import fs from 'node:fs';
import path from 'node:path';
import { selected, state, type Selection, type OperationOptions } from './project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { currentRun, readRun, type RunDocument } from '../adapters/runs.ts';
import { createRun, replaceDraft, writeAction } from '../adapters/action-store.ts';
import { loadMethods } from '../adapters/methods.ts';
import {
  actionDefinition,
  actionNext,
  assertActionStart,
  parseRun,
  type RunRecord,
} from '../core/actions.ts';
import { MendiError, text, errorInfo } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';

export interface ActorInput extends Selection {
  role: string;
  actor: string;
}
export interface StartInput extends ActorInput {
  changeId: string;
  type: string;
  authorRunRef?: string;
  revisesRunRef?: string;
  tool?: string;
}
export interface ContinueInput extends ActorInput {
  actionId: string;
}
export interface SaveInput extends ActorInput {
  runRef: string;
  bodyFile: string;
}
export interface SubmitInput extends ActorInput {
  runRef: string;
  outcome: string;
  result: string;
  verdict?: string;
}
export interface ActionOptions extends OperationOptions {
  methodsRoot?: string;
}
function context(input: ActorInput, options: ActionOptions) {
  text(input.actor, '操作者标识');
  if (input.role !== 'author' && input.role !== 'reviewer')
    throw new MendiError('action-role-mismatch', '必须声明 author 或 reviewer。');
  const selectedProject = selected(input, options);
  const workspace = readWorkspace(selectedProject.root);
  checkWorkspace(workspace);
  selectedProject.upstream.status(workspace.activeChangeId!);
  return { ...selectedProject, workspace };
}
function checkWorkspace(workspace: Workspace | null): asserts workspace is Workspace {
  if (!workspace) throw new MendiError('delivery-not-open', '目标尚未 Open。');
  if (workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', '人工 bootstrap 不通过 Action / Run 命令修改。');
  if (workspace.state !== 'open' || !workspace.activeChangeId)
    throw new MendiError('invalid-action', 'Action 要求 open Delivery 的活动 Change。');
}
function matchingActor(run: RunDocument, input: ActorInput) {
  if (run.record.role !== input.role || run.record.actorId !== input.actor)
    throw new MendiError('action-role-mismatch', '当前 Run 的角色或操作者不匹配。');
}
function authorInput(
  root: string,
  workspace: Workspace,
  ref: string,
  type: string,
  actor: string,
  review: boolean,
) {
  const author = readRun(root, ref, workspace.id, workspace.activeChangeId!);
  if (
    author.record.role !== 'author' ||
    author.record.status !== 'submitted' ||
    author.record.outcome !== 'complete' ||
    !author.body.trim() ||
    actionDefinition(author.record.actionType).phase !== actionDefinition(type).phase
  )
    throw new MendiError('review-input-invalid', '需要匹配阶段、已完成且有正文的 Author 提交。', {
      ref,
    });
  if (review && author.record.actorId === actor)
    throw new MendiError('self-review', 'Reviewer 不能与 Author 使用同一操作者标识。', { ref });
  return author;
}
function draft(root: string, workspace: Workspace, input: SaveInput | SubmitInput) {
  checkWorkspace(workspace);
  const run = currentRun(root, workspace);
  if (!run || run.ref !== input.runRef)
    throw new MendiError('run-not-current', '指定 Run 不是当前 draft。');
  matchingActor(run, input);
  if (run.record.status !== 'draft')
    throw new MendiError('run-already-submitted', '已提交 Run 不能保存或重新提交。');
  return run;
}
function output(
  root: string,
  upstream: ReturnType<typeof selected>['upstream'],
  operation: string,
  workspace: Workspace,
  run: RunDocument,
) {
  return {
    ok: true as const,
    operation,
    projectRoot: root,
    openspec: upstream.info(),
    local: state(workspace),
    run: { ref: run.ref, ...run.record },
    next: actionNext(run.record, run.ref),
  };
}
export function startAction(input: StartInput, options: ActionOptions = {}) {
  const { root, upstream, workspace } = context(input, options);
  const definition = actionDefinition(input.type);
  const tools = input.tool !== undefined ? [input.tool] : [];
  function check(workspace: Workspace) {
    checkWorkspace(workspace);
    if (workspace.activeChangeId !== input.changeId || input.role !== definition.role)
      throw new MendiError('action-role-mismatch', 'Action 类型、角色或当前 Change 不一致。');
    assertActionStart(
      currentRun(root, workspace),
      definition.type,
      input.authorRunRef,
      input.revisesRunRef,
    );
    if (definition.review || definition.revision)
      authorInput(
        root,
        workspace,
        (definition.review ? input.authorRunRef : input.revisesRunRef)!,
        definition.type,
        input.actor,
        definition.review,
      );
  }
  check(workspace);
  const methods = loadMethods(definition.type, tools, options.methodsRoot);
  const result = writeAction(
    root,
    'action-start',
    (current, written) => {
      check(current);
      const seed: Omit<RunRecord, 'actionId' | 'runNumber'> = {
        formatVersion: 1,
        recordingMode: 'product',
        deliveryId: current.id,
        changeId: input.changeId,
        actionType: definition.type,
        role: definition.role,
        actorId: input.actor,
        status: 'draft',
        stageSkill: definition.skill,
        toolGuidance: tools,
        ...(definition.review ? { authorRunRef: input.authorRunRef! } : {}),
        ...(definition.revision ? { revisesRunRef: input.revisesRunRef! } : {}),
      };
      return createRun(root, current, seed, written, options.observeWrite);
    },
    options.observeWrite,
  );
  return {
    ...output(root, upstream, 'action-start', result.workspace, result.run),
    methods,
    incompleteReservations: result.incompleteReservations,
  };
}
export function continueAction(input: ContinueInput, options: ActionOptions = {}) {
  const { root, upstream, workspace } = context(input, options);
  function check(workspace: Workspace) {
    checkWorkspace(workspace);
    const run = currentRun(root, workspace);
    if (
      !run ||
      run.record.actionId !== input.actionId ||
      run.record.status !== 'submitted' ||
      run.record.outcome !== 'continuing'
    )
      throw new MendiError('action-state-conflict', '只有当前已提交 continuing Action 可继续。');
    matchingActor(run, input);
    if (run.record.role === 'reviewer')
      authorInput(
        root,
        workspace,
        run.record.authorRunRef!,
        run.record.actionType,
        input.actor,
        true,
      );
    return run;
  }
  const prior = check(workspace);
  const methods = loadMethods(
    prior.record.actionType,
    prior.record.toolGuidance,
    options.methodsRoot,
  );
  const result = writeAction(
    root,
    'action-continue',
    (current, written) => {
      const run = check(current);
      const {
        runNumber: _number,
        outcome: _outcome,
        result: _result,
        verdict: _verdict,
        ...seed
      } = run.record;
      return createRun(root, current, { ...seed, status: 'draft' }, written, options.observeWrite);
    },
    options.observeWrite,
  );
  return {
    ...output(root, upstream, 'action-continue', result.workspace, result.run),
    methods,
    incompleteReservations: result.incompleteReservations,
  };
}
export function saveRun(input: SaveInput, options: ActionOptions = {}) {
  const { root, upstream, workspace } = context(input, options);
  draft(root, workspace, input);
  let body: string;
  try {
    body = fs.readFileSync(path.resolve(root, input.bodyFile), 'utf8');
  } catch (error) {
    throw new MendiError('run-input-missing', '无法读取明确正文输入。', {
      bodyFile: input.bodyFile,
      ...errorInfo(error),
    });
  }
  const result = writeAction(
    root,
    'run-save',
    (current, written) => {
      const run = draft(root, current, input);
      return {
        workspace: current,
        run: replaceDraft(root, run, run.header, body, written, options.observeWrite),
      };
    },
    options.observeWrite,
  );
  return output(root, upstream, 'run-save', result.workspace, result.run);
}
export function submitRun(input: SubmitInput, options: ActionOptions = {}) {
  const { root, upstream, workspace } = context(input, options);
  text(input.result, '提交结果');
  function check(workspace: Workspace) {
    const run = draft(root, workspace, input);
    if (!run.body.trim()) throw new MendiError('invalid-run', '提交需要非空工作正文。');
    if (run.record.role === 'reviewer')
      authorInput(
        root,
        workspace,
        run.record.authorRunRef!,
        run.record.actionType,
        input.actor,
        true,
      );
    const header = {
      ...run.header,
      status: 'submitted',
      outcome: input.outcome,
      result: input.result,
      ...(input.verdict !== undefined ? { verdict: input.verdict } : {}),
    };
    // Parse before mutation; rejects Author verdict and incomplete / invalid review verdicts.
    parseRun(header, run.ref, run.record.deliveryId, run.record.changeId);
    return { run, header };
  }
  check(workspace);
  const result = writeAction(
    root,
    'run-submit',
    (current, written) => {
      const { run, header } = check(current);
      return {
        workspace: current,
        run: replaceDraft(root, run, header, run.body, written, options.observeWrite),
      };
    },
    options.observeWrite,
  );
  return output(root, upstream, 'run-submit', result.workspace, result.run);
}
