import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { repository } from '../helpers.ts';
import { uiCommand, uiEnv, pnpmEntry } from '../../scripts/test-ui.ts';
import { stopCurrentChild } from '../../src/adapters/test-process.ts';

export function uiTarget(name: string) {
  const prepared = process.env.MENDI_UI_TARGETS_DIR;
  assert.ok(prepared && path.isAbsolute(prepared), '需要显式准备的绝对 UI 沙箱目录。');
  const target = path.join(prepared, name);
  assert.ok(
    fs.existsSync(path.join(target, 'node_modules/.modules.yaml')),
    '场景依赖未准备，不自动安装。',
  );
  assert.equal(fs.existsSync(path.join(target, '.mendi')), false, '需新目标，不能复用旧结果。');
  const evidence = process.env.MENDI_UI_EVIDENCE_DIR;
  assert.ok(evidence, 'UI 场景须由显式 test:ui 指定输出位置。');
  const output = path.join(evidence, name);
  fs.mkdirSync(output, { recursive: true });
  return { target, output };
}

export function checked(target: string, output: string, args: string[], exit = 0) {
  const result = uiCommand(target, args, output);
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return result;
}

export function tool(target: string, output: string, args: string[], exit = 0) {
  return checked(
    target,
    output,
    [path.join(target, 'node_modules/storybook/dist/bin/dispatcher.js'), ...args],
    exit,
  );
}

export function product(target: string, output: string, args: string[], exit = 0) {
  const result = checked(
    target,
    output,
    [path.join(repository, 'dist/drivers/cli.js'), ...args, '--project', target, '--json'],
    exit,
  );
  return JSON.parse(result.stdout);
}

export function launchPreview(target: string, output: string) {
  const child = spawn(process.execPath, [pnpmEntry, 'run', 'preview:components'], {
    cwd: target,
    env: uiEnv,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdout = path.join(output, 'preview.stdout.log');
  const stderr = path.join(output, 'preview.stderr.log');
  fs.writeFileSync(stdout, '');
  fs.writeFileSync(stderr, '');
  child.stdout.on('data', (chunk: Buffer) => fs.appendFileSync(stdout, chunk));
  child.stderr.on('data', (chunk: Buffer) => fs.appendFileSync(stderr, chunk));
  let error: Error | undefined;
  child.on('error', (failure) => {
    error = failure;
  });
  const closed = new Promise<void>((resolve) => child.on('close', () => resolve()));
  const service = { target, child, closed, stdout, stderr, error: () => error };
  fs.writeFileSync(
    path.join(output, 'preview-start.json'),
    JSON.stringify(
      {
        target,
        cwd: target,
        script: 'preview:components',
        config: '.storybook/main.ts',
        pid: child.pid,
        address: 'http://127.0.0.1:6113',
        stdout,
        stderr,
      },
      null,
      2,
    ),
  );
  return service;
}
export type Preview = ReturnType<typeof launchPreview>;

export function useKnownPreview(target: string, service?: Preview) {
  assert.ok(service && service.target === target, '未知服务或另一目标，不能复用或停止。');
  assert.ok(
    service.child.pid && service.child.exitCode === null && service.child.signalCode === null,
    '不持有活跃 child，不能依据历史 PID 处置。',
  );
  assert.equal(service.error(), undefined);
  return service;
}

export async function ready(service: Preview) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    useKnownPreview(service.target, service);
    try {
      const response = await fetch('http://127.0.0.1:6113/index.json', {
        signal: AbortSignal.timeout(2000),
      });
      const index = (await response.json()) as { entries: Record<string, { type: string }> };
      assert.equal(index.entries['proof-counter--basic']?.type, 'story');
      assert.equal(index.entries['proof-counter--disabled']?.type, 'story');
      return index;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error('本次预览未就绪：' + fs.readFileSync(service.stderr, 'utf8'));
}

export async function stopPreview(service: Preview, output: string) {
  useKnownPreview(service.target, service);
  const result = stopCurrentChild(service.child);
  assert.equal(result.confirmed, true, result.stderr);
  await service.closed;
  await assert.rejects(() => fetch('http://127.0.0.1:6113/index.json'));
  fs.writeFileSync(
    path.join(output, 'preview-stop.json'),
    JSON.stringify(
      {
        ...result,
        childExitCode: service.child.exitCode,
        childSignal: service.child.signalCode,
        childAndPipesClosed: true,
        listenerUnavailable: true,
      },
      null,
      2,
    ),
  );
}

export function browser(target: string, output: string, label: string, previewUrl?: string) {
  return checked(target, output, [
    path.join(target, 'browser-proof.ts'),
    path.join(output, 'browser'),
    label,
    ...(previewUrl ? [previewUrl] : []),
  ]);
}
