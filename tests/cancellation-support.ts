import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { stopCurrentChild, type ExecutionProcessOptions } from '../src/adapters/test-process.ts';
import { probeProcess } from '../src/application/diagnosis.ts';
import { repository } from './helpers.ts';
import { waitFor } from './test-support.ts';

// 测试显式处置自己刚创建的隔离进程，不改结果 / Run / 锁，产品没有这项恢复操作。
function stopFixtureTree(root: string, child: ChildProcess | undefined, began: number) {
  assert.ok(
    fs.realpathSync(root).startsWith(fs.realpathSync(path.join(repository, '.tmp')) + path.sep),
  );
  if (child?.pid && child.exitCode === null && child.signalCode === null) stopCurrentChild(child);
  const witnessed: number[] = [];
  for (const name of ['started.json', 'descendant.json']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.ok(Number.isSafeInteger(data.pid) && data.pid > 0);
    if (name === 'started.json') assert.equal(data.cwd, root);
    witnessed.push(data.pid);
    if (probeProcess(data.pid) === 'not-found') continue;
    const observation = spawnSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '$p = Get-CimInstance Win32_Process -Filter "ProcessId = $env:MENDI_CANCEL_PID"; if ($p) { @{pid=$p.ProcessId; command=$p.CommandLine; created=$p.CreationDate.ToUniversalTime().ToString("o")} | ConvertTo-Json -Compress }',
      ],
      {
        env: { ...process.env, MENDI_CANCEL_PID: String(data.pid) },
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000,
      },
    );
    assert.equal(observation.status, 0, observation.stderr);
    if (!observation.stdout.trim()) continue;
    const processFact = JSON.parse(observation.stdout);
    assert.equal(processFact.pid, data.pid);
    assert.ok(Date.parse(processFact.created) >= began);
    assert.ok(Date.parse(processFact.created) <= fs.statSync(file).mtimeMs);
    assert.match(processFact.command, /foreground\.ts["']?\s+(wait|descendant)(?:\s|$)/);
    if (name === 'descendant.json')
      assert.ok(processFact.command.toLowerCase().includes(root.toLowerCase()));
    const stopped = spawnSync(
      path.join(process.env.SystemRoot ?? 'C:/Windows', 'System32/taskkill.exe'),
      ['/PID', String(data.pid), '/T', '/F'],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000,
      },
    );
    assert.equal(stopped.status, 0, stopped.stderr);
  }
  return witnessed;
}

export async function immediateCancellation<T>(
  root: string,
  run: (options: ExecutionProcessOptions) => Promise<T>,
  stop?: typeof stopCurrentChild,
) {
  const began = Date.now();
  const control = new AbortController();
  let child: ChildProcess | undefined;
  let launchedAt = 0;
  let watchdogUsed = false;
  // 旧实现无界时由测试自己的 watchdog 收场；不能将其解释为产品取消成功。
  const watchdog = setTimeout(() => {
    watchdogUsed = true;
    stopFixtureTree(root, child, began);
  }, 20000);
  try {
    const result = await run({
      signal: control.signal,
      ...(stop ? { stop } : {}),
      spawnExecution: (command, args, options) => (child = spawn(command, args, options)),
      observe: (phase) => {
        if (phase === 'after-launch') {
          launchedAt = Date.now();
          control.abort();
        }
      },
    });
    assert.equal(watchdogUsed, false, '本次结果依赖测试 watchdog，不能认证产品取消有界。');
    assert.ok(launchedAt > 0);
    assert.ok(Date.now() - launchedAt < 15000, '取消未在停止 / close 确认期限内返回。');
    const files: Record<string, string> = {};
    for (const relative of ['.mendi/write.lock', 'started.json', 'descendant.json'])
      if (fs.existsSync(path.join(root, relative)))
        files[relative] = fs.readFileSync(path.join(root, relative), 'utf8');
    const current = JSON.parse(
      fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'), 'utf8'),
    );
    // 正式 unknown 的应用返回不含子结果；仅为这种现场保存必要直接记录和原始日志。
    if (files['.mendi/write.lock'] && current.deliveryRunRef)
      for (const name of ['result.json', 'stdout.log', 'stderr.log']) {
        const relative = `.mendi/delivery-groups/d01/tests/001-full/${name}`;
        files[relative] = fs.readFileSync(path.join(root, relative), 'utf8');
      }
    const evidence = process.env.MENDI_TEST_EVIDENCE_DIR;
    if (evidence)
      fs.appendFileSync(
        path.join(evidence, `cancel-scenes-${process.pid}.jsonl`),
        JSON.stringify({
          root,
          elapsedAfterLaunch: Date.now() - launchedAt,
          watchdogUsed,
          files,
        }) + '\n',
      );
    return result;
  } finally {
    clearTimeout(watchdog);
    control.abort();
    const preserve = new Map<string, Buffer>();
    for (const ref of [
      '.mendi/write.lock',
      '.mendi/delivery-groups/d01/tests/001-full/result.json',
    ]) {
      const file = path.join(root, ref);
      if (fs.existsSync(file)) preserve.set(file, fs.readFileSync(file));
    }
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'), 'utf8'),
    );
    if (manifest.deliveryRunRef) {
      const file = path.join(root, manifest.deliveryRunRef);
      preserve.set(file, fs.readFileSync(file));
    }
    const pids = stopFixtureTree(root, child, began);
    await waitFor(() => pids.every((pid) => probeProcess(pid) === 'not-found'));
    for (const [file, bytes] of preserve) assert.deepEqual(fs.readFileSync(file), bytes);
  }
}
