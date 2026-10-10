import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  passedTarget,
  closedTarget,
  reopenInput,
  openInput,
  lifecycleCli,
  queryCli,
} from './lifecycle-support.ts';
import { command, isolatedEnv } from './helpers.ts';
import { disposeStoppedFixtureLock } from './archive-support.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { diagnoseWorkspace } from '../src/application/diagnosis.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { saveRun, submitRun, continueAction } from '../src/application/actions.ts';
import { MendiError } from '../src/core/errors.ts';
import { testTarget } from './test-support.ts';

function worker(root: string, operation: string, phase: string) {
  const value = command(
    'tests/lifecycle-worker.ts',
    [root, operation, phase],
    process.cwd(),
    isolatedEnv(root),
  );
  assert.equal(value.status, 1, value.stdout + value.stderr);
  const result = JSON.parse(value.stdout);
  assert.ok(result.details.committedPaths.length);
  assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
  assert.equal(queryCli(root, [], 1).error.code, 'write-in-progress-or-interrupted');
  return result;
}
for (const operation of ['close', 'reopen', 'open']) {
  test(`${operation} 各提交边界中断与显式 resume：终态 / manifest / index / 释放`, async () => {
    for (const phase of [
      'pending-written',
      'before-run-commit',
      'terminal-written',
      'before-manifest-commit',
      'lifecycle-manifest-written',
      'before-entry-commit:2',
      'index-written',
      'before-readback',
      'before-lock-release',
    ]) {
      const target = operation === 'close' ? await passedTarget() : await closedTarget();
      const { root } = target;
      if (operation === 'reopen') reopenInput(root);
      if (operation === 'open') openInput(root);
      const id = operation === 'open' ? 'd02' : 'd01';
      const number = scanRunNumbers(root, id).number;
      const ref = `.mendi/runs/${id}/${String(number).padStart(3, '0')}-delivery-${operation}/run.md`;
      const projectBefore = JSON.parse(
        fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8'),
      );
      const oldManifest = fs.readFileSync(
        path.join(root, '.mendi/delivery-groups/d01/manifest.json'),
      );
      worker(root, operation, phase);
      const runBefore = fs.readFileSync(path.join(root, ref));
      const before = readDeliveryRun(root, ref, id);
      const diagnosis = diagnoseWorkspace({ project: root, runRef: ref });
      assert.equal(diagnosis.lock?.liveness, 'not-found');
      assert.equal(
        lifecycleCli(root, operation, ['--resume', ref], 1).error.code,
        'write-conflict',
      );
      disposeStoppedFixtureLock(root);
      if (
        [
          'pending-written',
          'before-run-commit',
          'terminal-written',
          'before-manifest-commit',
          'lifecycle-manifest-written',
          'before-entry-commit:2',
        ].includes(phase)
      ) {
        const pending = queryCli(root, [], 1);
        assert.equal(pending.outcome, 'unknown');
        assert.equal(pending.next.action, 'owner-decision');
        if (operation === 'open')
          assert.equal(
            JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8'))
              .activeDeliveryId,
            'd01',
          );
      }
      const result = lifecycleCli(root, operation, ['--resume', ref]);
      assert.equal(result.ok, true);
      assert.equal(scanRunNumbers(root, id).number, number + 1);
      assert.equal(
        readWorkspace(root)!.project.archivedChangeCount,
        projectBefore.archivedChangeCount,
      );
      if (before.record.status === 'submitted')
        assert.ok(fs.readFileSync(path.join(root, ref)).equals(runBefore));
      if (operation === 'open')
        assert.ok(
          fs
            .readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'))
            .equals(oldManifest),
        );
      assert.equal(lifecycleCli(root, operation, ['--resume', ref]).alreadyCompleted, true);
      assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
      if (['before-run-commit', 'before-manifest-commit', 'before-entry-commit:2'].includes(phase))
        assert.ok(
          diagnosis.temporaryPaths.length > 0 ||
            (operation === 'open' && phase === 'before-manifest-commit'),
        );
    }
  });
}
test('resume 拒绝原输入改变、错误 actor / 类型、占用目标与后续工作后的陈旧入口', async () => {
  const { root } = await passedTarget();
  const number = scanRunNumbers(root, 'd01').number;
  const ref = `.mendi/runs/d01/${String(number).padStart(3, '0')}-delivery-close/run.md`;
  worker(root, 'close', 'pending-written');
  disposeStoppedFixtureLock(root);
  const input = fs.readFileSync(path.join(root, 'close.json'));
  fs.appendFileSync(path.join(root, 'close.json'), ' ');
  assert.equal(
    lifecycleCli(root, 'close', ['--resume', ref], 1).error.code,
    'lifecycle-input-changed',
  );
  fs.writeFileSync(path.join(root, 'close.json'), input);
  assert.throws(
    () =>
      deliveryLifecycle('delivery-close', {
        project: root,
        role: 'author',
        actor: 'other',
        resumeRef: ref,
      }),
    MendiError,
  );
  assert.equal(lifecycleCli(root, 'reopen', ['--resume', ref], 1).error.code, 'invalid-run');
  const manifestFile = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const manifest = fs.readFileSync(manifestFile);
  fs.appendFileSync(manifestFile, ' ');
  assert.equal(
    lifecycleCli(root, 'close', ['--resume', ref], 1).error.code,
    'lifecycle-input-changed',
  );
  fs.writeFileSync(manifestFile, manifest);
  const noteFile = path.join(root, 'note.md');
  fs.writeFileSync(noteFile, '已确认原写者停止，记录本次故障检查。\n');
  saveRun({
    project: root,
    runRef: ref,
    role: 'author',
    actor: 'delivery-author',
    bodyFile: noteFile,
  });
  assert.throws(
    () =>
      submitRun({
        project: root,
        runRef: ref,
        role: 'author',
        actor: 'delivery-author',
        outcome: 'complete',
        result: 'closed',
      }),
    MendiError,
  );
  assert.throws(
    () =>
      continueAction({
        project: root,
        actionId: `d01-${String(number).padStart(3, '0')}-delivery-close`,
        role: 'author',
        actor: 'delivery-author',
      }),
    MendiError,
  );
  lifecycleCli(root, 'close', ['--resume', ref]);
  assert.match(readDeliveryRun(root, ref, 'd01').body, /故障检查/);
  deliveryLifecycle('delivery-reopen', reopenInput(root));
  assert.equal(lifecycleCli(root, 'close', ['--resume', ref], 1).ok, false);
});
test('首次记录化 Open：入口发布前不猜关联，pending 无 manifest 可诊断并继续', () => {
  for (const phase of ['intent-written', 'pending-written', 'terminal-written']) {
    const root = testTarget(false);
    openInput(root);
    const ref = '.mendi/runs/d02/001-delivery-open/run.md';
    worker(root, 'open', phase);
    const diagnosis = diagnoseWorkspace({ project: root, runRef: ref });
    assert.equal(diagnosis.reservation?.ref, ref);
    assert.equal(diagnosis.ok, false);
    assert.equal(fs.existsSync(path.join(root, '.mendi/delivery-groups/d02/manifest.json')), false);
    disposeStoppedFixtureLock(root);
    if (phase === 'intent-written') {
      assert.equal(lifecycleCli(root, 'open', ['--resume', ref], 1).ok, false);
      assert.equal(
        lifecycleCli(
          root,
          'open',
          ['--id', 'd02', '--title', '新 Delivery', '--scope', 'new-scope.json'],
          1,
        ).ok,
        false,
      );
    } else {
      assert.equal(queryCli(root, [], 1).outcome, 'unknown');
      assert.equal(lifecycleCli(root, 'open', ['--resume', ref]).ok, true);
      assert.equal(readWorkspace(root)!.id, 'd02');
      assert.equal(scanRunNumbers(root, 'd02').number, 2);
    }
  }
});
