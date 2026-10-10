import { identifier, MendiError, object, text } from './errors.ts';
import type { Binding } from './associations.ts';
import type { Scope, Workspace } from './records.ts';

export function currentBatchId(manifest: Record<string, unknown>): string | null {
  const batches = manifest.changeBatches as Record<string, unknown>[];
  if (manifest.currentBatchId === null) return null;
  if (manifest.currentBatchId !== undefined) return text(manifest.currentBatchId, 'currentBatchId');
  if (batches.length > 1) throw new MendiError('invalid-record', '多批次缺少明确当前选择。');
  return batches.length ? text(batches[0].id, 'batch.id') : null;
}

export function validateBatches(
  id: string,
  manifest: Record<string, unknown>,
  bindings: Binding[],
  scope: Scope,
) {
  if (!Array.isArray(manifest.changeBatches))
    throw new MendiError('invalid-record', '批次必须是数组。');
  const selected = currentBatchId(manifest);
  const seen = new Set<string>();
  const batchIds = new Set<string>();
  let previous = 0;
  for (const value of manifest.changeBatches) {
    const batch = object(value, '批次');
    const first = text(batch.firstRun, 'firstRun');
    const n = Number(first);
    if (
      !Number.isSafeInteger(n) ||
      n <= previous ||
      String(n).padStart(3, '0') !== first ||
      batch.id !== `${first}-changes` ||
      batch.runsRef !== `.mendi/runs/${id}/${batch.id}` ||
      !Array.isArray(batch.changeIds)
    )
      throw new MendiError('invalid-record', '批次身份或顺序不一致。');
    previous = n;
    batchIds.add(String(batch.id));
    const expected = bindings.filter((b) => b.batchId === batch.id);
    const members = batch.changeIds.map((v) => identifier(v, '批次 Change'));
    if (
      !members.length ||
      members.length !== expected.length ||
      members.some((v, i) => expected[i]?.changeId !== v || seen.has(v))
    )
      throw new MendiError('invalid-record', '批次成员或 binding 不一致。');
    for (const b of expected) {
      seen.add(b.changeId);
      if (b.latestRunRef && !b.latestRunRef.startsWith(`${batch.runsRef}/${b.changeId}/`))
        throw new MendiError('invalid-record', 'Run 定位不在所属批次。');
      if (batch.id === selected && !scope.plannedChanges.some((p) => p.slot === b.planningSlot))
        throw new MendiError('invalid-record', '当前批次包含历史范围项。');
    }
  }
  if (selected !== null && !batchIds.has(selected))
    throw new MendiError('invalid-record', '当前批次不存在。');
  for (const b of bindings) {
    const inScope = scope.plannedChanges.some((p) => p.slot === b.planningSlot);
    if (
      (b.batchId && !seen.has(b.changeId)) ||
      (b.latestRunRef && !b.batchId) ||
      (inScope && selected !== null && b.batchId !== selected) ||
      (inScope && selected === null && b.batchId !== undefined)
    )
      throw new MendiError('invalid-record', '当前范围、绑定与批次选择不一致。');
  }
}

export function currentScopeBindings(workspace: Pick<Workspace, 'bindings' | 'scope'>) {
  const slots = new Set(workspace.scope.plannedChanges.map((p) => p.slot));
  return workspace.bindings.filter((b) => slots.has(b.planningSlot));
}
