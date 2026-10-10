import fs from 'node:fs';
import path from 'node:path';
import { inspectProject } from '../adapters/project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import {
  createDeliveryRun,
  replaceDeliveryDraft,
  currentDeliveryRun,
  type DeliveryDocument,
} from '../adapters/delivery-runs.ts';
import { writeAction } from '../adapters/action-store.ts';
import { loadMethods } from '../adapters/methods.ts';
import {
  currentFailure,
  repairAuthor,
  reviewRepairInputs,
  same,
} from '../adapters/delivery-verification.ts';
import { deliveryDefinition, deliveryNext, parseDeliveryRun } from '../core/delivery-runs.ts';
import { verificationScope } from '../core/delivery-verification.ts';
import { MendiError, text } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';
import type { ActorInput, ActionOptions } from './action-context.ts';
import { state } from './project.ts';

export function hasDeliveryProgress(project: string) {
  const { root } = inspectProject(project);
  return readWorkspace(root)?.manifest.deliveryRunRef !== undefined;
}
function workspaceInput(root: string, ownLock = false) {
  const workspace = readWorkspace(root, ownLock);
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', 'Delivery 修复仅支持 product。');
  verificationScope(workspace);
  return workspace;
}
function actor(run: DeliveryDocument, input: ActorInput) {
  if (run.record.role !== input.role || run.record.actorId !== text(input.actor, 'actor'))
    throw new MendiError('action-role-mismatch', '当前 Run 角色 / actor 不匹配。');
}
function draft(root: string, workspace: Workspace, input: ActorInput & { runRef: string }) {
  const run = currentDeliveryRun(root, workspace);
  if (!run || run.ref !== input.runRef)
    throw new MendiError('run-not-current', '指定 Delivery Run 不是当前对象。');
  actor(run, input);
  if (run.record.status !== 'draft')
    throw new MendiError('run-already-submitted', '已提交 Run 不可重写。');
  return run;
}
function output(root: string, operation: string, workspace: Workspace, run: DeliveryDocument) {
  return {
    ok: true as const,
    operation,
    projectRoot: root,
    openspec: null,
    executionMode: 'local-only' as const,
    upstreamAccess: 'not-required',
    local: state(workspace),
    run: { ref: run.ref, ...run.record },
    next: deliveryNext(run.record, run.ref),
  };
}
export function startDeliveryRepair(
  input: ActorInput & { from: string; reason: string; revisesRunRef?: string },
  options: ActionOptions = {},
) {
  const { root } = inspectProject(input.project);
  if (input.role !== 'author') throw new MendiError('action-role-mismatch', '修复要求 Author。');
  text(input.actor, 'actor');
  const reason = text(input.reason, '修复原因');
  const type = input.revisesRunRef === undefined ? 'delivery-repair' : 'revise-delivery-repair';
  function check(workspace: Workspace, ownLock = false) {
    const failure = currentFailure(root, workspace, input.from, ownLock);
    const current = currentDeliveryRun(root, workspace);
    if (
      !current ||
      current.record.status !== 'submitted' ||
      current.record.outcome !== 'complete' ||
      current.record.verdict === 'rejected'
    )
      throw new MendiError('delivery-state-conflict', '当前交接未完成或 rejected，停 Owner。');
    if (type === 'delivery-repair') {
      if (current.ref !== failure.ref)
        throw new MendiError('delivery-state-conflict', '已有修复交接，请继续或明确修订。');
    } else {
      const target = current.record.role === 'reviewer' ? current.record.authorRunRef : current.ref;
      if (
        !current.record.repair ||
        input.revisesRunRef !== target ||
        !same(current.record.repair.scope, failure.record.fullTest!.scope)
      )
        throw new MendiError('delivery-state-conflict', '修订必须固定当前修复 Author。');
      repairAuthor(root, workspace, input.revisesRunRef!);
    }
    return {
      failedFullTestRunRef: failure.ref,
      scope: failure.record.fullTest!.scope,
      collection: failure.record.fullTest!.collection,
      reason,
    };
  }
  check(workspaceInput(root));
  const methods = loadMethods(type, [], options.methodsRoot);
  const result = writeAction(
    root,
    'delivery-repair-start',
    (workspace, written) => {
      verificationScope(workspace);
      const repair = check(workspace, true);
      return createDeliveryRun(
        root,
        workspace,
        {
          formatVersion: 1,
          recordingMode: 'product',
          scope: 'delivery',
          deliveryId: workspace.id,
          changeId: null,
          actionType: type,
          role: 'author',
          actorId: input.actor,
          status: 'draft',
          stageSkill: 'delivery-repair',
          toolGuidance: [],
          repair,
          ...(input.revisesRunRef ? { revisesRunRef: input.revisesRunRef } : {}),
        },
        written,
        options.observeWrite,
      );
    },
    options.observeWrite,
  );
  return {
    ...output(root, 'delivery-repair-start', result.workspace, result.run),
    methods,
    incompleteReservations: result.incompleteReservations,
  };
}
export function startDeliveryReview(
  input: ActorInput & { authorRunRef: string },
  options: ActionOptions = {},
) {
  const { root } = inspectProject(input.project);
  if (input.role !== 'reviewer')
    throw new MendiError('action-role-mismatch', '定向审核要求 Reviewer。');
  text(input.actor, 'actor');
  function check(workspace: Workspace, ownLock = false) {
    const current = currentDeliveryRun(root, workspace);
    if (!current || current.ref !== input.authorRunRef)
      throw new MendiError('run-not-current', '审核必须固定当前完成 Author。');
    const author = repairAuthor(root, workspace, input.authorRunRef, input.actor);
    const failure = currentFailure(
      root,
      workspace,
      author.record.repair!.failedFullTestRunRef,
      ownLock,
    );
    if (
      !same(author.record.repair!.scope, failure.record.fullTest!.scope) ||
      !same(author.record.repair!.collection, failure.record.fullTest!.collection)
    )
      throw new MendiError('review-input-invalid', 'Author 范围 / 集合与失败矛盾。');
    return author;
  }
  check(workspaceInput(root));
  const methods = loadMethods('review-delivery-repair', [], options.methodsRoot);
  const result = writeAction(
    root,
    'delivery-repair-review',
    (workspace, written) => {
      verificationScope(workspace);
      const author = check(workspace, true);
      return createDeliveryRun(
        root,
        workspace,
        {
          formatVersion: 1,
          recordingMode: 'product',
          scope: 'delivery',
          deliveryId: workspace.id,
          changeId: null,
          actionType: 'review-delivery-repair',
          role: 'reviewer',
          actorId: input.actor,
          status: 'draft',
          stageSkill: 'review-delivery-repair',
          toolGuidance: [],
          repair: author.record.repair!,
          authorRunRef: author.ref,
        },
        written,
        options.observeWrite,
      );
    },
    options.observeWrite,
  );
  return {
    ...output(root, 'delivery-repair-review', result.workspace, result.run),
    methods,
    incompleteReservations: result.incompleteReservations,
  };
}
export function saveDeliveryRun(
  input: ActorInput & { runRef: string; bodyFile: string },
  options: ActionOptions = {},
) {
  const { root } = inspectProject(input.project);
  draft(root, workspaceInput(root), input);
  const body = fs.readFileSync(path.resolve(root, input.bodyFile), 'utf8');
  const result = writeAction(
    root,
    'run-save',
    (workspace, written) => {
      const run = draft(root, workspace, input);
      return {
        workspace,
        run: replaceDeliveryDraft(root, run, run.header, body, written, options.observeWrite),
      };
    },
    options.observeWrite,
  );
  return output(root, 'run-save', result.workspace, result.run);
}
export function submitDeliveryRun(
  input: ActorInput & { runRef: string; outcome: string; result: string; verdict?: string },
  options: ActionOptions = {},
) {
  const { root } = inspectProject(input.project);
  function check(workspace: Workspace, ownLock = false) {
    const run = draft(root, workspace, input);
    if (run.record.fullTest)
      throw new MendiError('invalid-action', '正式 Full Test 禁止普通 submit。');
    if (!run.body.trim()) throw new MendiError('invalid-run', '提交需要真实非空正文。');
    if (run.record.role === 'reviewer') reviewRepairInputs(root, workspace, run, ownLock);
    else {
      const failure = currentFailure(
        root,
        workspace,
        run.record.repair!.failedFullTestRunRef,
        ownLock,
      );
      if (
        !same(run.record.repair!.scope, failure.record.fullTest!.scope) ||
        !same(run.record.repair!.collection, failure.record.fullTest!.collection)
      )
        throw new MendiError('delivery-state-conflict', '修复范围或完整集合变化，停 Owner。');
    }
    const header = {
      ...run.header,
      status: 'submitted',
      outcome: input.outcome,
      result: input.result,
      ...(input.verdict === undefined ? {} : { verdict: input.verdict }),
    };
    parseDeliveryRun(header, run.ref, workspace.id);
    return { run, header };
  }
  check(workspaceInput(root));
  const result = writeAction(
    root,
    'run-submit',
    (workspace, written) => {
      const { run, header } = check(workspace, true);
      return {
        workspace,
        run: replaceDeliveryDraft(root, run, header, run.body, written, options.observeWrite),
      };
    },
    options.observeWrite,
  );
  return output(root, 'run-submit', result.workspace, result.run);
}
export function continueDeliveryAction(
  input: ActorInput & { actionId: string },
  options: ActionOptions = {},
) {
  const { root } = inspectProject(input.project);
  function check(workspace: Workspace, ownLock = false) {
    const run = currentDeliveryRun(root, workspace);
    if (
      !run ||
      run.record.fullTest ||
      run.record.actionId !== input.actionId ||
      run.record.status !== 'submitted' ||
      run.record.outcome !== 'continuing'
    )
      throw new MendiError('action-state-conflict', '只有当前修复 / Review continuing 可继续。');
    actor(run, input);
    if (run.record.role === 'reviewer') reviewRepairInputs(root, workspace, run, ownLock);
    else currentFailure(root, workspace, run.record.repair!.failedFullTestRunRef, ownLock);
    return run;
  }
  const prior = check(workspaceInput(root));
  const methods = loadMethods(
    deliveryDefinition(prior.record.actionType).type,
    [],
    options.methodsRoot,
  );
  const result = writeAction(
    root,
    'action-continue',
    (workspace, written) => {
      const run = check(workspace, true);
      const { runNumber: _n, result: _r, outcome: _o, verdict: _v, ...seed } = run.record;
      return createDeliveryRun(
        root,
        workspace,
        { ...seed, status: 'draft' },
        written,
        options.observeWrite,
      );
    },
    options.observeWrite,
  );
  return {
    ...output(root, 'action-continue', result.workspace, result.run),
    methods,
    incompleteReservations: result.incompleteReservations,
  };
}
