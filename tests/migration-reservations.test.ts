import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { actionTarget, options, author, startAuthor } from './action-support.ts';
import { startAction } from '../src/application/actions.ts';
import { writeLegacyCommand as runFullTest } from './fixtures/legacy-command.ts';
import { fullInput, verificationTarget } from './delivery-support.ts';
import { releaseProjectLock } from '../src/adapters/workspace.ts';
import { legacyFixture, legacyTarget, preview } from './migration-support.ts';
import { snapshot } from './helpers.ts';

function disposeOwnAbortedFixtureLock(root: string, operation: string) {
  assert.ok(path.resolve(root).startsWith(path.resolve('.tmp') + path.sep));
  const lock = path.join(root, '.mendi/write.lock'),
    owner = fs.readFileSync(lock, 'utf8'),
    record = JSON.parse(owner);
  assert.equal(record.pid, process.pid);
  assert.equal(record.operation, operation);
  releaseProjectLock(root, { lock, owner });
}
test('旧 Action 已占号写 Run、未登记批次 / 指针的半提交不能迁移', () => {
  const root = actionTarget();
  assert.throws(() =>
    startAction(
      { ...author(root), changeId: 'proof-entry', type: 'explore' },
      {
        ...options,
        observeWrite: (phase) => {
          if (phase === 'run-written') throw new Error('fixture interruption before pointer');
        },
      },
    ),
  );
  disposeOwnAbortedFixtureLock(root, 'action-start');
  legacyFixture(root);
  const before = snapshot(root);
  assert.throws(() => preview(root), { code: 'legacy-recovery-required' });
  assert.deepEqual(snapshot(root), before);
});
test('旧正式 prepared Run 未发布当前指针时不能绕过迁移完整性检查', async () => {
  const root = verificationTarget();
  const interrupted = await runFullTest(fullInput(root), {
    observeWrite: (phase) => {
      if (phase === 'run-written') throw new Error('fixture interruption before formal pointer');
    },
  });
  assert.equal(interrupted.ok, false);
  disposeOwnAbortedFixtureLock(root, 'delivery-full-test');
  legacyFixture(root);
  const before = snapshot(root);
  assert.throws(() => preview(root), { code: 'legacy-recovery-required' });
  assert.deepEqual(snapshot(root), before);
});

test('后续实际交接已成立时保留旧空占号，不把历史失败占号当当前半提交', () => {
  const root = actionTarget();
  fs.mkdirSync(path.join(root, '.mendi/runs/d01/001-explore'), { recursive: true });
  const current = startAuthor(root);
  assert.equal(current.run.runNumber, 2);
  legacyFixture(root);
  const before = snapshot(root),
    plan = preview(root);
  assert.equal(plan.expectedNumber, 3);
  assert.deepEqual(snapshot(root), before);
});

test('未知历史说明目录只保留占号，不读取正文或增加迁移前置', () => {
  const { root } = legacyTarget(true);
  const note = path.join(root, '.mendi/runs/d01/003-old-note');
  fs.mkdirSync(note);
  fs.writeFileSync(path.join(note, 'run.md'), '历史说明，不是产品阶段记录。\n');
  const before = snapshot(root),
    plan = preview(root);
  assert.equal(plan.expectedNumber, 4);
  assert.ok(!plan.inputs.some((item) => item.ref.includes('old-note')));
  assert.deepEqual(snapshot(root), before);
});
