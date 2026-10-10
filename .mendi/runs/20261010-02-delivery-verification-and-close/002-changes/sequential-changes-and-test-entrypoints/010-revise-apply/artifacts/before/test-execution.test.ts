import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  execute,
  testTarget,
  writePackage,
  waitFor,
  statusCli,
  pnpmEntry,
  testInput,
} from './test-support.ts';
import { testStatus, runTest } from '../src/application/tests.ts';
import { cli, command, isolatedEnv, snapshot } from './helpers.ts';
import { saveExecution } from '../src/adapters/test-store.ts';
import { acquireProjectLock } from '../src/adapters/workspace.ts';
import { stopCurrentChild } from '../src/adapters/test-process.ts';
import { probeProcess } from '../src/application/diagnosis.ts';
import { query } from '../src/application/project.ts';

test('真实 focused / fast / full 结果、原始日志、新进程读回与不改协作记录', async () => {
  const root = testTarget();
  const project = fs.readFileSync(path.join(root, '.mendi/project.json'));
  const manifest = fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'));
  const prior: { file: string; bytes: Buffer }[] = [];
  for (const [kind, outcome] of [
    ['focused', 'passed'],
    ['fast', 'failed'],
    ['full', 'passed'],
  ] as const) {
    const result = await execute(root, kind);
    assert.equal(result.outcome, outcome, JSON.stringify(result));
    if (!('record' in result)) throw new Error(JSON.stringify(result));
    assert.equal(result.record.changeId, null);
    assert.equal(result.record.formalDeliveryTest, false);
    assert.equal(result.record.command.dependencyPolicy, 'warn');
    assert.equal(result.record.dependencyCheck.dependencyPolicy, 'error');
    const stdout = path.join(root, result.record.stdoutRef);
    const stderr = path.join(root, result.record.stderrRef);
    assert.match(fs.readFileSync(stdout, 'utf8'), /foreground:/);
    assert.match(fs.readFileSync(stderr, 'utf8'), /actual stderr/);
    if (kind === 'fast')
      assert.match(fs.readFileSync(stderr, 'utf8'), /ERR_PNPM_VERIFY_DEPS_BEFORE_RUN/);
    assert.equal(statusCli(root, result.executionId!).outcome, outcome);
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
    for (const p of prior) assert.deepEqual(fs.readFileSync(p.file), p.bytes);
    for (const file of [stdout, stderr, path.join(path.dirname(stdout), 'result.json')])
      prior.push({ file, bytes: fs.readFileSync(file) });
    assert.throws(() => saveExecution(root, result.record, 'before-terminal-commit'), /终态/);
  }
  assert.deepEqual(fs.readFileSync(path.join(root, '.mendi/project.json')), project);
  assert.deepEqual(
    fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json')),
    manifest,
  );
  assert.equal(fs.existsSync(path.join(root, '.mendi/runs')), false);
});
test('跨 await 持有同一锁，当前取消实际终止 pnpm / 前台脚本 / 后代，interrupted 正常释放', async () => {
  const root = testTarget();
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts wait';
  });
  const control = new AbortController();
  const pending = execute(root, 'full', { signal: control.signal });
  try {
    await waitFor(() => fs.existsSync(path.join(root, 'descendant.json')));
    const started = JSON.parse(fs.readFileSync(path.join(root, 'started.json'), 'utf8'));
    const descendant = JSON.parse(fs.readFileSync(path.join(root, 'descendant.json'), 'utf8'));
    const owner = fs.readFileSync(path.join(root, '.mendi/write.lock'));
    assert.throws(() => acquireProjectLock(root, 'second-writer'), /锁/);
    assert.deepEqual(fs.readFileSync(path.join(root, '.mendi/write.lock')), owner);
    assert.throws(() => query({ project: root }), /锁/);
    const during = testStatus({ project: root, execution: '001-full' });
    assert.equal(during.ok, false);
    assert.equal(during.outcome, 'unknown');
    control.abort();
    const result = await pending;
    assert.equal(result.outcome, 'interrupted', JSON.stringify(result));
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
    await waitFor(
      () =>
        probeProcess(started.pid) === 'not-found' && probeProcess(descendant.pid) === 'not-found',
    );
    assert.equal(statusCli(root, '001-full').outcome, 'interrupted');
  } finally {
    control.abort();
    await pending;
  }
});
test('启动明确失败保存 not-run；意图、日志、终态、读回和释放故障都 unknown 并保留现场', async () => {
  const failed = testTarget();
  const result = await execute(failed, 'focused', {
    spawnExecution: (_exe, args, options) => spawn(path.join(failed, 'absent.exe'), args, options),
  });
  assert.equal(result.outcome, 'not-run', JSON.stringify(result));
  assert.equal(fs.existsSync(path.join(failed, '.mendi/write.lock')), false);
  assert.equal(statusCli(failed, '001-focused').outcome, 'not-run');
  for (const phase of [
    'before-intent-commit',
    'before-log-write',
    'before-terminal-commit',
    'before-test-readback',
    'before-test-lock-release',
  ] as const) {
    const root = testTarget();
    const r = await execute(root, 'focused', {
      observe: (current, file) => {
        if (current !== phase) return;
        if (
          phase === 'before-test-readback' &&
          JSON.parse(fs.readFileSync(file, 'utf8')).executionState !== 'finished'
        )
          return;
        throw new Error('controlled:' + phase);
      },
    });
    assert.equal(r.outcome, 'unknown', phase + JSON.stringify(r));
    assert.equal(r.ok, false);
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), true);
    assert.equal(statusCli(root, '001-focused', 1).outcome, 'unknown');
    if (phase === 'before-intent-commit')
      assert.equal(fs.existsSync(path.join(root, 'started.json')), false);
  }
});
test('不能确认停止与真实异常信号保留 unknown，不重跑或根据 pid 猜终态', async () => {
  const root = testTarget();
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts wait';
  });
  const control = new AbortController();
  let owned: ReturnType<typeof spawn> | undefined;
  const pending = execute(root, 'full', {
    signal: control.signal,
    spawnExecution: (exe, args, options) => {
      owned = spawn(exe, args, options);
      return owned;
    },
    stop: () => ({ confirmed: false, exitCode: 1, stdout: '', stderr: 'controlled stop failure' }),
  });
  try {
    await waitFor(() => fs.existsSync(path.join(root, 'descendant.json')));
    control.abort();
    const r = await pending;
    assert.equal(r.outcome, 'unknown');
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), true);
    assert.equal(statusCli(root, '001-full', 1).outcome, 'unknown');
  } finally {
    control.abort();
    if (owned) {
      stopCurrentChild(owned);
      await waitFor(() => probeProcess(owned!.pid!) === 'not-found');
    }
    await pending;
  }
  const signaled = testTarget();
  const r = await execute(signaled, 'focused', {
    spawnExecution: (_exe, args, options) => {
      const child = spawn(process.execPath, args, options);
      child.once('spawn', () => child.kill('SIGTERM'));
      return child;
    },
  });
  assert.equal(r.outcome, 'unknown', JSON.stringify(r));
  assert.equal(fs.existsSync(path.join(signaled, '.mendi/write.lock')), true);
});
test('指定 status 无需旧工具、脚本或 Run 正文；输入损坏、缺日志、读中变化及越界拒绝', async () => {
  const root = testTarget();
  const forwarder = path.join(root, 'selected-tool.js');
  fs.writeFileSync(
    forwarder,
    `import { spawnSync } from 'node:child_process'; const r=spawnSync(process.execPath,[${JSON.stringify(pnpmEntry)},...process.argv.slice(2)],{stdio:'inherit'});process.exit(r.status??1);`,
  );
  const result = await runTest({ ...testInput(root), pnpmBin: forwarder });
  if (!('record' in result)) throw new Error(JSON.stringify(result));
  assert.equal(result.outcome, 'passed', JSON.stringify(result));
  fs.unlinkSync(forwarder);
  fs.unlinkSync(path.join(root, 'package.json'));
  assert.equal(statusCli(root, '001-focused').outcome, 'passed');
  const file = path.join(root, '.mendi/delivery-groups/d01/tests/001-focused/result.json');
  const original = fs.readFileSync(file);
  const changed = testStatus(
    { project: root, execution: '001-focused' },
    { observeRead: () => fs.appendFileSync(file, ' ') },
  );
  assert.equal(changed.ok, false);
  assert.equal(changed.outcome, 'unknown');
  fs.writeFileSync(file, original);
  for (const edit of [
    { deliveryId: 'other' },
    { executionId: '002-fast' },
    { stdoutRef: '../../outside' },
    { exitCode: null },
    {
      executionState: 'running',
      outcome: 'unknown',
      exitCode: null,
      signal: null,
      finishedAt: null,
      pid: 99999999,
    },
  ]) {
    fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(original.toString()), ...edit }));
    const bytes = fs.readFileSync(file);
    assert.equal(statusCli(root, '001-focused', 1).outcome, 'unknown');
    assert.deepEqual(fs.readFileSync(file), bytes);
  }
  fs.writeFileSync(file, original);
  const log = path.join(root, result.record.stdoutRef);
  fs.unlinkSync(log);
  assert.equal(testStatus({ project: root, execution: '001-focused' }).outcome, 'unknown');
  assert.equal(testStatus({ project: root, execution: '../001-focused' }).ok, false);
});

test('持久 running 意图后写者真实退出，新进程不补写 / 重试 / 处置锁', () => {
  const root = testTarget();
  const result = command(
    'tests/fixtures/test-worker.ts',
    [root, pnpmEntry],
    process.cwd(),
    isolatedEnv(root),
  );
  assert.equal(result.status, 88, result.stdout + result.stderr);
  const before = snapshot(root);
  const observed = statusCli(root, '001-focused', 1);
  assert.equal(observed.outcome, 'unknown');
  assert.equal(observed.record.executionState, 'running');
  assert.equal(observed.record.pid, null);
  assert.equal(fs.existsSync(path.join(root, 'started.json')), false);
  assert.deepEqual(snapshot(root), before);
});

test('真实异目录 CLI run 为一份 JSON / 原始日志；closed 和 manual 拒绝且无写入', () => {
  const root = testTarget();
  const args = [
    'test',
    'run',
    '--project',
    root,
    '--kind',
    'full',
    '--actor',
    'cli-author',
    '--pnpm-bin',
    pnpmEntry,
    '--json',
  ];
  const result = cli(args, path.dirname(root), isolatedEnv(root));
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.outcome, 'passed');
  assert.equal(data.record.cwd, fs.realpathSync(root));
  assert.equal(data.record.formalDeliveryTest, false);
  assert.equal(data.openspec, null);
  assert.match(fs.readFileSync(path.join(root, data.record.stdoutRef), 'utf8'), /foreground:/);
  const manifest = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const source = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  fs.writeFileSync(manifest, JSON.stringify({ ...source, state: 'closed' }));
  let before = snapshot(root);
  assert.equal(cli(args, root, isolatedEnv(root)).status, 1);
  assert.deepEqual(snapshot(root), before);
  const entry = path.join(root, '.mendi/project.json');
  const project = JSON.parse(fs.readFileSync(entry, 'utf8'));
  delete project.formatVersion;
  delete source.formatVersion;
  fs.writeFileSync(entry, JSON.stringify({ ...project, recordingMode: 'manual-bootstrap' }));
  fs.writeFileSync(
    manifest,
    JSON.stringify({
      ...source,
      recordingMode: 'manual-bootstrap',
      next: { action: 'explore', status: 'pending', role: 'author', reason: 'controlled' },
    }),
  );
  before = snapshot(root);
  assert.equal(query({ project: root }).local?.source, 'manual-bootstrap');
  assert.equal(cli(args, root, isolatedEnv(root)).status, 1);
  assert.deepEqual(snapshot(root), before);
});
