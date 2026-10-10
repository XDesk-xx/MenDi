import { identifier, MendiError, object, text } from './errors.ts';
import { archivedCount } from './archive.ts';
import { readAssociations, type Binding } from './associations.ts';
import { deliveryLocation } from './delivery-runs.ts';
export type { Binding } from './associations.ts';

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
  if (recordingMode === 'product') archivedCount(project);
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
  const { bindings, activeChangeId } = readAssociations(index, manifest, scope, state);
  if (index.mode === 'product') {
    for (const key of ['deliveryRunRef', 'fullTestRunRef']) {
      if (manifest[key] !== undefined) {
        const location = deliveryLocation(text(manifest[key], key), index.id);
        if (key === 'fullTestRunRef' && location.type !== 'delivery-full-test')
          throw new MendiError('invalid-record', 'fullTestRunRef 必须指向正式测试。');
      }
    }
    if (manifest.deliveryRunRef !== undefined && (activeChangeId || state !== 'open'))
      throw new MendiError('invalid-record', '当前 Delivery 操作与活动 Change / 状态冲突。');
    if (manifest.deliveryRunRef !== undefined && manifest.fullTestRunRef === undefined)
      throw new MendiError('invalid-record', 'Delivery 操作缺少最近正式测试入口。');
    if (
      manifest.deliveryRunRef !== undefined &&
      deliveryLocation(String(manifest.deliveryRunRef), index.id).type === 'delivery-full-test' &&
      manifest.deliveryRunRef !== manifest.fullTestRunRef
    )
      throw new MendiError('invalid-record', '当前正式 Run 与最新正式指针矛盾。');
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
