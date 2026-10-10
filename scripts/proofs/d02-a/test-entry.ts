import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';

export const pnpmEntry = 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
type Kind = 'focused' | 'fast' | 'full';

export async function executeFixtureTest(root: string, kind: Kind, log: string, interrupt = false) {
  const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;
  assert.equal(typeof scripts[`test:${kind}`], 'string');
  const args = [pnpmEntry, 'run', `test:${kind}`];
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: { ...process.env, COREPACK_ENABLE_NETWORK: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let stdout = '',
    stderr = '',
    interrupted = false;
  const stops: { args: string[]; status: number | null; stdout: string; stderr: string }[] = [];
  function stopOwnedFixture() {
    assert.ok(child.pid);
    // Only the live child created above and its controlled fixture descendants are stopped.
    const stopArgs = ['/PID', String(child.pid), '/T', '/F'];
    const stopped = spawnSync('taskkill', stopArgs, { encoding: 'utf8', windowsHide: true });
    stops.push({
      args: stopArgs,
      status: stopped.status,
      stdout: stopped.stdout,
      stderr: stopped.stderr,
    });
    assert.equal(stopped.status, 0, stopped.stderr);
    interrupted = true;
  }
  child.stdout.on('data', (data: Buffer) => {
    stdout += data.toString();
    if (interrupt && !interrupted && stdout.includes('TEST_READY')) stopOwnedFixture();
  });
  child.stderr.on('data', (data: Buffer) => {
    stderr += data.toString();
  });
  const watchdog = setTimeout(() => {
    if (!interrupted) stopOwnedFixture();
  }, 20_000);
  try {
    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
      (resolve, reject) => {
        child.on('error', reject);
        child.on('close', (code, signal) => resolve({ code, signal }));
      },
    );
    const outcome = interrupted ? 'interrupted' : exit.code === 0 ? 'passed' : 'failed';
    fs.appendFileSync(
      log,
      JSON.stringify({
        executable: process.execPath,
        args,
        cwd: root,
        stdout,
        stderr,
        ...exit,
        outcome,
        stops,
      }) + '\n',
    );
    return {
      kind,
      outcome,
      exitCode: exit.code,
      signal: exit.signal,
      interrupted,
      stopConfirmed: stops.every((s) => s.status === 0),
    };
  } finally {
    clearTimeout(watchdog);
  }
}
