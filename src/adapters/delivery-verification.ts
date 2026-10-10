import fs from 'node:fs';
import { managedPath } from './paths.ts';
import { readRun } from './runs.ts';
import { readDeliveryRun, currentDeliveryRun, type DeliveryDocument } from './delivery-runs.ts';
import { readExecution, observeExecution } from './test-store.ts';
import { selectedTest } from './test-entries.ts';
import { MendiError } from '../core/errors.ts';
import { verificationScope, type ApprovalFact } from '../core/delivery-verification.ts';
import type { Workspace } from '../core/records.ts';

export function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
export function firstApprovals(root: string, workspace: Workspace) {
  const approvals: ApprovalFact[] = [];
  const refs: string[] = [];
  for (const item of verificationScope(workspace).completed) {
    const binding = workspace.bindings.find((b) => b.changeId === item.changeId)!;
    const archive = readRun(root, binding.latestRunRef!, workspace.id, item.changeId);
    const info = archive.record.archive;
    if (
      !info ||
      archive.record.status !== 'submitted' ||
      archive.record.outcome !== 'complete' ||
      info.phase !== 'confirmed' ||
      info.ordinal !== item.archiveOrdinal ||
      info.archiveRef !== binding.changeRef
    )
      throw new MendiError('review-input-invalid', '本轮直接归档事实不一致。');
    const review = readRun(root, info.reviewRunRef, workspace.id, item.changeId);
    const author = readRun(root, info.authorRunRef, workspace.id, item.changeId);
    if (
      review.record.actionType !== 'review-apply' ||
      review.record.status !== 'submitted' ||
      review.record.outcome !== 'complete' ||
      review.record.verdict !== 'approved' ||
      review.record.authorRunRef !== author.ref ||
      !review.body.trim() ||
      author.record.role !== 'author' ||
      !['apply', 'revise-apply'].includes(author.record.actionType) ||
      author.record.status !== 'submitted' ||
      author.record.outcome !== 'complete' ||
      !author.body.trim() ||
      author.record.actorId === review.record.actorId
    )
      throw new MendiError('review-input-invalid', '本轮必要 Apply / Review 批准不完整。');
    approvals.push({
      changeId: item.changeId,
      archiveRunRef: archive.ref,
      reviewRunRef: review.ref,
      authorRunRef: author.ref,
      authorActor: author.record.actorId,
      reviewerActor: review.record.actorId,
    });
    refs.push(archive.ref, review.ref, author.ref);
  }
  return { approvals, refs };
}
export function inspectFullTest(
  root: string,
  workspace: Workspace,
  run: DeliveryDocument,
  ownLock = false,
) {
  const full = run.record.fullTest;
  if (!full) throw new MendiError('invalid-run', '指定 Run 不是正式 Full Test。');
  const fresh = readDeliveryRun(root, run.ref, workspace.id);
  if (!same(fresh.header, run.header) || fresh.body !== run.body)
    throw new MendiError('changed-during-read', '正式 Run 在解释期间变化。');
  const bytes = fs.readFileSync(managedPath(root, run.ref));
  const observation =
    full.executionId === null
      ? null
      : ownLock
        ? { record: readExecution(root, full.executionId, workspace.id), stable: true }
        : observeExecution(root, full.executionId);
  const child = observation?.record;
  if (
    child &&
    (child.deliveryId !== run.record.deliveryId ||
      child.changeId !== null ||
      child.kind !== 'full' ||
      child.actorId !== run.record.actorId ||
      child.scriptName !== full.entry.scriptName ||
      child.scriptText !== full.entry.scriptText ||
      child.command.args[0] !== full.entry.pnpmBin ||
      (full.phase === 'finished' && child.outcome !== full.outcome))
  )
    throw new MendiError('invalid-run', '正式父子执行身份或结果矛盾。');
  const stable =
    run.record.status === 'submitted' &&
    full.phase === 'finished' &&
    (observation === null || observation.stable) &&
    fs.readFileSync(managedPath(root, run.ref)).equals(bytes);
  let scopeMatch: 'match' | 'changed' | 'unavailable' = 'unavailable';
  try {
    scopeMatch = same(verificationScope(workspace), full.scope) ? 'match' : 'changed';
  } catch {
    /* 当前范围不能完整解释。 */
  }
  let commandMatch: 'match' | 'changed' | 'unavailable' = 'unavailable';
  try {
    const entry = selectedTest(root, 'full');
    commandMatch =
      entry.scriptName === full.entry.scriptName &&
      entry.scriptText === full.entry.scriptText &&
      entry.packageManager === full.entry.packageManager
        ? 'match'
        : 'changed';
  } catch {
    /* 当前配置不可读不改写历史执行事实。 */
  }
  return {
    outcome: stable ? full.outcome : ('unknown' as const),
    stable,
    executionId: full.executionId,
    collection: full.collection,
    basis: full.basis,
    entry: full.entry,
    scopeMatch,
    commandMatch,
    materialApplicability: 'requires-semantic-check' as const,
    ...(child ? { child } : {}),
  };
}
export function currentFailure(root: string, workspace: Workspace, ref: string, ownLock = false) {
  if (workspace.manifest.fullTestRunRef !== ref)
    throw new MendiError('run-not-current', '修复必须固定最近正式失败。');
  const run = readDeliveryRun(root, ref, workspace.id);
  const facts = inspectFullTest(root, workspace, run, ownLock);
  if (!facts.stable || facts.outcome !== 'failed' || facts.scopeMatch !== 'match')
    throw new MendiError('delivery-state-conflict', '需要本轮一致且完整的正式 failed。');
  return run;
}
export function repairAuthor(root: string, workspace: Workspace, ref: string, actor?: string) {
  const author = readDeliveryRun(root, ref, workspace.id);
  if (
    author.record.role !== 'author' ||
    !author.record.repair ||
    author.record.status !== 'submitted' ||
    author.record.outcome !== 'complete' ||
    !author.body.trim()
  )
    throw new MendiError('review-input-invalid', '需要完整的新修复 Author。');
  if (actor === author.record.actorId)
    throw new MendiError('self-review', 'Reviewer 不能与 Author 相同。');
  return author;
}
export function reviewRepairInputs(
  root: string,
  workspace: Workspace,
  review: DeliveryDocument,
  ownLock = false,
) {
  const author = repairAuthor(root, workspace, review.record.authorRunRef!, review.record.actorId);
  const failure = currentFailure(
    root,
    workspace,
    review.record.repair!.failedFullTestRunRef,
    ownLock,
  );
  if (
    !same(author.record.repair, review.record.repair) ||
    !same(author.record.repair!.scope, failure.record.fullTest!.scope) ||
    !same(author.record.repair!.collection, failure.record.fullTest!.collection)
  )
    throw new MendiError('review-input-invalid', '审核固定对象、失败范围或集合矛盾。');
  return { author, failure };
}
export function assertBindingAfterVerification(root: string, workspace: Workspace) {
  const current = currentDeliveryRun(root, workspace);
  if (!current) return;
  if (
    !current.record.fullTest ||
    inspectFullTest(root, workspace, current, true).outcome !== 'passed'
  )
    throw new MendiError('change-bind-conflict', '当前验收 / 修复交接尚未解决。');
}
