import { MendiError, object, text, identifier } from './errors.ts';
import { readScope, bindingFor, type Scope } from './records.ts';
import { parseFullTest } from './full-test-record.ts';
import { deliveryLocation } from './delivery-runs.ts';
import type { FullTest } from './delivery-verification.ts';

export type LifecycleType = 'delivery-open' | 'delivery-close' | 'delivery-reopen';
export interface Applicability {
  conclusion: 'applicable';
  materials: string;
  changes: string;
  reason: string;
}
export interface Lifecycle {
  operation: LifecycleType;
  sourceDeliveryId: string | null;
  scope: Scope;
  priorCloseRef?: string;
  fullTestRunRef?: string;
  acceptance?: FullTest;
  applicability?: Applicability;
  reason?: string;
  title?: string;
  recordedOn: string;
  initialBinding?: { changeId: string; planningSlot: string };
}

export function applicability(value: unknown): Applicability {
  const data = object(value, '材料适用性判断');
  if (data.conclusion !== 'applicable' || typeof data.changes !== 'string')
    throw new MendiError('invalid-applicability', '需要明确 applicable 与实际差异说明。');
  return {
    conclusion: 'applicable',
    materials: text(data.materials, '实际材料'),
    changes: data.changes,
    reason: text(data.reason, '适用理由'),
  };
}

export function parseLifecycle(
  data: Record<string, unknown>,
  id: string,
  number: number,
): Lifecycle {
  const value = object(data.lifecycle, '生命周期输入');
  const operation = data.actionType as LifecycleType;
  if (
    value.operation !== operation ||
    (data.status === 'submitted' &&
      (data.outcome !== 'complete' ||
        data.result !==
          { 'delivery-open': 'opened', 'delivery-close': 'closed', 'delivery-reopen': 'reopened' }[
            operation
          ]))
  )
    throw new MendiError('invalid-run', '生命周期提交身份或结果不一致。');
  const source =
    value.sourceDeliveryId === null ? null : identifier(value.sourceDeliveryId, '来源 Delivery');
  const scope = readScope(value.scope);
  const recordedOn = text(value.recordedOn, '记录日期');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedOn))
    throw new MendiError('invalid-run', '记录日期无效。');
  if (operation !== 'delivery-open' && source !== id)
    throw new MendiError('invalid-run', '生命周期来源身份不一致。');
  if (operation !== 'delivery-close' && value.priorCloseRef !== undefined) {
    if (source === null) throw new MendiError('invalid-run', '首次 Open 不能携带先前 Close。');
    const prior = deliveryLocation(text(value.priorCloseRef, '先前 Close'), source ?? id);
    if (prior.type !== 'delivery-close' || (source === id && prior.number >= number))
      throw new MendiError('invalid-run', '直接 Close 身份不一致。');
  }
  if (operation === 'delivery-reopen' || (operation === 'delivery-open' && source !== null))
    text(value.priorCloseRef, '直接 Close');
  if (operation === 'delivery-close') {
    const prior = deliveryLocation(text(value.fullTestRunRef, '正式入口'), id);
    if (prior.type !== 'delivery-full-test' || prior.number >= number)
      throw new MendiError('invalid-run', '正式入口身份不一致。');
    const accepted = parseFullTest(
      { fullTest: value.acceptance, status: 'submitted', outcome: 'complete', result: 'passed' },
      id,
      prior.number,
    );
    const comparable = (input: Scope) => ({
      goal: input.goal,
      plannedChanges: input.plannedChanges.map(({ slot, title, dependsOn }) => ({
        slot,
        title,
        dependsOn,
      })),
    });
    if (
      accepted.outcome !== 'passed' ||
      JSON.stringify(comparable(readScope(accepted.scope))) !== JSON.stringify(comparable(scope))
    )
      throw new MendiError('invalid-run', '收口快照与范围不一致。');
    return {
      operation,
      sourceDeliveryId: source,
      scope,
      recordedOn,
      fullTestRunRef: String(value.fullTestRunRef),
      acceptance: accepted,
      applicability: applicability(value.applicability),
    };
  }
  let initialBinding: Lifecycle['initialBinding'];
  if (value.initialBinding !== undefined) {
    if (operation !== 'delivery-open' || source !== null)
      throw new MendiError('invalid-run', '后续 Open 必须分开 bind。');
    const item = object(value.initialBinding, '首次绑定');
    const binding = bindingFor(
      scope,
      text(item.planningSlot, '槽位'),
      identifier(item.changeId, 'Change'),
    );
    initialBinding = { changeId: binding.changeId, planningSlot: binding.planningSlot };
  }
  return {
    operation,
    sourceDeliveryId: source,
    scope,
    recordedOn,
    ...(operation === 'delivery-open' ? { title: text(value.title, '标题') } : {}),
    ...(initialBinding ? { initialBinding } : {}),
    ...(value.priorCloseRef === undefined ? {} : { priorCloseRef: String(value.priorCloseRef) }),
    ...(operation === 'delivery-reopen' ? { reason: text(value.reason, '重开原因') } : {}),
  };
}
