import fs from 'node:fs';
import { isDeepStrictEqual as equal } from 'node:util';
import { inspectProject } from '../adapters/project.ts';
import { managedPath } from '../adapters/paths.ts';
import { lockedWrite, readWorkspace, type WriteObserver } from '../adapters/workspace.ts';
import { currentDeliveryRun, readDeliveryRun } from '../adapters/delivery-runs.ts';
import { currentRun } from '../adapters/runs.ts';
import { inspectAttempt, captureBytes, confirmBytes } from '../adapters/group-store.ts';
import { inspectFullTest } from '../adapters/delivery-verification.ts';
import { scopeAdditionReceipts } from '../adapters/scope-additions.ts';
import { deliveredBaselines } from '../adapters/baselines.ts';
import { commitChangeAdd, resumeChangeAdd } from '../adapters/change-add-store.ts';
import { MendiError, object, text } from '../core/errors.ts';
import { requireWritable } from '../core/rounds.ts';
import { readScope, type Workspace } from '../core/records.ts';
import { scopePointers, validateAdditions, type ChangeAddReceipt } from '../core/scope-addition.ts';
import { state } from './project.ts';
import { actionNext } from '../core/actions.ts';
import type { DeliveryDocument } from '../adapters/delivery-runs.ts';

export interface ChangeAddInput {
  project: string;
  role: string;
  actor: string;
  inputFile?: string;
  resumeRef?: string;
}
function response(
  root: string,
  workspace: Workspace,
  run: DeliveryDocument,
  alreadyCompleted = false,
) {
  const active = workspace.activeChangeId ? currentRun(root, workspace) : null;
  const next = active
    ? actionNext(active.record, active.ref, false)
    : {
        action: workspace.activeChangeId ? 'explore' : 'change-bind',
        role: 'author',
        source: 'local-state',
        executable: false,
        reason: '范围已追加；活动阶段或显式 bind 仍按各自授权继续。',
      };
  return {
    ok: true,
    operation: 'delivery-change-add',
    projectRoot: root,
    openspec: null,
    local: state(workspace),
    executionMode: 'local-only',
    upstreamAccess: 'not-required',
    alreadyCompleted,
    run: { ref: run.ref, ...run.record },
    next,
  };
}
function admissible(root: string, w: Workspace, ownLock: boolean, bytes: Map<string, Buffer>) {
  requireWritable(w);
  if (w.state !== 'open')
    throw new MendiError('delivery-state-conflict', '范围追加只支持尚未 Close 的当前 open 轮。');
  for (const [ref, content] of scopeAdditionReceipts(root, w)) bytes.set(ref, content);
  const current = currentDeliveryRun(root, w);
  if (current) {
    captureBytes(root, current.ref, bytes);
    if (
      current.record.status !== 'submitted' ||
      current.record.outcome !== 'complete' ||
      current.record.repair ||
      current.record.verification
    )
      throw new MendiError('delivery-state-conflict', '当前操作尚未解决，不能追加范围。');
    if (current.record.attempt) {
      const facts = inspectAttempt(root, w, current, ownLock, bytes);
      if (
        !facts.stable ||
        !['passed', 'failed'].includes(String(facts.formalOutcome)) ||
        facts.scopeMatch !== 'match' ||
        facts.protocolState !== 'valid'
      )
        throw new MendiError('delivery-state-conflict', '正式执行/清理或当前范围尚未确认。');
    } else if (current.record.fullTest) {
      const facts = inspectFullTest(root, w, current, ownLock);
      if (
        !facts.stable ||
        !['passed', 'failed'].includes(facts.outcome) ||
        facts.scopeMatch !== 'match'
      )
        throw new MendiError('delivery-state-conflict', '旧正式结果尚未确认。');
      // Old command is retained only as history; no execution is created here.
      if (facts.child)
        for (const ref of [
          facts.child.stdoutRef,
          facts.child.stderrRef,
          `.mendi/delivery-groups/${w.id}/tests/${facts.child.executionId}/result.json`,
        ])
          captureBytes(root, ref, bytes);
    } else if (!['delivery-open', 'delivery-reopen'].includes(current.record.actionType))
      throw new MendiError('delivery-state-conflict', '当前 Delivery 操作不支持范围追加。');
  }
  const active = currentRun(root, w);
  if (active) captureBytes(root, active.ref, bytes);
  if (w.bindings.some((b) => b.state === 'archiving'))
    throw new MendiError('delivery-state-conflict', 'Archive 尚未收口。');
}
function confirmReceipt(root: string, before: Workspace, receipt: ChangeAddReceipt) {
  if (
    receipt.roundId !== before.currentRoundId ||
    !equal(before.scope, receipt.beforeScope) ||
    !equal(scopePointers(before), receipt.priorPointers)
  )
    throw new MendiError('delivery-input-changed', '收据与原当前范围、轮次或指针不符。');
  const after = readScope(receipt.afterScope);
  const oldSlots = new Set(
    before.rounds!.flatMap((r) => r.scope.plannedChanges.map((p) => p.slot)),
  );
  if (receipt.addedSlots.some((slot) => oldSlots.has(slot)))
    throw new MendiError('invalid-scope', '新增槽位已在本轮或历史轮使用。');
  const bytes = new Map<string, Buffer>();
  admissible(root, before, true, bytes);
  deliveredBaselines(root, before, after).confirm();
}
export function addDeliveryChanges(
  input: ChangeAddInput,
  options: { observeWrite?: WriteObserver } = {},
) {
  if (input.role !== 'author')
    throw new MendiError(
      'action-role-mismatch',
      '计划追加要求 Author；actor 不能替代 Owner 实际授权。',
    );
  const actor = text(input.actor, 'actor'),
    { root } = inspectProject(input.project);
  let result;
  if (input.resumeRef) {
    if (input.inputFile) throw new MendiError('invalid-arguments', '--resume 不混用 --input。');
    result = resumeChangeAdd(
      root,
      input.resumeRef,
      actor,
      (w, r) => confirmReceipt(root, w, r),
      options.observeWrite,
    );
  } else {
    const workspace = readWorkspace(root);
    if (!workspace) throw new MendiError('delivery-not-open', '目标尚未 Open。');
    requireWritable(workspace);
    const inputRef = text(input.inputFile, 'input'),
      inputContent = fs.readFileSync(managedPath(root, inputRef), 'utf8');
    const raw = object(JSON.parse(inputContent), '追加输入');
    const requestId = text(raw.requestId, 'requestId');
    const existing = workspace
      .rounds!.at(-1)!
      .scopeAdditions?.find((a) => a.requestId === requestId);
    if (existing) {
      const run = readDeliveryRun(root, existing.runRef, workspace.id),
        receipt = run.record.changeAdd!;
      if (
        run.record.actorId !== actor ||
        receipt.inputRef !== inputRef ||
        receipt.inputContent !== inputContent
      )
        throw new MendiError('request-conflict', '相同 requestId 的实际输入或 Author 不同。');
      return lockedWrite(root, 'delivery-change-add-replay', () => {
        const current = readWorkspace(root, true)!;
        if (
          !equal(current, workspace) ||
          fs.readFileSync(managedPath(root, inputRef), 'utf8') !== inputContent
        )
          throw new MendiError('delivery-input-changed', '重放请求在持锁前变化。');
        return response(root, current, run, true);
      });
    }
    const ownerDecision = text(raw.ownerDecision, 'ownerDecision'),
      reason = text(raw.reason, 'reason');
    validateAdditions(raw);
    const afterScope = readScope({
      goal: workspace.scope.goal,
      plannedChanges: [...workspace.scope.plannedChanges, ...raw.additions],
    });
    const receipt: ChangeAddReceipt = {
      version: 1,
      requestId,
      ownerDecision,
      reason,
      roundId: workspace.currentRoundId!,
      inputRef,
      inputContent,
      createdAt: new Date().toISOString(),
      beforeScope: workspace.scope,
      afterScope,
      addedSlots: afterScope.plannedChanges
        .slice(workspace.scope.plannedChanges.length)
        .map((p) => p.slot),
      priorPointers: scopePointers(workspace),
    };
    const bytes = new Map<string, Buffer>();
    if (captureBytes(root, inputRef, bytes).toString() !== inputContent)
      throw new MendiError('delivery-input-changed', '声明在写前读取期间变化。');
    admissible(root, workspace, false, bytes);
    confirmReceipt(root, workspace, receipt);
    for (const [ref, content] of deliveredBaselines(root, workspace, afterScope).bytes)
      bytes.set(ref, content);
    confirmBytes(root, bytes);
    result = commitChangeAdd(
      root,
      workspace,
      receipt,
      actor,
      bytes,
      (w, r) => confirmReceipt(root, w, r),
      options.observeWrite,
    );
  }
  return response(
    root,
    result.workspace,
    result.run,
    'alreadyCompleted' in result && result.alreadyCompleted === true,
  );
}
