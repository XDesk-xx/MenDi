import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formal,
  verificationTarget,
  finishRepair,
  authorActor,
  reviewActor,
} from './delivery-support.ts';
import { writePackage } from './test-support.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { renderRun, scanRunNumbers } from '../src/adapters/runs.ts';
import { query } from '../src/application/project.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';
import { acquireProjectLock, releaseProjectLock } from '../src/adapters/workspace.ts';

test('RA-B-001：首次修复后执行需要完整当前 Review，查询不倒查正文', async () => {
  const root = verificationTarget();
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts fail';
  });
  const failed = await formal(root);
  const author = startDeliveryRepair({
    project: root,
    from: failed.run!.ref,
    reason: '受控接线修复',
    role: 'author',
    actor: authorActor,
  });
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts pass';
  });
  finishRepair(root, author.run.ref);
  const review = startDeliveryReview({
    project: root,
    authorRunRef: author.run.ref,
    role: 'reviewer',
    actor: reviewActor,
  });
  finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
  const approved = readDeliveryRun(root, review.run.ref, 'd01');
  fs.writeFileSync(path.join(root, review.run.ref), renderRun(approved.header, ''));
  const manifestFile = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const manifest = fs.readFileSync(manifestFile);
  const number = scanRunNumbers(root, 'd01').number;
  const rejected = await formal(root);
  assert.equal(rejected.ok, false, JSON.stringify(rejected));
  assert.equal(scanRunNumbers(root, 'd01').number, number);
  assert.deepEqual(fs.readFileSync(manifestFile), manifest);
  assert.equal(query({ project: root }).ok, true);
  fs.writeFileSync(path.join(root, review.run.ref), renderRun(approved.header, approved.body));
  assert.equal((await formal(root)).ok, true);
});

test('RA-B-002：当前 query 与指定 status 的 next 使用本次锁 / 日志不稳定观察', async () => {
  const root = verificationTarget();
  const passed = await formal(root);
  assert.equal(passed.ok, true);
  const ref = passed.run!.ref;
  const parentFile = path.join(root, ref);
  const parentBytes = fs.readFileSync(parentFile);
  const base = path.join(
    root,
    '.mendi/delivery-groups/d01/tests',
    passed.run!.fullTest!.executionId!,
  );
  const resultFile = path.join(base, 'result.json');
  const logFile = path.join(base, 'stdout.log');
  const logBytes = fs.readFileSync(logFile);
  for (const read of [
    () => query({ project: root }),
    () => fullTestStatus({ project: root, runRef: ref }),
  ]) {
    for (const conflict of ['lock', 'log']) {
      const original = fs.readFileSync;
      let lease: ReturnType<typeof acquireProjectLock> | undefined;
      let reads = 0;
      fs.readFileSync = new Proxy(original, {
        apply(target, receiver, args) {
          if (String(args[0]) === resultFile) {
            reads++;
            if (conflict === 'lock' && reads === 1)
              lease = acquireProjectLock(root, 'controlled-competing-writer');
            if (conflict === 'log' && reads === 2)
              fs.appendFileSync(logFile, 'controlled concurrent log change');
          }
          return Reflect.apply(target, receiver, args);
        },
      });
      try {
        const observed = read();
        assert.ok('verification' in observed && observed.verification);
        assert.equal(observed.ok, false);
        assert.equal(observed.verification.stable, false);
        assert.equal(observed.verification.outcome, 'unknown');
        assert.equal(observed.next.action, 'owner-decision');
        assert.equal(observed.next.role, 'owner');
        assert.equal(observed.next.status, 'stopped');
        assert.doesNotMatch(String(observed.next.reason), /已通过/);
        assert.deepEqual(original(parentFile), parentBytes);
      } finally {
        fs.readFileSync = original;
        if (lease) releaseProjectLock(root, lease);
        fs.writeFileSync(logFile, logBytes);
      }
    }
  }
  assert.equal(fullTestStatus({ project: root, runRef: ref }).verification.outcome, 'passed');
});
