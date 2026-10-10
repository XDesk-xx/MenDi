import { MendiError, object, text } from './errors.ts';

export interface ArchiveRecord {
  reviewRunRef: string;
  authorRunRef: string;
  countBasis: number;
  ordinal: number;
  phase: 'prepared' | 'invoking' | 'none' | 'confirmed';
  attempt: number;
  attemptRef?: string;
  archiveRef?: string;
}
export function archivedCount(project: Record<string, unknown>): number {
  const count = project.archivedChangeCount ?? 0;
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0)
    throw new MendiError('invalid-record', 'archivedChangeCount 必须是非负安全整数。');
  return count;
}
export function archiveName(ref: string, changeId: string, ordinal?: number) {
  const prefix = ordinal === undefined ? '' : `${String(ordinal).padStart(3, '0')}-`;
  const match = /^openspec\/changes\/archive\/(\d{4}-\d{2}-\d{2})-(.+)$/.exec(ref);
  if (
    !match ||
    match[2] !== prefix + changeId ||
    !Number.isFinite(Date.parse(`${match[1]}T00:00:00Z`)) ||
    new Date(`${match[1]}T00:00:00Z`).toISOString().slice(0, 10) !== match[1]
  )
    throw new MendiError(
      'archive-path-invalid',
      '归档路径必须是实际日期与当前 Change 的规范名称。',
      { ref },
    );
  return match[1];
}
export function parseArchive(
  value: unknown,
  runRef: string,
  delivery: string,
  change: string,
): ArchiveRecord {
  const data = object(value, 'Archive 执行状态');
  const countBasis = archivedCount({ archivedChangeCount: data.countBasis });
  const ordinal = countBasis + 1;
  if (
    data.countBasis === undefined ||
    !Number.isSafeInteger(ordinal) ||
    data.ordinal !== ordinal ||
    !['prepared', 'invoking', 'none', 'confirmed'].includes(String(data.phase)) ||
    typeof data.attempt !== 'number' ||
    !Number.isSafeInteger(data.attempt) ||
    data.attempt < 0 ||
    (data.phase === 'prepared') !== (data.attempt === 0)
  )
    throw new MendiError('invalid-run', 'Archive 阶段、尝试编号或计数依据无效。');
  const direct = (v: unknown, reviewer: boolean) => {
    const ref = text(v, 'Archive 直接 Run');
    const prefix = runRef.slice(0, runRef.lastIndexOf('/') + 1).replace(/\d{3,}-archive\/$/, '');
    const suffix = reviewer ? 'review-apply' : '(?:revise-)?apply';
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`^${escapedPrefix}(\\d{3,})-${suffix}/run\\.md$`).exec(ref);
    const current = /\/(\d{3,})-archive\/run\.md$/.exec(runRef);
    if (
      !match ||
      !current ||
      Number(match[1]) < 1 ||
      String(Number(match[1])).padStart(3, '0') !== match[1] ||
      Number(match[1]) >= Number(current[1]) ||
      !ref.startsWith(`.mendi/runs/${delivery}/`) ||
      !prefix.includes(`/${change}/`)
    )
      throw new MendiError('invalid-run', 'Archive 的直接 Apply / Review 引用无效。');
    return ref;
  };
  const record: ArchiveRecord = {
    reviewRunRef: direct(data.reviewRunRef, true),
    authorRunRef: direct(data.authorRunRef, false),
    countBasis,
    ordinal,
    phase: data.phase as ArchiveRecord['phase'],
    attempt: data.attempt,
  };
  if (record.attempt > 0) {
    const expected = `${runRef.slice(0, -'run.md'.length)}artifacts/attempt-${String(record.attempt).padStart(3, '0')}`;
    if (data.attemptRef !== expected)
      throw new MendiError('invalid-run', 'Archive attempt 路径与当前 Run 不一致。');
    record.attemptRef = expected;
  } else if (data.attemptRef !== undefined)
    throw new MendiError('invalid-run', 'prepared 尚无执行 attempt。');
  if (data.archiveRef !== undefined) {
    const ref = text(data.archiveRef, '实际归档路径');
    try {
      archiveName(ref, change);
    } catch {
      archiveName(ref, change, ordinal);
    }
    if (record.phase !== 'confirmed')
      throw new MendiError('invalid-run', '只有 confirmed 有归档目标。');
    record.archiveRef = ref;
  } else if (record.phase === 'confirmed')
    throw new MendiError('invalid-run', 'confirmed 缺实际目标。');
  return record;
}
