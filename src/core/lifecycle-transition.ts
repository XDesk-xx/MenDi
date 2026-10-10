import { MendiError, text } from './errors.ts';
import { parseProject, parseWorkspace, bindingFor, type Workspace } from './records.ts';
import type { DeliveryRunRecord } from './delivery-runs.ts';

export interface LifecycleBefore {
  project: string | null;
  manifest: string | null;
}
interface DeliveryIntent {
  ref: string;
  header: Record<string, unknown>;
  record: DeliveryRunRecord;
}

export function basisWorkspace(basis: LifecycleBefore): Workspace | null {
  if (basis.project === null) {
    if (basis.manifest !== null)
      throw new MendiError('invalid-lifecycle-basis', '空入口不能携带 manifest。');
    return null;
  }
  return parseWorkspace(
    parseProject(JSON.parse(basis.project)),
    JSON.parse(text(basis.manifest, '原 manifest')),
  );
}
export function lifecycleTargets(run: DeliveryIntent, basis: LifecycleBefore) {
  const value = run.record.lifecycle!;
  const before = basisWorkspace(basis);
  const id = run.record.deliveryId;
  const ref = `.mendi/delivery-groups/${id}/manifest.json`;
  if (
    before &&
    (before.mode !== 'product' ||
      before.id !== value.sourceDeliveryId ||
      before.project.pendingDeliveryRunRef !== undefined)
  )
    throw new MendiError('invalid-lifecycle-basis', '原入口身份或 pending 不符。');
  if (!before && (value.operation !== 'delivery-open' || value.sourceDeliveryId !== null))
    throw new MendiError('invalid-lifecycle-basis', '空入口仅支持首次记录化 Open。');
  let project: Record<string, unknown>;
  let manifest: Record<string, unknown>;
  if (value.operation === 'delivery-open') {
    if (
      before &&
      (before.state !== 'closed' ||
        before.manifest.deliveryRunRef !== value.priorCloseRef ||
        (before.project.deliveries as { id: string }[]).some((item) => item.id === id))
    )
      throw new MendiError('invalid-lifecycle-basis', '新 Open 的来源或 ID 冲突。');
    project = before
      ? {
          ...before.project,
          activeDeliveryId: id,
          deliveries: [...(before.project.deliveries as unknown[]), { id, manifestRef: ref }],
        }
      : {
          formatVersion: 1,
          recordingMode: 'product',
          name: run.header.projectName,
          deliveryGroupsDir: '.mendi/delivery-groups',
          activeDeliveryId: id,
          deliveries: [{ id, manifestRef: ref }],
        };
    const binding = value.initialBinding
      ? bindingFor(value.scope, value.initialBinding.planningSlot, value.initialBinding.changeId)
      : null;
    manifest = {
      formatVersion: 1,
      recordingMode: 'product',
      id,
      title: value.title,
      state: 'open',
      openedOn: value.recordedOn,
      ...value.scope,
      activeChangeId: binding?.changeId ?? null,
      changeBindings: binding ? [binding] : [],
      changeBatches: [],
      currentBatchId: null,
      openRunRef: run.ref,
      ...(binding ? {} : { deliveryRunRef: run.ref }),
    };
  } else {
    if (!before || before.id !== id)
      throw new MendiError('invalid-lifecycle-basis', '当前 Delivery 不一致。');
    project = { ...before.project };
    if (value.operation === 'delivery-close') {
      if (
        before.state !== 'open' ||
        before.activeChangeId ||
        before.manifest.deliveryRunRef !== value.fullTestRunRef ||
        before.manifest.fullTestRunRef !== value.fullTestRunRef
      )
        throw new MendiError('invalid-lifecycle-basis', 'Close 原入口不一致。');
      manifest = {
        ...before.manifest,
        state: 'closed',
        closedOn: value.recordedOn,
        deliveryRunRef: run.ref,
        closeRunRef: run.ref,
      };
    } else {
      if (
        before.state !== 'closed' ||
        before.manifest.deliveryRunRef !== value.priorCloseRef ||
        value.scope.plannedChanges.some((item) =>
          before.bindings.some((binding) => binding.planningSlot === item.slot),
        )
      )
        throw new MendiError('invalid-lifecycle-basis', 'Reopen 原收口或新槽位不一致。');
      manifest = {
        ...before.manifest,
        ...value.scope,
        state: 'open',
        reopenedOn: value.recordedOn,
        currentBatchId: null,
        activeChangeId: null,
        deliveryRunRef: run.ref,
      };
    }
  }
  delete project.pendingDeliveryRunRef;
  const pending = {
    ...(value.operation === 'delivery-open' && before ? before.project : project),
    pendingDeliveryRunRef: run.ref,
  };
  parseWorkspace(parseProject(project), manifest);
  return { before, project, manifest, pending, ref };
}
