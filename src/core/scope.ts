import { identifier, MendiError, object, text } from './errors.ts';
import { deliveryLocation } from './delivery-runs.ts';

export interface BaselineDependency {
  deliveryId: string;
  planningSlot: string;
  closeRunRef: string;
}

export interface PlannedChange {
  slot: string;
  title: string;
  dependsOn: string[];
  roadmapSection?: string;
  baselineDependencies?: BaselineDependency[];
}
export interface Scope {
  goal: string;
  plannedChanges: PlannedChange[];
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
    const baselineDependencies = array(
      item.baselineDependencies === undefined ? [] : item.baselineDependencies,
      'baselineDependencies',
    ).map((value) => {
      const source = object(value, '已交付基线');
      const deliveryId = identifier(source.deliveryId, '基线 Delivery ID');
      const planningSlot = text(source.planningSlot, '基线 planningSlot');
      const closeRunRef = text(source.closeRunRef, '基线 closeRunRef');
      if (deliveryLocation(closeRunRef, deliveryId).type !== 'delivery-close')
        throw new MendiError('invalid-scope', '基线必须引用指定 Delivery 的 Close。');
      return { deliveryId, planningSlot, closeRunRef };
    });
    if (
      new Set(baselineDependencies.map((d) => `${d.deliveryId}/${d.planningSlot}`)).size !==
      baselineDependencies.length
    )
      throw new MendiError('invalid-scope', '基线槽位重复或指向矛盾 Close。', { slot });
    return {
      slot,
      title,
      dependsOn,
      ...(baselineDependencies.length ? { baselineDependencies } : {}),
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
