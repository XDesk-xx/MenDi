import fs from 'node:fs';
import { inspectProject } from '../adapters/project.ts';
import { managedPath, present } from '../adapters/paths.ts';
import { readWorkspace, type WriteObserver } from '../adapters/workspace.ts';
import { readDeliveryRun, currentDeliveryRun } from '../adapters/delivery-runs.ts';
import { inspectFullTest, same } from '../adapters/delivery-verification.ts';
import { loadMethods } from '../adapters/methods.ts';
import type { OpenSpec } from '../adapters/openspec.ts';
import {
  commitLifecycle,
  resumeLifecycle,
  type LifecycleBasis,
} from '../adapters/lifecycle-store.ts';
import { applicability, type Lifecycle, type LifecycleType } from '../core/delivery-lifecycle.ts';
import { completionScope, verificationScope } from '../core/delivery-verification.ts';
import { deliveryNext } from '../core/delivery-runs.ts';
import { bindingFor, readScope, type Workspace } from '../core/records.ts';
import { assertAssociationAvailable } from '../core/associations.ts';
import { MendiError, object, text } from '../core/errors.ts';
import { state, selected, type OpenInput, type OperationOptions } from './project.ts';

export interface LifecycleInput {
  project: string;
  role: string;
  actor: string;
  inputFile?: string;
  scopePath?: string;
  reason?: string;
  resumeRef?: string;
}
export interface LifecycleOptions {
  observeWrite?: WriteObserver;
  methodsRoot?: string;
}
function actor(role: unknown, value: unknown) {
  if (role !== 'author')
    throw new MendiError('action-role-mismatch', '生命周期操作需要显式 Author。');
  return text(value, 'actor');
}
const date = () => {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};
function inputBasis(root: string, ref: string, workspace: Workspace | null): LifecycleBasis {
  return {
    project: workspace ? fs.readFileSync(managedPath(root, '.mendi/project.json'), 'utf8') : null,
    manifest: workspace ? fs.readFileSync(managedPath(root, workspace.manifestRef), 'utf8') : null,
    input: { ref, content: fs.readFileSync(managedPath(root, ref), 'utf8') },
  };
}
function product(workspace: Workspace | null): asserts workspace is Workspace {
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', '生命周期写入仅支持 product，不迁移人工历史。');
}
function closed(root: string, workspace: Workspace) {
  const run = currentDeliveryRun(root, workspace);
  if (
    workspace.state !== 'closed' ||
    !run?.record.lifecycle ||
    run.record.actionType !== 'delivery-close' ||
    run.record.status !== 'submitted' ||
    workspace.manifest.closeRunRef !== run.ref ||
    !same(completionScope(workspace), run.record.lifecycle.acceptance?.scope)
  )
    throw new MendiError('delivery-state-conflict', '需要当前完整 closed 与一致的 Close。');
  return run;
}
export function confirmLifecycle(root: string, workspace: Workspace | null, lifecycle: Lifecycle) {
  if (lifecycle.operation === 'delivery-open' && !workspace) {
    if (lifecycle.sourceDeliveryId !== null)
      throw new MendiError('delivery-state-conflict', '首次 Open 来源不符。');
    if (lifecycle.initialBinding) {
      const binding = bindingFor(
        lifecycle.scope,
        lifecycle.initialBinding.planningSlot,
        lifecycle.initialBinding.changeId,
      );
      assertAssociationAvailable(lifecycle.scope, [], binding.planningSlot, binding.changeId);
      if (!present(managedPath(root, binding.changeRef)))
        throw new MendiError('run-input-missing', '首次绑定的必要 Change 不存在。');
    }
    return;
  }
  product(workspace);
  if (lifecycle.operation !== 'delivery-close') {
    const prior = closed(root, workspace);
    if (prior.ref !== lifecycle.priorCloseRef || workspace.id !== lifecycle.sourceDeliveryId)
      throw new MendiError('lifecycle-input-changed', '直接来源 Close 已变化。');
    return;
  }
  if (
    workspace.state !== 'open' ||
    workspace.activeChangeId ||
    workspace.manifest.deliveryRunRef !== lifecycle.fullTestRunRef ||
    workspace.manifest.fullTestRunRef !== lifecycle.fullTestRunRef
  )
    throw new MendiError('delivery-state-conflict', 'Close 需要当前本轮正式入口与两个指针一致。');
  const run = readDeliveryRun(root, lifecycle.fullTestRunRef!, workspace.id);
  verificationScope(workspace);
  const facts = inspectFullTest(root, workspace, run, true);
  if (
    run.record.status !== 'submitted' ||
    run.record.outcome !== 'complete' ||
    !facts.stable ||
    facts.outcome !== 'passed' ||
    facts.scopeMatch !== 'match' ||
    facts.commandMatch !== 'match' ||
    !same(run.record.fullTest, lifecycle.acceptance) ||
    run.record.fullTest?.approvals.some(
      (fact) =>
        workspace.bindings.find((binding) => binding.changeId === fact.changeId)?.latestRunRef !==
        fact.archiveRunRef,
    )
  )
    throw new MendiError(
      'delivery-close-unavailable',
      '需要稳定 known passed、当前范围 / 命令与完整批准快照。',
    );
}
function output(
  root: string,
  operation: LifecycleType,
  value: ReturnType<typeof commitLifecycle> | ReturnType<typeof resumeLifecycle>,
  methods: ReturnType<typeof loadMethods>,
  openspec: ReturnType<OpenSpec['info']> | null = null,
) {
  return {
    ok: true,
    operation,
    projectRoot: root,
    openspec,
    executionMode: openspec === null ? 'local-only' : 'fixed-tool',
    upstreamAccess: openspec === null ? 'not-required' : 'validated',
    local: state(value.workspace),
    run: { ref: value.run.ref, ...value.run.record },
    methods,
    ...('alreadyCompleted' in value ? { alreadyCompleted: value.alreadyCompleted } : {}),
    next: deliveryNext(value.run.record, value.run.ref),
  };
}
export function deliveryLifecycle(
  type: 'delivery-close' | 'delivery-reopen',
  input: LifecycleInput,
  options: LifecycleOptions = {},
) {
  const actorId = actor(input.role, input.actor);
  const { root } = inspectProject(input.project);
  const methods = loadMethods(type, [], options.methodsRoot);
  if (input.resumeRef)
    return output(
      root,
      type,
      resumeLifecycle(
        root,
        input.resumeRef,
        type,
        actorId,
        (workspace, value) => confirmLifecycle(root, workspace, value),
        options.observeWrite,
      ),
      methods,
    );
  const workspace = readWorkspace(root);
  product(workspace);
  const basis = inputBasis(
    root,
    text(type === 'delivery-close' ? input.inputFile : input.scopePath, '输入文件'),
    workspace,
  );
  const declared = object(JSON.parse(basis.input.content), '生命周期声明');
  let lifecycle: Lifecycle;
  if (type === 'delivery-close') {
    const ref = text(declared.fullTestRunRef, '正式入口');
    const run = readDeliveryRun(root, ref, workspace.id);
    if (!run.record.fullTest) throw new MendiError('invalid-run', 'Close 不能使用普通测试 PASS。');
    lifecycle = {
      operation: type,
      sourceDeliveryId: workspace.id,
      scope: workspace.scope,
      recordedOn: date(),
      fullTestRunRef: ref,
      acceptance: run.record.fullTest,
      applicability: applicability(declared.applicability),
    };
    const facts = inspectFullTest(root, workspace, run);
    if (!facts.stable) throw new MendiError('delivery-close-unavailable', '正式直接执行未稳定。');
  } else {
    const prior = closed(root, workspace);
    lifecycle = {
      operation: type,
      sourceDeliveryId: workspace.id,
      scope: readScope(declared),
      recordedOn: date(),
      priorCloseRef: prior.ref,
      reason: text(input.reason, '重开原因'),
    };
    if (
      lifecycle.scope.plannedChanges.some((item) =>
        workspace.bindings.some((binding) => binding.planningSlot === item.slot),
      )
    )
      throw new MendiError('invalid-scope', '新一轮不能复用旧绑定槽位。');
  }
  confirmLifecycle(root, workspace, lifecycle);
  // 只固定本次直接执行 / 配置的实际字节；不持久化 hash 清单或复制历史证据。
  const refs =
    type === 'delivery-close'
      ? [lifecycle.fullTestRunRef!, 'package.json']
      : [lifecycle.priorCloseRef!];
  if (type === 'delivery-close') {
    const run = readDeliveryRun(root, lifecycle.fullTestRunRef!, workspace.id);
    const facts = inspectFullTest(root, workspace, run);
    if (facts.child)
      refs.push(
        `.mendi/delivery-groups/${workspace.id}/tests/${facts.child.executionId}/result.json`,
        facts.child.stdoutRef,
        facts.child.stderrRef,
      );
  }
  // 可选配置文件不存在时 selectedTest 已解释其默认值；存在者才是此处字节复核输入。
  const bytes = new Map(
    refs
      .filter((ref) => present(managedPath(root, ref)))
      .map((ref) => [ref, fs.readFileSync(managedPath(root, ref))]),
  );
  const result = commitLifecycle(
    root,
    workspace.id,
    lifecycle,
    actorId,
    basis,
    (current, value) => {
      if ([...bytes].some(([ref, old]) => !fs.readFileSync(managedPath(root, ref)).equals(old)))
        throw new MendiError('lifecycle-input-changed', '本次直接材料在提交期间变化。');
      confirmLifecycle(root, current, value);
    },
    options.observeWrite,
  );
  return output(root, type, result, methods);
}
export function recordedOpen(
  input: OpenInput & { role?: string; actor?: string; resumeRef?: string },
  options: OperationOptions & LifecycleOptions = {},
) {
  const actorId = actor(input.role, input.actor);
  const methods = loadMethods('delivery-open', [], options.methodsRoot);
  if (input.resumeRef) {
    const { root } = inspectProject(input.project);
    return output(
      root,
      'delivery-open',
      resumeLifecycle(
        root,
        input.resumeRef,
        'delivery-open',
        actorId,
        (workspace, value) => confirmLifecycle(root, workspace, value),
        options.observeWrite,
      ),
      methods,
    );
  }
  const { root, upstream } = selected(input, options);
  const existing = present(managedPath(root, '.mendi'));
  const workspace = existing ? readWorkspace(root) : null;
  if (existing) {
    product(workspace);
    closed(root, workspace);
  }
  if (workspace && (input.changeId !== undefined || input.slot !== undefined))
    throw new MendiError('invalid-arguments', 'closed 后 Open 与 Change bind 分开。');
  if ((input.changeId === undefined) !== (input.slot === undefined))
    throw new MendiError('invalid-arguments', '首次 --change / --slot 必须成对。');
  // 拒绝已存在未登记 group / runs；不能把中断残留解释为新入口。
  for (const ref of [`.mendi/delivery-groups/${input.id}`, `.mendi/runs/${input.id}`])
    if (present(managedPath(root, ref)))
      throw new MendiError('existing-mendi-state', '目标 Delivery ID 或占用目录已存在。', { ref });
  const basis = inputBasis(root, input.scopePath, workspace);
  const scope = readScope(JSON.parse(basis.input.content));
  const lifecycle: Lifecycle = {
    operation: 'delivery-open',
    sourceDeliveryId: workspace?.id ?? null,
    scope,
    title: text(input.title, '标题'),
    recordedOn: date(),
    ...(workspace ? { priorCloseRef: String(workspace.manifest.closeRunRef) } : {}),
    ...(input.changeId
      ? { initialBinding: { changeId: input.changeId, planningSlot: text(input.slot, '槽位') } }
      : {}),
  };
  if (input.changeId) upstream.status(input.changeId);
  confirmLifecycle(root, workspace, lifecycle);
  return output(
    root,
    'delivery-open',
    commitLifecycle(
      root,
      input.id,
      lifecycle,
      actorId,
      basis,
      (current, value) => confirmLifecycle(root, current, value),
      options.observeWrite,
    ),
    methods,
    upstream.info(),
  );
}
