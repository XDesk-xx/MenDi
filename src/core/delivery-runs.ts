import { parseRepair } from './repair-record.ts';
import { MendiError, object, text } from './errors.ts';
import type { Role, Verdict } from './actions.ts';
import { type FullTest, type Repair } from './delivery-verification.ts';
import { parseFullTest } from './full-test-record.ts';
import {
  parseAttempt,
  parseCandidateVerification,
  type GroupAttempt,
  type CandidateVerification,
} from './group-records.ts';
import { parseLifecycle, type Lifecycle } from './delivery-lifecycle.ts';

export const deliveryTypes = [
  'delivery-open',
  'delivery-close',
  'delivery-reopen',
  'delivery-migrate',
  'delivery-full-test',
  'delivery-test-attempt',
  'delivery-verification',
  'delivery-repair',
  'revise-delivery-repair',
  'review-delivery-repair',
] as const;
export type DeliveryType = (typeof deliveryTypes)[number];
export function deliveryDefinition(value: unknown) {
  if (!deliveryTypes.includes(value as DeliveryType))
    throw new MendiError('invalid-action', '不支持 Delivery Action。');
  const type = value as DeliveryType;
  const review = type === 'review-delivery-repair';
  const phase =
    ['delivery-full-test', 'delivery-test-attempt', 'delivery-verification'].includes(type) ||
    ['delivery-open', 'delivery-close', 'delivery-reopen', 'delivery-migrate'].includes(type)
      ? type
      : 'delivery-repair';
  return {
    type,
    phase,
    role: (review ? 'reviewer' : 'author') as Role,
    skill: ['delivery-test-attempt', 'delivery-verification'].includes(type)
      ? 'delivery-full-test'
      : review
        ? type
        : phase,
  };
}
export function deliveryLocation(ref: string, id: string) {
  const match =
    /^\.mendi\/runs\/([a-z0-9-]+)\/(\d{3,})-(delivery-open|delivery-close|delivery-reopen|delivery-migrate|delivery-full-test|delivery-test-attempt|delivery-verification|delivery-repair|revise-delivery-repair|review-delivery-repair)\/run\.md$/.exec(
      ref,
    );
  if (
    !match ||
    match[1] !== id ||
    !Number.isSafeInteger(Number(match[2])) ||
    Number(match[2]) < 1 ||
    String(Number(match[2])).padStart(3, '0') !== match[2]
  )
    throw new MendiError('invalid-run', 'Delivery Run 路径身份不一致。', { ref });
  return { number: Number(match[2]), ...deliveryDefinition(match[3]) };
}
export interface DeliveryRunRecord {
  formatVersion: 1;
  recordingMode: 'product';
  scope: 'delivery';
  deliveryId: string;
  changeId: null;
  runNumber: number;
  actionId: string;
  actionType: DeliveryType;
  role: Role;
  actorId: string;
  status: 'draft' | 'submitted';
  stageSkill: string;
  toolGuidance: string[];
  outcome?: 'continuing' | 'complete';
  result?: string;
  verdict?: Verdict;
  authorRunRef?: string;
  revisesRunRef?: string;
  fullTest?: FullTest;
  attempt?: GroupAttempt;
  verification?: CandidateVerification;
  lifecycle?: Lifecycle;
  repair?: Repair;
  migration?: { sourceVersion: 1; targetVersion: 2; manifestRef: string; planRef: string };
  ownerDecision?: never;
}
export function parseDeliveryRun(value: unknown, ref: string, id: string): DeliveryRunRecord {
  const data = object(value, 'Delivery Run');
  const record = { ...data } as unknown as DeliveryRunRecord;
  const location = deliveryLocation(ref, id);
  const first = new RegExp(`^${id}-(\\d{3,})-${location.type}$`).exec(String(data.actionId));
  if (
    data.formatVersion !== 1 ||
    data.recordingMode !== 'product' ||
    data.scope !== 'delivery' ||
    data.deliveryId !== id ||
    data.changeId !== null ||
    data.runNumber !== location.number ||
    data.actionType !== location.type ||
    data.role !== location.role ||
    data.stageSkill !== location.skill ||
    !first ||
    Number(first[1]) < 1 ||
    Number(first[1]) > location.number ||
    String(Number(first[1])).padStart(3, '0') !== first[1] ||
    !Array.isArray(data.toolGuidance) ||
    data.toolGuidance.length ||
    !['draft', 'submitted'].includes(String(data.status))
  )
    throw new MendiError('invalid-run', 'Delivery Run 头部、方法或 Action 身份不一致。');
  text(data.actorId, 'actor');
  if (['delivery-test-attempt', 'delivery-verification'].includes(location.type)) {
    if (
      data.verdict !== undefined ||
      data.ownerDecision !== undefined ||
      data.archive !== undefined
    )
      throw new MendiError(
        'invalid-run',
        'typed Author 不能携带 verdict、Owner resolve 或 Archive 字段。',
      );
    if (data.status === 'draft' && (data.outcome !== undefined || data.result !== undefined))
      throw new MendiError('invalid-run', 'typed draft 不能携带提交字段。');
    if (
      Number(first![1]) !== location.number ||
      data.fullTest !== undefined ||
      data.repair !== undefined ||
      data.lifecycle !== undefined ||
      data.migration !== undefined
    )
      throw new MendiError('invalid-run', '新 typed 记录不可混入旧模式。');
    if (location.type === 'delivery-test-attempt') {
      if (data.verification !== undefined)
        throw new MendiError('invalid-run', '尝试不能携带候选结论。');
      record.attempt = parseAttempt(data.attempt, id, location.number);
      if (
        (record.attempt.phase === 'finished') !== (data.status === 'submitted') ||
        (data.status === 'submitted' && data.outcome !== 'complete')
      )
        throw new MendiError('invalid-run', '尝试持久终态矛盾。');
      if (data.status === 'submitted') {
        const a = record.attempt;
        const o = a.observation!;
        if (
          (o.notRun && o.protocolState !== 'unconfirmed') ||
          (o.cancelled && o.protocolState === 'valid') ||
          (o.notRun && o.cancelled)
        )
          throw new MendiError('invalid-run', '尝试终态标记矛盾。');
        const expected =
          o.protocolState === 'invalid'
            ? 'invalid'
            : o.notRun
              ? 'not-run'
              : o.cancelled
                ? 'interrupted'
                : o.protocolState === 'valid'
                  ? a.plan.groups
                      .filter((g) => a.selection.includes(g.id) && g.required)
                      .every((g) => o.groups.some((f) => f.id === g.id && f.state === 'passed'))
                    ? 'passed'
                    : 'failed'
                  : 'unknown';
        if (
          record.attempt.version === 2
            ? data.result !== record.attempt.formalOutcome
            : expected === 'unknown' || data.result !== expected
        )
          throw new MendiError('invalid-run', '尝试 result 与已确认协议终态矛盾。');
      }
    } else {
      if (data.attempt !== undefined) throw new MendiError('invalid-run', '结论不能携带尝试。');
      record.verification = parseCandidateVerification(data.verification, id, location.number);
      if (
        data.status === 'submitted' &&
        (data.outcome !== 'complete' || data.result !== record.verification.conclusion)
      )
        throw new MendiError('invalid-run', '候选提交矛盾。');
    }
    return record;
  }
  if (data.attempt !== undefined || data.verification !== undefined)
    throw new MendiError('invalid-run', '旧类型不能携带新组结果。');
  if (
    (location.type === 'delivery-full-test' ||
      ['delivery-open', 'delivery-close', 'delivery-reopen', 'delivery-migrate'].includes(
        location.type,
      )) &&
    Number(first![1]) !== location.number
  )
    throw new MendiError('invalid-run', '正式 Full Test 不沿旧 Action 继续。');
  if (data.ownerDecision !== undefined || data.archive !== undefined)
    throw new MendiError('invalid-run', 'Delivery Run 不支持 Owner resolve / Archive。');
  if (data.status === 'submitted') {
    if (!['continuing', 'complete'].includes(String(data.outcome)))
      throw new MendiError('invalid-run', '提交缺少 outcome。');
    text(data.result, 'result');
    if (location.role === 'reviewer' && data.outcome === 'complete') {
      if (!['approved', 'changes-requested', 'rejected'].includes(String(data.verdict)))
        throw new MendiError('invalid-run', '审核缺少 verdict。');
    } else if (data.verdict !== undefined)
      throw new MendiError('invalid-run', 'Author / 未完成审核不能给 verdict。');
  } else if (data.outcome !== undefined || data.result !== undefined || data.verdict !== undefined)
    throw new MendiError('invalid-run', 'draft 不能携带提交结论。');
  for (const [key, needed] of [
    ['authorRunRef', location.role === 'reviewer'],
    ['revisesRunRef', location.type === 'revise-delivery-repair'],
  ] as const) {
    if (needed) {
      const target = deliveryLocation(text(data[key], key), id);
      if (
        target.number >= location.number ||
        !['delivery-repair', 'revise-delivery-repair'].includes(target.type)
      )
        throw new MendiError('invalid-run', '直接 Author 身份无效。');
    } else if (data[key] !== undefined)
      throw new MendiError('invalid-run', '多余的直接 Author 字段。');
  }
  if (location.type === 'delivery-migrate') {
    const migration = object(data.migration, '迁移收据');
    if (
      migration.sourceVersion !== 1 ||
      migration.targetVersion !== 2 ||
      migration.manifestRef !== `.mendi/delivery-groups/${id}/manifest.json` ||
      migration.planRef !== ref.replace(/run\.md$/, 'artifacts/intent.json') ||
      data.lifecycle !== undefined ||
      data.fullTest !== undefined ||
      data.repair !== undefined ||
      (data.status === 'submitted' && (data.outcome !== 'complete' || data.result !== 'migrated'))
    )
      throw new MendiError('invalid-run', '迁移收据身份或提交字段不一致。');
    record.migration = migration as unknown as DeliveryRunRecord['migration'];
    return record;
  }
  if (data.migration !== undefined)
    throw new MendiError('invalid-run', '普通 Run 不能携带迁移收据。');
  if (['delivery-open', 'delivery-close', 'delivery-reopen'].includes(location.type)) {
    if (data.fullTest !== undefined || data.repair !== undefined)
      throw new MendiError('invalid-run', '生命周期不能携带执行或修复字段。');
    record.lifecycle = parseLifecycle(data, id, location.number);
    return record;
  }
  if (data.lifecycle !== undefined)
    throw new MendiError('invalid-run', '非生命周期 Run 不能携带生命周期输入。');
  if (location.type === 'delivery-full-test') {
    if (data.repair !== undefined)
      throw new MendiError('invalid-run', 'Full Test 不能携带 repair。');
    record.fullTest = parseFullTest(data, id, location.number);
  } else {
    if (data.fullTest !== undefined) throw new MendiError('invalid-run', '修复不能携带 fullTest。');
    record.repair = parseRepair(data.repair, id, location.number);
  }
  return record;
}
