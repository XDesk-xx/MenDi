import { isDeepStrictEqual as equal } from 'node:util';
import { MendiError, object, text } from './errors.ts';
import { readScope, type Scope } from './scope.ts';
import type { Workspace } from './records.ts';

export interface ScopeAddition {
  requestId: string;
  runRef: string;
  beforeScope: Scope;
  addedSlots: string[];
  afterScope: Scope;
}
export interface ChangeAddReceipt extends Omit<ScopeAddition, 'runRef'> {
  version: 1;
  roundId: string;
  ownerDecision: string;
  reason: string;
  inputRef: string;
  inputContent: string;
  priorPointers: Record<string, string | null>;
  createdAt: string;
}
export function pureAddition(value: unknown): ScopeAddition {
  const data = object(value, '范围追加');
  const beforeScope = readScope(data.beforeScope),
    afterScope = readScope(data.afterScope);
  const suffix = afterScope.plannedChanges.slice(beforeScope.plannedChanges.length);
  if (
    !suffix.length ||
    beforeScope.goal !== afterScope.goal ||
    !equal(
      afterScope.plannedChanges.slice(0, beforeScope.plannedChanges.length),
      beforeScope.plannedChanges,
    ) ||
    !equal(
      data.addedSlots,
      suffix.map((p) => p.slot),
    )
  )
    throw new MendiError(
      'invalid-scope-addition',
      '范围追加必须保留原目标及全部前缀，addedSlots 与新后缀一致。',
    );
  return {
    requestId: text(data.requestId, 'requestId'),
    runRef: text(data.runRef, 'runRef'),
    beforeScope,
    addedSlots: suffix.map((p) => p.slot),
    afterScope,
  };
}
export const priorPointerKeys = [
  'activeChangeId',
  'latestRunRef',
  'deliveryRunRef',
  'fullTestRunRef',
  'testAttemptRunRef',
  'verificationRunRef',
  'scopeAddRunRef',
] as const;
export function scopePointers(workspace: Workspace): ChangeAddReceipt['priorPointers'] {
  const active = workspace.bindings.find((b) => b.changeId === workspace.activeChangeId);
  return Object.fromEntries(
    priorPointerKeys.map((k) => [
      k,
      k === 'latestRunRef'
        ? (active?.latestRunRef ?? workspace.manifest[k] ?? null)
        : (workspace.manifest[k] ?? null),
    ]),
  ) as ChangeAddReceipt['priorPointers'];
}
export function parseChangeAdd(value: unknown, ref: string): ChangeAddReceipt {
  const data = object(value, '追加收据');
  const { runRef: _, ...addition } = pureAddition({ ...data, runRef: ref });
  const pointers = object(data.priorPointers, '原当前指针');
  if (
    data.version !== 1 ||
    !/^r\d{3,}$/.test(String(data.roundId)) ||
    !Number.isFinite(Date.parse(String(data.createdAt))) ||
    Object.keys(pointers).length !== priorPointerKeys.length ||
    priorPointerKeys.some((k) => !(pointers[k] === null || typeof pointers[k] === 'string'))
  )
    throw new MendiError('invalid-scope-addition', '追加收据版本、轮次、时间或指针不合法。');
  const inputContent = text(data.inputContent, '实际输入');
  const input = object(JSON.parse(inputContent), '追加输入');
  validateAdditions(input);
  const ownerDecision = text(data.ownerDecision, 'ownerDecision'),
    reason = text(data.reason, 'reason');
  if (
    input.requestId !== addition.requestId ||
    input.ownerDecision !== ownerDecision ||
    input.reason !== reason ||
    !equal(
      readScope({
        goal: addition.beforeScope.goal,
        plannedChanges: [
          ...addition.beforeScope.plannedChanges,
          ...(Array.isArray(input.additions) ? input.additions : []),
        ],
      }),
      addition.afterScope,
    )
  )
    throw new MendiError('invalid-scope-addition', '收据与保存的实际请求不符。');
  return {
    ...addition,
    version: 1,
    roundId: String(data.roundId),
    ownerDecision,
    reason,
    inputRef: text(data.inputRef, 'inputRef'),
    inputContent,
    priorPointers: pointers as ChangeAddReceipt['priorPointers'],
    createdAt: String(data.createdAt),
  };
}
/** Historical scope-addition Run and intent must be covered exactly once.
 * Old inline bytes and newer compact digests are both supported. */
export function additionEvidenceRefs(before: Workspace): string[] {
  return (
    before.rounds?.flatMap((round) =>
      (round.scopeAdditions ?? []).flatMap((addition) => [
        addition.runRef,
        addition.runRef.replace('run.md', 'artifacts/intent.json'),
      ]),
    ) ?? []
  );
}
export function requireAdditionEvidence(
  before: Workspace,
  directRefs: readonly string[],
  digestRefs: readonly string[],
): void {
  const expected = new Set(additionEvidenceRefs(before));
  const seen = new Set<string>();
  for (const ref of [...directRefs, ...digestRefs]) {
    if (seen.has(ref))
      throw new MendiError('invalid-scope-addition', '追加依据存在重复或冲突的直接引用。', { ref });
    seen.add(ref);
  }
  for (const ref of digestRefs)
    if (!expected.has(ref))
      throw new MendiError('invalid-scope-addition', '摘要引用不是本轮已保存的旧追加依据。', {
        ref,
      });
  for (const ref of expected)
    if (!seen.has(ref))
      throw new MendiError('invalid-scope-addition', '追加依据缺少必要的旧收据或 intent。', {
        ref,
      });
}

export function validateAdditions(
  input: Record<string, unknown>,
): asserts input is Record<string, unknown> & { additions: unknown[] } {
  if (
    Object.keys(input).some(
      (k) => !['requestId', 'ownerDecision', 'reason', 'additions'].includes(k),
    ) ||
    !Array.isArray(input.additions) ||
    !input.additions.length ||
    input.additions.some((value) =>
      Object.keys(object(value, '新增槽位')).some(
        (k) =>
          !['slot', 'title', 'dependsOn', 'roadmapSection', 'baselineDependencies'].includes(k),
      ),
    )
  )
    throw new MendiError(
      'invalid-scope-addition',
      '输入须为非空新增计划，不能夹带 bind、激活或其他操作。',
    );
}
