import { readWorkspace } from '../adapters/workspace.ts';
import { managedPath } from '../adapters/paths.ts';
import { currentDeliveryRun, readDeliveryRun } from '../adapters/delivery-runs.ts';
import {
  capturedJson,
  captureBytes,
  rememberBytes,
  confirmBytes,
  inspectAttempt,
  equal,
} from '../adapters/group-store.ts';
import {
  firstApprovals,
  reviewRepairInputs,
  repairAuthor,
} from '../adapters/delivery-verification.ts';
import { deliveredBaselines } from '../adapters/baselines.ts';
import { selectedTest } from '../adapters/test-entries.ts';
import { materialSnapshot, environmentRecovery } from '../adapters/group-environment.ts';
import { candidate, groupPlan, selectGroups } from '../core/group-plan.ts';
import { verificationScope, type FullTest } from '../core/delivery-verification.ts';
import { requireWritable, projectProgress } from '../core/rounds.ts';
import { requireCurrentRound, comparableRepair } from '../core/round-records.ts';
import { MendiError, object, text } from '../core/errors.ts';
import type { GroupAttempt } from '../core/group-records.ts';
import { formalWorkspace, type FullTestInput } from './full-test-admission.ts';

export function groupAdmission(root: string, input: FullTestInput, ownLock = false) {
  const { workspace, scope } = formalWorkspace(root, input, ownLock);
  const bytes = new Map<string, Buffer>();
  const raw = object(capturedJson(root, input.inputFile, bytes), '组声明');
  if (raw.mode !== 'groups-v1' || raw.purpose !== 'initial')
    throw new MendiError(
      'invalid-group-input',
      '新正式执行只支持 groups-v1 完整 initial；continue / retest 仅历史可读。',
    );
  const plan = groupPlan(capturedJson(root, text(raw.planRef, 'planRef'), bytes));
  for (const g of plan.groups) for (const ref of g.artifacts ?? []) managedPath(root, ref);
  const c = candidate(raw.candidate);
  const selection = selectGroups(plan, raw.selection);
  if (plan.groups.some((g) => g.required && !selection.includes(g.id)))
    throw new MendiError('invalid-group-input', 'initial 须选择全部必需组。');
  for (const id of selection)
    if (plan.groups.find((g) => g.id === id)!.dependsOn.some((dep) => !selection.includes(dep)))
      throw new MendiError('group-prerequisite-unavailable', '本次必要前置必须实际执行。');
  const script = selectedTest(root, 'full');
  captureBytes(root, 'package.json', bytes);
  const baseline = deliveredBaselines(root, workspace, workspace.scope);
  for (const [ref, content] of baseline.bytes)
    if (ref !== workspace.manifestRef) rememberBytes(ref, content, bytes);
  let approvals: FullTest['approvals'];
  const snapshot = materialSnapshot(root, raw.materialRefs, bytes);
  let repairApproval: FullTest['repairApproval'];
  let recovery: GroupAttempt['environmentRecovery'];
  const current = currentDeliveryRun(root, workspace);
  if (current && !current.record.lifecycle) {
    requireCurrentRound(workspace, current.record);
    if (
      current.record.status !== 'submitted' ||
      current.record.outcome !== 'complete' ||
      raw.fromRunRef !== current.ref
    )
      throw new MendiError('run-not-current', '须固定当前完整进展 fromRunRef。');
    captureBytes(root, current.ref, bytes);
    if (current.record.repair) {
      if (
        current.record.role !== 'reviewer' ||
        current.record.verdict !== 'approved' ||
        !current.body.trim() ||
        raw.environmentRecovery !== undefined
      )
        throw new MendiError('review-input-invalid', '实质修复要求当前独立 Review approved。');
      const { author, failure } = reviewRepairInputs(root, workspace, current, ownLock);
      for (const ref of [author.ref, failure.ref]) captureBytes(root, ref, bytes);
      const previous = failure.record.attempt ?? failure.record.fullTest!;
      if (!equal(previous.scope, scope))
        throw new MendiError('delivery-state-conflict', '原失败与当前完整范围 / 批准矛盾。');
      approvals = previous.approvals;
      if (failure.record.attempt) {
        if (
          failure.record.attempt.candidate.id === c.id &&
          !equal(failure.record.attempt.candidate, c)
        )
          throw new MendiError(
            'candidate-conflict',
            '同候选 ID 的材料声明矛盾，实质修复须明确新候选。',
          );
        const facts = inspectAttempt(root, workspace, failure, ownLock, bytes);
        const impact = author.record.repair?.groups?.impact;
        if (
          !facts.stable ||
          (facts.protocolState === 'unconfirmed' && !failure.record.attempt.observation?.notRun) ||
          !equal(failure.record.attempt.plan, plan) ||
          !equal(impact?.candidate, c)
        )
          throw new MendiError('review-input-invalid', '当前修复批准的完整计划 / 候选不一致。');
      }
      repairApproval = {
        reviewRunRef: current.ref,
        authorRunRef: author.ref,
        authorActor: author.record.actorId,
        reviewerActor: current.record.actorId,
      };
    } else {
      if (!current.record.attempt)
        throw new MendiError(
          'delivery-state-conflict',
          '旧 command / verification 只能历史读；旧 failed 先完成修复审核。',
        );
      const a = current.record.attempt;
      approvals = a.approvals;
      const facts = inspectAttempt(root, workspace, current, ownLock, bytes);
      if (
        !facts.stable ||
        !equal(a.scope, scope) ||
        !equal(a.plan, plan) ||
        !equal(a.candidate, c) ||
        facts.commandMatch !== 'match'
      )
        throw new MendiError(
          'delivery-state-conflict',
          '原执行不稳定或材料 / 完整计划 / 入口变化，须修复审核。',
        );
      if (a.version !== 2 || a.formalOutcome !== 'passed') {
        if (facts.protocolState === 'unconfirmed' && !a.observation?.notRun)
          throw new MendiError('delivery-state-conflict', '原执行 / 清理未知，停 Owner。');
        recovery = environmentRecovery(
          root,
          raw.environmentRecovery,
          a,
          current.ref,
          snapshot,
          bytes,
        );
      } else if (raw.environmentRecovery !== undefined)
        throw new MendiError('environment-recovery-invalid', 'passed 没有环境失败可处置。');
      repairApproval = a.repairApproval;
      if (repairApproval) {
        const approval = repairApproval;
        const review = readDeliveryRun(root, approval.reviewRunRef, workspace.id);
        const author = repairAuthor(root, workspace, approval.authorRunRef, approval.reviewerActor);
        requireCurrentRound(workspace, review.record);
        if (
          review.record.status !== 'submitted' ||
          review.record.outcome !== 'complete' ||
          review.record.verdict !== 'approved' ||
          !review.body.trim() ||
          review.record.authorRunRef !== author.ref ||
          review.record.actorId !== approval.reviewerActor ||
          author.record.actorId !== approval.authorActor ||
          !equal(comparableRepair(review.record.repair), comparableRepair(author.record.repair)) ||
          !equal(author.record.repair?.scope, scope) ||
          (author.record.repair?.groups &&
            (!equal(author.record.repair.groups.plan, plan) ||
              !equal(author.record.repair.groups.impact.candidate, c)))
        )
          throw new MendiError('review-input-invalid', '当前必要修复批准已不可用。');
        for (const ref of [review.ref, author.ref]) captureBytes(root, ref, bytes);
      }
    }
  } else {
    if (raw.fromRunRef !== undefined || raw.environmentRecovery !== undefined)
      throw new MendiError('delivery-state-conflict', '本轮没有可重跑来源。');
    const first = firstApprovals(root, workspace);
    approvals = first.approvals;
    for (const ref of first.refs) captureBytes(root, ref, bytes);
  }
  if (
    approvals.some(
      (f) =>
        workspace.bindings.find((b) => b.changeId === f.changeId)?.latestRunRef !== f.archiveRunRef,
    )
  )
    throw new MendiError('review-input-invalid', '本轮已核对批准快照与当前归档绑定不一致。');
  const attempt: GroupAttempt = {
    version: 2,
    roundId: workspace.currentRoundId!,
    scope,
    approvals,
    baselineFacts: baseline.facts,
    entry: {
      scriptName: script.scriptName,
      scriptText: script.scriptText,
      ...(script.packageManager === undefined
        ? {}
        : { packageManager: String(script.packageManager) }),
      pnpmBin: input.pnpmBin,
    },
    plan,
    candidate: c,
    purpose: 'initial',
    selection,
    progress: plan.groups.map((g) => ({
      id: g.id,
      state: 'not-run',
      reason: '本次完整执行尚未开始',
      sourceRunRef: null,
      candidate: c,
    })),
    phase: 'prepared',
    executionId: null,
    timing: [],
    ...(snapshot?.length ? { materialSnapshot: snapshot } : {}),
    ...(raw.fromRunRef === undefined ? {} : { fromRunRef: String(raw.fromRunRef) }),
    ...(repairApproval ? { repairApproval } : {}),
    ...(recovery ? { environmentRecovery: recovery } : {}),
  };
  return { workspace, attempt, bytes };
}
export function confirmGroupInputs(
  root: string,
  admitted: ReturnType<typeof groupAdmission>,
  runRef: string,
) {
  const workspace = readWorkspace(root, true)!;
  requireWritable(workspace);
  confirmBytes(root, admitted.bytes);
  const expected = projectProgress(admitted.workspace, {
    ...admitted.workspace.manifest,
    deliveryRunRef: runRef,
    testAttemptRunRef: runRef,
  });
  if (
    !equal(workspace.project, admitted.workspace.project) ||
    !equal(workspace.manifest, expected) ||
    !equal(verificationScope(workspace), admitted.attempt.scope)
  )
    throw new MendiError('delivery-input-changed', '本次当前指针 / 范围变化。');
  return workspace;
}
