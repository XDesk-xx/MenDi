import { MendiError, object, text } from './errors.ts';
import {
  candidate,
  groupPlan,
  selectGroups,
  type Candidate,
  type GroupPlan,
} from './group-plan.ts';
import {
  stageTimings,
  type GroupRequest,
  type ProtocolObservation,
  type Progress,
} from './group-report.ts';
import { parseVerificationScope, type FullTest } from './delivery-verification.ts';
import { checkBaselineSnapshot } from './baselines.ts';
import { deliveryLocation } from './delivery-runs.ts';
import { runLocation } from './actions.ts';
import { executionLocation } from './test-execution.ts';
import { parseImpact } from './repair-record.ts';
import { formalOutcome, type FormalOutcome } from './formal-attempt.ts';

export interface GroupImpact {
  candidate: Candidate;
  affectedGroupIds: string[];
  retained: { id: string; reason: string }[];
  extent: 'local' | 'common' | 'unknown';
  reason: string;
}
export interface GroupAttempt {
  version: 1 | 2;
  roundId: string;
  scope: FullTest['scope'];
  approvals: FullTest['approvals'];
  baselineFacts: NonNullable<FullTest['baselineFacts']>;
  entry: FullTest['entry'];
  plan: GroupPlan;
  candidate: Candidate;
  purpose: 'initial' | 'continue' | 'retest';
  selection: string[];
  fromRunRef?: string;
  repairApproval?: FullTest['repairApproval'];
  phase: 'prepared' | 'running' | 'finished';
  executionId: string | null;
  request?: GroupRequest;
  observation?: ProtocolObservation;
  progress: Progress[];
  timing: ReturnType<typeof stageTimings>;
  reason?: string;
  formalOutcome?: FormalOutcome;
  materialSnapshot?: { ref: string; sha256: string }[];
  environmentRecovery?: {
    failedRunRef: string;
    evidenceRef: string;
    reason: string;
    evidence: Record<string, unknown>;
  };
}
export interface CandidateVerification {
  version: 1;
  kind: 'candidate-verification';
  roundId: string;
  scope: FullTest['scope'];
  approvals: FullTest['approvals'];
  baselineFacts: NonNullable<FullTest['baselineFacts']>;
  plan: GroupPlan;
  candidate: Candidate;
  progress: Progress[];
  sources: {
    id: string;
    runRef: string;
    candidate: Candidate;
    fact: Progress;
    executionId: string;
    rawOutcome: string;
    protocolState: 'valid';
    applicability: string;
  }[];
  repairApproval?: FullTest['repairApproval'];
  repairImpact?: GroupImpact;
  conclusion: 'verified' | 'incomplete';
  gaps: string[];
}
function shared(raw: Record<string, unknown>, id: string, number: number, attempt = false) {
  const scope = parseVerificationScope(raw.scope);
  checkBaselineSnapshot(scope, raw.baselineFacts as FullTest['baselineFacts']);
  if (
    !(raw.version === 1 || (attempt && raw.version === 2)) ||
    !/^r\d{3,}$/.test(text(raw.roundId, 'roundId')) ||
    !Array.isArray(raw.approvals) ||
    raw.approvals.length !== scope.completed.length
  )
    throw new MendiError('invalid-run', '组记录版本、轮次或批准快照无效。');
  for (const [i, v] of raw.approvals.entries()) {
    const f = object(v, '批准');
    if (
      f.changeId !== scope.completed[i].changeId ||
      text(f.authorActor, 'Author') === text(f.reviewerActor, 'Reviewer')
    )
      throw new MendiError('invalid-run', '批准快照矛盾。');
    for (const key of ['archiveRunRef', 'reviewRunRef', 'authorRunRef']) text(f[key], key);
    const archive = runLocation(String(f.archiveRunRef), id, String(f.changeId));
    const review = runLocation(String(f.reviewRunRef), id, String(f.changeId));
    const author = runLocation(String(f.authorRunRef), id, String(f.changeId));
    if (
      archive.type !== 'archive' ||
      review.type !== 'review-apply' ||
      !['apply', 'revise-apply'].includes(author.type) ||
      author.number >= review.number ||
      review.number >= archive.number ||
      archive.number >= number ||
      author.batchId !== review.batchId ||
      review.batchId !== archive.batchId
    )
      throw new MendiError('invalid-run', '批准快照顺序 / 身份不一致。');
  }
  if (raw.repairApproval !== undefined) {
    const a = object(raw.repairApproval, '修复批准');
    const review = deliveryLocation(text(a.reviewRunRef, 'Review'), id);
    const author = deliveryLocation(text(a.authorRunRef, 'Author'), id);
    if (
      review.type !== 'review-delivery-repair' ||
      !['delivery-repair', 'revise-delivery-repair'].includes(author.type) ||
      author.number >= review.number ||
      review.number >= number ||
      text(a.authorActor, 'Author') === text(a.reviewerActor, 'Reviewer')
    )
      throw new MendiError('invalid-run', '修复批准快照不一致。');
  }
  return { scope, plan: groupPlan(raw.plan), candidate: candidate(raw.candidate) };
}
function progress(value: unknown, plan: GroupPlan): Progress[] {
  if (!Array.isArray(value) || value.length !== plan.groups.length)
    throw new MendiError('invalid-run', '缺完整扁平进展。');
  return value.map((v, i) => {
    const f = object(v, '进展');
    if (
      f.id !== plan.groups[i].id ||
      !['passed', 'failed', 'blocked', 'not-run', 'interrupted', 'unknown'].includes(
        String(f.state),
      ) ||
      typeof f.reason !== 'string' ||
      !(f.sourceRunRef === null || typeof f.sourceRunRef === 'string')
    )
      throw new MendiError('invalid-run', '进展身份 / 状态矛盾。');
    candidate(f.candidate);
    return f as unknown as Progress;
  });
}
export function parseAttempt(value: unknown, id: string, number: number): GroupAttempt {
  const raw = object(value, '结构化尝试');
  const facts = shared(raw, id, number, true);
  const selection = selectGroups(facts.plan, raw.selection);
  if (
    !['initial', 'continue', 'retest'].includes(String(raw.purpose)) ||
    !['prepared', 'running', 'finished'].includes(String(raw.phase)) ||
    !(raw.executionId === null || /^\d{3,}-full$/.test(String(raw.executionId)))
  )
    throw new MendiError('invalid-run', '尝试类型或执行状态无效。');
  const entry = object(raw.entry, '入口');
  for (const k of ['scriptName', 'scriptText', 'pnpmBin']) text(entry[k], k);
  if (raw.phase !== 'prepared' && raw.executionId !== null) {
    const request = object(raw.request, '请求');
    if (
      request.executionId !== raw.executionId ||
      JSON.stringify(request.plan) !== JSON.stringify(facts.plan) ||
      JSON.stringify(request.candidate) !== JSON.stringify(facts.candidate) ||
      JSON.stringify(request.selection) !== JSON.stringify(selection)
    )
      throw new MendiError('invalid-run', '请求与记录不一致。');
  }
  if (raw.phase === 'finished') {
    const obs = object(raw.observation, '协议结果');
    if (
      !['valid', 'invalid', 'unconfirmed'].includes(String(obs.protocolState)) ||
      !Array.isArray(obs.groups) ||
      !Array.isArray(obs.reasons)
    )
      throw new MendiError('invalid-run', '协议状态无效。');
  }
  if (raw.version === 2) {
    if (
      raw.purpose !== 'initial' ||
      facts.plan.groups.some((g) => g.required && !selection.includes(g.id)) ||
      (raw.phase === 'finished'
        ? raw.formalOutcome !== formalOutcome(facts.plan, raw.observation as ProtocolObservation)
        : raw.formalOutcome !== undefined)
    )
      throw new MendiError('invalid-run', 'v2 需要本次完整 initial 和一致正式终态。');
    if (
      (raw.phase === 'running' && raw.executionId === null) ||
      (raw.phase === 'finished' &&
        raw.executionId === null &&
        !(raw.observation as ProtocolObservation).notRun)
    )
      throw new MendiError('invalid-run', 'v2 实际执行终态缺少 child 身份，不能由元数据制造通过。');
    if (
      raw.request !== undefined &&
      (!Array.isArray(object(raw.request, '请求').prerequisites) ||
        (object(raw.request, '请求').prerequisites as unknown[]).length)
    )
      throw new MendiError('invalid-run', 'v2 不沿用旧通过前置。');
    if (raw.materialSnapshot !== undefined) {
      if (!Array.isArray(raw.materialSnapshot) || !raw.materialSnapshot.length)
        throw new MendiError('invalid-run', '材料快照为空。');
      const seen = new Set<string>();
      for (const v of raw.materialSnapshot) {
        const m = object(v, '直接材料');
        const ref = text(m.ref, '材料路径');
        if (seen.has(ref) || !/^[a-f0-9]{64}$/.test(String(m.sha256)))
          throw new MendiError('invalid-run', '直接材料快照无效。');
        seen.add(ref);
      }
    }
    if (raw.environmentRecovery !== undefined) {
      const r = object(raw.environmentRecovery, '环境恢复');
      const loc = deliveryLocation(text(r.failedRunRef, '失败来源'), id);
      if (
        loc.type !== 'delivery-test-attempt' ||
        loc.number >= number ||
        r.failedRunRef !== raw.fromRunRef
      )
        throw new MendiError('invalid-run', '环境恢复来源不一致。');
      text(r.evidenceRef, '恢复证据');
      text(r.reason, '恢复原因');
      const evidence = object(r.evidence, '恢复事实快照');
      if (
        evidence.failedRunRef !== r.failedRunRef ||
        evidence.cleanup !== 'confirmed' ||
        evidence.contractUnchanged !== true
      )
        throw new MendiError('invalid-run', '环境恢复事实快照不完整。');
    }
  } else if (
    raw.formalOutcome !== undefined ||
    raw.environmentRecovery !== undefined ||
    raw.materialSnapshot !== undefined
  )
    throw new MendiError('invalid-run', 'v1 不携带新版正式字段。');
  return {
    ...raw,
    ...facts,
    selection,
    progress: progress(raw.progress, facts.plan),
    timing: stageTimings(raw.timing),
  } as unknown as GroupAttempt;
}
export function parseCandidateVerification(
  value: unknown,
  id: string,
  number: number,
): CandidateVerification {
  const raw = object(value, '候选结论');
  const facts = shared(raw, id, number);
  if (
    raw.kind !== 'candidate-verification' ||
    !['verified', 'incomplete'].includes(String(raw.conclusion)) ||
    !Array.isArray(raw.sources) ||
    !Array.isArray(raw.gaps)
  )
    throw new MendiError('invalid-run', '候选类型或结论无效。');
  const p = progress(raw.progress, facts.plan);
  const impact =
    raw.repairApproval === undefined ? undefined : parseImpact(raw.repairImpact, facts.plan);
  if (impact && JSON.stringify(impact.candidate) !== JSON.stringify(facts.candidate))
    throw new MendiError('invalid-run', '当前影响批准与候选矛盾。');
  if (raw.repairImpact !== undefined && raw.repairApproval === undefined)
    throw new MendiError('invalid-run', '影响快照没有独立批准。');
  const required = facts.plan.groups.filter((g) => g.required);
  const sources = raw.sources.map((v) => object(v, '直接组快照'));
  if (new Set(sources.map((s) => s.id)).size !== sources.length)
    throw new MendiError('invalid-run', '来源重复。');
  for (const s of sources) {
    const f = object(s.fact, '来源事实');
    const loc = deliveryLocation(text(s.runRef, '来源'), id);
    if (
      loc.type !== 'delivery-test-attempt' ||
      loc.number >= number ||
      !required.some((g) => g.id === s.id) ||
      f.id !== s.id ||
      f.state !== 'passed' ||
      f.sourceRunRef !== s.runRef ||
      s.protocolState !== 'valid' ||
      JSON.stringify(s.fact) !== JSON.stringify(p.find((f) => f.id === s.id)) ||
      JSON.stringify(f.candidate) !== JSON.stringify(facts.candidate) ||
      !['passed', 'failed'].includes(String(s.rawOutcome))
    )
      throw new MendiError('invalid-run', '来源快照无效。');
    text(s.applicability, '适用依据');
    if (executionLocation(text(s.executionId, 'execution'), id).kind !== 'full')
      throw new MendiError('invalid-run', '组来源必须是实际 full 执行。');
    candidate(s.candidate);
    if (JSON.stringify(s.candidate) !== JSON.stringify(facts.candidate)) {
      if (
        !impact ||
        JSON.stringify(impact.candidate) !== JSON.stringify(facts.candidate) ||
        !impact.retained.some((v) => v.id === s.id)
      )
        throw new MendiError('invalid-run', '跨候选来源缺必要本地批准快照。');
    }
  }
  if (
    raw.conclusion === 'verified' &&
    (raw.gaps.length ||
      required.some(
        (g) =>
          !sources.some((s) => s.id === g.id) || p.find((f) => f.id === g.id)?.state !== 'passed',
      ))
  )
    throw new MendiError('invalid-run', 'verified 存在必需缺口。');
  return { ...raw, ...facts, progress: p } as unknown as CandidateVerification;
}
