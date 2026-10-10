import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { listTests, runTest } from '../src/application/tests.ts';
import { testEnvironment, capturePnpm } from '../src/adapters/test-entries.ts';
import { testTarget, testInput, writePackage, pnpmEntry } from './test-support.ts';
import { snapshot, cli, isolatedEnv } from './helpers.ts';
import { parseArguments } from '../src/drivers/arguments.ts';

test('默认映射和覆盖只读取目标已有脚本，list 无 Open、无写入', async () => {
  const root = testTarget(false);
  const before = snapshot(root);
  assert.deepEqual(
    listTests({ project: root }).entries.map((e) => e.scriptName),
    ['test:focused', 'test:fast', 'test:full'],
  );
  assert.deepEqual(snapshot(root), before);
  writePackage(root, (pkg) => {
    pkg.mendi = { tests: { full: 'test', unknownRef: '../missing' } };
    (pkg.scripts as Record<string, unknown>).test = 'node foreground.ts pass';
  });
  assert.equal(listTests({ project: root }).entries[2].scriptName, 'test');
  assert.equal((await runTest(testInput(root))).outcome, 'not-run');
});
test('缺失、空值、类型错误、非法映射只阻止相关集合；坏 package / 外部链接拒绝', async () => {
  for (const value of [null, '', '--help', 'test.*', 'test --arg', 3]) {
    const root = testTarget();
    writePackage(root, (pkg) => {
      pkg.mendi = { tests: { fast: value } };
    });
    const entries = listTests({ project: root }).entries;
    assert.equal(entries[0].available, true);
    assert.equal(entries[1].available, false);
    assert.equal((await runTest(testInput(root, 'fast'))).executionId, null);
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  }
  for (const value of ['', null, 42]) {
    const root = testTarget();
    writePackage(root, (pkg) => {
      (pkg.scripts as Record<string, unknown>)['test:focused'] = value;
    });
    assert.equal((await runTest(testInput(root))).outcome, 'not-run');
  }
  const root = testTarget();
  fs.writeFileSync(path.join(root, 'package.json'), '{');
  assert.throws(() => listTests({ project: root }));
  const linked = testTarget();
  const outside = testTarget();
  fs.unlinkSync(path.join(linked, 'package.json'));
  fs.symlinkSync(path.join(outside, 'package.json'), path.join(linked, 'package.json'));
  assert.throws(() => listTests({ project: linked }));
});
test('无下载 / 安装环境键归一且不修改宿主；入口、版本和声明错误均未运行', async () => {
  const source = {
    Corepack_Enable_Network: '1',
    Corepack_Enable_Auto_Pin: '1',
    PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: 'install',
    pnpm_config_verify_deps_before_run: 'prompt',
    KEEP: 'yes',
  };
  assert.deepEqual(testEnvironment('error', source), {
    KEEP: 'yes',
    COREPACK_ENABLE_NETWORK: '0',
    COREPACK_ENABLE_AUTO_PIN: '0',
    pnpm_config_verify_deps_before_run: 'error',
  });
  assert.equal(source.PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN, 'install');
  const root = testTarget();
  for (const pnpmBin of ['pnpm', path.join(root, 'missing.js')]) {
    const r = await runTest({ ...testInput(root), pnpmBin });
    assert.equal(r.outcome, 'not-run');
    assert.equal(r.executionId, null);
  }
  fs.writeFileSync(path.join(root, 'wrong.js'), "console.log('0.0.0');\n");
  assert.equal(
    (await runTest({ ...testInput(root), pnpmBin: path.join(root, 'wrong.js') })).outcome,
    'not-run',
  );
  writePackage(root, (pkg) => {
    pkg.packageManager = 'pnpm@10.0.0';
  });
  assert.equal((await runTest(testInput(root))).outcome, 'not-run');
  assert.equal(fs.existsSync(path.join(root, '.mendi/delivery-groups/d01/tests')), false);
});

test('调用者启用 Corepack auto pin，缺 packageManager 的目标仍不被工具预检改写', () => {
  const root = testTarget();
  writePackage(root, (p) => {
    delete p.packageManager;
  });
  const file = path.join(root, 'package.json');
  const bytes = fs.readFileSync(file);
  const previous = process.env.COREPACK_ENABLE_AUTO_PIN;
  try {
    process.env.COREPACK_ENABLE_AUTO_PIN = '1';
    capturePnpm(root, pnpmEntry, ['--version'], 'error');
    assert.deepEqual(fs.readFileSync(file), bytes);
  } finally {
    if (previous === undefined) delete process.env.COREPACK_ENABLE_AUTO_PIN;
    else process.env.COREPACK_ENABLE_AUTO_PIN = previous;
  }
});
test('CLI test 参数无上游入口，帮助无副作用，异目录本地 list，缺本地配置拒绝', () => {
  for (const args of [
    ['test', 'run', '--project', 'x'],
    ['test', 'list', '--project', 'x', '--openspec-bin', 'x'],
    ['test', 'status', '--project', 'x'],
    [
      'test',
      'run',
      '--project',
      'x',
      '--kind',
      'full',
      '--actor',
      'a',
      '--pnpm-bin',
      'x',
      '--kind',
      'fast',
    ],
  ])
    assert.throws(() => parseArguments(args));
  const root = testTarget(false);
  const before = snapshot(root);
  const result = cli(
    ['test', 'list', '--project', root, '--json'],
    path.dirname(root),
    isolatedEnv(path.dirname(root)),
  );
  assert.equal(result.status, 0, result.stdout);
  assert.equal(JSON.parse(result.stdout).openspec, null);
  assert.deepEqual(snapshot(root), before);
  const help = cli(['--help'], root, isolatedEnv(root));
  assert.equal(help.status, 0);
  assert.match(help.stdout, /mendi test run/);
  assert.deepEqual(snapshot(root), before);
  fs.unlinkSync(path.join(root, 'openspec/config.yaml'));
  assert.throws(() => listTests({ project: root }));
});
