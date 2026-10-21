import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  verificationTarget,
  formal,
  finishRepair,
  authorActor,
  reviewActor,
} from './delivery-support.ts';
import { writePackage } from './test-support.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import { currentRun } from '../src/adapters/runs.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { supplement, amendment, actual, baseline } from './aftercare-support.ts';
import { query } from '../src/application/project.ts';
import { cli, isolatedEnv } from './helpers.ts';
import { closedTarget, reopenInput } from './lifecycle-support.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';

test('真实 Delivery Repair / Review 的两条命令，采用 deliveryRunRef；旧 Archive/正式执行/后续 draft 拒绝', async () => {
  const root = verificationTarget();
  writePackage(root, (pkg) => {
    (pkg.scripts as Record<string, string>)['test:full'] = 'node foreground.ts fail';
  });
  const failed = await formal(root);
  const formalRef = failed.run!.ref;
  const actor = { project: root, role: 'author', actor: authorActor };
  assert.notEqual(
    actual('supplement', { ...actor, runRef: formalRef, inputFile: supplement(root, 'formal') })
      .exit,
    0,
  );
  const started = startDeliveryRepair({ ...actor, from: formalRef, reason: '原范围修复' });
  finishRepair(root, started.run.ref);
  const input = { ...actor, runRef: started.run.ref },
    unchanged = baseline(root, input.runRef);
  const before = query({ project: root });
  assert.notEqual(currentRun(root, readWorkspace(root)!)!.ref, input.runRef);
  assert.equal(actual('supplement', { ...input, inputFile: supplement(root, 'author') }).exit, 0);
  const safe = actual('amend', { ...input, ...amendment(root, input.runRef) });
  assert.equal(safe.exit, 0, safe.raw.stdout);
  const status = cli(['status', '--project', root, '--json'], root, isolatedEnv(root));
  assert.equal(status.status, 0, status.stdout);
  assert.deepEqual(JSON.parse(status.stdout).next, before.next);
  unchanged();
  const review = startDeliveryReview({
    project: root,
    role: 'reviewer',
    actor: reviewActor,
    authorRunRef: input.runRef,
  });
  const forbidden = actual('supplement', { ...input, inputFile: supplement(root, 'late') });
  assert.notEqual(forbidden.exit, 0);
  finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
  const ri = { project: root, role: 'reviewer', actor: reviewActor, runRef: review.run.ref },
    same = baseline(root, ri.runRef);
  assert.equal(
    actual('supplement', {
      ...ri,
      inputFile: supplement(root, 'review', { relation: 'uncertain' }),
    }).exit,
    0,
  );
  fs.writeFileSync(path.join(root, 'comment.md'), '原失败已通过？这是事后未审核评论。\n');
  const comment = actual('amend', {
    ...ri,
    requestId: 'a-review',
    kind: 'unreviewed-comment',
    commentFile: 'comment.md',
    reason: '保留未验证说法',
  });
  assert.equal(comment.exit, 0, comment.raw.stdout);
  const current = query({ project: root });
  assert.ok('run' in current);
  assert.equal(current.run!.verdict, 'approved');
  same();
  const archived = currentRun(root, readWorkspace(root)!)!;
  assert.notEqual(
    actual('supplement', { ...actor, runRef: archived.ref, inputFile: supplement(root, 'archive') })
      .exit,
    0,
  );
});

test('实际 closed / 新轮生命周期均拒绝补证，旧 Run 只能只读', async () => {
  const { root, close } = await closedTarget();
  const closeRef = close.run.ref;
  const input = {
    project: root,
    role: 'author',
    actor: authorActor,
    runRef: closeRef,
    inputFile: supplement(root, 'closed'),
  };
  assert.notEqual(actual('supplement', input).exit, 0);
  const reopened = deliveryLifecycle('delivery-reopen', reopenInput(root));
  assert.notEqual(actual('supplement', input).exit, 0);
  assert.notEqual(actual('supplement', { ...input, runRef: reopened.run.ref }).exit, 0);
});
