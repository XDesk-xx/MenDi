import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { formal, verificationTarget } from './delivery-support.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { diagnoseWorkspace } from '../src/application/diagnosis.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';

test('同级连续编号、空占号不复用、重复号拒绝', async () => {
  const root = verificationTarget();
  assert.equal(scanRunNumbers(root, 'd01').number, 15);
  fs.mkdirSync(path.join(root, '.mendi/runs/d01/015-delivery-repair'));
  const result = await formal(root);
  assert.ok(result.run);
  assert.match(result.run.ref, /\/016-delivery-full-test\/run.md$/);
  const next = verificationTarget();
  fs.mkdirSync(path.join(next, '.mendi/runs/d01/014-delivery-repair'));
  const duplicate = await formal(next);
  assert.equal(duplicate.ok, false);
  assert.ok('error' in duplicate && duplicate.error.code === 'run-number-conflict');
});
test('父 Run、manifest、读回和锁释放故障保留实际现场，不重试', async () => {
  for (const phase of [
    'run-written',
    'before-manifest-commit',
    'before-run-commit',
    'before-readback',
    'before-lock-release',
  ] as const) {
    const root = verificationTarget();
    let occurred = 0;
    const result = await formal(root, {
      observeWrite: (current) => {
        if (current === phase) {
          occurred++;
          throw new Error('controlled:' + phase);
        }
      },
    });
    assert.equal(result.ok, false, phase);
    assert.equal(occurred, 1);
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), true);
    const runRef = '.mendi/runs/d01/015-delivery-full-test/run.md';
    const scene = diagnoseWorkspace({ project: root, runRef });
    assert.equal(scene.blockedByLock, true);
    assert.ok(scene.reservation && 'scope' in scene.reservation);
    assert.equal(scene.reservation.scope, 'delivery');
    assert.equal(scene.reservation!.actionType, 'delivery-full-test');
    if (phase === 'before-lock-release') assert.equal(scene.current!.status, 'submitted');
    else assert.equal(fs.existsSync(path.join(root, 'started.json')), false);
  }
});
test('日志、子终态 / 读回与父终态失败均非零并保留 unknown / 锁', async () => {
  for (const phase of [
    'before-log-write',
    'before-terminal-commit',
    'before-test-readback',
    'parent-terminal',
  ] as const) {
    const root = verificationTarget();
    const result = await formal(root, {
      observe: (current, file) => {
        if (current !== phase) return;
        if (
          phase === 'before-test-readback' &&
          JSON.parse(fs.readFileSync(file, 'utf8')).executionState !== 'finished'
        )
          return;
        throw new Error('controlled:' + phase);
      },
      observeWrite: (current, file) => {
        if (
          phase === 'parent-terminal' &&
          current === 'before-run-commit' &&
          fs.readFileSync(file, 'utf8').includes('phase: running')
        )
          throw new Error('controlled:parent-terminal');
      },
    });
    assert.equal(result.ok, false);
    assert.ok('retainedLock' in result);
    assert.throws(() => fullTestStatus({ project: root, runRef: result.run!.ref }), /锁/);
  }
});
test('持锁复核变更不占号；执行期间必要批准和 full 入口变化保留现场', async () => {
  const before = verificationTarget();
  const rejected = await formal(before, {
    observeWrite: (phase) => {
      if (phase === 'lock-acquired') fs.appendFileSync(path.join(before, 'full-test.json'), ' ');
    },
  });
  assert.equal(rejected.ok, false);
  assert.equal(scanRunNumbers(before, 'd01').number, 15);
  assert.equal(fs.existsSync(path.join(before, '.mendi/write.lock')), false);
  for (const material of ['review', 'entry']) {
    const root = verificationTarget();
    const result = await formal(root, {
      observe: (phase) => {
        if (phase !== 'after-launch') return;
        if (material === 'review')
          fs.appendFileSync(
            path.join(root, '.mendi/runs/d01/001-changes/proof-entry/006-review-apply/run.md'),
            '\nchanged',
          );
        else {
          const file = path.join(root, 'package.json');
          const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
          pkg.scripts['test:full'] = 'node foreground.ts fail';
          fs.writeFileSync(file, JSON.stringify(pkg));
        }
      },
    });
    assert.equal(result.ok, false);
    assert.ok('retainedLock' in result);
  }
});
