import { assertAssociationAvailable } from '../core/associations.ts';
import fs from 'node:fs';
import path from 'node:path';
import { inspectProject } from '../adapters/project.ts';
import { OpenSpec, type ProcessRunner } from '../adapters/openspec.ts';
import { managedPath, present } from '../adapters/paths.ts';
import {
  createWorkspace,
  readWorkspace,
  updateWorkspace,
  type WriteObserver,
} from '../adapters/workspace.ts';
import { bindingFor, readScope, type Workspace } from '../core/records.ts';
import { errorInfo, identifier, MendiError, text } from '../core/errors.ts';
import { assertBindingAfterVerification } from '../adapters/delivery-verification.ts';
import { currentBatchId } from '../core/batches.ts';
import { recordedOpen } from './delivery-lifecycle.ts';
import { initialRound, requireWritable } from '../core/rounds.ts';
import { deliveredBaselines } from '../adapters/baselines.ts';

export interface Selection {
  project: string;
  openspecBin?: string;
  deliveryId?: string;
}
export interface OperationOptions {
  runner?: ProcessRunner;
  observeWrite?: WriteObserver;
}
export interface OpenInput extends Selection {
  id: string;
  title: string;
  scopePath: string;
  changeId?: string;
  slot?: string;
  role?: string;
  actor?: string;
  resumeRef?: string;
}
export interface BindInput extends Selection {
  changeId: string;
  slot: string;
}

export function selected(input: Selection, options: OperationOptions) {
  const project = inspectProject(input.project);
  const upstream = new OpenSpec(project.root, input.openspecBin, options.runner);
  return { ...project, upstream };
}

export function state(workspace: Workspace) {
  return {
    source: workspace.mode,
    deliveryId: workspace.id,
    title: workspace.title,
    state: workspace.state,
    ...workspace.scope,
    activeChangeId: workspace.activeChangeId,
    changeBindings: workspace.bindings,
    ...(workspace.rounds
      ? {
          currentRoundId: workspace.currentRoundId,
          rounds: workspace.rounds.map(({ id, state, openedOn, closedOn, closeRunRef }) => ({
            id,
            state,
            openedOn,
            closedOn,
            closeRunRef,
          })),
        }
      : {
          compatibility:
            workspace.mode === 'product'
              ? 'legacy-product-read-only'
              : 'manual-bootstrap-read-only',
        }),
    ...(workspace.mode === 'manual-bootstrap' ? { recorded: workspace.manifest } : {}),
  };
}

export function openDelivery(input: OpenInput, options: OperationOptions = {}) {
  if (input.resumeRef) return recordedOpen(input, options);
  const id = identifier(input.id, 'Delivery ID');
  const title = text(input.title, 'Delivery 标题');
  if ((input.role !== undefined) !== (input.actor !== undefined))
    throw new MendiError('invalid-arguments', '--role / --actor 必须成对。');
  if (input.role !== undefined) return recordedOpen(input, options);
  if ((input.changeId !== undefined) !== (input.slot !== undefined))
    throw new MendiError(
      'invalid-arguments',
      '--change 与 --slot 必须成对出现。',
      {},
      '同时提供 Change 和计划槽位，或同时省略。',
      2,
    );
  const { root, upstream } = selected(input, options);
  const directory = managedPath(root, '.mendi');
  if (present(directory)) {
    let existing: Workspace | null = null;
    try {
      existing = readWorkspace(root);
    } catch {
      /* 旧首次 Open 对任何已有现场都保持拒绝，不取得或抢占锁。 */
    }
    if (existing?.mode === 'product' && existing.state === 'closed')
      throw new MendiError(
        'invalid-arguments',
        'closed 后新 Open 必须显式提供 --role author / --actor。',
      );
    throw new MendiError(
      'existing-mendi-state',
      '目标已存在 MenDi 状态；首次 Open 不覆盖。',
      { directory },
      '核对已有项目或残留；不会自动重新 Open。',
    );
  }
  const scopePath = path.resolve(root, input.scopePath);
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(scopePath, 'utf8')) as unknown;
  } catch (error) {
    throw new MendiError('invalid-scope', '无法读取 JSON 范围文件。', {
      scopePath,
      ...errorInfo(error),
    });
  }
  const scope = readScope(value);
  if (scope.plannedChanges.some((p) => p.baselineDependencies?.length))
    throw new MendiError('baseline-source-unavailable', '首次 Open 没有已登记的产品基线来源。');
  const binding =
    input.changeId !== undefined
      ? bindingFor(scope, text(input.slot, '计划槽位'), input.changeId)
      : null;
  if (binding) {
    assertAssociationAvailable(scope, [], binding.planningSlot, binding.changeId);
    managedPath(root, binding.changeRef);
    upstream.status(binding.changeId);
  }
  const date = new Date();
  const openedOn = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const project = {
    formatVersion: 2,
    recordingMode: 'product',
    name: path.basename(root),
    deliveryGroupsDir: '.mendi/delivery-groups',
    activeDeliveryId: id,
    deliveries: [{ id, manifestRef: `.mendi/delivery-groups/${id}/manifest.json` }],
  };
  const manifest = initialRound({
    formatVersion: 2,
    recordingMode: 'product',
    id,
    title,
    state: 'open',
    openedOn,
    ...scope,
    changeBindings: binding ? [binding] : [],
    activeChangeId: binding?.changeId ?? null,
    changeBatches: [],
  });
  const workspace = createWorkspace(root, project, manifest, options.observeWrite);
  return {
    ok: true as const,
    operation: 'delivery-open' as const,
    projectRoot: root,
    openspec: upstream.info(),
    local: state(workspace),
  };
}

export function bindChange(input: BindInput, options: OperationOptions = {}) {
  identifier(input.changeId, 'Change ID');
  text(input.slot, '计划槽位');
  const { root, upstream } = selected(input, options);
  let baseline: ReturnType<typeof deliveredBaselines> | undefined;
  const associate = (current: Workspace) => {
    if (current.mode !== 'product')
      throw new MendiError(
        'manual-state-read-only',
        '人工 bootstrap 仅支持产品查询。',
        {},
        '保留人工历史，不通过产品 bind 改写。',
      );
    requireWritable(current);
    if (current.state !== 'open' || current.activeChangeId)
      throw new MendiError(
        'change-bind-conflict',
        '仅允许无活动项、前项归档完成的 open Delivery 关联。',
        { deliveryId: current.id, activeChangeId: current.activeChangeId },
      );
    assertBindingAfterVerification(root, current);
    assertAssociationAvailable(current.scope, current.bindings, input.slot, input.changeId);
    const direct = deliveredBaselines(root, current, {
      goal: current.scope.goal,
      plannedChanges: current.scope.plannedChanges.filter((p) => p.slot === input.slot),
    });
    baseline?.confirm();
    baseline ??= direct;
    const binding = bindingFor(current.scope, input.slot, input.changeId);
    const batches = current.manifest.changeBatches as Record<string, unknown>[];
    const batchId = currentBatchId(current.manifest);
    if (batchId !== null) binding.batchId = batchId;
    managedPath(root, binding.changeRef);
    upstream.status(binding.changeId);
    return {
      ...current.manifest,
      changeBindings: [...(current.manifest.changeBindings as unknown[]), binding],
      activeChangeId: binding.changeId,
      deliveryRunRef: undefined,
      changeBatches: batches.map((batch) =>
        batch.id !== batchId
          ? batch
          : {
              ...batch,
              changeIds: [...(batch.changeIds as string[]), binding.changeId],
            },
      ),
    };
  };
  const before = readWorkspace(root);
  if (!before) throw new MendiError('delivery-not-open', '目标尚未 Open。');
  associate(before); // Reject known invalid requests before acquiring a write lock.
  const workspace = updateWorkspace(root, associate, options.observeWrite);
  return {
    ok: true as const,
    operation: 'change-bind' as const,
    projectRoot: root,
    openspec: upstream.info(),
    local: state(workspace),
  };
}

export { query, queryRound } from './project-query.ts';
