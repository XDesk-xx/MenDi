import { isDeepStrictEqual } from 'node:util';
import { MendiError } from './errors.ts';
import { readScope, type Scope, type Workspace } from './records.ts';
import type { DeliveryRunRecord } from './delivery-runs.ts';
import type { DeliveryRound } from './rounds.ts';
import { deliveryLocation } from './delivery-runs.ts';
import type { Repair } from './delivery-verification.ts';

export function comparableRepair(value: Repair | undefined) {
  if (!value) return undefined;
  const { roundId: _, ...repair } = value;
  return repair;
}

export function comparableScope(scope: Scope) {
  return {
    goal: scope.goal,
    plannedChanges: scope.plannedChanges.map(({ roadmapSection: _, ...item }) => item),
  };
}

/** Missing new fields are admitted only before an explicit migration receipt, without reading history. */
export function recordRound(
  workspace: Workspace,
  record: DeliveryRunRecord,
): DeliveryRound | undefined {
  if (!workspace.rounds) return undefined;
  const summary =
    record.lifecycle ?? record.fullTest ?? record.attempt ?? record.verification ?? record.repair;
  if (!summary) throw new MendiError('invalid-round-record', '记录没有可解释的轮次摘要。');
  const recordedScope = comparableScope(readScope(summary.scope));
  const matching = workspace.rounds.filter((round) => {
    // The Run must have existed while its claimed scope was the effective
    // scope. Append receipt numbers are exclusive boundaries, not valid
    // historical work recorded under either side of that transition.
    let previousAddition = 0;
    for (const addition of round.scopeAdditions ?? []) {
      const number = deliveryLocation(addition.runRef, workspace.id).number;
      if (record.runNumber <= number)
        return (
          record.runNumber > previousAddition &&
          record.runNumber < number &&
          isDeepStrictEqual(recordedScope, comparableScope(addition.beforeScope))
        );
      previousAddition = number;
    }
    return (
      record.runNumber > previousAddition &&
      isDeepStrictEqual(recordedScope, comparableScope(round.scope))
    );
  });
  if (matching.length !== 1)
    throw new MendiError('invalid-round-record', '范围不能唯一归属已保存轮次。');
  const round = matching[0];
  if (summary.roundId === undefined) {
    const receipt = new RegExp(
      `^\\.mendi/runs/${workspace.id}/(\\d{3,})-delivery-migrate/run\\.md$`,
    ).exec(String(workspace.manifest.migrationRunRef));
    if (!receipt || record.runNumber >= Number(receipt[1]))
      throw new MendiError(
        'invalid-round-record',
        '新建记录必须明确所属轮次；不能借旧记录兼容省略。',
      );
  } else if (summary.roundId !== round.id)
    throw new MendiError('invalid-round-record', '声明轮次与保存范围矛盾。');
  const completedScope = record.lifecycle?.acceptance?.scope ?? summary.scope;
  if (
    record.lifecycle?.acceptance?.roundId !== undefined &&
    record.lifecycle.acceptance.roundId !== round.id
  )
    throw new MendiError('invalid-round-record', 'Close 正式快照属于另一轮。');
  if ('completed' in completedScope) {
    const expected = readScope(completedScope).plannedChanges.map((p) => {
      const binding = workspace.bindings.find((b) => b.planningSlot === p.slot);
      if (!binding || binding.state !== 'archived')
        throw new MendiError('invalid-round-record', '正式范围缺少所属轮次归档绑定。');
      return { slot: p.slot, changeId: binding.changeId, archiveOrdinal: binding.archiveOrdinal };
    });
    if (!isDeepStrictEqual(completedScope.completed, expected))
      throw new MendiError('invalid-round-record', '正式完成项与所属轮次矛盾。');
  }
  return round;
}

export function requireCurrentRound(workspace: Workspace, record: DeliveryRunRecord) {
  const round = recordRound(workspace, record);
  if (round && round.id !== workspace.currentRoundId)
    throw new MendiError('round-not-current', '直接对象属于另一轮，不能用于本轮工作。');
}
