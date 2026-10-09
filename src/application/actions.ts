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
  type OwnerDecision,
} from '../core/actions.ts';
import { MendiError, text, errorInfo } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';
import { inspectProject } from '../adapters/project.ts';

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
export interface ResolveInput extends ActorInput {
  runRef: string;
  resolution: string;
  toRole: string;
  toActor: string;
  reason: string;
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
  text(input.actor, '操作者标识');
  if (input.role !== 'author' && input.role !== 'reviewer')
    throw new MendiError('action-role-mismatch', '必须声明 author 或 reviewer。');
  const { root } = inspectProject(input.project);
  const workspace = readWorkspace(root);
  checkWorkspace(workspace);
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
      inspectProject(root);
      const run = draft(root, current, input);
      return {
        workspace: current,
        run: replaceDraft(root, run, run.header, body, written, options.observeWrite),
      };
    },
    options.observeWrite,
  );
  return {
    ok: true as const,
    operation: 'run-save',
    projectRoot: root,
    executionMode: 'local-only' as const,
    openspec: null,
    upstreamAccess: 'not-required' as const,
    local: state(result.workspace),
    run: { ref: result.run.ref, ...result.run.record },
    next: actionNext(result.run.record, result.run.ref),
  };
}

export function actionInstructions(
  input: Selection & { actionId: string; artifact: string },
  options: ActionOptions = {},
) {
  const { root, upstream } = selected(input, options);
  const workspace = readWorkspace(root);
  checkWorkspace(workspace);
  const run = currentRun(root, workspace);
  if (!run || run.record.actionId !== input.actionId)
    throw new MendiError('action-state-conflict', '需要当前 Action ID。');
  const phase = actionDefinition(run.record.actionType).phase;
  if (phase === 'apply' || (phase === 'explore' && input.artifact !== 'proposal'))
    throw new MendiError('unsupported-action-instructions', '本阶段不支持该 artifact 指引。');
  const instructions = upstream.instructions(workspace.activeChangeId!, input.artifact);
  return { ...output(root, upstream, 'action-instructions', workspace, run), instructions };
}

export function resolveAction(input: ResolveInput, options: ActionOptions = {}) {
  if (input.role !== 'owner')
    throw new MendiError('owner-declaration-required', '处置须明确声明 Owner。');
  text(input.actor, 'Owner 标识');
  text(input.reason, 'Owner 原因');
  text(input.toActor, '接收标识');
  const { root, upstream } = selected(input, options);
  const workspace = readWorkspace(root);
  checkWorkspace(workspace);
  upstream.status(workspace.activeChangeId!);
  function check(current: Workspace) {
    checkWorkspace(current);
    const run = currentRun(root, current);
    if (!run || run.ref !== input.runRef)
      throw new MendiError('run-not-current', '处置对象不是当前 Run。');
    const definition = actionDefinition(run.record.actionType);
    if (definition.phase === 'apply')
      throw new MendiError('unsupported-resolution', '仅支持 Explore / Propose 处置。');
    if (input.resolution === 'handoff') {
      if (
        input.toRole !== run.record.role ||
        input.toActor === run.record.actorId ||
        (run.record.status !== 'draft' && run.record.outcome !== 'continuing')
      )
        throw new MendiError('resolution-state-conflict', '交接要求未完成、同角色、不同操作者。');
      let fixed: RunDocument | null = null;
      if (definition.review)
        fixed = authorInput(
          root,
          current,
          run.record.authorRunRef!,
          run.record.actionType,
          input.toActor,
          true,
        );
      if (definition.revision)
        fixed = authorInput(
          root,
          current,
          run.record.revisesRunRef!,
          run.record.actionType,
          input.toActor,
          false,
        );
      return { run, definition, author: null, fixed };
    }
    if (
      input.resolution !== 'revise' ||
      input.toRole !== 'author' ||
      !definition.review ||
      run.record.status !== 'submitted' ||
      run.record.outcome !== 'complete' ||
      run.record.verdict !== 'rejected'
    )
      throw new MendiError(
        'resolution-state-conflict',
        'revise 仅处理当前 rejected 的同阶段 Author 修订。',
      );
    const author = authorInput(
      root,
      current,
      run.record.authorRunRef!,
      run.record.actionType,
      input.toActor,
      false,
    );
    return {
      run,
      definition: actionDefinition(`revise-${definition.phase}`),
      author,
      fixed: author,
    };
  }
  const prior = check(workspace);
  const tools = prior.author?.record.toolGuidance ?? prior.run.record.toolGuidance;
  const methods = loadMethods(prior.definition.type, tools, options.methodsRoot);
  const result = writeAction(
    root,
    'action-resolve',
    (current, written) => {
      const { run, definition, author, fixed } = check(current);
      const ownerDecision: OwnerDecision = {
        resolution: input.resolution as OwnerDecision['resolution'],
        role: 'owner',
        actorId: input.actor,
        reason: input.reason,
        sourceRunRef: run.ref,
        targetRole: definition.role,
        targetActorId: input.toActor,
        phase: definition.phase as 'explore' | 'propose',
      };
      // Fixed inputs and method selection must still be the same when the lock is acquired.
      if (
        definition.type !== prior.definition.type ||
        JSON.stringify(author?.record ?? run.record) !==
          JSON.stringify(prior.author?.record ?? prior.run.record) ||
        run.body !== prior.run.body ||
        author?.body !== prior.author?.body ||
        JSON.stringify(fixed) !== JSON.stringify(prior.fixed)
      )
        throw new MendiError('resolution-state-conflict', '写前处置对象已变化。');
      const {
        runNumber: _number,
        outcome: _outcome,
        result: _result,
        verdict: _verdict,
        ...continuing
      } = run.record;
      const seed = author
        ? {
            formatVersion: 1 as const,
            recordingMode: 'product' as const,
            deliveryId: current.id,
            changeId: current.activeChangeId!,
            actionType: definition.type,
            role: definition.role,
            actorId: input.toActor,
            status: 'draft' as const,
            stageSkill: definition.skill,
            toolGuidance: author.record.toolGuidance,
            revisesRunRef: author.ref,
            ownerDecision,
          }
        : { ...continuing, actorId: input.toActor, status: 'draft' as const, ownerDecision };
      return createRun(root, current, seed, written, options.observeWrite, author ? '' : run.body);
    },
    options.observeWrite,
  );
  return {
    ...output(root, upstream, 'action-resolve', result.workspace, result.run),
    methods,
    incompleteReservations: result.incompleteReservations,
  };
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
