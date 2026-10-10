import { identifier, MendiError, object, text } from './errors.ts';
import { archivedCount } from './archive.ts';
import { runLocation } from './actions.ts';
import type { Scope, Workspace, parseProject } from './records.ts';

export interface Binding {
  planningSlot: string;
  changeId: string;
  changeRef: string;
  state: string;
  archiveOrdinal?: number;
  latestRunRef?: string;
  batchId?: string;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new MendiError('invalid-data', label + ' 必须是数组。');
  return value;
}

// 结构和追加顺序决定当前对象；不读取或倒查历史文件。
export function currentBinding(
  workspace: Pick<Workspace, 'bindings' | 'activeChangeId'>,
): Binding | undefined {
  return workspace.activeChangeId
    ? workspace.bindings.find((b) => b.changeId === workspace.activeChangeId)
    : [...workspace.bindings].reverse().find((b) => b.state === 'archived');
}
export function readAssociations(
  index: ReturnType<typeof parseProject>,
  manifest: Record<string, unknown>,
  scope: Scope,
  state: string,
) {
  const activeChangeId =
    manifest.activeChangeId === null ? null : identifier(manifest.activeChangeId, '当前 Change ID');
  const bindings = array(manifest.changeBindings, 'changeBindings').map((value) => {
    const item = object(value, 'Change binding');
    const changeId = identifier(item.changeId, 'Change ID');
    const changeRef = text(item.changeRef, 'changeRef');
    const bindingState = text(item.state, '关联状态');
    const archived = bindingState === 'archived';
    const archiveOrdinal = item.archiveOrdinal;
    if (
      archiveOrdinal !== undefined &&
      (!archived ||
        typeof archiveOrdinal !== 'number' ||
        !Number.isSafeInteger(archiveOrdinal) ||
        archiveOrdinal < 1)
    ) {
      throw new MendiError('invalid-record', 'archiveOrdinal 必须是已归档 Change 的正整数编号。');
    }
    const archivedName =
      typeof archiveOrdinal === 'number'
        ? `${String(archiveOrdinal).padStart(3, '0')}-${changeId}`
        : changeId;
    const archiveMatch = /^openspec\/changes\/archive\/(\d{4}-\d{2}-\d{2})-(.+)$/.exec(changeRef);
    const archiveTime = archiveMatch ? Date.parse(`${archiveMatch[1]}T00:00:00Z`) : NaN;
    const expected = archived
      ? archiveMatch?.[2] === archivedName &&
        Number.isFinite(archiveTime) &&
        new Date(archiveTime).toISOString().slice(0, 10) === archiveMatch[1]
      : changeRef === `openspec/changes/${changeId}`;
    if (!expected || (archived && activeChangeId === changeId))
      throw new MendiError('invalid-record', 'Change 引用、归档状态与当前身份不一致。', {
        changeId,
        changeRef,
        state: bindingState,
      });
    const planningSlot = text(item.planningSlot, 'planningSlot');
    if (!scope.plannedChanges.some((slot) => slot.slot === planningSlot))
      throw new MendiError('invalid-record', '关联槽位不在范围内。');
    return {
      changeId,
      changeRef,
      planningSlot,
      state: bindingState,
      ...(typeof archiveOrdinal === 'number' ? { archiveOrdinal } : {}),
      ...(index.mode === 'product' && item.batchId !== undefined
        ? { batchId: text(item.batchId, 'batchId') }
        : {}),
      ...(index.mode === 'product' && item.latestRunRef !== undefined
        ? {
            latestRunRef: text(item.latestRunRef, 'latestRunRef'),
            batchId: text(item.batchId, 'batchId'),
          }
        : {}),
    };
  });
  if (
    new Set(bindings.map((b) => b.changeId)).size !== bindings.length ||
    new Set(bindings.map((b) => b.planningSlot)).size !== bindings.length
  )
    throw new MendiError('invalid-record', 'Change / 槽位关联重复。');
  if (activeChangeId !== null && !bindings.some((b) => b.changeId === activeChangeId))
    throw new MendiError('invalid-record', '当前 Change 缺少关联。');
  const batches = array(manifest.changeBatches, 'changeBatches');
  if (index.mode === 'product') {
    if (
      state !== 'open' ||
      batches.length > 1 ||
      bindings.some((b, i) => i < bindings.length - 1 && b.state !== 'archived') ||
      (bindings.at(-1)?.state === 'archived'
        ? activeChangeId !== null
        : (bindings.at(-1)?.changeId ?? null) !== activeChangeId) ||
      bindings.some((b) =>
        b.latestRunRef
          ? !['active', 'archiving', 'archived'].includes(b.state)
          : b.state !== 'explore',
      )
    )
      throw new MendiError('invalid-record', '产品关联顺序或当前状态不一致。');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text(manifest.openedOn, 'openedOn')))
      throw new MendiError('invalid-record', 'openedOn 必须是日期。');
    let lastOrdinal = 0;
    for (const b of bindings) {
      if (b.state === 'archived') {
        if (
          b.archiveOrdinal === undefined ||
          b.archiveOrdinal <= lastOrdinal ||
          b.archiveOrdinal > archivedCount(index.project)
        )
          throw new MendiError('invalid-record', '旧归档编号必须递增且不大于项目计数。');
        lastOrdinal = b.archiveOrdinal;
      }
      if (b.latestRunRef) {
        let loc: ReturnType<typeof runLocation>;
        try {
          loc = runLocation(b.latestRunRef, index.id, b.changeId);
        } catch {
          throw new MendiError('invalid-record', 'binding 的 Run 定位与当前身份不一致。', {
            ref: b.latestRunRef,
          });
        }
        if (loc.batchId !== b.batchId)
          throw new MendiError('invalid-record', 'Run 与 binding 批次不一致。');
      }
    }
    if (batches.length) {
      const batch = object(batches[0], '当前批次');
      const firstRun = text(batch.firstRun, 'firstRun');
      if (
        !/^\d{3,}$/.test(firstRun) ||
        Number(firstRun) < 1 ||
        !Number.isSafeInteger(Number(firstRun)) ||
        String(Number(firstRun)).padStart(3, '0') !== firstRun ||
        batch.id !== firstRun + '-changes' ||
        batch.runsRef !== '.mendi/runs/' + index.id + '/' + batch.id
      )
        throw new MendiError('invalid-record', '批次身份不一致。');
      const members = array(batch.changeIds, '批次成员').map((v) => identifier(v, '批次 Change'));
      if (
        members.length !== bindings.length ||
        members.some((id, i) => bindings[i]?.changeId !== id) ||
        bindings.some((b) => b.batchId !== batch.id)
      )
        throw new MendiError('invalid-record', '批次成员或 binding 不一致。');
      for (const b of bindings)
        if (b.latestRunRef && !b.latestRunRef.startsWith(batch.runsRef + '/' + b.changeId + '/'))
          throw new MendiError('invalid-record', 'Run 定位不在所属批次。');
    } else if (bindings.some((b) => b.batchId !== undefined || b.latestRunRef !== undefined))
      throw new MendiError('invalid-record', '产品批次关联缺失。');
  } else {
    const next = object(manifest.next, '人工 next');
    text(next.action, 'next.action');
    text(next.status, 'next.status');
    if (next.role !== undefined && !['author', 'reviewer'].includes(String(next.role)))
      throw new MendiError('invalid-record', '人工 next.role 不合法。');
    for (const value of batches) {
      const batch = object(value, 'Changes 批次');
      const id = text(batch.id, 'batch.id');
      const firstRun = text(batch.firstRun, 'firstRun');
      if (
        !/^\d{3,}-changes$/.test(id) ||
        id !== `${firstRun}-changes` ||
        batch.runsRef !== `.mendi/runs/${index.id}/${id}`
      )
        throw new MendiError('invalid-record', '人工 Changes 批次引用不一致。');
      const ids = array(batch.changeIds, 'batch.changeIds').map((v) =>
        identifier(v, 'batch Change'),
      );
      if (ids.some((id) => !bindings.some((b) => b.changeId === id)))
        throw new MendiError('invalid-record', '批次包含未关联 Change。');
    }
  }
  return { bindings, activeChangeId };
}

export function assertAssociationAvailable(
  scope: Scope,
  bindings: Binding[],
  slot: string,
  changeId: string,
) {
  const planned = scope.plannedChanges.find((p) => p.slot === slot);
  if (!planned) throw new MendiError('planning-slot-not-found', '计划槽位不在 Delivery 范围内。');
  if (bindings.some((b) => b.changeId === changeId || b.planningSlot === slot))
    throw new MendiError('change-bind-conflict', 'Change 或槽位已经关联。');
  if (
    planned.dependsOn.some(
      (dependency) =>
        !bindings.some((b) => b.planningSlot === dependency && b.state === 'archived'),
    )
  )
    throw new MendiError('change-dependency-not-archived', '槽位依赖尚未归档。');
}
