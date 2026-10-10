import { MendiError, object, text, identifier } from './errors.ts';
import type { TestOutcome } from './test-execution.ts';
import { readScope, type Workspace } from './records.ts';
import { archivedCount } from './archive.ts';
import { currentScopeBindings } from './batches.ts';
export interface Declaration {
  collection: string[];
  basis: { materials: string; changes: string; commit?: string };
}
export function declaration(value: unknown): Declaration {
  const data = object(value, '验收声明');
  if (!Array.isArray(data.collection))
    throw new MendiError('invalid-declaration', 'collection 必须是非空完整集合。');
  const collection = data.collection.map((v) => text(v, '集合说明'));
  if (!collection.length || new Set(collection).size !== collection.length)
    throw new MendiError('invalid-declaration', '集合说明为空或重复。');
  const basis = object(data.basis, '受测材料');
  const materials = text(basis.materials, '实际材料');
  if (typeof basis.changes !== 'string')
    throw new MendiError('invalid-declaration', 'changes 必须是差异说明，可为空。');
  if (
    basis.commit !== undefined &&
    (typeof basis.commit !== 'string' || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(basis.commit))
  )
    throw new MendiError('invalid-declaration', 'commit 必须是完整提交标识。');
  return {
    collection,
    basis: {
      materials,
      changes: basis.changes,
      ...(basis.commit === undefined ? {} : { commit: basis.commit as string }),
    },
  };
}
export interface DeliveryScope {
  goal: string;
  plannedChanges: { slot: string; title: string; dependsOn: string[] }[];
  completed: { slot: string; changeId: string; archiveOrdinal: number }[];
}
export function completionScope(workspace: Workspace): DeliveryScope {
  if (
    workspace.mode !== 'product' ||
    workspace.activeChangeId ||
    currentScopeBindings(workspace).length !== workspace.scope.plannedChanges.length ||
    currentScopeBindings(workspace).some((b) => b.state !== 'archived')
  )
    throw new MendiError(
      'delivery-scope-incomplete',
      '正式验收要求本轮全部槽位归档且无活动 Change。',
    );
  const completed = workspace.scope.plannedChanges.map((p) => {
    const binding = workspace.bindings.find((b) => b.planningSlot === p.slot);
    if (!binding?.archiveOrdinal)
      throw new MendiError('delivery-scope-incomplete', '计划槽位未归档。');
    return { slot: p.slot, changeId: binding.changeId, archiveOrdinal: binding.archiveOrdinal };
  });
  return {
    goal: workspace.scope.goal,
    plannedChanges: workspace.scope.plannedChanges.map(({ slot, title, dependsOn }) => ({
      slot,
      title,
      dependsOn,
    })),
    completed,
  };
}
export function verificationScope(workspace: Workspace): DeliveryScope {
  const scope = completionScope(workspace);
  if (
    workspace.state !== 'open' ||
    workspace.project.pendingDeliveryRunRef !== undefined ||
    Math.max(...scope.completed.map((v) => v.archiveOrdinal)) !== archivedCount(workspace.project)
  )
    throw new MendiError(
      'delivery-scope-incomplete',
      '当前正式执行要求 open、无未完成操作与一致完成计数。',
    );
  return scope;
}
export function parseVerificationScope(value: unknown): DeliveryScope {
  const data = object(value, '验收范围');
  const scope = readScope(data);
  if (!Array.isArray(data.completed) || data.completed.length !== scope.plannedChanges.length)
    throw new MendiError('invalid-run', '验收范围缺少完成槽位。');
  const completed = data.completed.map((v, i) => {
    const item = object(v, '完成槽位');
    if (
      item.slot !== scope.plannedChanges[i].slot ||
      !Number.isSafeInteger(item.archiveOrdinal) ||
      Number(item.archiveOrdinal) < 1
    )
      throw new MendiError('invalid-run', '验收槽位 / 归档编号不一致。');
    return {
      slot: String(item.slot),
      changeId: identifier(item.changeId, '完成 Change'),
      archiveOrdinal: Number(item.archiveOrdinal),
    };
  });
  if (
    new Set(completed.map((v) => v.changeId)).size !== completed.length ||
    new Set(completed.map((v) => v.archiveOrdinal)).size !== completed.length
  )
    throw new MendiError('invalid-run', '验收完成身份重复。');
  return {
    goal: scope.goal,
    plannedChanges: scope.plannedChanges.map(({ slot, title, dependsOn }) => ({
      slot,
      title,
      dependsOn,
    })),
    completed,
  };
}
export interface ApprovalFact {
  changeId: string;
  archiveRunRef: string;
  reviewRunRef: string;
  authorRunRef: string;
  authorActor: string;
  reviewerActor: string;
}
export interface FullTest extends Declaration {
  scope: DeliveryScope;
  approvals: ApprovalFact[];
  repairApproval?: {
    reviewRunRef: string;
    authorRunRef: string;
    authorActor: string;
    reviewerActor: string;
  };
  entry: { scriptName: string; scriptText: string; packageManager?: string; pnpmBin: string };
  phase: 'prepared' | 'running' | 'finished';
  executionId: string | null;
  outcome: TestOutcome;
  reason?: string;
}
export interface Repair {
  failedFullTestRunRef: string;
  scope: DeliveryScope;
  collection: string[];
  reason: string;
}
