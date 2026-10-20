import { isDeepStrictEqual } from 'node:util';
import { MendiError, object, text } from './errors.ts';
import { deliveryLocation } from './delivery-runs.ts';
import { readScope, type Scope, type Workspace } from './records.ts';
import type { Binding } from './associations.ts';

export interface DeliveryRound {
  id: string;
  origin: { kind: 'open' | 'reopen' | 'legacy-baseline'; runRef?: string; sourceRefs?: string[] };
  openedOn: string;
  reason?: string;
  scope: Scope;
  state: 'open' | 'closed';
  currentBatchId: string | null;
  deliveryRunRef?: string;
  fullTestRunRef?: string;
  testAttemptRunRef?: string;
  verificationRunRef?: string;
  closeRunRef?: string;
  closedOn?: string;
}

const pointers = [
  'deliveryRunRef',
  'fullTestRunRef',
  'testAttemptRunRef',
  'verificationRunRef',
  'closeRunRef',
] as const;
const projected = [
  'goal',
  'plannedChanges',
  'state',
  'currentBatchId',
  ...pointers,
  'closedOn',
  'reopenedOn',
] as const;

export function initialRound(manifest: Record<string, unknown>, runRef?: string) {
  return projectRound(
    manifest,
    [
      {
        id: 'r001',
        origin: { kind: 'open', ...(runRef ? { runRef } : {}) },
        openedOn: text(manifest.openedOn, 'openedOn'),
        scope: readScope(manifest),
        state: 'open',
        currentBatchId: null,
        ...(manifest.deliveryRunRef ? { deliveryRunRef: String(manifest.deliveryRunRef) } : {}),
      },
    ],
    'r001',
  );
}

function invalid(message: string): never {
  throw new MendiError('invalid-rounds', message);
}
function date(value: unknown, label: string): string {
  const result = text(value, label);
  const parsed = Date.parse(`${result}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result) ||
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString().slice(0, 10) !== result
  )
    invalid(`${label} 必须是真实日期。`);
  return result;
}

/** Scope and progress have one authority; callers deliberately project after updating a round. */
export function projectRound(
  manifest: Record<string, unknown>,
  rounds: DeliveryRound[],
  currentRoundId: string,
) {
  const current = rounds.find((r) => r.id === currentRoundId);
  if (!current) invalid('当前轮次不存在。');
  const result = { ...manifest };
  for (const key of projected) delete result[key];
  Object.assign(result, current.scope, {
    rounds,
    currentRoundId,
    state: current.state,
    currentBatchId: current.currentBatchId,
  });
  for (const key of [...pointers, 'closedOn'] as const)
    if (current[key] !== undefined) result[key] = current[key];
  if (current.origin.kind === 'reopen') result.reopenedOn = current.openedOn;
  return result;
}

export function readRounds(manifest: Record<string, unknown>, deliveryId: string): DeliveryRound[] {
  if (!Array.isArray(manifest.rounds) || !manifest.rounds.length)
    invalid('version 2 必须保存非空 rounds。');
  const values = manifest.rounds;
  const slots = new Set<string>();
  const runOwners = new Map<string, string>();
  const rounds = values.map((value, i): DeliveryRound => {
    const item = object(value, '轮次');
    const id = `r${String(i + 1).padStart(3, '0')}`;
    if (item.id !== id) invalid('轮次编号必须唯一且按追加顺序连续。');
    const source = object(item.origin, '轮次来源');
    if (
      !['open', 'reopen', 'legacy-baseline'].includes(String(source.kind)) ||
      (i > 0 && source.kind !== 'reopen') ||
      (i === 0 && source.kind === 'reopen')
    )
      invalid('轮次来源与顺序不一致。');
    const origin = { ...source } as DeliveryRound['origin'];
    if (source.kind === 'legacy-baseline') {
      if (
        source.runRef !== undefined ||
        !Array.isArray(source.sourceRefs) ||
        !source.sourceRefs.length
      )
        invalid('旧格式基线须说明真实来源，不能补造 Open。');
      origin.sourceRefs = source.sourceRefs.map((r) => {
        const ref = text(r, 'sourceRef');
        if (
          ref !== `.mendi/delivery-groups/${deliveryId}/manifest.json` &&
          !ref.startsWith(`.mendi/runs/${deliveryId}/`)
        )
          invalid('旧格式来源不属于本 Delivery。');
        if (ref.includes('\\') || ref.split('/').some((p) => p === '..' || p === '.'))
          invalid('旧格式来源路径越界。');
        return ref;
      });
    } else if (source.runRef !== undefined || source.kind === 'reopen') {
      const ref = text(source.runRef, 'origin.runRef');
      if (deliveryLocation(ref, deliveryId).type !== `delivery-${source.kind}`)
        invalid('轮次来源 Run 类型不符。');
      origin.runRef = ref;
    }
    const scope = readScope(item.scope);
    for (const planned of scope.plannedChanges) {
      if (slots.has(planned.slot)) invalid('同一槽位不能属于多个轮次。');
      slots.add(planned.slot);
    }
    if (
      !['open', 'closed'].includes(String(item.state)) ||
      (i < values.length - 1 && item.state !== 'closed')
    )
      invalid('历史轮次必须已收口。');
    const round: DeliveryRound = {
      ...item,
      id,
      origin,
      scope,
      openedOn: date(item.openedOn, 'round.openedOn'),
      state: item.state as DeliveryRound['state'],
      currentBatchId:
        item.currentBatchId === null ? null : text(item.currentBatchId, 'round.currentBatchId'),
    };
    if (item.reason !== undefined) round.reason = text(item.reason, 'round.reason');
    if (source.kind === 'reopen' && !round.reason) invalid('Reopen 轮次缺少原因。');
    for (const key of pointers) {
      if (item[key] === undefined) continue;
      const ref = text(item[key], key),
        loc = deliveryLocation(ref, deliveryId);
      if (
        (key === 'fullTestRunRef' && loc.type !== 'delivery-full-test') ||
        (key === 'testAttemptRunRef' && loc.type !== 'delivery-test-attempt') ||
        (key === 'verificationRunRef' && loc.type !== 'delivery-verification') ||
        (key === 'closeRunRef' && loc.type !== 'delivery-close')
      )
        invalid('轮次结果指针类型不符。');
      round[key] = ref;
    }
    if (item.closedOn !== undefined) round.closedOn = date(item.closedOn, 'round.closedOn');
    if (
      round.state === 'closed' &&
      (!round.closedOn ||
        !round.closeRunRef ||
        round.deliveryRunRef !== round.closeRunRef ||
        (!round.fullTestRunRef && !round.verificationRunRef && !round.testAttemptRunRef))
    )
      invalid('closed 轮次缺少一致收口。');
    if (round.state === 'open' && (round.closedOn || round.closeRunRef))
      invalid('open 轮次不能保存自身 Close。');
    for (const ref of [round.origin.runRef, ...pointers.map((key) => round[key])]) {
      if (!ref) continue;
      const owner = runOwners.get(ref);
      if (owner && owner !== id) invalid('同一实际 Run 不能归属不同轮次。');
      runOwners.set(ref, id);
    }
    return round;
  });
  if (manifest.currentRoundId !== rounds.at(-1)!.id) invalid('只能选择最新轮次执行。');
  if (manifest.openedOn !== rounds[0].openedOn) invalid('Delivery 首次日期与首轮不一致。');
  const expected = projectRound(manifest, rounds, String(manifest.currentRoundId));
  for (const key of projected) {
    const actual =
      key === 'goal' || key === 'plannedChanges' ? readScope(manifest)[key] : manifest[key];
    if (!isDeepStrictEqual(actual, expected[key])) invalid(`顶层 ${key} 与当前轮投影矛盾。`);
  }
  return rounds;
}

/** An existing writer changes current progress, then regenerates its compatibility projection. */
export function projectProgress(workspace: Workspace, manifest: Record<string, unknown>) {
  if (!workspace.rounds) return manifest;
  const rounds = workspace.rounds.map((r) => {
    if (r.id !== workspace.currentRoundId) return r;
    const updated = {
      ...r,
      state: manifest.state as DeliveryRound['state'],
      currentBatchId: manifest.currentBatchId as string | null,
    };
    for (const key of [...pointers, 'closedOn'] as const) {
      delete updated[key];
      if (manifest[key] !== undefined) updated[key] = String(manifest[key]);
    }
    return updated;
  });
  return projectRound(manifest, rounds, workspace.currentRoundId!);
}

export function validateRoundBindings(rounds: DeliveryRound[], bindings: Binding[]) {
  const owner = new Map(
    rounds.flatMap((r) => r.scope.plannedChanges.map((p) => [p.slot, r] as const)),
  );
  const batches = new Map<string, string>();
  for (const binding of bindings) {
    const round = owner.get(binding.planningSlot);
    if (!round) invalid('binding 不属于任何已保存轮次。');
    if (round !== rounds.at(-1) && binding.state !== 'archived')
      invalid('历史轮次含未归档 binding。');
    if (binding.batchId) {
      const existing = batches.get(binding.batchId);
      if (existing && existing !== round.id) invalid('同一批次不能混合不同轮次成员。');
      batches.set(binding.batchId, round.id);
      if (binding.batchId !== round.currentBatchId) invalid('binding 与所属轮次批次不一致。');
    } else if (round.currentBatchId !== null) invalid('已选批次的轮次含无批次 binding。');
  }
  for (const round of rounds)
    if (round.currentBatchId !== null && batches.get(round.currentBatchId) !== round.id)
      invalid('轮次当前批次没有对应成员。');
}

export function requireWritable(workspace: Pick<Workspace, 'mode' | 'project' | 'manifest'>) {
  if (workspace.mode !== 'product')
    throw new MendiError('manual-history-read-only', '人工历史只读。');
  if (workspace.project.formatVersion !== 2 || workspace.manifest.formatVersion !== 2)
    throw new MendiError(
      'legacy-product-read-only',
      '旧 product 仅可查询，写入须先预览并显式迁移。',
      {},
      '旧操作的 pending / 中断必须先使用兼容旧版恢复完成，再由新版预览迁移；新版不恢复旧提交。本次新迁移中断则核对现场后显式 delivery migrate resume。',
    );
}
