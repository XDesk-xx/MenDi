import { identifier, MendiError, object, text } from './errors.ts';
import { archivedCount } from './archive.ts';
import { readAssociations, type Binding } from './associations.ts';
import { deliveryLocation } from './delivery-runs.ts';
import { readRounds, validateRoundBindings, type DeliveryRound } from './rounds.ts';
export type { Binding } from './associations.ts';

import { readScope, type Scope } from './scope.ts';
export { readScope, type Scope, type PlannedChange } from './scope.ts';

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
  rounds?: DeliveryRound[];
  currentRoundId?: string;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new MendiError('invalid-data', `${label} 必须是数组。`);
  return value;
}

function mode(record: Record<string, unknown>): 'product' | 'manual-bootstrap' {
  if (
    record.recordingMode === 'product' &&
    [1, 2].includes(Number(record.formatVersion)) &&
    typeof record.formatVersion === 'number'
  )
    return 'product';
  if (record.recordingMode === 'manual-bootstrap' && record.formatVersion === undefined)
    return 'manual-bootstrap';
  throw new MendiError(
    'unsupported-record-format',
    '记录不是支持的 version 1 / 2 产品格式或明确的人工 bootstrap。',
    { formatVersion: record.formatVersion, recordingMode: record.recordingMode },
  );
}

export function parseProject(
  value: unknown,
  deliveryId?: string,
): {
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
  const selectedId = identifier(project.activeDeliveryId, '当前 Delivery ID');
  const id = deliveryId === undefined ? selectedId : identifier(deliveryId, '所选 Delivery ID');
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
  if (project.pendingDeliveryRunRef !== undefined) {
    const ref = text(project.pendingDeliveryRunRef, 'pendingDeliveryRunRef');
    const owner = ref.split('/')[2];
    const location = deliveryLocation(ref, owner);
    if (
      (owner !== selectedId &&
        (location.type !== 'delivery-open' || deliveries.some((item) => item.id === owner))) ||
      !['delivery-open', 'delivery-close', 'delivery-reopen', 'delivery-migrate'].includes(
        location.type,
      )
    )
      throw new MendiError('invalid-record', 'pending 生命周期身份未登记。');
  }
  const active = deliveries.find((item) => item.id === id);
  if (!active || !deliveries.some((item) => item.id === selectedId))
    throw new MendiError('invalid-record', '当前 Delivery 索引不存在或不符合首版范围。');
  return { project, mode: recordingMode, id, manifestRef: active.manifestRef };
}

export function parseWorkspace(index: ReturnType<typeof parseProject>, value: unknown): Workspace {
  const manifest = object(value, 'Delivery manifest');
  if (mode(manifest) !== index.mode || manifest.id !== index.id)
    throw new MendiError('invalid-record', '项目入口与 manifest 身份 / 格式不一致。');
  if (index.mode === 'product' && index.project.formatVersion === 1 && manifest.formatVersion === 2)
    throw new MendiError('invalid-record', 'version 1 入口不能选择 version 2 manifest。');
  const rounds =
    index.mode === 'product' && manifest.formatVersion === 2
      ? readRounds(manifest, index.id)
      : undefined;
  const title = text(manifest.title, 'Delivery 标题');
  const state = text(manifest.state, 'Delivery 状态');
  const scope = readScope(manifest);
  const { bindings, activeChangeId } = readAssociations(index, manifest, scope, state);
  if (rounds) validateRoundBindings(rounds, bindings);
  if (index.mode === 'product') {
    if (
      manifest.migrationRunRef !== undefined &&
      (manifest.formatVersion !== 2 ||
        deliveryLocation(text(manifest.migrationRunRef, 'migrationRunRef'), index.id).type !==
          'delivery-migrate')
    )
      throw new MendiError('invalid-record', 'migrationRunRef 必须是新格式的独立迁移收据。');
    for (const key of [
      'deliveryRunRef',
      'fullTestRunRef',
      'testAttemptRunRef',
      'verificationRunRef',
      'closeRunRef',
      'openRunRef',
    ]) {
      if (manifest[key] !== undefined) {
        const location = deliveryLocation(text(manifest[key], key), index.id);
        if (key === 'fullTestRunRef' && location.type !== 'delivery-full-test')
          throw new MendiError('invalid-record', 'fullTestRunRef 必须指向正式测试。');
        if (
          (key === 'testAttemptRunRef' && location.type !== 'delivery-test-attempt') ||
          (key === 'verificationRunRef' && location.type !== 'delivery-verification')
        )
          throw new MendiError('invalid-record', '组模式指针类型不符。');
        if (
          (key === 'closeRunRef' && location.type !== 'delivery-close') ||
          (key === 'openRunRef' && location.type !== 'delivery-open')
        )
          throw new MendiError('invalid-record', '生命周期指针类型不符。');
      }
    }
    const currentType =
      manifest.deliveryRunRef === undefined
        ? undefined
        : deliveryLocation(String(manifest.deliveryRunRef), index.id).type;
    if (manifest.deliveryRunRef !== undefined && activeChangeId)
      throw new MendiError('invalid-record', '当前 Delivery 操作与活动 Change / 状态冲突。');
    if (
      (currentType === 'delivery-test-attempt' &&
        manifest.testAttemptRunRef !== manifest.deliveryRunRef) ||
      (currentType === 'delivery-verification' &&
        manifest.verificationRunRef !== manifest.deliveryRunRef)
    )
      throw new MendiError('invalid-record', '当前组模式与实际指针矛盾。');
    if (
      currentType &&
      !['delivery-open', 'delivery-reopen'].includes(currentType) &&
      manifest.fullTestRunRef === undefined &&
      manifest.testAttemptRunRef === undefined
    )
      throw new MendiError('invalid-record', 'Delivery 操作缺少最近正式测试入口。');
    if (
      manifest.deliveryRunRef !== undefined &&
      deliveryLocation(String(manifest.deliveryRunRef), index.id).type === 'delivery-full-test' &&
      manifest.deliveryRunRef !== manifest.fullTestRunRef
    )
      throw new MendiError('invalid-record', '当前正式 Run 与最新正式指针矛盾。');
    if (
      state === 'closed' &&
      (currentType !== 'delivery-close' || manifest.closeRunRef !== manifest.deliveryRunRef)
    )
      throw new MendiError('invalid-record', 'closed 缺少一致的当前 Close。');
    if (state === 'open' && currentType === 'delivery-close')
      throw new MendiError('invalid-record', 'open 不能选择已收口 Close。');
  }
  return {
    ...index,
    manifest,
    title,
    state,
    scope,
    activeChangeId,
    bindings,
    ...(rounds ? { rounds, currentRoundId: String(manifest.currentRoundId) } : {}),
  };
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
