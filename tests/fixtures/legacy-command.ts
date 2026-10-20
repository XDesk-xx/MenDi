// 冻结的 D04 command 历史夹具生成器：仅隔离测试 / 旧 proof 使用，产品新写入口不调用。
import fs from 'node:fs';
import path from 'node:path';
import { inspectProject } from '../../src/adapters/project.ts';
import { managedPath } from '../../src/adapters/paths.ts';
import {
  acquireProjectLock,
  releaseProjectLock,
  type WriteObserver,
} from '../../src/adapters/workspace.ts';
import {
  createDeliveryRun,
  replaceDeliveryDraft,
  type DeliveryDocument,
} from '../../src/adapters/delivery-runs.ts';
import { selectedTest, validatePnpm } from '../../src/adapters/test-entries.ts';
import { loadMethods } from '../../src/adapters/methods.ts';
import { inspectFullTest, same } from '../../src/adapters/delivery-verification.ts';
import { deliveryNext } from '../../src/core/delivery-next.ts';
import { MendiError, errorInfo } from '../../src/core/errors.ts';
import type { Workspace } from '../../src/core/records.ts';
import type { ExecutionProcessOptions } from '../../src/adapters/test-process.ts';
import { executionState, executeTestUnderLease } from '../../src/application/test-execution.ts';
import { state } from '../../src/application/project.ts';
import { runGroupAttempt } from '../../src/application/group-attempt.ts';

import {
  admission,
  confirmInputs,
  formalWorkspace,
  type FullTestInput,
} from './legacy-admission.ts';
export type { FullTestInput } from './legacy-admission.ts';

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
export async function writeLegacyCommand(input: FullTestInput, options: FullTestOptions = {}) {
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
