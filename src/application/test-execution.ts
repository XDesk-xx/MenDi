import fs from 'node:fs';
import { managedPath } from '../adapters/paths.ts';
import type { ProjectLock } from '../adapters/workspace.ts';
import { MendiError, errorInfo } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';
import type { TestKind, TestExecution, TestOutcome } from '../core/test-execution.ts';
import { capturePnpm, selectedTest } from '../adapters/test-entries.ts';
import { reserveExecution, saveExecution, readExecution } from '../adapters/test-store.ts';
import { executeForeground, type ExecutionProcessOptions } from '../adapters/test-process.ts';
export interface ExecutionState {
  preserve: boolean;
  executionId: string | null;
  record: TestExecution | null;
  outcome: TestOutcome;
}
export function executionState(): ExecutionState {
  return { preserve: false, executionId: null, record: null, outcome: 'not-run' };
}
// 调用者持有并负责释放 lease；服务只负责实际子执行生命周期。
export async function executeTestUnderLease(
  root: string,
  workspace: Workspace,
  lease: ProjectLock,
  kind: TestKind,
  actorId: string,
  pnpm: string,
  execution: ExecutionState,
  options: ExecutionProcessOptions = {},
  onIntent?: (record: TestExecution) => void,
) {
  if (fs.readFileSync(managedPath(root, '.mendi/write.lock'), 'utf8') !== lease.owner)
    throw new MendiError('write-conflict', '执行服务没有自己的 lease。');
  const script = selectedTest(root, kind);
  let record: TestExecution;
  let executionId: string;
  let outcome: TestOutcome = 'not-run';
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
  execution.preserve = true;
  executionId = reservation.id;
  execution.executionId = executionId;
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
  execution.record = record;
  saveExecution(root, record, 'prepared', options.observe, true);
  options.observe?.('prepared', managedPath(root, `${reservation.ref}/result.json`));
  record = { ...record, executionState: 'running', outcome: 'unknown' };
  outcome = 'unknown';
  execution.record = record;
  execution.outcome = outcome;
  saveExecution(root, record, 'before-intent-commit', options.observe);
  onIntent?.(record);
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
  execution.record = record;
  execution.outcome = outcome;
  saveExecution(root, record, 'before-terminal-commit', options.observe);
  const readback = readExecution(root, executionId, workspace.id);
  if (JSON.stringify(readback) !== JSON.stringify(record))
    throw new MendiError('test-readback-failed', '子执行终态读回不一致。');
  return { record, executionId, outcome };
}
