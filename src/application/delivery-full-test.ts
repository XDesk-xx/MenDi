import fs from 'node:fs';
import path from 'node:path';
import { inspectProject } from '../adapters/project.ts';
import { managedPath, present } from '../adapters/paths.ts';
import {
  acquireProjectLock,
  releaseProjectLock,
  type WriteObserver,
} from '../adapters/workspace.ts';
import {
  createDeliveryRun,
  readDeliveryRun,
  replaceDeliveryDraft,
  type DeliveryDocument,
} from '../adapters/delivery-runs.ts';
import { selectedTest, validatePnpm } from '../adapters/test-entries.ts';
import { loadMethods } from '../adapters/methods.ts';
import { inspectFullTest, same } from '../adapters/delivery-verification.ts';
import { deliveryNext, deliveryLocation } from '../core/delivery-runs.ts';
import { MendiError, errorInfo } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';
import type { ExecutionProcessOptions } from '../adapters/test-process.ts';
import { executionState, executeTestUnderLease } from './test-execution.ts';
import { state } from './project.ts';
import { executionWorkspace } from '../adapters/test-store.ts';
import { runGroupAttempt } from './group-attempt.ts';
import { inspectAttempt } from '../adapters/group-store.ts';

import {
  admission,
  confirmInputs,
  formalWorkspace,
  type FullTestInput,
} from './full-test-admission.ts';
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
  let lease: ReturnType<typeof acquireProjectLock> | undefined;
  const written: string[] = [];
  let run: DeliveryDocument | undefined;
  const execution = executionState();
  let workspace: Workspace | undefined;
  try {
    formalWorkspace(root, input, false);
    const dispatchBytes = fs.readFileSync(managedPath(root, input.inputFile));
    const raw = JSON.parse(dispatchBytes.toString());
    if (raw?.mode !== undefined) {
      if (raw.mode !== 'groups-v1')
        throw new MendiError('invalid-group-input', '不支持的显式 mode。');
      return await runGroupAttempt(input, options, dispatchBytes);
    }
    const before = admission(root, input, false);
    if (!before.inputBytes.equals(dispatchBytes))
      throw new MendiError('delivery-input-changed', '分流期间正式输入变化。');
    const methods = loadMethods('delivery-full-test', [], options.methodsRoot);
    lease = acquireProjectLock(root, 'delivery-full-test');
    options.observeWrite?.('lock-acquired', lease.lock);
    const admitted = admission(root, input, true);
    if (
      !same(before.fullTest, admitted.fullTest) ||
      !before.inputBytes.equals(admitted.inputBytes) ||
      [...before.bytes].some(([ref, bytes]) => !admitted.bytes.get(ref)?.equals(bytes))
    )
      throw new MendiError('delivery-input-changed', '持锁复核输入变化，未分配 Run。');
    const created = createDeliveryRun(
      root,
      admitted.workspace,
      {
        formatVersion: 1,
        recordingMode: 'product',
        scope: 'delivery',
        deliveryId: admitted.workspace.id,
        changeId: null,
        actionType: 'delivery-full-test',
        role: 'author',
        actorId: input.actor,
        status: 'draft',
        stageSkill: 'delivery-full-test',
        toolGuidance: [],
        fullTest: admitted.fullTest,
      },
      written,
      options.observeWrite,
    );
    run = created.run;
    workspace = created.workspace;
    let precheckError: unknown;
    let preparingTool = true;
    try {
      const pnpm = validatePnpm(root, input.pnpmBin, selectedTest(root, 'full').packageManager);
      preparingTool = false;
      // 实际子命令使用校验后的既有真实入口。
      run = replaceDeliveryDraft(
        root,
        run,
        {
          ...run.header,
          fullTest: {
            ...run.record.fullTest!,
            entry: { ...run.record.fullTest!.entry, pnpmBin: pnpm },
          },
        },
        run.body,
        written,
        options.observeWrite,
      );
      admitted.fullTest.entry.pnpmBin = pnpm;
      confirmInputs(root, input, admitted, run);
      await executeTestUnderLease(
        root,
        workspace,
        lease,
        'full',
        input.actor,
        pnpm,
        execution,
        options,
        (child) => {
          confirmInputs(root, input, admitted, run!);
          run = replaceDeliveryDraft(
            root,
            run!,
            {
              ...run!.header,
              fullTest: {
                ...run!.record.fullTest!,
                phase: 'running',
                executionId: child.executionId,
                outcome: 'unknown',
              },
            },
            run!.body,
            written,
            options.observeWrite,
          );
        },
      );
    } catch (error) {
      if (
        execution.preserve ||
        (!preparingTool &&
          !(
            error instanceof MendiError &&
            ['test-dependencies-unavailable', 'test-cancelled-before-launch'].includes(error.code)
          ))
      )
        throw error;
      precheckError = error;
      const artifacts = path.dirname(managedPath(root, run.ref)) + '/artifacts';
      fs.mkdirSync(artifacts);
      fs.writeFileSync(
        path.join(artifacts, 'precheck.json'),
        JSON.stringify(
          {
            ...errorInfo(error),
            ...(error instanceof MendiError ? { details: error.details } : {}),
          },
          null,
          2,
        ) + '\n',
        { flag: 'wx' },
      );
      written.push(artifacts);
    }
    const outcome = precheckError ? 'not-run' : execution.outcome;
    if (outcome === 'unknown')
      throw new MendiError('test-execution-unknown', '子执行未确认，保留现场与锁。');
    workspace = confirmInputs(root, input, admitted, run);
    const fullTest = {
      ...run.record.fullTest!,
      phase: 'finished',
      outcome,
      executionId: execution.executionId,
      ...(precheckError ? { reason: JSON.stringify(errorInfo(precheckError)) } : {}),
    };
    run = replaceDeliveryDraft(
      root,
      run,
      { ...run.header, fullTest, status: 'submitted', outcome: 'complete', result: outcome },
      run.body,
      written,
      options.observeWrite,
    );
    const facts = inspectFullTest(root, workspace, run, true);
    confirmInputs(root, input, admitted, run);
    if (
      !facts.stable ||
      facts.outcome !== outcome ||
      facts.scopeMatch !== 'match' ||
      facts.commandMatch !== 'match'
    )
      throw new MendiError('delivery-readback-failed', '正式两层结果读回未确认。');
    options.observeWrite?.('before-lock-release', lease.lock);
    releaseProjectLock(root, lease);
    lease = undefined;
    return {
      ...local,
      ok: outcome === 'passed',
      operation: 'delivery-full-test-run',
      projectRoot: root,
      local: state(workspace),
      run: { ref: run.ref, ...run.record },
      verification: facts,
      methods,
      next: deliveryNext(run.record, run.ref, facts.outcome),
    };
  } catch (error) {
    let releaseError: unknown;
    if (lease && !written.length && !execution.preserve) {
      try {
        releaseProjectLock(root, lease);
        lease = undefined;
      } catch (failure) {
        releaseError = errorInfo(failure);
      }
    }
    return {
      ...local,
      ok: false,
      operation: 'delivery-full-test-run',
      projectRoot: root,
      local: workspace ? state(workspace) : null,
      outcome: written.length ? 'unknown' : 'not-run',
      ...(run ? { run: { ref: run.ref, ...run.record } } : {}),
      error: {
        ...errorInfo(error),
        ...(error instanceof MendiError ? { details: error.details } : {}),
        ...(releaseError ? { releaseError } : {}),
      },
      committedPaths: written,
      ...(lease ? { retainedLock: lease.lock } : {}),
    };
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
      next: deliveryNext(run.record, run.ref, groupExecution.stable ? undefined : 'unknown'),
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
