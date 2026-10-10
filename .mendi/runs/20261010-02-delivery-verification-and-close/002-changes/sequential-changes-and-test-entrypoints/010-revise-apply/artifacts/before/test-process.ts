import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync, type ChildProcess, type SpawnOptions } from 'node:child_process';
import { managedPath } from './paths.ts';
import { testEnvironment } from './test-entries.ts';
import type { TestObserver } from './test-store.ts';
import type { TestExecution } from '../core/test-execution.ts';
import { errorInfo } from '../core/errors.ts';

export function stopCurrentChild(child: ChildProcess) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null)
    return { confirmed: false, exitCode: null, stdout: '', stderr: '当前 child 不再可确认持有。' };
  const result = spawnSync(
    path.join(process.env.SystemRoot ?? 'C:/Windows', 'System32/taskkill.exe'),
    ['/PID', String(child.pid), '/T', '/F'],
    { encoding: 'utf8', windowsHide: true, shell: false },
  );
  return {
    confirmed: result.status === 0 && !result.error,
    exitCode: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}
export interface ExecutionProcessOptions {
  signal?: AbortSignal;
  spawnExecution?: (command: string, args: string[], options: SpawnOptions) => ChildProcess;
  stop?: typeof stopCurrentChild;
  observe?: TestObserver;
}
export async function executeForeground(
  root: string,
  record: TestExecution,
  onPid: (pid: number) => void,
  options: ExecutionProcessOptions = {},
) {
  const descriptors: number[] = [];
  try {
    for (const ref of [record.stdoutRef, record.stderrRef])
      descriptors.push(fs.openSync(managedPath(root, ref), 'a'));
  } catch (error) {
    for (const fd of descriptors) fs.closeSync(fd);
    throw error;
  }
  let failure: unknown;
  let pid: number | null = null;
  let stop: ReturnType<typeof stopCurrentChild> | undefined;
  let launchError: unknown;
  let closed = false;
  let exitCode: number | null = null;
  let signal: NodeJS.Signals | null = null;
  try {
    if (options.signal?.aborted)
      return { pid, closed, exitCode, signal, launchError: '调用者在启动前取消。', stop, failure };
    await new Promise<void>((resolve) => {
      let child: ChildProcess;
      try {
        child = (options.spawnExecution ?? spawn)(record.command.executable, record.command.args, {
          cwd: root,
          env: testEnvironment('warn'),
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
          windowsHide: true,
        });
      } catch (error) {
        launchError = error;
        resolve();
        return;
      }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        process.off('SIGINT', cancel);
        options.signal?.removeEventListener('abort', cancel);
        resolve();
      };
      const cancel = () => {
        if (settled || stop) return;
        try {
          stop = (options.stop ?? stopCurrentChild)(child);
        } catch (error) {
          stop = {
            confirmed: false,
            exitCode: null,
            stdout: '',
            stderr: JSON.stringify(errorInfo(error)),
          };
        }
        if (!stop.confirmed) {
          // 不确定停止时只保存已经收到的日志；不等待未知进程或认证旧 pid。
          child.stdout?.destroy();
          child.stderr?.destroy();
          child.unref();
          finish();
        }
      };
      child.once('spawn', () => {
        pid = child.pid ?? null;
        try {
          if (pid) onPid(pid);
          options.observe?.('after-launch', root);
        } catch (error) {
          failure = error;
          cancel();
        }
      });
      for (const [index, stream] of [child.stdout, child.stderr].entries()) {
        stream?.on('data', (chunk: Buffer) => {
          if (settled) return;
          try {
            options.observe?.(
              'before-log-write',
              managedPath(root, index === 0 ? record.stdoutRef : record.stderrRef),
            );
            fs.writeSync(descriptors[index], chunk);
          } catch (error) {
            failure = error;
            cancel();
          }
        });
        stream?.on('error', (error) => {
          failure = error;
          cancel();
        });
      }
      child.once('error', (error) => {
        launchError = error;
      });
      child.once('close', (code, sig) => {
        closed = true;
        exitCode = code;
        signal = sig;
        finish();
      });
      process.on('SIGINT', cancel);
      options.signal?.addEventListener('abort', cancel, { once: true });
      if (options.signal?.aborted) cancel();
    });
  } finally {
    for (const fd of descriptors)
      try {
        fs.closeSync(fd);
      } catch (error) {
        failure = error;
      }
  }
  return { pid, closed, exitCode, signal, launchError, stop, failure };
}
