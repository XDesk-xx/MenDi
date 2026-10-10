import fs from 'node:fs';
import { inspectProject } from '../adapters/project.ts';
import { managedPath } from '../adapters/paths.ts';
import { readWorkspace, acquireProjectLock, releaseProjectLock } from '../adapters/workspace.ts';
import { currentBinding } from '../core/associations.ts';
import { MendiError, errorInfo, text } from '../core/errors.ts';
import { testKind, type TestExecution, type TestOutcome } from '../core/test-execution.ts';
import {
  readTestEntries,
  selectedTest,
  validatePnpm,
  capturePnpm,
} from '../adapters/test-entries.ts';
import { reserveExecution, saveExecution, observeExecution } from '../adapters/test-store.ts';
import { executeForeground, type ExecutionProcessOptions } from '../adapters/test-process.ts';

const local = {
  openspec: null,
  local: null,
  executionMode: 'local-only',
  upstreamAccess: 'not-required',
} as const;
export function listTests(input: { project: string }) {
  const { root } = inspectProject(input.project);
  return {
    ...local,
    ok: true,
    operation: 'test-list',
    projectRoot: root,
    entries: readTestEntries(root).entries,
  };
}
function runnable(root: string, ownLock = false) {
  const workspace = readWorkspace(root, ownLock);
  if (
    !workspace ||
    workspace.mode !== 'product' ||
    workspace.state !== 'open' ||
    currentBinding(workspace)?.state === 'archiving'
  )
    throw new MendiError(
      'test-workspace-unavailable',
      '测试要求无归档过渡的 open product Delivery，未运行。',
    );
  return workspace;
}
export async function runTest(
  input: { project: string; kind: string; actor: string; pnpmBin: string },
  options: ExecutionProcessOptions = {},
) {
  const { root } = inspectProject(input.project);
  let outcome: TestOutcome = 'not-run';
  let record: TestExecution | null = null;
  let lease: ReturnType<typeof acquireProjectLock> | undefined;
  let preserve = false;
  let executionId: string | null = null;
  try {
    const kind = testKind(input.kind);
    const actorId = text(input.actor, 'actor');
    runnable(root);
    const chosen = selectedTest(root, kind);
    const pnpm = validatePnpm(root, input.pnpmBin, chosen.packageManager);
    lease = acquireProjectLock(root, 'test-run');
    const workspace = runnable(root, true);
    const script = selectedTest(root, kind);
    if (pnpm !== validatePnpm(root, input.pnpmBin, script.packageManager))
      throw new MendiError('test-tool-changed', '锁内工具入口变化，未运行。');
    const dependencyCheck = capturePnpm(root, pnpm, ['run'], 'error');
    if (dependencyCheck.exitCode !== 0 || dependencyCheck.signal || dependencyCheck.error)
      throw new MendiError(
        'test-dependencies-unavailable',
        '依赖预检拒绝，选定脚本未运行。',
        dependencyCheck,
      );
    if (options.signal?.aborted)
      throw new MendiError('test-cancelled-before-launch', '调用者已取消，未运行。');
    const reservation = reserveExecution(root, workspace.id, kind);
    preserve = true;
    executionId = reservation.id;
    record = {
      formatVersion: 1,
      executionId,
      kind,
      projectRoot: root,
      cwd: root,
      deliveryId: workspace.id,
      changeId: workspace.activeChangeId,
      actorId,
      scope: 'command',
      formalDeliveryTest: false,
      command: {
        executable: process.execPath,
        args: [pnpm, 'run', script.scriptName],
        dependencyPolicy: 'warn',
      },
      dependencyCheck: {
        executable: dependencyCheck.executable,
        args: dependencyCheck.args,
        dependencyPolicy: 'error',
        exitCode: 0,
      },
      scriptName: script.scriptName,
      scriptText: script.scriptText,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      executionState: 'prepared',
      outcome: 'not-run',
      exitCode: null,
      signal: null,
      pid: null,
      stdoutRef: `${reservation.ref}/stdout.log`,
      stderrRef: `${reservation.ref}/stderr.log`,
    };
    for (const ref of [record.stdoutRef, record.stderrRef])
      fs.writeFileSync(managedPath(root, ref), '', { flag: 'wx' });
    saveExecution(root, record, 'prepared', options.observe, true);
    options.observe?.('prepared', managedPath(root, `${reservation.ref}/result.json`));
    record = { ...record, executionState: 'running', outcome: 'unknown' };
    outcome = 'unknown';
    saveExecution(root, record, 'before-intent-commit', options.observe);
    const result = await executeForeground(
      root,
      record,
      (pid) => {
        record = { ...record!, pid };
        saveExecution(root, record, 'before-pid-commit', options.observe);
      },
      options,
    );
    outcome =
      result.launchError && result.pid === null && !result.failure
        ? 'not-run'
        : result.failure || !result.closed || (result.stop && !result.stop.confirmed)
          ? 'unknown'
          : result.stop?.confirmed
            ? 'interrupted'
            : result.signal || result.exitCode === null
              ? 'unknown'
              : result.exitCode === 0
                ? 'passed'
                : 'failed';
    record = {
      ...record,
      pid: result.pid,
      executionState: 'finished',
      finishedAt: new Date().toISOString(),
      outcome,
      exitCode: outcome === 'not-run' ? null : result.exitCode,
      signal: outcome === 'not-run' ? null : result.signal,
      ...(result.stop ? { stop: result.stop } : {}),
      ...(result.failure || result.launchError || outcome === 'unknown'
        ? {
            reason: JSON.stringify(
              result.failure
                ? errorInfo(result.failure)
                : result.launchError
                  ? { ...errorInfo(result.launchError), launchCloseCode: result.exitCode }
                  : '执行 / 停止未确认。',
            ),
          }
        : {}),
    };
    saveExecution(root, record, 'before-terminal-commit', options.observe);
    if (outcome === 'unknown')
      throw new MendiError('test-execution-unknown', '执行无法确认，保留现场与锁。');
    options.observe?.('before-test-lock-release', lease.lock);
    releaseProjectLock(root, lease);
    lease = undefined;
    preserve = false;
    return {
      ...local,
      ok: outcome === 'passed',
      operation: 'test-run',
      projectRoot: root,
      executionId,
      outcome,
      record,
    };
  } catch (error) {
    let failure: { message: string; code?: string; details?: unknown; releaseError?: unknown } = {
      ...errorInfo(error),
      ...(error instanceof MendiError ? { details: error.details } : {}),
    };
    if (lease && !preserve) {
      try {
        options.observe?.('before-test-lock-release', lease.lock);
        releaseProjectLock(root, lease);
        lease = undefined;
      } catch (releaseError) {
        failure = { ...failure, releaseError: errorInfo(releaseError) };
        outcome = 'unknown';
      }
    } else if (preserve) outcome = 'unknown';
    return {
      ...local,
      ok: false,
      operation: 'test-run',
      projectRoot: root,
      executionId,
      outcome,
      observed: record,
      error: failure,
      ...(lease ? { retainedLock: lease.lock } : {}),
    };
  }
}
export function testStatus(
  input: { project: string; execution: string },
  options: { observeRead?: () => void } = {},
) {
  const { root } = inspectProject(input.project);
  try {
    const observation = observeExecution(root, input.execution, options.observeRead);
    return {
      ...local,
      ok: observation.stable,
      operation: 'test-status',
      projectRoot: root,
      executionId: input.execution,
      outcome: observation.stable ? observation.record.outcome : 'unknown',
      ...observation,
    };
  } catch (error) {
    return {
      ...local,
      ok: false,
      operation: 'test-status',
      projectRoot: root,
      executionId: input.execution,
      outcome: 'unknown',
      error: errorInfo(error),
    };
  }
}
