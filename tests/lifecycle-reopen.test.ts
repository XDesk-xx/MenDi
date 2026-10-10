import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  closedTarget,
  reopenInput,
  prepareLifecycleChange,
  archiveNew,
  closeInput,
  writeJson,
  queryCli,
  recordLifecycleScene,
  lifecycleCli,
} from './lifecycle-support.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { bindChange } from '../src/application/project.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { fullTestStatus, runFullTest } from '../src/application/delivery-full-test.ts';
import { fullInput, declarationFile } from './delivery-support.ts';
import { MendiError } from '../src/core/errors.ts';
import { approvedArchive } from './sequential-support.ts';
import { archiveAction } from '../src/application/archive.ts';
import { archiveInput } from './archive-support.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import { finishRepair } from './delivery-support.ts';

test('真实 Close → Reopen → 新批次 / 原生 Archive → 新集合整次执行 → Close', async () => {
  const { root, passed, close } = await closedTarget();
  assert.ok('run' in passed && passed.run);
  const before = readWorkspace(root)!;
  const original = [
    close.run.ref,
    passed.run.ref,
    ...before.bindings.map((item) => item.latestRunRef!),
  ];
  const bytes = new Map(original.map((ref) => [ref, fs.readFileSync(path.join(root, ref))]));
  const reopened = deliveryLifecycle('delivery-reopen', reopenInput(root));
  assert.equal(reopened.local.state, 'open');
  let current = readWorkspace(root)!;
  assert.equal(current.manifest.currentBatchId, null);
  assert.deepEqual(current.manifest.changeBatches, before.manifest.changeBatches);
  assert.deepEqual(current.manifest.changeBindings, before.manifest.changeBindings);
  assert.equal(current.manifest.fullTestRunRef, passed.run.ref);
  assert.equal(current.manifest.closeRunRef, close.run.ref);
  assert.equal(current.project.archivedChangeCount, 2);
  assert.equal(
    fullTestStatus({ project: root, runRef: passed.run.ref }).verification.scopeMatch,
    'changed',
  );
  assert.throws(
    () => deliveryLifecycle('delivery-close', closeInput(root, passed.run!.ref)),
    MendiError,
  );
  // 空占号不复用，首次实际 Run 才建立新批次。
  const number = scanRunNumbers(root, 'd01').number;
  fs.mkdirSync(path.join(root, `.mendi/runs/d01/${String(number).padStart(3, '0')}-explore`));
  prepareLifecycleChange(root, 'third-entry');
  bindChange({ project: root, changeId: 'third-entry', slot: 'C' });
  current = readWorkspace(root)!;
  assert.equal(current.bindings.at(-1)?.batchId, undefined);
  assert.deepEqual(current.manifest.changeBatches, before.manifest.changeBatches);
  const archive = approvedArchive(root, 'third-entry');
  assert.equal(archiveAction(archiveInput(root, archive.run.ref)).result, 'archived');
  current = readWorkspace(root)!;
  const batches = current.manifest.changeBatches as { id: string; changeIds: string[] }[];
  assert.equal(batches.length, 2);
  assert.equal(batches[1].id, `${String(number + 1).padStart(3, '0')}-changes`);
  assert.deepEqual(batches[1].changeIds, ['third-entry']);
  assert.deepEqual(batches[0], (before.manifest.changeBatches as unknown[])[0]);
  assert.equal(current.project.archivedChangeCount, 3);
  declarationFile(root);
  const declaration = JSON.parse(fs.readFileSync(path.join(root, 'full-test.json'), 'utf8'));
  declaration.collection = ['本轮单元场景', '本轮接线场景'];
  writeJson(root, 'full-test.json', declaration);
  const next = await runFullTest(fullInput(root));
  assert.equal(next.ok, true, JSON.stringify(next));
  assert.ok('run' in next && next.run && 'verification' in next && next.verification.child);
  assert.deepEqual(
    next.run.fullTest!.approvals.map((item) => item.changeId),
    ['third-entry'],
  );
  assert.equal(next.run.fullTest!.repairApproval, undefined);
  const logs = fs.readFileSync(path.join(root, next.verification.child.stdoutRef), 'utf8');
  assert.match(logs, /consumer accepts archived completion/);
  assert.match(logs, /producer and consumer/);
  const secondClose = deliveryLifecycle('delivery-close', closeInput(root));
  assert.equal(secondClose.local.state, 'closed');
  assert.equal(queryCli(root).upstream, null);
  assert.equal(queryCli(root).local.plannedChanges[0].slot, 'C');
  for (const [ref, expected] of bytes)
    assert.ok(fs.readFileSync(path.join(root, ref)).equals(expected));
  assert.equal(
    fullTestStatus({ project: root, runRef: passed.run.ref }).verification.outcome,
    'passed',
  );
  assert.ok('verification' in passed && passed.verification.child);
  recordLifecycleScene(
    root,
    'reopen-chain',
    {
      first: passed.run,
      close: close.run,
      reopen: reopened.run,
      second: next.run,
      secondClose: secondClose.run,
    },
    [passed.verification.child, next.verification.child],
  );
});
test('Reopen 拒绝旧槽位、空范围、外部 / 循环依赖、非 closed 与错误角色，写前不占号', async () => {
  const { root } = await closedTarget();
  const input = reopenInput(root);
  const original = fs.readFileSync(path.join(root, 'reopen.json'));
  const number = scanRunNumbers(root, 'd01').number;
  const value = JSON.parse(original.toString());
  for (const bad of [
    { ...value, plannedChanges: [] },
    { ...value, plannedChanges: [{ slot: 'A', title: 'reuse', dependsOn: [] }] },
    { ...value, plannedChanges: [{ slot: 'C', title: 'C', dependsOn: ['A'] }] },
    {
      ...value,
      plannedChanges: [
        { slot: 'C', title: 'C', dependsOn: ['D'] },
        { slot: 'D', title: 'D', dependsOn: ['C'] },
      ],
    },
  ]) {
    writeJson(root, 'reopen.json', bad);
    assert.throws(() => deliveryLifecycle('delivery-reopen', input), MendiError);
    assert.equal(scanRunNumbers(root, 'd01').number, number);
  }
  fs.writeFileSync(path.join(root, 'reopen.json'), original);
  assert.throws(() => deliveryLifecycle('delivery-reopen', { ...input, reason: '' }), MendiError);
  assert.throws(
    () => deliveryLifecycle('delivery-reopen', { ...input, role: 'reviewer' }),
    MendiError,
  );
  assert.equal(
    lifecycleCli(root, 'reopen', ['--scope', input.scopePath, '--reason', input.reason]).ok,
    true,
  );
  assert.throws(() => deliveryLifecycle('delivery-reopen', input), MendiError);
});
test('Reopen 后本轮首次失败不继承旧 PASS，当前修复仍须独立审核和新整次结果', async () => {
  const { root } = await closedTarget();
  deliveryLifecycle('delivery-reopen', reopenInput(root));
  archiveNew(root, 'third-entry', 'C');
  const producer = path.join(root, 'checks/producer.ts');
  const bytes = fs.readFileSync(producer);
  fs.writeFileSync(producer, bytes.toString().replace('change-archived', 'change-completed'));
  const failed = await runFullTest(fullInput(root));
  assert.equal(failed.ok, false);
  assert.ok('run' in failed && failed.run);
  assert.equal(failed.run.fullTest!.outcome, 'failed');
  assert.throws(() => deliveryLifecycle('delivery-close', closeInput(root)), MendiError);
  const repair = startDeliveryRepair({
    project: root,
    role: 'author',
    actor: 'delivery-author',
    from: failed.run.ref,
    reason: '修复本轮接线契约',
  });
  fs.writeFileSync(producer, bytes);
  finishRepair(root, repair.run.ref);
  const tooEarly = await runFullTest(fullInput(root));
  assert.equal(tooEarly.ok, false);
  const review = startDeliveryReview({
    project: root,
    role: 'reviewer',
    actor: 'independent-fixture-reviewer',
    authorRunRef: repair.run.ref,
  });
  finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
  const passed = await runFullTest(fullInput(root));
  assert.equal(passed.ok, true, JSON.stringify(passed));
  assert.equal(deliveryLifecycle('delivery-close', closeInput(root)).ok, true);
});
