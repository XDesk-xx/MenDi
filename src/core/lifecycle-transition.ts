import { MendiError, text } from './errors.ts';
import { parseProject, parseWorkspace, bindingFor, type Workspace } from './records.ts';
import type { DeliveryRunRecord } from './delivery-runs.ts';
import { initialRound, projectProgress, projectRound } from './rounds.ts';

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
    if (value.roundId !== 'r001') throw new MendiError('invalid-rounds', '新 Open 必须属于 r001。');
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
          formatVersion: 2,
          recordingMode: 'product',
          name: run.header.projectName,
          deliveryGroupsDir: '.mendi/delivery-groups',
          activeDeliveryId: id,
          deliveries: [{ id, manifestRef: ref }],
        };
    const binding = value.initialBinding
      ? bindingFor(value.scope, value.initialBinding.planningSlot, value.initialBinding.changeId)
      : null;
    manifest = initialRound(
      {
        formatVersion: 2,
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
      },
      run.ref,
    );
  } else {
    if (!before || before.id !== id)
      throw new MendiError('invalid-lifecycle-basis', '当前 Delivery 不一致。');
    project = { ...before.project };
    if (value.operation === 'delivery-close') {
      if (value.roundId !== before.currentRoundId)
        throw new MendiError('invalid-rounds', 'Close 轮次不符。');
      if (
        before.state !== 'open' ||
        before.activeChangeId ||
        before.manifest.deliveryRunRef !== value.fullTestRunRef ||
        before.manifest.fullTestRunRef !== value.fullTestRunRef
      )
        throw new MendiError('invalid-lifecycle-basis', 'Close 原入口不一致。');
      manifest = projectProgress(before, {
        ...before.manifest,
        state: 'closed',
        closedOn: value.recordedOn,
        deliveryRunRef: run.ref,
        closeRunRef: run.ref,
      });
    } else {
      if (
        before.state !== 'closed' ||
        before.manifest.deliveryRunRef !== value.priorCloseRef ||
        value.scope.plannedChanges.some((item) =>
          before.bindings.some((binding) => binding.planningSlot === item.slot),
        )
      )
        throw new MendiError('invalid-lifecycle-basis', 'Reopen 原收口或新槽位不一致。');
      if (!before.rounds)
        throw new MendiError('legacy-product-read-only', '旧 product 写入须先显式迁移。');
      const roundId = `r${String(before.rounds.length + 1).padStart(3, '0')}`;
      if (value.roundId !== roundId)
        throw new MendiError('invalid-rounds', 'Reopen 目标轮次不符。');
      manifest = projectRound(
        { ...before.manifest, activeChangeId: null },
        [
          ...before.rounds,
          {
            id: roundId,
            origin: { kind: 'reopen', runRef: run.ref },
            scope: value.scope,
            state: 'open',
            openedOn: value.recordedOn,
            reason: value.reason,
            currentBatchId: null,
            deliveryRunRef: run.ref,
          },
        ],
        roundId,
      );
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
