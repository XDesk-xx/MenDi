import { parse } from 'yaml';
import { isDeepStrictEqual } from 'node:util';
import { MendiError, object, text } from './errors.ts';
import { parseProject, parseWorkspace } from './records.ts';
import { deliveryLocation, parseDeliveryRun } from './delivery-runs.ts';
import { convertLegacy, type LegacyBoundary } from './legacy-conversion.ts';
import type { MigrationPlan } from './migration-plan.ts';

/** Rebuild the candidate from preserved original bytes; saved target JSON is not authority. */
export function migrationIntent(value: unknown, expectedRoot: string): MigrationPlan {
  const data = object(value, '迁移 intent');
  if (
    data.kind !== 'delivery-migration-preview' ||
    data.projectRoot !== expectedRoot ||
    data.sourceVersion !== 1 ||
    !Array.isArray(data.inputs)
  )
    throw new MendiError('invalid-migration-intent', '迁移 intent 身份无效。');
  if (
    !Array.isArray(data.executionEntries) ||
    data.executionEntries.some(
      (name) => typeof name !== 'string' || !/^\d{3,}-(focused|fast|full)$/.test(name),
    )
  )
    throw new MendiError('invalid-migration-intent', '执行现场列表无效。');
  const inputs = new Map<string, string | null>();
  for (const item of data.inputs) {
    const source = object(item, '直接输入');
    const ref = text(source.ref, 'ref'),
      content = source.content === null ? null : text(source.content, '实际原输入');
    if (inputs.has(ref)) throw new MendiError('invalid-migration-intent', '迁移原输入重复。');
    inputs.set(ref, content);
  }
  const get = (ref: string) => {
    const content = inputs.get(ref);
    if (content === undefined || content === null)
      throw new MendiError('invalid-migration-intent', '缺必要原始输入。', { ref });
    return content;
  };
  const index = parseProject(JSON.parse(get('.mendi/project.json')));
  const workspace = parseWorkspace(index, JSON.parse(get(index.manifestRef)));
  const ref = text(data.migrationRunRef, '迁移 Run');
  const location = deliveryLocation(ref, workspace.id);
  if (
    workspace.id !== data.deliveryId ||
    location.type !== 'delivery-migrate' ||
    location.number !== data.expectedNumber
  )
    throw new MendiError('invalid-migration-intent', '迁移目标或编号不一致。');
  const records = new Map();
  const boundaries: LegacyBoundary[] = [];
  for (const [sourceRef, content] of inputs) {
    if (!new RegExp(`^\\.mendi/runs/${workspace.id}/\\d{3,}-[a-z-]+/run\\.md$`).test(sourceRef))
      continue;
    if (content === null) throw new MendiError('invalid-migration-intent', '必要原 Run 缺失。');
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
    if (!match) throw new MendiError('invalid-migration-intent', '原 Run 没有真实结构化头部。');
    const record = parseDeliveryRun(parse(match[1]), sourceRef, workspace.id);
    records.set(sourceRef, record);
    if (!['delivery-open', 'delivery-reopen'].includes(record.actionType)) continue;
    let before: Record<string, unknown> | undefined, beforeRef: string | undefined;
    if (record.actionType === 'delivery-reopen') {
      beforeRef = sourceRef.replace('run.md', 'artifacts/before-manifest.json');
      const stored: unknown = JSON.parse(get(beforeRef));
      before = object(typeof stored === 'string' ? JSON.parse(stored) : stored, '原前态');
    }
    boundaries.push({ ref: sourceRef, record, before, beforeRef });
  }
  const rebuilt = convertLegacy({ workspace, boundaries, records, migrationRunRef: ref });
  if (
    !isDeepStrictEqual(rebuilt.project, data.project) ||
    !isDeepStrictEqual(rebuilt.manifest, data.manifest)
  )
    throw new MendiError('invalid-migration-intent', '迁移候选不符合实际原输入转换。');
  return data as unknown as MigrationPlan;
}
