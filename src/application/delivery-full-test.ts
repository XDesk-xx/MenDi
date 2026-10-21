import fs from 'node:fs';
import { inspectProject } from '../adapters/project.ts';
import { managedPath, present } from '../adapters/paths.ts';
import { readDeliveryRun } from '../adapters/delivery-runs.ts';
import { inspectFullTest } from '../adapters/delivery-verification.ts';
import { deliveryLocation } from '../core/delivery-runs.ts';
import { deliveryNext } from '../core/delivery-next.ts';
import { MendiError, errorInfo } from '../core/errors.ts';
import { executionWorkspace } from '../adapters/test-store.ts';
import { runGroupAttempt } from './group-attempt.ts';
import { inspectAttempt } from '../adapters/group-store.ts';
import type { ExecutionProcessOptions } from '../adapters/test-process.ts';
import type { WriteObserver } from '../adapters/workspace.ts';
import { formalWorkspace, type FullTestInput } from './full-test-admission.ts';
import { state } from './project.ts';
export type { FullTestInput } from './full-test-admission.ts';
export interface FullTestOptions extends ExecutionProcessOptions {
  onGroupProgress?: (event: unknown) => void;
  observeWrite?: WriteObserver;
  methodsRoot?: string;
}
const local = {
  openspec: null,
  executionMode: 'local-only' as const,
  upstreamAccess: 'not-required',
};
export async function runFullTest(input: FullTestInput, options: FullTestOptions = {}) {
  const { root } = inspectProject(input.project);
  try {
    formalWorkspace(root, input, false);
    const bytes = fs.readFileSync(managedPath(root, input.inputFile));
    const raw = JSON.parse(bytes.toString());
    if (raw?.mode !== 'groups-v1')
      throw new MendiError(
        'invalid-group-input',
        '新的正式 Full Test 只接受显式 groups-v1 完整 initial；旧 command 仅供历史读取。',
      );
    return await runGroupAttempt(input, options, bytes);
  } catch (error) {
    const rejected = {
      ...local,
      ok: false,
      operation: 'delivery-full-test-run',
      projectRoot: root,
      local: null,
      outcome: 'not-run',
      error: errorInfo(error),
      committedPaths: [],
    };
    return rejected as typeof rejected & { run?: never };
  }
}
export function fullTestStatus(input: { project: string; runRef: string }) {
  const { root } = inspectProject(input.project);
  const lock = managedPath(root, '.mendi/write.lock');
  if (present(lock))
    throw new MendiError(
      'write-in-progress-or-interrupted',
      '目标存在写入锁，操作可能正在进行或已中断。',
      { lock },
      '核对原写者和现场；不会自动清锁。',
    );
  const id = input.runRef.split('/')[2];
  deliveryLocation(input.runRef, id);
  const workspace = executionWorkspace(root, id).workspace;
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('invalid-run', '需要当前 product Delivery。');
  const run = readDeliveryRun(root, input.runRef, workspace.id);
  if (run.record.attempt) {
    const groupExecution = inspectAttempt(root, workspace, run);
    return {
      ...local,
      ok: groupExecution.stable,
      operation: 'delivery-full-test-status',
      projectRoot: root,
      local: state(workspace),
      run: { ref: run.ref, ...run.record },
      groupExecution,
      next: groupExecution.current
        ? deliveryNext(run.record, run.ref, groupExecution.stable ? undefined : 'unknown')
        : {
            source: 'local-state',
            executable: false,
            currentRunRef: run.ref,
            action: 'historical-read-only',
            role: 'owner',
            status: 'read-only',
            reason: '此 Run 已非当前进展，只展示历史，不授权重跑或 Close。',
          },
    };
  }
  const verification = inspectFullTest(root, workspace, run);
  return {
    ...local,
    ok: verification.stable && verification.outcome !== 'unknown',
    operation: 'delivery-full-test-status',
    projectRoot: root,
    local: state(workspace),
    run: { ref: run.ref, ...run.record },
    verification,
    next: deliveryNext(run.record, run.ref, verification.outcome),
  };
}
