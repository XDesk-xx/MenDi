import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { addDeliveryChanges } from '../src/application/delivery-change-add.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { input, write, execute, evidence } from './change-add-support.ts';
import { authorActor } from './delivery-support.ts';
import { groupTarget, groupRun, attemptResult, writeGroupInput } from './group-support.ts';
import { finishRepair } from './delivery-support.ts';
import { fullInput } from './delivery-support.ts';
import { writeLegacyCommand } from './fixtures/legacy-command.ts';
import { writePackage } from './test-support.ts';
import { projectRound } from '../src/core/rounds.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { recordRound } from '../src/core/round-records.ts';
import { archiveNew, reopenInput } from './lifecycle-support.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import { snapshot } from './helpers.ts';

test('真实 passed → append C/D → 显式 bind/原生归档 → 新全量 groups-v1 → typed Close；旧 PASS/Open 历史保留', async () => {
  const { root } = groupTarget();
  const passed = attemptResult(await groupRun(root));
  assert.equal(passed.run.attempt!.formalOutcome, 'passed');
  const original = fs.readFileSync(path.join(root, passed.run.ref));
  write(root);
  const appended = addDeliveryChanges(input(root));
  const expanded = readWorkspace(root)!,
    manifestFile = path.join(root, expanded.manifestRef);
  const manifestBytes = fs.readFileSync(manifestFile),
    forgedRounds = structuredClone(expanded.rounds!);
  forgedRounds.at(-1)!.deliveryRunRef = passed.run.ref;
  fs.writeFileSync(
    manifestFile,
    JSON.stringify(projectRound(expanded.manifest, forgedRounds, expanded.currentRoundId!)),
  );
  assert.throws(() => readWorkspace(root), /同轮旧范围/);
  fs.writeFileSync(manifestFile, manifestBytes);
  assert.equal(readWorkspace(root)!.manifest.testAttemptRunRef, passed.run.ref);
  assert.equal(fullTestStatus({ project: root, runRef: passed.run.ref }).ok, true);
  assert.equal(execute(root, ['next']).next.action, 'change-bind');
  const close = (ref: string) => {
    fs.writeFileSync(
      path.join(root, 'close.json'),
      JSON.stringify({
        testAttemptRunRef: ref,
        applicability: {
          conclusion: 'applicable',
          materials: '隔离真实组测试及范围',
          changes: '',
          reason: '本次新全量覆盖当前范围',
        },
      }),
    );
    return () =>
      deliveryLifecycle('delivery-close', {
        project: root,
        role: 'author',
        actor: authorActor,
        inputFile: 'close.json',
      });
  };
  assert.throws(close(passed.run.ref));
  assert.throws(close(appended.run.ref));
  archiveNew(root, 'append-c', 'C');
  archiveNew(root, 'append-d', 'D');
  assert.throws(close(passed.run.ref));
  const current = attemptResult(await groupRun(root));
  assert.equal(current.run.attempt!.formalOutcome, 'passed');
  assert.deepEqual(current.run.attempt!.selection, ['prefix', 'middle', 'tail']);
  assert.equal(current.run.attempt!.scope.completed.length, 4);
  assert.equal(current.run.attempt!.repairApproval, undefined);
  const closed = close(current.run.ref)();
  assert.equal(closed.ok, true);
  assert.ok(fs.readFileSync(path.join(root, passed.run.ref)).equals(original));
  assert.equal(fullTestStatus({ project: root, runRef: passed.run.ref }).ok, true);
  write(root, { requestId: 'closed-new', additions: [{ slot: 'E', title: 'E', dependsOn: [] }] });
  assert.throws(() => addDeliveryChanges(input(root)), /open|Close/);
  deliveryLifecycle('delivery-reopen', reopenInput(root, 'E'));
  write(root, { requestId: 'r2', additions: [{ slot: 'C', title: '历史复用', dependsOn: [] }] });
  assert.throws(() => addDeliveryChanges(input(root)), /历史轮/);
  assert.equal(execute(root, ['status', '--round', 'r001']).ok, true);
  const oldRound = structuredClone(readWorkspace(root)!.rounds![0]);
  write(root, {
    requestId: 'baseline-r2',
    additions: [
      {
        slot: 'F',
        title: '真实旧轮基线',
        dependsOn: ['E'],
        baselineDependencies: [
          { deliveryId: 'd01', planningSlot: 'C', closeRunRef: closed.run.ref },
        ],
      },
    ],
  });
  addDeliveryChanges(input(root));
  assert.deepEqual(readWorkspace(root)!.rounds![0], oldRound);
  evidence('full-lifecycle', root, {
    passed,
    appended,
    current,
    closed,
    workspace: readWorkspace(root),
  });
});

test('旧 submitted command 保持历史只读，追加不新建旧执行或修改旧报告', async () => {
  const { root } = groupTarget();
  writePackage(root, (pkg) => {
    (pkg.scripts as Record<string, string>)['test:full'] =
      'node --test prefix.test.ts middle.test.ts tail.test.ts';
  });
  const historical = await writeLegacyCommand(fullInput(root));
  assert.ok(historical.run);
  const original = fs.readFileSync(path.join(root, historical.run.ref));
  write(root);
  addDeliveryChanges(input(root));
  const queried = fullTestStatus({ project: root, runRef: historical.run.ref });
  assert.equal(queried.ok, true);
  assert.equal(readWorkspace(root)!.manifest.fullTestRunRef, historical.run.ref);
  assert.equal(readWorkspace(root)!.manifest.deliveryRunRef, undefined);
  assert.ok(fs.readFileSync(path.join(root, historical.run.ref)).equals(original));
});

test('真实 failed 可追加并历史读取；未决 Repair/Review 与执行未知阻断，旧失败不能修复新范围', async () => {
  const { root } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('failed',()=>{throw new Error('real fail')});\n",
  );
  const failed = attemptResult(await groupRun(root));
  assert.equal(failed.run.attempt!.formalOutcome, 'failed');
  const bytes = fs.readFileSync(path.join(root, failed.run.ref));
  write(root);
  addDeliveryChanges(input(root));
  assert.equal(fullTestStatus({ project: root, runRef: failed.run.ref }).ok, true);
  assert.throws(() =>
    startDeliveryRepair({
      project: root,
      role: 'author',
      actor: authorActor,
      from: failed.run.ref,
      reason: '不能复用旧范围',
    }),
  );
  assert.ok(fs.readFileSync(path.join(root, failed.run.ref)).equals(bytes));
  const pending = groupTarget();
  fs.writeFileSync(
    path.join(pending.root, 'middle.test.ts'),
    fs.readFileSync(path.join(root, 'middle.test.ts')),
  );
  const failure = attemptResult(await groupRun(pending.root));
  fs.writeFileSync(
    path.join(pending.root, 'impact.json'),
    JSON.stringify({
      candidate: { ...failure.run.attempt!.candidate, id: 'c2' },
      extent: 'common',
      affectedGroupIds: ['prefix', 'middle', 'tail'],
      retained: [],
      reason: '当前完整修复',
    }),
  );
  const repair = startDeliveryRepair({
    project: pending.root,
    role: 'author',
    actor: authorActor,
    from: failure.run.ref,
    reason: '局部修复',
    inputFile: 'impact.json',
  });
  write(pending.root);
  assert.throws(() => addDeliveryChanges(input(pending.root)));
  finishRepair(pending.root, repair.run.ref);
  const review = startDeliveryReview({
    project: pending.root,
    role: 'reviewer',
    actor: 'independent-fixture-reviewer',
    authorRunRef: repair.run.ref,
  });
  assert.throws(() => addDeliveryChanges(input(pending.root)));
  finishRepair(pending.root, review.run.ref, 'reviewer', 'complete', 'approved');
  assert.throws(() => addDeliveryChanges(input(pending.root)));
  fs.writeFileSync(
    path.join(pending.root, 'middle.test.ts'),
    "import test from 'node:test';test('repaired',()=>{});\n",
  );
  writeGroupInput(pending.root, {
    ...pending.declaration,
    fromRunRef: review.run.ref,
    candidate: { ...failure.run.attempt!.candidate, id: 'c2' },
  });
  const repaired = attemptResult(await groupRun(pending.root));
  assert.equal(repaired.run.attempt!.formalOutcome, 'passed');
  const oldRepair = fs.readFileSync(path.join(pending.root, repair.run.ref)),
    oldReview = fs.readFileSync(path.join(pending.root, review.run.ref));
  addDeliveryChanges(input(pending.root));
  for (const ref of [failure.run.ref, repair.run.ref, review.run.ref, repaired.run.ref])
    assert.equal(
      recordRound(readWorkspace(pending.root)!, readDeliveryRun(pending.root, ref, 'd01').record)
        ?.id,
      'r001',
    );
  assert.ok(fs.readFileSync(path.join(pending.root, repair.run.ref)).equals(oldRepair));
  assert.ok(fs.readFileSync(path.join(pending.root, review.run.ref)).equals(oldReview));
  evidence('repair-history', pending.root, {
    failure,
    repair,
    review,
    repaired,
    workspace: readWorkspace(pending.root),
  });
  evidence('failed-history', root, { failed, workspace: readWorkspace(root) });
});

test('真实运行结束但协议/清理 unknown 不能被追加遮蔽', async () => {
  const { root } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'group-control.json'),
    JSON.stringify({ unknownCleanup: 'middle' }),
  );
  const result = await groupRun(root);
  assert.ok('outcome' in result && result.outcome === 'unknown');
  assert.ok('retainedLock' in result && result.retainedLock);
  write(root);
  const before = snapshot(path.join(root, '.mendi'));
  assert.throws(() => addDeliveryChanges(input(root)));
  assert.deepEqual(snapshot(path.join(root, '.mendi')), before);
  evidence('unknown-blocked', root, result);
});
