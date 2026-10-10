import { currentBinding, assertAssociationAvailable } from '../core/associations.ts';
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
import { errorInfo, identifier, MendiError, object, text } from '../core/errors.ts';
import { actionNext } from '../core/actions.ts';
import { currentRun } from '../adapters/runs.ts';
import { currentDeliveryRun } from '../adapters/delivery-runs.ts';
import {
  inspectFullTest,
  assertBindingAfterVerification,
} from '../adapters/delivery-verification.ts';
import { deliveryNext } from '../core/delivery-runs.ts';
import { currentBatchId } from '../core/batches.ts';
import { recordedOpen } from './delivery-lifecycle.ts';

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
    ...(workspace.mode === 'manual-bootstrap' ? { recorded: workspace.manifest } : {}),
  };
}

export function query(input: Selection, options: OperationOptions = {}) {
  const { root, upstream } = selected(input, options);
  const base = {
    ok: true as const,
    operation: 'query' as const,
    projectRoot: root,
    openspec: upstream.info(),
  };
  let workspace: Workspace | null;
  try {
    workspace = readWorkspace(root, false, input.deliveryId);
  } catch (error) {
    if (!(error instanceof MendiError) || error.code !== 'delivery-commit-pending') throw error;
    return {
      ...base,
      ok: false,
      local: null,
      upstream: null,
      outcome: 'unknown',
      pending: error.details,
      next: {
        action: 'owner-decision',
        role: 'owner',
        status: 'stopped',
        executable: false,
        reason: error.message,
      },
    };
  }
  if (!workspace)
    return {
      ...base,
      local: null,
      upstream: null,
      next: {
        action: 'delivery-open',
        source: 'local-state',
        executable: true,
        reason: '需明确 Delivery 范围与 Owner 授权。',
      },
    };
  const delivery = currentDeliveryRun(root, workspace);
  if (delivery) {
    const verification = delivery.record.fullTest
      ? inspectFullTest(root, workspace, delivery)
      : undefined;
    return {
      ...base,
      ok: !verification || (verification.stable && verification.outcome !== 'unknown'),
      local: state(workspace),
      upstream: null,
      run: { ref: delivery.ref, ...delivery.record },
      ...(verification ? { verification } : {}),
      next: deliveryNext(delivery.record, delivery.ref, verification?.outcome),
    };
  }
  const run = currentRun(root, workspace);
  const facts =
    workspace.activeChangeId && !run?.record.archive
      ? upstream.status(workspace.activeChangeId)
      : null;
  const next =
    workspace.mode === 'manual-bootstrap'
      ? {
          ...object(workspace.manifest.next, '人工 next'),
          source: 'manual-bootstrap',
          executable: false,
        }
      : run
        ? actionNext(run.record, run.ref, currentBinding(workspace)?.state === 'archived')
        : workspace.activeChangeId
          ? {
              action: 'explore',
              source: 'local-state',
              executable: false,
              role: 'author',
              reason: '关联已保存；可显式开始 Explore 记录，阶段语义工作由 Agent 完成。',
            }
          : {
              action: 'change-bind',
              source: 'local-state',
              executable: true,
              reason: '需明确已有 Change、计划槽位及相应 Owner 授权。',
            };
  return {
    ...base,
    local: state(workspace),
    upstream: facts,
    ...(run ? { run: { ref: run.ref, ...run.record } } : {}),
    next,
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
    formatVersion: 1,
    recordingMode: 'product',
    name: path.basename(root),
    deliveryGroupsDir: '.mendi/delivery-groups',
    activeDeliveryId: id,
    deliveries: [{ id, manifestRef: `.mendi/delivery-groups/${id}/manifest.json` }],
  };
  const manifest = {
    formatVersion: 1,
    recordingMode: 'product',
    id,
    title,
    state: 'open',
    openedOn,
    ...scope,
    changeBindings: binding ? [binding] : [],
    activeChangeId: binding?.changeId ?? null,
    changeBatches: [],
  };
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
  const associate = (current: Workspace) => {
    if (current.mode !== 'product')
      throw new MendiError(
        'manual-state-read-only',
        '人工 bootstrap 仅支持产品查询。',
        {},
        '保留人工历史，不通过产品 bind 改写。',
      );
    if (current.state !== 'open' || current.activeChangeId)
      throw new MendiError(
        'change-bind-conflict',
        '仅允许无活动项、前项归档完成的 open Delivery 关联。',
        { deliveryId: current.id, activeChangeId: current.activeChangeId },
      );
    assertBindingAfterVerification(root, current);
    assertAssociationAvailable(current.scope, current.bindings, input.slot, input.changeId);
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
