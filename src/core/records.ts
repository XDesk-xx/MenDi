import { identifier, MendiError, object, text } from './errors.ts';

export interface PlannedChange {
  slot: string;
  title: string;
  dependsOn: string[];
  roadmapSection?: string;
}
export interface Scope {
  goal: string;
  plannedChanges: PlannedChange[];
}
export interface Binding {
  planningSlot: string;
  changeId: string;
  changeRef: string;
  state: string;
  archiveOrdinal?: number;
}
export interface Workspace {
  mode: 'product' | 'manual-bootstrap';
  id: string;
  title: string;
  state: string;
  scope: Scope;
  activeChangeId: string | null;
  bindings: Binding[];
  project: Record<string, unknown>;
  manifest: Record<string, unknown>;
  manifestRef: string;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new MendiError('invalid-data', `${label} 必须是数组。`);
  return value;
}

export function readScope(value: unknown): Scope {
  const input = object(value, '范围');
  const goal = text(input.goal, 'goal');
  const plannedChanges = array(input.plannedChanges, 'plannedChanges').map((value) => {
    const item = object(value, '计划槽位');
    const slot = text(item.slot, 'slot');
    const title = text(item.title, 'title');
    const dependsOn = array(item.dependsOn, 'dependsOn').map((value) => text(value, '依赖槽位'));
    if (new Set(dependsOn).size !== dependsOn.length)
      throw new MendiError('invalid-scope', '槽位依赖重复。', { slot });
    return {
      slot,
      title,
      dependsOn,
      ...(item.roadmapSection !== undefined
        ? { roadmapSection: text(item.roadmapSection, 'roadmapSection') }
        : {}),
    };
  });
  const bySlot = new Map(plannedChanges.map((item) => [item.slot, item]));
  if (!plannedChanges.length || bySlot.size !== plannedChanges.length)
    throw new MendiError('invalid-scope', '范围必须包含至少一个且互不重复的槽位。');
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(slot: string): void {
    if (visiting.has(slot)) throw new MendiError('invalid-scope', '计划依赖存在循环。', { slot });
    if (visited.has(slot)) return;
    const item = bySlot.get(slot);
    if (!item) throw new MendiError('invalid-scope', '依赖指向范围外槽位。', { slot });
    visiting.add(slot);
    for (const dependency of item.dependsOn) visit(dependency);
    visiting.delete(slot);
    visited.add(slot);
  }
  for (const item of plannedChanges) visit(item.slot);
  return { goal, plannedChanges };
}

function mode(record: Record<string, unknown>): 'product' | 'manual-bootstrap' {
  if (record.recordingMode === 'product' && record.formatVersion === 1) return 'product';
  if (record.recordingMode === 'manual-bootstrap' && record.formatVersion === undefined)
    return 'manual-bootstrap';
  throw new MendiError(
    'unsupported-record-format',
    '记录不是 version 1 产品格式或明确的人工 bootstrap。',
    { formatVersion: record.formatVersion, recordingMode: record.recordingMode },
  );
}

export function parseProject(value: unknown): {
  project: Record<string, unknown>;
  mode: Workspace['mode'];
  id: string;
  manifestRef: string;
} {
  const project = object(value, '项目入口');
  const recordingMode = mode(project);
  text(project.name, '项目名称');
  if (project.deliveryGroupsDir !== '.mendi/delivery-groups')
    throw new MendiError('invalid-record', 'deliveryGroupsDir 不符合约定。');
  const id = identifier(project.activeDeliveryId, '当前 Delivery ID');
  const deliveries = array(project.deliveries, 'deliveries').map((value) => {
    const item = object(value, 'Delivery 索引');
    const deliveryId = identifier(item.id, 'Delivery ID');
    const manifestRef = text(item.manifestRef, 'manifestRef');
    if (manifestRef !== `.mendi/delivery-groups/${deliveryId}/manifest.json`)
      throw new MendiError('invalid-record', 'manifestRef 与 Delivery 身份不一致。', {
        manifestRef,
        deliveryId,
      });
    return { id: deliveryId, manifestRef };
  });
  if (new Set(deliveries.map((item) => item.id)).size !== deliveries.length)
    throw new MendiError('invalid-record', 'Delivery 索引重复。');
  const active = deliveries.find((item) => item.id === id);
  if (!active || (recordingMode === 'product' && deliveries.length !== 1))
    throw new MendiError('invalid-record', '当前 Delivery 索引不存在或不符合首版范围。');
  return { project, mode: recordingMode, id, manifestRef: active.manifestRef };
}

export function parseWorkspace(index: ReturnType<typeof parseProject>, value: unknown): Workspace {
  const manifest = object(value, 'Delivery manifest');
  if (mode(manifest) !== index.mode || manifest.id !== index.id)
    throw new MendiError('invalid-record', '项目入口与 manifest 身份 / 格式不一致。');
  const title = text(manifest.title, 'Delivery 标题');
  const state = text(manifest.state, 'Delivery 状态');
  const scope = readScope(manifest);
  const activeChangeId =
    manifest.activeChangeId === null ? null : identifier(manifest.activeChangeId, '当前 Change ID');
  const bindings = array(manifest.changeBindings, 'changeBindings').map((value) => {
    const item = object(value, 'Change binding');
    const changeId = identifier(item.changeId, 'Change ID');
    const changeRef = text(item.changeRef, 'changeRef');
    const bindingState = text(item.state, '关联状态');
    const archived = index.mode === 'manual-bootstrap' && bindingState === 'archived';
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
      bindings.length > 1 ||
      batches.length ||
      (bindings.length === 1 && activeChangeId === null) ||
      bindings.some((b) => b.state !== 'explore')
    )
      throw new MendiError('invalid-record', '产品记录超出首次 Open / 首个 Change 的支持范围。');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text(manifest.openedOn, 'openedOn')))
      throw new MendiError('invalid-record', 'openedOn 必须是日期。');
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
  return { ...index, manifest, title, state, scope, activeChangeId, bindings };
}

export function bindingFor(scope: Scope, slot: string, changeId: string): Binding {
  identifier(changeId, 'Change ID');
  if (!scope.plannedChanges.some((item) => item.slot === slot))
    throw new MendiError('planning-slot-not-found', '计划槽位不在 Delivery 范围内。', { slot });
  return {
    planningSlot: slot,
    changeId,
    changeRef: `openspec/changes/${changeId}`,
    state: 'explore',
  };
}
