import { isDeepStrictEqual } from 'node:util';
import { MendiError, text } from './errors.ts';
import { parseProject, parseWorkspace, readScope, type Workspace } from './records.ts';
import type { DeliveryRunRecord } from './delivery-runs.ts';
import { comparableScope, recordRound } from './round-records.ts';
import { currentBatchId } from './batches.ts';
import { projectRound, type DeliveryRound } from './rounds.ts';

export interface LegacyBoundary {
  ref: string;
  record: DeliveryRunRecord;
  before?: Record<string, unknown>;
  beforeRef?: string;
}
export interface LegacyInputs {
  workspace: Workspace;
  boundaries: LegacyBoundary[];
  records: Map<string, DeliveryRunRecord>;
  migrationRunRef: string;
}
const sameScope = (a: unknown, b: unknown) =>
  isDeepStrictEqual(comparableScope(readScope(a)), comparableScope(readScope(b)));

/** Pure conversion of known direct scopes. Missing historical promises are an error, never inferred from names. */
export function convertLegacy(input: LegacyInputs) {
  const { workspace, records } = input;
  if (workspace.mode !== 'product' || workspace.manifest.formatVersion !== 1)
    throw new MendiError('migration-not-legacy', '只转换选定旧 product。');
  const opens = input.boundaries.filter((b) => b.record.actionType === 'delivery-open');
  const reopens = input.boundaries
    .filter((b) => b.record.actionType === 'delivery-reopen')
    .sort((a, b) => a.record.runNumber - b.record.runNumber);
  if (
    opens.length > 1 ||
    (opens[0] && reopens[0] && opens[0].record.runNumber >= reopens[0].record.runNumber)
  )
    throw new MendiError('migration-source-conflict', 'Open / Reopen 顺序矛盾。');
  const snapshots = [...reopens.map((b) => b.before!), workspace.manifest];
  const rounds: DeliveryRound[] = snapshots.map((snapshot, i) => {
    if (
      !snapshot ||
      snapshot.id !== workspace.id ||
      snapshot.recordingMode !== 'product' ||
      snapshot.formatVersion !== 1
    )
      throw new MendiError('migration-source-gap', '缺少同一 Delivery 的真实旧前态。');
    const scope = readScope(snapshot);
    const origin = i === 0 ? opens[0] : reopens[i - 1];
    if (origin && !sameScope(origin.record.lifecycle!.scope, scope))
      throw new MendiError('migration-source-conflict', '记录化范围与直接前态 / 当前范围矛盾。');
    if (i && reopens[i - 1].before?.state !== 'closed')
      throw new MendiError('migration-source-gap', 'Reopen 缺少真实 closed 前态。');
    const round: DeliveryRound = {
      id: `r${String(i + 1).padStart(3, '0')}`,
      origin: origin
        ? { kind: i ? 'reopen' : 'open', runRef: origin.ref }
        : {
            kind: 'legacy-baseline',
            sourceRefs: [
              reopens[0]?.beforeRef ?? workspace.manifestRef,
              ...(snapshot.state === 'closed' ? [text(snapshot.closeRunRef, '真实 Close')] : []),
            ],
          },
      scope,
      openedOn: i ? origin!.record.lifecycle!.recordedOn : text(snapshot.openedOn, '首次日期'),
      ...(i ? { reason: text(origin!.record.lifecycle!.reason, 'Reopen 原因') } : {}),
      state: snapshot.state as DeliveryRound['state'],
      currentBatchId: currentBatchId(snapshot),
    };
    if (snapshot.fullTestRunRef !== undefined) {
      const ref = String(snapshot.fullTestRunRef),
        full = records.get(ref)?.fullTest;
      if (!full) throw new MendiError('migration-source-gap', '缺少直接正式范围。', { ref });
      if (sameScope(full.scope, scope)) round.fullTestRunRef = ref;
    }
    if (snapshot.deliveryRunRef !== undefined) {
      const ref = String(snapshot.deliveryRunRef),
        record = records.get(ref);
      const summary = record?.lifecycle ?? record?.fullTest ?? record?.repair;
      if (!summary || !sameScope(summary.scope, scope))
        throw new MendiError('migration-source-conflict', '当前交接无法归属真实范围。', { ref });
      round.deliveryRunRef = ref;
    }
    if (round.state === 'closed') {
      const ref = text(snapshot.closeRunRef, 'Close'),
        close = records.get(ref);
      if (
        !close?.lifecycle?.acceptance ||
        close.actionType !== 'delivery-close' ||
        close.status !== 'submitted' ||
        close.outcome !== 'complete' ||
        !sameScope(close.lifecycle.scope, scope) ||
        close.lifecycle.fullTestRunRef !== round.fullTestRunRef ||
        !isDeepStrictEqual(
          close.lifecycle.acceptance,
          records.get(round.fullTestRunRef!)?.fullTest,
        ) ||
        (reopens[i] && reopens[i].record.lifecycle!.priorCloseRef !== ref)
      )
        throw new MendiError('migration-source-conflict', '旧轮 Close 与直接完成事实矛盾。', {
          ref,
        });
      round.closeRunRef = ref;
      round.closedOn = text(snapshot.closedOn, '真实收口日期');
    }
    return round;
  });
  const project = { ...workspace.project, formatVersion: 2 };
  const manifest = projectRound(
    { ...workspace.manifest, formatVersion: 2, migrationRunRef: input.migrationRunRef },
    rounds,
    rounds.at(-1)!.id,
  );
  const converted = parseWorkspace(parseProject(project), manifest);
  // Every consumed result has a unique owner, including old results retained by a later Reopen.
  for (const record of records.values()) recordRound(converted, record);
  for (const boundary of input.boundaries) recordRound(converted, boundary.record);
  return { project, manifest, rounds };
}
