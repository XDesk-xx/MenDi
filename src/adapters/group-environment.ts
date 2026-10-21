import { createHash } from 'node:crypto';
import { MendiError, object, text } from '../core/errors.ts';
import { strings } from '../core/group-plan.ts';
import type { GroupAttempt } from '../core/group-records.ts';
import { capturedJson, captureBytes, equal } from './group-store.ts';

// 仅固定显式声明的直接受测输入；无快照不能使用环境豁免。
export function materialSnapshot(root: string, refs: unknown, bytes: Map<string, Buffer>) {
  if (refs === undefined) return undefined;
  return [...new Set(['package.json', ...strings(refs, 'materialRefs')])].map((ref) => ({
    ref,
    sha256: createHash('sha256')
      .update(captureBytes(root, ref, bytes))
      .digest('hex'),
  }));
}
export function environmentRecovery(
  root: string,
  raw: unknown,
  previous: GroupAttempt,
  from: string,
  snapshot: GroupAttempt['materialSnapshot'],
  bytes: Map<string, Buffer>,
) {
  const recovery = object(raw, '环境恢复声明');
  if (
    recovery.failedRunRef !== from ||
    previous.version !== 2 ||
    !['failed', 'blocked', 'not-run'].includes(String(previous.formalOutcome)) ||
    !snapshot?.length ||
    !equal(snapshot, previous.materialSnapshot)
  )
    throw new MendiError(
      'environment-recovery-invalid',
      '须固定当前 known 环境失败与未变直接材料；实质变化须 Repair / Review。',
    );
  const evidenceRef = text(recovery.evidenceRef, '环境恢复证据');
  const evidence = object(capturedJson(root, evidenceRef, bytes), '恢复证据');
  if (
    evidence.failedRunRef !== from ||
    evidence.projectRoot !== root ||
    evidence.phase !== 'preparation' ||
    evidence.cleanup !== 'confirmed' ||
    evidence.contractUnchanged !== true ||
    !Array.isArray(evidence.resources) ||
    !evidence.resources.length
  )
    throw new MendiError(
      'environment-recovery-invalid',
      '恢复缺少直接失败、归属、合同或清理确认。',
    );
  // 原报告也必须声明准备失败；普通断言失败不能用恢复字符串旁路。
  if (previous.executionId && !previous.observation?.notRun) {
    if (!previous.request) throw new MendiError('environment-recovery-invalid', '缺直接请求。');
    const report = object(capturedJson(root, previous.request.reportRef, bytes), '原报告');
    const failure = object(report.environmentFailure, '原准备失败');
    if (
      !previous.observation?.environmentFailure ||
      !equal(failure, previous.observation.environmentFailure) ||
      failure.phase !== 'preparation' ||
      !equal(
        failure.resources,
        evidence.resources.map((v) => {
          const r = object(v, '资源');
          return { id: r.id, projectRoot: r.projectRoot, identity: r.identity };
        }),
      )
    )
      throw new MendiError('environment-recovery-invalid', '恢复身份与原真实准备失败不一致。');
  } else {
    const failure = object(
      capturedJson(root, from.replace(/run\.md$/, 'artifacts/precheck.json'), bytes),
      '原准备失败',
    );
    if (!['test-tool-unavailable', 'test-dependencies-unavailable'].includes(String(failure.code)))
      throw new MendiError('environment-recovery-invalid', '原记录不是可确认的准备问题。');
  }
  for (const value of evidence.resources) {
    const r = object(value, '恢复资源');
    if (
      r.projectRoot !== root ||
      r.ownership !== 'project' ||
      r.state !== 'recovered' ||
      r.cleanup !== 'confirmed'
    )
      throw new MendiError('environment-recovery-invalid', '外部 / 未知资源不得由环境豁免接管。');
    for (const k of ['id', 'identity', 'preflight']) text(r[k], k);
  }
  return { failedRunRef: from, evidenceRef, reason: text(recovery.reason, '处置原因'), evidence };
}
