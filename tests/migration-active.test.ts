import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { legacyFixture, migrationInput, legacyTarget, preview } from './migration-support.ts';
import { actionTarget, startAuthor, finish, reviewer, options } from './action-support.ts';
import { startAction, saveRun, submitRun } from '../src/application/actions.ts';
import { migrateDelivery } from '../src/application/delivery-migration.ts';
import { currentRun, scanRunNumbers } from '../src/adapters/runs.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import {
  verificationTarget,
  formal,
  authorActor,
  reviewActor,
  finishRepair,
} from './delivery-support.ts';
import {
  archiveTarget,
  prepare,
  worker,
  disposeStoppedFixtureLock,
  archiveInput,
} from './archive-support.ts';
import { archiveAction } from '../src/application/archive.ts';
import { snapshot } from './helpers.ts';
import { writePackage } from './test-support.ts';

test('旧 Reviewer draft 迁移不改固定 Author、原正文或 actor，可按原身份提交', () => {
  const target = { root: actionTarget() };
  // Prepare actual ordinary Run operations in a v2 control target before making the explicit v1 input fixture.
  const author = startAuthor(target.root);
  finish(target.root, author.run.ref);
  const review = startAction(
    {
      ...reviewer(target.root),
      changeId: 'proof-entry',
      type: 'review-explore',
      authorRunRef: author.run.ref,
    },
    options,
  );
  legacyFixture(target.root);
  const original = fs.readFileSync(path.join(target.root, review.run.ref));
  migrateDelivery(migrationInput(target.root));
  const run = currentRun(target.root, readWorkspace(target.root)!)!;
  assert.equal(run.record.authorRunRef, author.run.ref);
  assert.ok(fs.readFileSync(path.join(target.root, run.ref)).equals(original));
  fs.writeFileSync(
    path.join(target.root, 'review.md'),
    '受控独立身份记录夹具；非本仓库审核结论。\n',
  );
  saveRun({ ...reviewer(target.root), runRef: run.ref, bodyFile: 'review.md' }, options);
  const submitted = submitRun(
    {
      ...reviewer(target.root),
      runRef: run.ref,
      outcome: 'complete',
      result: '受控记录',
      verdict: 'approved',
    },
    options,
  );
  assert.equal(submitted.run.authorRunRef, author.run.ref);
});

test('旧 repair Author draft 可迁移并交新 Review；新记录明确归属而不补改旧 Author', async () => {
  const root = verificationTarget();
  writePackage(root, (pkg) => {
    (pkg.scripts as Record<string, string>)['test:full'] = 'node foreground.ts fail';
  });
  const failed = await formal(root);
  assert.equal(failed.ok, false);
  assert.ok('run' in failed && failed.run);
  const repair = startDeliveryRepair({
    project: root,
    from: failed.run.ref,
    role: 'author',
    actor: authorActor,
    reason: '受控失败分析',
  });
  legacyFixture(root);
  const original = fs.readFileSync(path.join(root, repair.run.ref));
  migrateDelivery(migrationInput(root));
  assert.ok(fs.readFileSync(path.join(root, repair.run.ref)).equals(original));
  finishRepair(root, repair.run.ref);
  const authorBytes = fs.readFileSync(path.join(root, repair.run.ref));
  const review = startDeliveryReview({
    project: root,
    authorRunRef: repair.run.ref,
    role: 'reviewer',
    actor: reviewActor,
  });
  assert.equal(review.run.repair!.roundId, 'r001');
  finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
  assert.equal(readDeliveryRun(root, repair.run.ref, 'd01').record.repair!.roundId, undefined);
  assert.ok(fs.readFileSync(path.join(root, repair.run.ref)).equals(authorBytes));
});

for (const phase of ['prepared', 'none'])
  test(`旧 Archive ${phase} 保留当前 Run，迁移后可显式 execute`, () => {
    const target = archiveTarget('approved'),
      started = prepare(target);
    if (phase === 'none') {
      const result = worker(target.root, started.run.ref, 'execute', 'after-invoking');
      assert.equal(result.status, 88);
      disposeStoppedFixtureLock(target.root);
      assert.equal(
        archiveAction(archiveInput(target.root, started.run.ref, 'finish')).result,
        'observed-none',
      );
    }
    legacyFixture(target.root);
    const before = fs.readFileSync(path.join(target.root, started.run.ref));
    const plan = preview(target.root);
    assert.equal(plan.progress.activeChangeId, 'proof-entry');
    migrateDelivery(migrationInput(target.root));
    assert.ok(fs.readFileSync(path.join(target.root, started.run.ref)).equals(before));
    assert.equal(archiveAction(archiveInput(target.root, started.run.ref)).result, 'archived');
  });

test('旧 Archive launch 后无退出见证不能迁移，新版 finish 不恢复旧格式', () => {
  const target = archiveTarget('approved'),
    started = prepare(target);
  assert.equal(worker(target.root, started.run.ref, 'execute', 'before-native-call').status, 88);
  disposeStoppedFixtureLock(target.root);
  legacyFixture(target.root);
  const before = snapshot(target.root);
  assert.throws(() => preview(target.root), { code: 'legacy-recovery-required' });
  assert.throws(() => archiveAction(archiveInput(target.root, started.run.ref, 'finish')), {
    code: 'legacy-product-read-only',
  });
  assert.deepEqual(snapshot(target.root), before);
});

test('旧 pending、新版恢复旧操作、运行 / 不完整测试均停止并保持现场', () => {
  const target = legacyTarget(true);
  const entry = JSON.parse(fs.readFileSync(target.projectRef, 'utf8'));
  entry.pendingDeliveryRunRef = '.mendi/runs/d01/002-delivery-close/run.md';
  fs.writeFileSync(target.projectRef, JSON.stringify(entry));
  let before = snapshot(target.root);
  assert.throws(() => preview(target.root));
  assert.deepEqual(snapshot(target.root), before);
  delete entry.pendingDeliveryRunRef;
  fs.writeFileSync(target.projectRef, JSON.stringify(entry));
  const directory = path.join(target.root, '.mendi/delivery-groups/d01/tests/001-full');
  fs.mkdirSync(directory, { recursive: true });
  before = snapshot(target.root);
  assert.throws(() => preview(target.root), { code: 'legacy-recovery-required' });
  assert.deepEqual(snapshot(target.root), before);
  assert.equal(scanRunNumbers(target.root, 'd01').number, 2);
});
