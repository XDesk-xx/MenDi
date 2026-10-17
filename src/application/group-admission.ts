import { managedPath } from '../adapters/paths.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { currentDeliveryRun, readDeliveryRun } from '../adapters/delivery-runs.ts';
import {
  captureBytes,
  rememberBytes,
  capturedJson,
  inspectAttempt,
  equal,
  confirmBytes,
} from '../adapters/group-store.ts';
import { firstApprovals, reviewRepairInputs } from '../adapters/delivery-verification.ts';
import { deliveredBaselines } from '../adapters/baselines.ts';
import { selectedTest } from '../adapters/test-entries.ts';
import { candidate, groupPlan, selectGroups } from '../core/group-plan.ts';
import { verificationScope, type FullTest } from '../core/delivery-verification.ts';
import { requireWritable, projectProgress } from '../core/rounds.ts';
import { MendiError, object, text } from '../core/errors.ts';
import type { GroupAttempt } from '../core/group-records.ts';
import type { Progress } from '../core/group-report.ts';
import { formalWorkspace, type FullTestInput } from './full-test-admission.ts';

export function groupAdmission(root: string, input: FullTestInput, ownLock = false) {
  const { workspace, scope } = formalWorkspace(root, input, ownLock);
  const bytes = new Map<string, Buffer>();
  const raw = object(capturedJson(root, input.inputFile, bytes), '组声明');
  if (raw.mode !== 'groups-v1' || !['initial', 'continue', 'retest'].includes(String(raw.purpose)))
    throw new MendiError('invalid-group-input', '显式 mode / purpose 无效。');
  const plan = groupPlan(capturedJson(root, text(raw.planRef, 'planRef'), bytes));
  for (const g of plan.groups) for (const ref of g.artifacts ?? []) managedPath(root, ref);
  const c = candidate(raw.candidate);
  const selection = selectGroups(plan, raw.selection);
  const script = selectedTest(root, 'full');
  captureBytes(root, 'package.json', bytes);
  const baseline = deliveredBaselines(root, workspace, workspace.scope);
  for (const [ref, content] of baseline.bytes)
    if (ref !== workspace.manifestRef) rememberBytes(ref, content, bytes);
  const current = currentDeliveryRun(root, workspace);
  let approvals: FullTest['approvals'];
  let repairApproval: FullTest['repairApproval'];
  let progress: Progress[] = plan.groups.map((g) => ({
    id: g.id,
    state: 'not-run',
    reason: '尚未执行',
    sourceRunRef: null,
    candidate: c,
  }));
  if (current && !current.record.lifecycle) {
    if (
      current.record.status !== 'submitted' ||
      current.record.outcome !== 'complete' ||
      raw.fromRunRef !== current.ref
    )
      throw new MendiError('run-not-current', '须固定当前完整进展 fromRunRef。');
    captureBytes(root, current.ref, bytes);
    const priorRun = readDeliveryRun(
      root,
      text(workspace.manifest.testAttemptRunRef, '当前 attempt'),
      workspace.id,
    );
    const prior = {
      run: priorRun,
      facts: inspectAttempt(root, workspace, priorRun, ownLock, bytes),
    };
    const a = prior.run.record.attempt!;
    const safelyInterrupted =
      (prior.facts.child?.outcome === 'interrupted' || a.observation?.cancelled === true) &&
      prior.facts.stable;
    const safelyNotRun =
      (a.executionId === null || prior.facts.child?.outcome === 'not-run') &&
      a.phase === 'finished' &&
      prior.facts.stable;
    if (
      !prior.facts.stable ||
      (prior.facts.protocolState === 'unconfirmed' &&
        !(raw.purpose === 'initial' && (safelyInterrupted || safelyNotRun)))
    )
      throw new MendiError('delivery-state-conflict', '原执行 / 清理未确认，不可复用。');
    captureBytes(root, prior.run.ref, bytes);
    if (!equal(a.scope, scope) || (!equal(a.plan, plan) && raw.purpose !== 'initial'))
      throw new MendiError('delivery-state-conflict', '完整计划变化需要显式重新规划，不沿用旧组。');
    approvals = a.approvals;
    repairApproval = a.repairApproval;
    progress = structuredClone(a.progress);
    if (c.id === a.candidate.id && !equal(c, a.candidate))
      throw new MendiError('candidate-conflict', '同候选 ID 的材料矛盾。');
    if (raw.purpose === 'continue') {
      if (
        (!current.record.attempt && !current.record.verification) ||
        prior.facts.protocolState !== 'valid' ||
        !equal(c, a.candidate) ||
        a.progress.some((p) => p.state === 'interrupted' || p.state === 'unknown') ||
        selection.some(
          (id) => !['not-run', 'blocked'].includes(progress.find((p) => p.id === id)!.state),
        )
      )
        throw new MendiError(
          'delivery-state-conflict',
          'continue 只能运行相同候选的已知未执行组。',
        );
    } else if (raw.purpose === 'retest') {
      if (
        current.record.role !== 'reviewer' ||
        current.record.verdict !== 'approved' ||
        !current.body.trim() ||
        !current.record.repair?.groups
      )
        throw new MendiError('review-input-invalid', 'retest 要求当前独立修复批准。');
      const { author } = reviewRepairInputs(root, workspace, current, ownLock);
      const impact = current.record.repair.groups.impact;
      if (
        !equal(c, impact.candidate) ||
        impact.affectedGroupIds.some((id) => !selection.includes(id))
      )
        throw new MendiError('invalid-impact', '复验未覆盖批准影响 / 候选。');
      captureBytes(root, author.ref, bytes);
      repairApproval = {
        reviewRunRef: current.ref,
        authorRunRef: author.ref,
        authorActor: author.record.actorId,
        reviewerActor: current.record.actorId,
      };
      progress = progress.map((p) =>
        selection.includes(p.id)
          ? { ...p, state: 'not-run', reason: '受影响须复验', candidate: c }
          : impact.retained.some((r) => r.id === p.id)
            ? { ...p, candidate: c }
            : { ...p, state: 'unknown', reason: '缺沿用依据', candidate: c },
      );
    } else {
      if (
        progress.some((p) => p.state === 'failed') ||
        prior.facts.protocolState === 'invalid' ||
        current.record.repair
      )
        throw new MendiError('delivery-state-conflict', 'initial 不能绕过失败修复审核。');
      if (a.phase !== 'finished') throw new MendiError('delivery-state-conflict', '原现场未完成。');
      progress = plan.groups.map((g) => ({
        id: g.id,
        state: 'not-run',
        reason: '显式重新首次执行',
        sourceRunRef: null,
        candidate: c,
      }));
      repairApproval = undefined;
    }
    if (
      raw.purpose !== 'initial' &&
      !equal(a.entry, { ...script, pnpmBin: a.entry.pnpmBin }) &&
      raw.purpose !== 'retest'
    )
      throw new MendiError('delivery-state-conflict', '实际入口变化必须经影响审核。');
  } else {
    if (raw.purpose !== 'initial' || raw.fromRunRef !== undefined)
      throw new MendiError('delivery-state-conflict', '本轮没有可续测来源。');
    const first = firstApprovals(root, workspace);
    approvals = first.approvals;
    for (const ref of first.refs) captureBytes(root, ref, bytes);
  }
  if (raw.purpose === 'initial' && plan.groups.some((g) => g.required && !selection.includes(g.id)))
    throw new MendiError('invalid-group-input', 'initial 须选择全部必需组。');
  for (const id of selection) {
    const g = plan.groups.find((g) => g.id === id)!;
    if (
      g.dependsOn.some(
        (dep) => !selection.includes(dep) && progress.find((p) => p.id === dep)?.state !== 'passed',
      )
    )
      throw new MendiError('group-prerequisite-unavailable', '本次必要前置没有有效来源。');
  }
  const attempt: GroupAttempt = {
    version: 1,
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
    purpose: raw.purpose as GroupAttempt['purpose'],
    selection,
    progress,
    phase: 'prepared',
    executionId: null,
    timing: [],
    ...(raw.fromRunRef === undefined ? {} : { fromRunRef: String(raw.fromRunRef) }),
    ...(repairApproval ? { repairApproval } : {}),
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
