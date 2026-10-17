import { inspectProject } from '../adapters/project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { writeAction } from '../adapters/action-store.ts';
import {
  readDeliveryRun,
  currentDeliveryRun,
  createDeliveryRun,
  replaceDeliveryDraft,
} from '../adapters/delivery-runs.ts';
import {
  currentGroupProgress,
  capturedJson,
  captureBytes,
  rememberBytes,
  confirmBytes,
  inspectAttempt,
  inspectCandidate,
  equal,
} from '../adapters/group-store.ts';
import { repairAuthor } from '../adapters/delivery-verification.ts';
import { loadMethods } from '../adapters/methods.ts';
import { deliveredBaselines } from '../adapters/baselines.ts';
import { candidate, groupPlan } from '../core/group-plan.ts';
import { requireCurrentRound } from '../core/round-records.ts';
import { requireWritable } from '../core/rounds.ts';
import { verificationScope } from '../core/delivery-verification.ts';
import type { CandidateVerification } from '../core/group-records.ts';
import { deliveryLocation, deliveryNext } from '../core/delivery-runs.ts';
import { MendiError, object, text } from '../core/errors.ts';
import { state } from './project.ts';
import type { ActionOptions } from './action-context.ts';
export interface VerificationInput {
  project: string;
  inputFile: string;
  role: string;
  actor: string;
}

function admission(root: string, input: VerificationInput, ownLock = false) {
  if (input.role !== 'author')
    throw new MendiError('action-role-mismatch', '构造结论要求 Author。');
  text(input.actor, 'actor');
  const workspace = readWorkspace(root, ownLock);
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', '人工历史只读。');
  requireWritable(workspace);
  const scope = verificationScope(workspace);
  const bytes = new Map<string, Buffer>();
  const raw = object(capturedJson(root, input.inputFile, bytes), '候选声明');
  const current = currentDeliveryRun(root, workspace);
  if ((!current?.record.attempt && !current?.record.verification) || raw.fromRunRef !== current.ref)
    throw new MendiError('run-not-current', '结论固定当前结构化尝试，不回退历史。');
  const latest = currentGroupProgress(root, workspace, ownLock);
  const a = latest.run.record.attempt!;
  captureBytes(root, current.ref, bytes);
  const plan = groupPlan(capturedJson(root, text(raw.planRef, 'planRef'), bytes));
  const c = candidate(raw.candidate);
  if (!equal(plan, a.plan) || !equal(c, a.candidate) || !equal(a.scope, scope))
    throw new MendiError('candidate-conflict', '当前计划、候选或范围矛盾。');
  const baseline = deliveredBaselines(root, workspace, workspace.scope);
  if (!equal(a.baselineFacts, baseline.facts))
    throw new MendiError('baseline-snapshot-invalid', '本轮基线与已测事实变化。');
  for (const [ref, content] of baseline.bytes)
    if (ref !== workspace.manifestRef) rememberBytes(ref, content, bytes);
  let impact;
  if (a.repairApproval) {
    const approval = a.repairApproval;
    const review = readDeliveryRun(root, approval.reviewRunRef, workspace.id);
    requireCurrentRound(workspace, review.record);
    const author = repairAuthor(root, workspace, approval.authorRunRef, approval.reviewerActor);
    if (
      review.record.authorRunRef !== author.ref ||
      review.record.actorId !== approval.reviewerActor ||
      author.record.actorId !== approval.authorActor ||
      review.record.status !== 'submitted' ||
      review.record.outcome !== 'complete' ||
      review.record.verdict !== 'approved' ||
      !review.body.trim() ||
      !equal(review.record.repair, author.record.repair) ||
      !equal(author.record.repair?.groups?.plan, plan)
    )
      throw new MendiError('review-input-invalid', '当前必要修复批准不完整。');
    impact = author.record.repair!.groups!.impact;
    if (!equal(impact.candidate, c)) throw new MendiError('invalid-impact', '当前批准候选不一致。');
    for (const ref of [review.ref, author.ref]) captureBytes(root, ref, bytes);
  }
  if (!Array.isArray(raw.sources))
    throw new MendiError('invalid-group-input', 'sources 必须显式列出。');
  const inputs = raw.sources.map((v) => {
    const s = object(v, '来源');
    return {
      id: text(s.id, '组'),
      runRef: text(s.runRef, '直接来源'),
      applicability: text(s.applicability, '适用依据'),
    };
  });
  if (
    new Set(inputs.map((s) => s.id)).size !== inputs.length ||
    inputs.some((s) => !plan.groups.some((g) => g.id === s.id && g.required))
  )
    throw new MendiError('invalid-group-input', '来源重复或超出必需范围。');
  const gaps: string[] = [];
  const sources: CandidateVerification['sources'] = [];
  for (const group of plan.groups.filter((g) => g.required)) {
    const selected = inputs.find((s) => s.id === group.id);
    const recent = a.progress.find((p) => p.id === group.id)!;
    if (!selected) {
      gaps.push(`${group.id}: 缺直接来源`);
      continue;
    }
    if (
      recent.state !== 'passed' ||
      recent.sourceRunRef !== selected.runRef ||
      !equal(recent.candidate, c)
    ) {
      gaps.push(`${group.id}: 当前仍有失败 / 未确认或来源已被替代`);
      continue;
    }
    const source = readDeliveryRun(root, selected.runRef, workspace.id);
    requireCurrentRound(workspace, source.record);
    const facts = inspectAttempt(root, workspace, source, ownLock, bytes);
    const original = source.record.attempt!;
    const fact = original.observation?.groups.find((g) => g.id === group.id);
    if (
      !facts.stable ||
      facts.protocolState !== 'valid' ||
      !facts.child ||
      !equal(original.plan, plan) ||
      !equal(original.scope, scope) ||
      !original.selection.includes(group.id) ||
      fact?.state !== 'passed'
    ) {
      gaps.push(`${group.id}: 来源不是有效直接通过`);
      continue;
    }
    if (!equal(original.candidate, c) && !impact?.retained.some((r) => r.id === group.id)) {
      gaps.push(`${group.id}: 跨候选缺当前独立沿用批准`);
      continue;
    }
    sources.push({
      ...selected,
      candidate: original.candidate,
      fact: recent,
      executionId: facts.child.executionId,
      rawOutcome: facts.child.outcome,
      protocolState: 'valid',
    });
  }
  if (latest.facts.protocolState !== 'valid') gaps.push('当前尝试协议不可复用');
  confirmBytes(root, bytes);
  const verification: CandidateVerification = {
    version: 1,
    kind: 'candidate-verification',
    roundId: workspace.currentRoundId!,
    scope,
    approvals: a.approvals,
    baselineFacts: a.baselineFacts,
    plan,
    candidate: c,
    progress: a.progress,
    sources,
    conclusion: gaps.length ? 'incomplete' : 'verified',
    gaps,
    ...(a.repairApproval ? { repairApproval: a.repairApproval, repairImpact: impact } : {}),
  };
  return { workspace, bytes, verification };
}
export function createVerification(input: VerificationInput, options: ActionOptions = {}) {
  const { root } = inspectProject(input.project);
  const before = admission(root, input);
  const methods = loadMethods('delivery-verification', [], options.methodsRoot);
  const result = writeAction(
    root,
    'delivery-verification-create',
    (workspace, written) => {
      const admitted = admission(root, input, true);
      if (
        !equal(before.verification, admitted.verification) ||
        [...before.bytes].some(([ref, b]) => !admitted.bytes.get(ref)?.equals(b))
      )
        throw new MendiError('delivery-input-changed', '持锁后候选输入变化。');
      const created = createDeliveryRun(
        root,
        workspace,
        {
          formatVersion: 1,
          recordingMode: 'product',
          scope: 'delivery',
          deliveryId: workspace.id,
          changeId: null,
          actionType: 'delivery-verification',
          role: 'author',
          actorId: input.actor,
          status: 'draft',
          stageSkill: 'delivery-full-test',
          toolGuidance: [],
          verification: admitted.verification,
        },
        written,
        options.observeWrite,
      );
      confirmBytes(root, admitted.bytes);
      const run = replaceDeliveryDraft(
        root,
        created.run,
        {
          ...created.run.header,
          status: 'submitted',
          outcome: 'complete',
          result: admitted.verification.conclusion,
        },
        '',
        written,
        options.observeWrite,
      );
      confirmBytes(root, admitted.bytes);
      const facts = inspectCandidate(root, created.workspace, run, true);
      const actual = readWorkspace(root, true)!;
      if (
        !equal(actual.project, created.workspace.project) ||
        !equal(actual.manifest, created.workspace.manifest)
      )
        throw new MendiError('delivery-input-changed', '候选提交期间当前身份 / 指针变化。');
      if (!facts.stable) throw new MendiError('delivery-readback-failed', '候选持久读回未确认。');
      return { workspace: created.workspace, run, candidateVerification: facts };
    },
    options.observeWrite,
  );
  return {
    ok: result.candidateVerification.conclusion === 'verified',
    operation: 'delivery-verification-create',
    projectRoot: root,
    openspec: null,
    local: state(result.workspace),
    run: { ref: result.run.ref, ...result.run.record },
    candidateVerification: result.candidateVerification,
    methods,
    next: deliveryNext(result.run.record, result.run.ref),
  };
}
export function verificationStatus(input: { project: string; runRef: string }) {
  const { root } = inspectProject(input.project);
  const id = input.runRef.split('/')[2];
  deliveryLocation(input.runRef, id);
  const workspace = readWorkspace(root, false, id);
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('invalid-run', '需要登记 product。');
  const run = readDeliveryRun(root, input.runRef, workspace.id);
  const facts = inspectCandidate(root, workspace, run);
  return {
    ok: facts.stable,
    operation: 'delivery-verification-status',
    projectRoot: root,
    openspec: null,
    local: state(workspace),
    run: { ref: run.ref, ...run.record },
    candidateVerification: facts,
    next: deliveryNext(run.record, run.ref, facts.stable ? undefined : 'unknown'),
  };
}
