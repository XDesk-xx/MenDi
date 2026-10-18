import { MendiError, object, text } from './errors.ts';
import { declaration, parseVerificationScope, type Repair } from './delivery-verification.ts';
import { deliveryLocation } from './delivery-runs.ts';
import { candidate, groupPlan, selectGroups } from './group-plan.ts';
import type { GroupImpact } from './group-records.ts';

export function parseImpact(value: unknown, planValue: unknown): GroupImpact {
  const p = groupPlan(planValue);
  const raw = object(value, '影响声明');
  const affectedGroupIds = selectGroups(p, raw.affectedGroupIds);
  if (!['local', 'common', 'unknown'].includes(String(raw.extent)) || !Array.isArray(raw.retained))
    throw new MendiError('invalid-impact', '影响范围或沿用缺失。');
  const retained = raw.retained.map((v) => {
    const x = object(v, '沿用');
    return { id: text(x.id, '组'), reason: text(x.reason, '沿用理由') };
  });
  const all = [...affectedGroupIds, ...retained.map((r) => r.id)];
  if (
    new Set(all).size !== all.length ||
    all.length !== p.groups.length ||
    all.some((id) => !p.groups.some((g) => g.id === id)) ||
    (raw.extent !== 'local' && affectedGroupIds.length !== p.groups.length)
  )
    throw new MendiError('invalid-impact', '每组须明确影响；公共或未知变化须全部复验。');
  return {
    candidate: candidate(raw.candidate),
    affectedGroupIds,
    retained,
    extent: raw.extent as GroupImpact['extent'],
    reason: text(raw.reason, '影响依据'),
  };
}
export function parseRepair(value: unknown, id: string, number: number): Repair {
  const raw = object(value, '局部修复');
  const source = deliveryLocation(text(raw.failedFullTestRunRef, '直接失败'), id);
  if (
    !['delivery-full-test', 'delivery-test-attempt'].includes(source.type) ||
    source.number >= number
  )
    throw new MendiError('invalid-run', '失败来源必须是正式 Run。');
  const scope = parseVerificationScope(raw.scope);
  declaration({
    collection: raw.collection,
    basis: { materials: text(raw.reason, '修复原因'), changes: '' },
  });
  return {
    ...(raw.roundId === undefined ? {} : { roundId: text(raw.roundId, 'roundId') }),
    failedFullTestRunRef: String(raw.failedFullTestRunRef),
    scope,
    collection: raw.collection as string[],
    reason: String(raw.reason),
    ...(source.type === 'delivery-test-attempt'
      ? {
          groups: {
            plan: groupPlan(object(raw.groups, '组修复').plan),
            impact: parseImpact(
              object(raw.groups, '组修复').impact,
              object(raw.groups, '组修复').plan,
            ),
          },
        }
      : {}),
  };
}
