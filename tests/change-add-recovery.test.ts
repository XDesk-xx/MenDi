import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { addDeliveryChanges } from '../src/application/delivery-change-add.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { input, write, execute, evidence } from './change-add-support.ts';
import { authorActor } from './delivery-support.ts';
import type { ActionWritePhase } from '../src/adapters/workspace.ts';
import { verificationTarget } from './delivery-support.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { snapshot, command, isolatedEnv } from './helpers.ts';
import { disposeStoppedFixtureLock } from './archive-support.ts';

test('追加事务每个确定断点保留锁/原号，原 actor 显式恢复；新进程 pending 不能伪完成', () => {
  for (const fault of [
    'intent-written',
    'pending-written',
    'terminal-written',
    'before-manifest-commit',
    'lifecycle-manifest-written',
    'index-written',
    'before-lock-release',
  ] as ActionWritePhase[]) {
    const root = verificationTarget();
    write(root);
    const number = scanRunNumbers(root, 'd01').number;
    const ref = `.mendi/runs/d01/${String(number).padStart(3, '0')}-delivery-change-add/run.md`;
    assert.equal(
      command(
        'tests/fixtures/change-add-worker.ts',
        [root, fault, authorActor],
        process.cwd(),
        isolatedEnv(root),
      ).status,
      2,
    );
    assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
    assert.throws(() =>
      addDeliveryChanges({ ...input(root), inputFile: undefined, resumeRef: ref }),
    );
    disposeStoppedFixtureLock(root);
    if (
      [
        'pending-written',
        'terminal-written',
        'before-manifest-commit',
        'lifecycle-manifest-written',
      ].includes(fault)
    ) {
      const pending = execute(root, ['status'], 1);
      assert.equal(pending.outcome, 'unknown');
      assert.equal(pending.next.action, 'owner-decision');
    }
    assert.throws(() =>
      addDeliveryChanges({ ...input(root), inputFile: undefined, resumeRef: ref, actor: 'other' }),
    );
    const result = execute(root, [
      'delivery',
      'change',
      'add',
      '--resume',
      ref,
      '--role',
      'author',
      '--actor',
      authorActor,
    ]);
    assert.equal(result.run.ref, ref);
    assert.equal(readWorkspace(root)!.scope.plannedChanges.length, 4);
    assert.equal(scanRunNumbers(root, 'd01').number, number + 1);
    const stable = snapshot(path.join(root, '.mendi'));
    assert.equal(
      addDeliveryChanges({ ...input(root), inputFile: undefined, resumeRef: ref }).alreadyCompleted,
      true,
    );
    assert.deepEqual(snapshot(path.join(root, '.mendi')), stable);
    evidence(`recover-${fault}`, root, result);
  }
});

test('持锁第二写者与直接输入漂移不占新号，unknown 不清理现场；陈旧恢复拒绝', () => {
  const root = verificationTarget();
  write(root);
  assert.equal(
    command(
      'tests/fixtures/change-add-worker.ts',
      [root, 'drift', authorActor],
      process.cwd(),
      isolatedEnv(root),
    ).status,
    2,
  );
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(root, 'second-writer.json'), 'utf8')).ok,
    false,
  );
  const project = JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8'));
  const ref = project.pendingDeliveryRunRef;
  disposeStoppedFixtureLock(root);
  assert.throws(() => addDeliveryChanges({ ...input(root), inputFile: undefined, resumeRef: ref }));
  write(root);
  addDeliveryChanges({ ...input(root), inputFile: undefined, resumeRef: ref });
  write(root, { requestId: 'later', additions: [{ slot: 'E', title: 'E', dependsOn: ['D'] }] });
  addDeliveryChanges(input(root));
  assert.throws(() => addDeliveryChanges({ ...input(root), inputFile: undefined, resumeRef: ref }));
});
