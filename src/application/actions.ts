import fs from 'node:fs';
import { pendingLifecycle, saveLifecycleNote } from '../adapters/lifecycle-store.ts';
import path from 'node:path';
import {
  hasDeliveryProgress,
  continueDeliveryAction,
  saveDeliveryRun,
  submitDeliveryRun,
} from './delivery-repair.ts';
import { state } from './project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { currentRun } from '../adapters/runs.ts';
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
import { inspectProject } from '../adapters/project.ts';
import { prepareArchive } from './archive-prepare.ts';
import {
  context,
  checkWorkspace,
  matchingActor,
  authorInput,
  draft,
  output,
  type ActorInput,
  type ActionOptions,
} from './action-context.ts';

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
export function startAction(input: StartInput, options: ActionOptions = {}) {
  if (input.type === 'archive') return prepareArchive(input, options);
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
  if (hasDeliveryProgress(input.project)) return continueDeliveryAction(input, options);
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
  const { root: noteRoot } = inspectProject(input.project);
  if (pendingLifecycle(noteRoot)) {
    if (input.role !== 'author')
      throw new MendiError('action-role-mismatch', '生命周期说明需要 Author。');
    return saveLifecycleNote(
      noteRoot,
      input.runRef,
      text(input.actor, 'actor'),
      fs.readFileSync(path.resolve(noteRoot, input.bodyFile), 'utf8'),
      options.observeWrite,
    );
  }
  if (hasDeliveryProgress(input.project)) return saveDeliveryRun(input, options);
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

export function submitRun(input: SubmitInput, options: ActionOptions = {}) {
  if (hasDeliveryProgress(input.project)) return submitDeliveryRun(input, options);
  const { root, upstream, workspace } = context(input, options);
  text(input.result, '提交结果');
  function check(workspace: Workspace) {
    const run = draft(root, workspace, input);
    if (run.record.archive)
      throw new MendiError('archive-pending', 'Archive 只能通过显式 execute / finish 完成。');
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
