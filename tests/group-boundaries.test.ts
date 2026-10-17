import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { groupTarget, groupRun, attemptResult, writeGroupInput } from './group-support.ts';
import { fullInput } from './delivery-support.ts';
import { runFullTest } from '../src/application/delivery-full-test.ts';
import { query } from '../src/application/project.ts';
import { parseDeliveryRun } from '../src/core/delivery-runs.ts';
import { createVerification } from '../src/application/candidate-verification.ts';
import { writePackage } from './test-support.ts';

test('角色、非法计划 / 路径、持锁输入漂移均在分配副作用前拒绝', async () => {
  const { root, declaration, plan } = groupTarget();
  const input = { ...fullInput(root), inputFile: 'group-input.json' };
  for (const raw of [
    { ...declaration, planRef: '../escape.json' },
    { ...declaration, mode: 'groups-v2' },
    { ...declaration, selection: ['absent'] },
    { ...declaration, selection: ['prefix'] },
  ]) {
    writeGroupInput(root, raw);
    try {
      const result = await runFullTest(input);
      assert.equal(result.ok, false);
      assert.equal('run' in result, false);
    } catch (error) {
      assert.match(String(error), /协议|mode|引用|组选择/);
    }
  }
  writeGroupInput(root, declaration);
  assert.equal((await runFullTest({ ...input, role: 'reviewer' })).ok, false);
  const drift = await groupRun(root, {
    observeWrite: (phase) => {
      if (phase === 'lock-acquired')
        fs.writeFileSync(
          path.join(root, 'group-plan.json'),
          JSON.stringify({
            ...plan,
            groups: plan.groups.map((g) => ({ ...g, title: g.title + ' changed' })),
          }),
        );
    },
  });
  assert.equal(drift.ok, false);
  assert.equal('run' in drift, false);
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
});
test('工具或真实依赖拒绝保留预检原输出，not-run 不分配 child', async () => {
  for (const cause of ['tool', 'dependencies']) {
    const { root } = groupTarget();
    if (cause === 'dependencies')
      writePackage(root, (p) => {
        p.dependencies = { 'missing-fixture-package': '99.99.99' };
      });
    const result = await runFullTest({
      ...fullInput(root),
      inputFile: 'group-input.json',
      ...(cause === 'tool' ? { pnpmBin: path.join(root, 'absent.js') } : {}),
    });
    assert.equal(result.ok, false);
    assert.ok(result.run?.attempt);
    assert.equal(result.run.attempt.executionId, null);
    assert.equal(result.run.result, 'not-run');
    const diagnostic = JSON.parse(
      fs.readFileSync(
        path.join(root, path.posix.dirname(result.run.ref), 'artifacts/precheck.json'),
        'utf8',
      ),
    );
    if (process.env.MENDI_TEST_EVIDENCE_DIR)
      fs.copyFileSync(
        path.join(root, path.posix.dirname(result.run.ref), 'artifacts/precheck.json'),
        path.join(
          process.env.MENDI_TEST_EVIDENCE_DIR,
          `group-precheck-${cause}-${process.pid}.json`,
        ),
        fs.constants.COPYFILE_EXCL,
      );
    assert.ok(diagnostic.message);
    if (cause === 'dependencies') {
      assert.equal(typeof diagnostic.details.stderr, 'string');
      assert.notEqual(diagnostic.details.exitCode, 0);
    }
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  }
});
test('E6 真实子 close 后终态替换 / 读回 / 释放故障保留 unknown，不再占后号', async () => {
  for (const fault of ['terminal', 'readback', 'release']) {
    const { root } = groupTarget();
    const result = await groupRun(root, {
      observe: (phase, file) => {
        if (fault === 'terminal' && phase === 'before-terminal-commit')
          throw new Error('injected-after-real-close');
        if (
          fault === 'readback' &&
          phase === 'before-test-readback' &&
          JSON.parse(fs.readFileSync(file, 'utf8')).executionState === 'finished'
        )
          throw new Error('injected-terminal-readback');
      },
      observeWrite: (phase) => {
        if (fault === 'release' && phase === 'before-lock-release')
          throw new Error('injected-release');
      },
    });
    assert.equal(result.ok, false);
    assert.ok('outcome' in result);
    assert.equal(result.outcome, 'unknown');
    assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'), 'utf8'),
    );
    const original = fs.readdirSync(path.join(root, '.mendi/runs/d01'));
    assert.throws(() => query({ project: root }), /锁/);
    assert.equal((await groupRun(root)).ok, false);
    assert.deepEqual(fs.readdirSync(path.join(root, '.mendi/runs/d01')), original);
    if (fault !== 'release')
      assert.equal(parseDeliveryRun(result.run!, result.run!.ref, 'd01').status, 'draft');
    assert.equal(typeof manifest.testAttemptRunRef, 'string');
  }
});
test('清理未知阻断共享后项，陌生端口实际占用不抢占', async () => {
  const { root, plan } = groupTarget();
  plan.groups[1].resources = ['service'];
  plan.groups[2].resources = ['service'];
  fs.writeFileSync(path.join(root, 'group-plan.json'), JSON.stringify(plan));
  fs.writeFileSync(
    path.join(root, 'group-control.json'),
    JSON.stringify({ unknownCleanup: 'middle' }),
  );
  const result = await groupRun(root);
  assert.equal(result.ok, false);
  assert.ok('retainedLock' in result);
  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, '.mendi/delivery-groups/d01/tests/001-full/group-report.json'),
      'utf8',
    ),
  );
  assert.equal(report.groups[2].state, 'blocked');
  const next = groupTarget();
  const server = net.createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  try {
    fs.writeFileSync(
      path.join(next.root, 'group-control.json'),
      JSON.stringify({ ports: { middle: address.port } }),
    );
    const occupied = attemptResult(await groupRun(next.root));
    assert.equal(occupied.ok, false);
    assert.equal(occupied.run.attempt!.progress[1].state, 'blocked');
    assert.equal(server.listening, true);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
test('缺失 / 陈旧报告不可复用，安全结束的协议错误和真实未知分开', async () => {
  const { root } = groupTarget();
  const result = attemptResult(
    await groupRun(root, {
      observe: (phase, file) => {
        if (phase === 'before-terminal-commit') {
          const ref = path.join(path.dirname(file), 'group-report.json');
          const report = JSON.parse(fs.readFileSync(ref, 'utf8'));
          report.request.executionId = '999-full';
          fs.writeFileSync(ref, JSON.stringify(report));
        }
      },
    }),
  );
  assert.equal(result.groupExecution.protocolState, 'invalid');
  const unknown = structuredClone(result.run);
  unknown.attempt!.version = 2 as 1;
  assert.throws(() => parseDeliveryRun(unknown, unknown.ref, 'd01'), /版本/);
  assert.equal(result.groupExecution.child!.outcome, 'passed');
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  const record = { ...result.run, actionType: 'delivery-full-test', fullTest: result.run.attempt };
  assert.throws(() =>
    parseDeliveryRun(
      record,
      result.run.ref.replace('delivery-test-attempt', 'delivery-full-test'),
      'd01',
    ),
  );
});
test('真实取消停止本次树，不从取消中的 prefix 认领通过', async () => {
  const { root } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'prefix.test.ts'),
    "import test from 'node:test';test('wait',async()=>{await new Promise(r=>setTimeout(r,60000));});",
  );
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const result = await groupRun(root, {
    signal: controller.signal,
    spawnExecution: (command, args, options) => {
      const child = spawn(command, args, options);
      timer = setTimeout(() => controller.abort(), 800);
      return child;
    },
  });
  clearTimeout(timer);
  assert.equal(result.ok, false);
  assert.ok(result.run);
  assert.equal(
    result.run.attempt?.progress.some((p) => p.state === 'passed'),
    false,
  );
  if ('groupExecution' in result && result.groupExecution)
    assert.equal(result.groupExecution.child?.outcome, 'interrupted');
  else assert.ok('retainedLock' in result);
});
test('候选终态持久失败保留现场，不发布或回退旧 verified', async () => {
  const { root } = groupTarget();
  const attempt = attemptResult(await groupRun(root));
  fs.writeFileSync(
    path.join(root, 'verify.json'),
    JSON.stringify({
      fromRunRef: attempt.run.ref,
      planRef: 'group-plan.json',
      candidate: attempt.run.attempt!.candidate,
      sources: attempt.run.attempt!.plan.groups.map((g) => ({
        id: g.id,
        runRef: attempt.run.ref,
        applicability: '本次实际当前候选通过',
      })),
    }),
  );
  assert.throws(
    () =>
      createVerification(
        { project: root, inputFile: 'verify.json', role: 'author', actor: 'delivery-author' },
        {
          observeWrite: (phase) => {
            if (phase === 'before-run-commit') throw Error('injected-verification-terminal');
          },
        },
      ),
    /写入/,
  );
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), true);
  assert.throws(() => query({ project: root }), /锁/);
});

test('目标真实 Node aborted 在正常 wrapper 结束后仍为取消，不认领局部成功；可显式 initial 重跑', async () => {
  const { root, declaration } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('aborted',{signal:AbortSignal.timeout(40)},async()=>{await new Promise(r=>setTimeout(r,150));});",
  );
  const cancelled = attemptResult(await groupRun(root));
  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.groupExecution.child!.outcome, 'failed');
  assert.equal(cancelled.groupExecution.protocolState, 'unconfirmed');
  assert.equal(cancelled.run.attempt!.observation?.cancelled, true);
  assert.deepEqual(
    cancelled.run.attempt!.progress.map((p) => p.state),
    ['passed', 'interrupted', 'not-run'],
  );
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  writeGroupInput(root, {
    ...declaration,
    purpose: 'continue',
    selection: ['tail'],
    fromRunRef: cancelled.run.ref,
  });
  assert.equal((await groupRun(root)).ok, false);
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('normal',()=>{});",
  );
  writeGroupInput(root, {
    ...declaration,
    candidate: {
      id: 'after-cancel',
      basis: { ...declaration.candidate.basis, changes: '明确重新执行：移除控制取消刺激' },
    },
    fromRunRef: cancelled.run.ref,
  });
  const restarted = attemptResult(await groupRun(root));
  assert.equal(restarted.ok, true, JSON.stringify(restarted));
  assert.deepEqual(restarted.run.attempt!.selection, ['prefix', 'middle', 'tail']);
});

test('真实启动失败为有 child ID 的 not-run，不假造协议失败；显式 initial 使用新身份重跑', async () => {
  const { root, declaration } = groupTarget();
  const notRun = attemptResult(
    await groupRun(root, {
      spawnExecution: (_command, args, options) =>
        spawn(path.join(root, 'missing.exe'), args, options),
    }),
  );
  assert.equal(notRun.ok, false);
  assert.equal(notRun.run.result, 'not-run');
  assert.equal(notRun.groupExecution.child!.outcome, 'not-run');
  assert.equal(notRun.run.attempt!.executionId, '001-full');
  assert.equal(notRun.run.attempt!.observation?.notRun, true);
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  assert.equal(notRun.next.action, 'delivery-full-test');
  writeGroupInput(root, { ...declaration, fromRunRef: notRun.run.ref });
  const retried = attemptResult(await groupRun(root));
  assert.equal(retried.ok, true, JSON.stringify(retried));
  assert.equal(retried.run.attempt!.executionId, '002-full');
});

test('真实取消与 wrapper 零退出矛盾持久为 invalid，并释放已安全结束的锁', async () => {
  const { root } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('aborted',{signal:AbortSignal.timeout(40)},async()=>{await new Promise(r=>setTimeout(r,150));});",
  );
  fs.writeFileSync(path.join(root, 'group-control.json'), JSON.stringify({ wrapperZero: true }));
  const result = attemptResult(await groupRun(root));
  assert.equal(result.ok, false);
  assert.equal(result.groupExecution.child!.outcome, 'passed');
  assert.equal(result.run.result, 'invalid');
  assert.equal(result.groupExecution.protocolState, 'invalid');
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
});
