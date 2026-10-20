import fs from 'node:fs';
import { inspectProject } from '../adapters/project.ts';
import { managedPath, present } from '../adapters/paths.ts';
import { readWorkspace, guardProductWrite, type WriteObserver } from '../adapters/workspace.ts';
import { readDeliveryRun, currentDeliveryRun } from '../adapters/delivery-runs.ts';
import { same } from '../adapters/delivery-verification.ts';
import { loadMethods } from '../adapters/methods.ts';
import type { OpenSpec } from '../adapters/openspec.ts';
import {
  commitLifecycle,
  resumeLifecycle,
  type LifecycleBasis,
} from '../adapters/lifecycle-store.ts';
import { applicability, type Lifecycle, type LifecycleType } from '../core/delivery-lifecycle.ts';
import { completionScope, verificationScope } from '../core/delivery-verification.ts';
import { deliveryNext } from '../core/delivery-next.ts';
import { bindingFor, readScope, type Workspace } from '../core/records.ts';
import { assertAssociationAvailable } from '../core/associations.ts';
import { MendiError, object, text } from '../core/errors.ts';
import { state, selected, type OpenInput, type OperationOptions } from './project.ts';
import { requireWritable } from '../core/rounds.ts';
import { deliveredBaselines } from '../adapters/baselines.ts';
import { checkBaselineSnapshot } from '../core/baselines.ts';
import { inspectAttempt, captureBytes } from '../adapters/group-store.ts';

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
  requireWritable(workspace);
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
    if (lifecycle.scope.plannedChanges.some((p) => p.baselineDependencies?.length))
      throw new MendiError('baseline-source-unavailable', '首次 Open 没有登记基线来源。');
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
    deliveredBaselines(
      root,
      {
        ...workspace,
        id: lifecycle.operation === 'delivery-open' ? '__new-delivery__' : workspace.id,
      },
      lifecycle.scope,
      lifecycle.roundId,
    );
    const prior = closed(root, workspace);
    if (prior.ref !== lifecycle.priorCloseRef || workspace.id !== lifecycle.sourceDeliveryId)
      throw new MendiError('lifecycle-input-changed', '直接来源 Close 已变化。');
    return;
  }
  if (
    workspace.state !== 'open' ||
    workspace.activeChangeId ||
    workspace.manifest.deliveryRunRef !==
      (lifecycle.testAttemptRunRef ?? lifecycle.verificationRunRef ?? lifecycle.fullTestRunRef) ||
    (lifecycle.testAttemptRunRef !== undefined
      ? workspace.manifest.testAttemptRunRef !== lifecycle.testAttemptRunRef
      : lifecycle.verificationRunRef !== undefined
        ? workspace.manifest.verificationRunRef !== lifecycle.verificationRunRef
        : workspace.manifest.fullTestRunRef !== lifecycle.fullTestRunRef)
  )
    throw new MendiError('delivery-state-conflict', 'Close 需要当前本轮正式入口与两个指针一致。');
  if (lifecycle.testAttemptRunRef !== undefined) {
    const run = readDeliveryRun(root, lifecycle.testAttemptRunRef, workspace.id);
    const facts = inspectAttempt(root, workspace, run, true);
    const a = run.record.attempt;
    verificationScope(workspace);
    checkBaselineSnapshot(workspace.scope, lifecycle.acceptance?.baselineFacts ?? []);
    if (
      !a ||
      a.version !== 2 ||
      a.roundId !== workspace.currentRoundId ||
      !facts.stable ||
      facts.formalOutcome !== 'passed' ||
      facts.protocolState !== 'valid' ||
      facts.scopeMatch !== 'match' ||
      facts.commandMatch !== 'match' ||
      !same(a, lifecycle.acceptance) ||
      !same(a.scope, completionScope(workspace)) ||
      a.approvals.some(
        (f) =>
          workspace.bindings.find((b) => b.changeId === f.changeId)?.latestRunRef !==
          f.archiveRunRef,
      )
    )
      throw new MendiError(
        'delivery-close-unavailable',
        '需要本轮当前稳定 v2 passed、全部必需组与一致直接快照。',
      );
    return;
  }
  throw new MendiError(
    'historical-close-read-only',
    '旧验收 Close 仅供已完成历史读取，不接受新的写入或未完成恢复。',
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
  guardProductWrite(root);
  const methods = loadMethods(type, [], options.methodsRoot);
  if (input.resumeRef) {
    if (type === 'delivery-close') {
      if (
        !readDeliveryRun(root, input.resumeRef, input.resumeRef.split('/')[2]).record.lifecycle
          ?.testAttemptRunRef
      )
        throw new MendiError(
          'historical-close-read-only',
          '旧 Close 只读，未完成的旧写入先用兼容版本核对恢复。',
        );
    }
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
  }
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
    if (
      declared.testAttemptRunRef === undefined ||
      declared.fullTestRunRef !== undefined ||
      declared.verificationRunRef !== undefined
    )
      throw new MendiError(
        'invalid-declaration',
        '新 Close 唯一选择 testAttemptRunRef；旧 fullTestRunRef / verificationRunRef 仅供历史读取。',
      );
    const ref = text(declared.testAttemptRunRef, '正式入口');
    const run = readDeliveryRun(root, ref, workspace.id);
    if (run.record.attempt?.version !== 2)
      throw new MendiError('invalid-run', 'Close 入口类型不符。');
    lifecycle = {
      roundId: workspace.currentRoundId!,
      operation: type,
      sourceDeliveryId: workspace.id,
      scope: workspace.scope,
      recordedOn: date(),
      testAttemptRunRef: ref,
      acceptance: run.record.attempt,
      applicability: applicability(declared.applicability),
    };
    const facts = inspectAttempt(root, workspace, run);
    if (!facts.stable) throw new MendiError('delivery-close-unavailable', '正式直接执行未稳定。');
  } else {
    const prior = closed(root, workspace);
    lifecycle = {
      roundId: `r${String(workspace.rounds!.length + 1).padStart(3, '0')}`,
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
      ? [lifecycle.testAttemptRunRef!, 'package.json']
      : [lifecycle.priorCloseRef!];
  // 可选配置文件不存在时 selectedTest 已解释其默认值；存在者才是此处字节复核输入。
  const bytes = new Map<string, Buffer>(
    refs
      .filter((ref) => present(managedPath(root, ref)))
      .map((ref) => [ref, fs.readFileSync(managedPath(root, ref))]),
  );
  if (lifecycle.testAttemptRunRef) {
    const run = readDeliveryRun(root, lifecycle.testAttemptRunRef, workspace.id);
    inspectAttempt(root, workspace, run, false, bytes);
    // 锁内及恢复期间同样解释真实子结果，不能只比较父头部。
    for (const ref of [run.ref, 'package.json']) captureBytes(root, ref, bytes);
  }
  if (type === 'delivery-reopen') {
    const baseline = deliveredBaselines(root, workspace, lifecycle.scope, lifecycle.roundId);
    for (const [ref, content] of baseline.bytes)
      if (ref !== workspace.manifestRef) bytes.set(ref, content);
  }
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
    guardProductWrite(root);
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
    roundId: 'r001',
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
