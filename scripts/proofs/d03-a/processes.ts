import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';

export const pnpmEntry = 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
export const proofEnv = {
  ...process.env,
  COREPACK_ENABLE_NETWORK: '0',
  COREPACK_ENABLE_AUTO_PIN: '0',
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
  STORYBOOK_DISABLE_TELEMETRY: '1',
};

export function launch(output: string, name: string, cwd: string, args: string[]) {
  const stdoutRef = path.join(output, name + '.stdout.log');
  const stderrRef = path.join(output, name + '.stderr.log');
  fs.writeFileSync(stdoutRef, '', { flag: 'wx' });
  fs.writeFileSync(stderrRef, '', { flag: 'wx' });
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, args, {
    cwd,
    env: proofEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let launchError: string | null = null;
  let finished = false;
  child.once('error', (error) => {
    launchError = error.message;
  });
  child.stdout.on('data', (data: Buffer) => fs.appendFileSync(stdoutRef, data));
  child.stderr.on('data', (data: Buffer) => fs.appendFileSync(stderrRef, data));
  const close = new Promise<{
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    launchError: string | null;
  }>((resolve) => {
    child.once('close', (exitCode, signal) => {
      finished = true;
      const result = { exitCode, signal, launchError };
      fs.appendFileSync(
        path.join(output, 'commands.jsonl'),
        JSON.stringify({
          name,
          executable: process.execPath,
          args,
          cwd,
          pid: child.pid ?? null,
          startedAt,
          finishedAt: new Date().toISOString(),
          childAndPipesClosed: true,
          stdoutRef,
          stderrRef,
          ...result,
        }) + '\n',
      );
      resolve(result);
    });
  });
  return { child, close, finished: () => finished, stdoutRef, stderrRef };
}

export async function run(output: string, name: string, cwd: string, args: string[], exit = 0) {
  const process = launch(output, name, cwd, args);
  const result = await process.close;
  assert.equal(result.launchError, null);
  assert.equal(result.signal, null);
  assert.equal(result.exitCode, exit, fs.readFileSync(process.stderrRef, 'utf8'));
  return {
    result,
    stdout: fs.readFileSync(process.stdoutRef, 'utf8'),
    stderr: fs.readFileSync(process.stderrRef, 'utf8'),
  };
}

export async function assertStories(url: string) {
  const response = await fetch(url + '/index.json', { signal: AbortSignal.timeout(3000) });
  assert.equal(response.status, 200);
  const index = (await response.json()) as { entries: Record<string, { type: string }> };
  assert.equal(index.entries['proof-counter--basic']?.type, 'story');
  assert.equal(index.entries['proof-counter--disabled']?.type, 'story');
  return index;
}

export async function waitReady(service: ReturnType<typeof launch>) {
  const start = Date.now();
  while (Date.now() - start < 60000) {
    assert.ok(!service.finished(), fs.readFileSync(service.stderrRef, 'utf8'));
    try {
      return await assertStories('http://127.0.0.1:6113');
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error('本次受控 Storybook 启动未在实验等待时间内确认。');
}

export async function stopOwned(output: string, service: ReturnType<typeof launch>) {
  assert.ok(service.child.pid && !service.finished());
  const args = ['/PID', String(service.child.pid), '/T', '/F'];
  const stopped = spawnSync('taskkill', args, { encoding: 'utf8', windowsHide: true });
  fs.writeFileSync(
    path.join(output, 'stop-owned.json'),
    JSON.stringify({
      args,
      exitCode: stopped.status,
      stdout: stopped.stdout,
      stderr: stopped.stderr,
    }),
  );
  assert.equal(stopped.status, 0, stopped.stderr);
  const result = await service.close;
  await assert.rejects(() => fetch('http://127.0.0.1:6113/index.json'));
  return { ...result, childAndPipesClosed: true, listenerUnavailable: true };
}
