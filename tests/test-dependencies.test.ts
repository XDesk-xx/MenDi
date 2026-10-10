import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { testTarget, writePackage, execute, pnpmEntry, statusCli } from './test-support.ts';
import { command, isolatedEnv, snapshot, repository } from './helpers.ts';
import { query } from '../src/application/project.ts';

function dependency(root: string, name = 'controlled-local-dep', folder = 'dependency') {
  fs.mkdirSync(path.join(root, folder), { recursive: true });
  fs.writeFileSync(
    path.join(root, folder, 'package.json'),
    JSON.stringify({ name, version: '1.0.0' }),
  );
}
function missingTarget() {
  const root = testTarget(true, false);
  dependency(root);
  fs.writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    "packages: []\nverifyDepsBeforeRun: install\nstoreDir: './store'\n",
  );
  fs.writeFileSync(path.join(root, '.npmrc'), 'offline=true\n');
  writePackage(root, (p) => {
    p.dependencies = { 'controlled-local-dep': 'file:./dependency' };
  });
  return root;
}
test('RP-A-001：版本正确但缺依赖，目标 install 被覆盖，不启动、不占号、不安装', async () => {
  const root = missingTarget();
  const before = snapshot(root);
  const result = await execute(root);
  assert.equal(result.outcome, 'not-run', JSON.stringify(result));
  assert.equal(result.executionId, null);
  assert.deepEqual(snapshot(root), before);
  assert.equal(fs.existsSync(path.join(root, 'started.json')), false);
  assert.equal(fs.existsSync(path.join(root, 'pnpm-lock.yaml')), false);
  assert.equal(fs.existsSync(path.join(root, 'node_modules')), false);
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  assert.match(JSON.stringify('error' in result ? result.error : null), /依赖预检/);
});
test('真实同步后预检可执行；增加依赖后不同步，原锁文件与依赖字节保留', async () => {
  const root = missingTarget();
  const prepared = command(pnpmEntry, ['install', '--offline', '--ignore-scripts'], root, {
    ...isolatedEnv(root),
    COREPACK_ENABLE_NETWORK: '0',
    pnpm_config_verify_deps_before_run: 'error',
  });
  assert.equal(prepared.status, 0, prepared.stdout + prepared.stderr);
  const pass = await execute(root);
  assert.equal(pass.outcome, 'passed', JSON.stringify(pass));
  assert.equal(statusCli(root, '001-focused').outcome, 'passed');
  fs.unlinkSync(path.join(root, 'started.json'));
  dependency(root, 'new-local-dep', 'new-dependency');
  writePackage(root, (p) => {
    (p.dependencies as Record<string, string>)['new-local-dep'] = 'file:./new-dependency';
  });
  const before = snapshot(root);
  const rejected = await execute(root);
  assert.equal(rejected.outcome, 'not-run');
  assert.equal(rejected.executionId, null);
  assert.deepEqual(snapshot(root), before);
  assert.equal(fs.existsSync(path.join(root, 'node_modules/new-local-dep')), false);
});
test('预检后外部改变依赖，执行 warn 不自动安装；实际脚本结果仍是真实命令事实', async () => {
  const root = testTarget();
  dependency(root);
  const lock = fs.readFileSync(path.join(root, 'pnpm-lock.yaml'));
  const result = await execute(root, 'fast', {
    observe: (phase) => {
      if (phase === 'prepared')
        writePackage(root, (p) => {
          p.dependencies = { 'controlled-local-dep': 'file:./dependency' };
        });
    },
  });
  assert.equal(result.outcome, 'failed', JSON.stringify(result));
  assert.equal(fs.existsSync(path.join(root, 'node_modules/controlled-local-dep')), false);
  assert.equal(statusCli(root, '001-fast').outcome, 'failed');
  assert.deepEqual(fs.readFileSync(path.join(root, 'pnpm-lock.yaml')), lock);
});
test('已有脚本自身显式 install 按实际行为执行，不冒充自动安装；不改协作状态', async () => {
  const root = testTarget();
  dependency(root);
  fs.copyFileSync(
    path.join(repository, 'tests/fixtures/explicit-install.ts'),
    path.join(root, 'installer.ts'),
  );
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:focused'] = `node installer.ts "${pnpmEntry}"`;
  });
  const state = fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'));
  const result = await execute(root);
  assert.equal(result.outcome, 'passed', JSON.stringify(result));
  assert.equal(
    fs.existsSync(path.join(root, 'node_modules/controlled-local-dep/package.json')),
    true,
  );
  assert.equal(fs.existsSync(path.join(root, 'pnpm-lock.yaml')), true);
  assert.deepEqual(
    fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json')),
    state,
  );
});
test('空执行占号跳过、重复编号与外部 junction 拒绝；普通查询不读测试历史', async () => {
  const root = testTarget();
  const base = path.join(root, '.mendi/delivery-groups/d01/tests');
  fs.mkdirSync(path.join(base, '002-focused'), { recursive: true });
  const result = await execute(root);
  assert.equal(result.executionId, '003-focused');
  fs.mkdirSync(path.join(base, '002-fast'));
  const duplicate = await execute(root);
  assert.equal(duplicate.outcome, 'not-run');
  assert.equal(duplicate.executionId, null);
  const outside = testTarget();
  const linked = testTarget();
  const linkedBase = path.join(linked, '.mendi/delivery-groups/d01/tests');
  fs.symlinkSync(outside, linkedBase, 'junction');
  const before = snapshot(outside);
  assert.equal((await execute(linked)).outcome, 'not-run');
  assert.deepEqual(snapshot(outside), before);
  fs.unlinkSync(path.join(base, '003-focused/stdout.log'));
  assert.equal(query({ project: root }).next.action, 'change-bind');
});
