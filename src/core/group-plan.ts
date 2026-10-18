import { MendiError, object, text, identifier } from './errors.ts';
import { declaration, type Declaration } from './delivery-verification.ts';

export const groupProtocol = 'mendi-group-tests/1' as const;
export interface Candidate {
  id: string;
  basis: Declaration['basis'];
}
export interface Group {
  id: string;
  title: string;
  kind: 'tests' | 'command';
  required: boolean;
  dependsOn: string[];
  resources: string[];
  selection: string[];
  completion: string;
  preparation: string;
  exclusions: { id: string; reason: string }[];
  command?: string;
  artifacts?: string[];
  reason?: string;
}
export interface GroupPlan {
  protocol: typeof groupProtocol;
  groups: Group[];
}
export function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new MendiError('invalid-group-plan', `${label} 必须是数组。`);
  const result = value.map((v) => text(v, label));
  if (new Set(result).size !== result.length)
    throw new MendiError('invalid-group-plan', `${label} 重复。`);
  return result;
}
export function candidate(value: unknown): Candidate {
  const raw = object(value, 'candidate');
  return {
    id: identifier(raw.id, 'candidate id'),
    basis: declaration({ collection: ['candidate'], basis: raw.basis }).basis,
  };
}
export function groupPlan(value: unknown): GroupPlan {
  const raw = object(value, '组计划');
  if (raw.protocol !== groupProtocol || !Array.isArray(raw.groups) || !raw.groups.length)
    throw new MendiError('invalid-group-plan', '不支持的协议或空 groups。');
  const seen = new Set<string>();
  const groups = raw.groups.map((value): Group => {
    const g = object(value, '组');
    const id = identifier(g.id, 'group id');
    const dependsOn = strings(g.dependsOn, 'dependsOn');
    if (
      seen.has(id) ||
      dependsOn.some((dep) => !seen.has(dep)) ||
      !['tests', 'command'].includes(String(g.kind)) ||
      typeof g.required !== 'boolean'
    )
      throw new MendiError('invalid-group-plan', '组重复、种类无效或依赖不是前向关系。');
    seen.add(id);
    const selection = strings(g.selection, 'selection');
    if (!selection.length || !Array.isArray(g.exclusions))
      throw new MendiError('invalid-group-plan', '选择或排除声明缺失。');
    const exclusions = g.exclusions.map((v) => {
      const x = object(v, '排除');
      return { id: text(x.id, '排除身份'), reason: text(x.reason, '排除理由') };
    });
    if (new Set(exclusions.map((x) => x.id)).size !== exclusions.length)
      throw new MendiError('invalid-group-plan', '排除重复。');
    const group: Group = {
      id,
      title: text(g.title, '组标题'),
      kind: g.kind as Group['kind'],
      required: g.required,
      dependsOn,
      resources: strings(g.resources, 'resources'),
      selection,
      completion: text(g.completion, '完成条件'),
      preparation: text(g.preparation, '必要准备'),
      exclusions,
    };
    if (!g.required) group.reason = text(g.reason, '非必需理由');
    if (g.kind === 'command') {
      group.command = text(g.command, '实际命令');
      group.artifacts = strings(g.artifacts, '产物条件');
    }
    return group;
  });
  if (!groups.some((g) => g.required)) throw new MendiError('invalid-group-plan', '没有必需组。');
  return { protocol: groupProtocol, groups };
}
export function selectGroups(plan: GroupPlan, value: unknown) {
  const selection = strings(value, '本次组选择');
  const ordered = plan.groups.filter((g) => selection.includes(g.id)).map((g) => g.id);
  if (!selection.length || JSON.stringify(ordered) !== JSON.stringify(selection))
    throw new MendiError('invalid-group-plan', '组选择须为计划内有序子集。');
  return selection;
}
