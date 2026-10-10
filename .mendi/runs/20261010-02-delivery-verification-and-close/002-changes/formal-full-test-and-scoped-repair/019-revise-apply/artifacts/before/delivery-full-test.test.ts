import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { formal, verificationTarget, fullInput } from './delivery-support.ts';
import { runFullTest, fullTestStatus } from '../src/application/delivery-full-test.ts';
import { acquireProjectLock } from '../src/adapters/workspace.ts';
import { query } from '../src/application/project.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { execute, writePackage } from './test-support.ts';
import { testEnvironment } from '../src/adapters/test-entries.ts';

test('独立目标测试去除宿主 node:test 上下文，不改宿主环境', () => {
  const env = { NODE_TEST_CONTEXT: 'child-v8', Node_Test_Context: 'child-v8', KEEP: 'yes' };
  const normalized = testEnvironment('warn', env);
  assert.equal(normalized.NODE_TEST_CONTEXT, undefined);
  assert.equal(normalized.Node_Test_Context, undefined);
  assert.equal(normalized.KEEP, 'yes');
  assert.equal(env.NODE_TEST_CONTEXT, 'child-v8');
});

test('正式运行新子执行；启动前同一 lease 内父子意图持久，普通旧 PASS 不认领', async () => {
  const root = verificationTarget();
  const ordinary = await execute(root, 'full');
  assert.equal(ordinary.ok, true);
  let lockCount = 0;
  const result = await formal(root, {
    observeWrite: (phase) => {
      if (phase === 'lock-acquired') lockCount++;
    },
    spawnExecution: (command, args, options) => {
      assert.equal(lockCount, 1);
      assert.throws(() => acquireProjectLock(root, 'other-writer'));
      const data = JSON.parse(
        fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'), 'utf8'),
      );
      const parent = readDeliveryRun(root, data.deliveryRunRef, 'd01');
      assert.equal(parent.record.fullTest!.phase, 'running');
      assert.equal(parent.record.fullTest!.executionId, '002-full');
      const child = JSON.parse(
        fs.readFileSync(
          path.join(root, '.mendi/delivery-groups/d01/tests/002-full/result.json'),
          'utf8',
        ),
      );
      assert.equal(child.executionState, 'running');
      assert.equal(child.formalDeliveryTest, false);
      return spawn(command, args, options);
    },
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.ok('verification' in result);
  assert.equal(result.verification.child!.scope, 'command');
  assert.equal(result.verification.outcome, 'passed');
  assert.equal(result.next.role, 'owner');
  assert.equal(result.local.state, 'open');
});
test('真正非零为 failed，历史 status 读取成功不等于 passed', async () => {
  const root = verificationTarget();
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts fail';
  });
  const result = await formal(root);
  assert.equal(result.ok, false);
  assert.ok(result.run);
  assert.equal(result.run.fullTest!.outcome, 'failed');
  const readback = fullTestStatus({ project: root, runRef: result.run.ref });
  assert.equal(readback.ok, true);
  assert.equal(readback.verification.outcome, 'failed');
  assert.equal(readback.verification.child!.exitCode, 7);
});
test('声明固定后工具 / 依赖拒绝 not-run，原始输出留存且不安装、不占子执行', async () => {
  for (const cause of ['tool', 'dependencies']) {
    const root = verificationTarget();
    if (cause === 'dependencies')
      writePackage(root, (p) => {
        p.dependencies = { 'missing-fixture-package': '99.99.99' };
      });
    const result = await runFullTest({
      ...fullInput(root),
      ...(cause === 'tool' ? { pnpmBin: path.join(root, 'missing.js') } : {}),
    });
    assert.ok(result.run);
    assert.equal(result.run.fullTest!.outcome, 'not-run', JSON.stringify(result));
    assert.equal(result.run.fullTest!.executionId, null);
    assert.equal(fs.existsSync(path.join(root, '.mendi/delivery-groups/d01/tests')), false);
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
    const raw = JSON.parse(
      fs.readFileSync(
        path.join(root, path.dirname(result.run.ref), 'artifacts/precheck.json'),
        'utf8',
      ),
    );
    assert.ok(raw.message);
    if (cause === 'dependencies') {
      assert.notEqual(raw.details.exitCode, 0);
      assert.equal(typeof raw.details.stderr, 'string');
    }
    assert.equal(
      fullTestStatus({ project: root, runRef: result.run.ref }).verification.outcome,
      'not-run',
    );
  }
});
test('选定启动失败保存有子 ID 的 not-run；本次真实树确认中断为 interrupted', async () => {
  const root = verificationTarget();
  const failure = await formal(root, {
    spawnExecution: (_command, args, options) =>
      spawn(path.join(root, 'missing.exe'), args, options),
  });
  assert.ok(failure.run);
  assert.equal(failure.run.fullTest!.outcome, 'not-run');
  assert.equal(failure.run.fullTest!.executionId, '001-full', JSON.stringify(failure));
  const next = verificationTarget();
  writePackage(next, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts wait';
  });
  const control = new AbortController();
  const interrupted = await formal(next, {
    signal: control.signal,
    observe: (phase) => {
      if (phase === 'after-launch') control.abort();
    },
  });
  assert.ok(interrupted.run);
  assert.equal(interrupted.run.fullTest!.outcome, 'interrupted', JSON.stringify(interrupted));
  assert.equal(fs.existsSync(path.join(next, '.mendi/write.lock')), false);
});
test('正式持锁 / 声明 / 入口冲突不生成通过，当前 query 拒绝锁现场', async () => {
  const root = verificationTarget();
  const result = await formal(root, {
    observe: (phase) => {
      if (phase === 'after-launch') {
        assert.throws(() => query({ project: root }), /锁/);
        fs.appendFileSync(path.join(root, 'full-test.json'), ' ');
      }
    },
  });
  assert.equal(result.ok, false);
  assert.equal('verification' in result, false);
  assert.ok('retainedLock' in result);
  assert.equal(result.run!.status, 'draft');
});
