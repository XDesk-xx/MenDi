import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { migrateDelivery } from '../src/application/delivery-migration.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { scanRunNumbers, currentRun } from '../src/adapters/runs.ts';
import { saveRun, submitRun, continueAction } from '../src/application/actions.ts';
import { options, author } from './action-support.ts';
import { snapshot } from './helpers.ts';
import {
  legacyTarget,
  migrationInput,
  preview,
  fixtureLockDisposition,
} from './migration-support.ts';
import type { ActionWritePhase } from '../src/adapters/workspace.ts';

test('旧首轮预览本地只读、不占号，充分旧来源不补 Open，未知 Ref 不展开', () => {
  const { root, manifestRef } = legacyTarget(true);
  const manifest = JSON.parse(fs.readFileSync(manifestRef, 'utf8'));
  manifest.explanatoryRef = '../missing-history';
  fs.writeFileSync(manifestRef, JSON.stringify(manifest));
  const before = snapshot(root),
    number = scanRunNumbers(root, 'd01').number;
  const plan = preview(root);
  assert.equal(plan.expectedNumber, number);
  assert.equal(plan.projectRoot, root);
  const round = (plan.manifest.rounds as { origin: { kind: string; runRef?: string } }[])[0];
  assert.equal(round.origin.kind, 'legacy-baseline');
  assert.equal(round.origin.runRef, undefined);
  assert.equal(plan.manifest.explanatoryRef, '../missing-history');
  assert.deepEqual(snapshot(root), before);
  assert.equal(scanRunNumbers(root, 'd01').number, number);
});

test('迁移保留 draft 字节、actor / Action；原 actor 可保存、提交和同 Action 继续', () => {
  const { root, started } = legacyTarget(true);
  const ref = started!.run.ref,
    original = fs.readFileSync(path.join(root, ref));
  const input = migrationInput(root),
    migrated = migrateDelivery(input);
  assert.equal(migrated.result, 'migrated');
  let workspace = readWorkspace(root)!;
  assert.equal(workspace.project.formatVersion, 2);
  assert.equal(workspace.manifest.formatVersion, 2);
  assert.equal(workspace.manifest.deliveryRunRef, undefined);
  assert.equal(workspace.bindings[0].latestRunRef, ref);
  assert.ok(fs.readFileSync(path.join(root, ref)).equals(original));
  assert.equal(currentRun(root, workspace)!.record.actionId, started!.run.actionId);
  assert.ok('run' in migrated && migrated.run);
  const receipt = migrated.run.ref;
  const number = scanRunNumbers(root, 'd01').number;
  assert.equal(migrateDelivery(input).result, 'already-migrated');
  assert.equal(
    migrateDelivery({
      project: root,
      mode: 'resume',
      role: 'author',
      actor: input.actor,
      runRef: receipt,
    }).result,
    'already-completed',
  );
  assert.equal(scanRunNumbers(root, 'd01').number, number);
  fs.writeFileSync(path.join(root, 'body.md'), '迁移后的原 Action 正文。\n');
  assert.throws(() =>
    saveRun({ ...author(root), actor: 'other', runRef: ref, bodyFile: 'body.md' }, options),
  );
  saveRun({ ...author(root), runRef: ref, bodyFile: 'body.md' }, options);
  submitRun(
    { ...author(root), runRef: ref, outcome: 'continuing', result: '继续原 Action' },
    options,
  );
  const next = continueAction({ ...author(root), actionId: started!.run.actionId }, options);
  assert.equal(next.run.actionId, started!.run.actionId);
  assert.equal(next.run.actorId, started!.run.actorId);
  workspace = readWorkspace(root)!;
  assert.equal(workspace.currentRoundId, 'r001');
  assert.throws(() =>
    migrateDelivery({
      project: root,
      mode: 'resume',
      role: 'author',
      actor: input.actor,
      runRef: receipt,
    }),
  );
});

test('预览手改、源变化、项目外输入、错误角色在写前拒绝', () => {
  for (const kind of ['edited', 'stale', 'outside', 'reviewer']) {
    const { root, manifestRef } = legacyTarget();
    const input = migrationInput(root);
    if (kind === 'edited') {
      const file = path.join(root, input.inputFile),
        plan = JSON.parse(fs.readFileSync(file, 'utf8'));
      plan.manifest.goal = '伪造目标';
      fs.writeFileSync(file, JSON.stringify(plan));
    }
    if (kind === 'stale') {
      const manifest = JSON.parse(fs.readFileSync(manifestRef, 'utf8'));
      manifest.goal = '新目标';
      fs.writeFileSync(manifestRef, JSON.stringify(manifest));
    }
    const before = snapshot(root);
    assert.throws(() =>
      migrateDelivery({
        ...input,
        ...(kind === 'outside' ? { inputFile: '../outside.json' } : {}),
        ...(kind === 'reviewer' ? { role: 'reviewer' } : {}),
      }),
    );
    assert.deepEqual(snapshot(root), before);
  }
});

test('open 旧记录的已知 Close 指针缺失仍是迁移缺口，不作为未知说明忽略', () => {
  const { root, manifestRef } = legacyTarget(true);
  const manifest = JSON.parse(fs.readFileSync(manifestRef, 'utf8'));
  manifest.closeRunRef = '.mendi/runs/d01/009-delivery-close/run.md';
  fs.writeFileSync(manifestRef, JSON.stringify(manifest));
  const before = snapshot(root);
  assert.throws(() => preview(root));
  assert.deepEqual(snapshot(root), before);
});

for (const phase of [
  'intent-written',
  'pending-written',
  'terminal-written',
  'lifecycle-manifest-written',
  'index-written',
  'before-readback',
  'before-lock-release',
] as ActionWritePhase[]) {
  test(`迁移 ${phase} 中断保留现场；显式原 actor 只补同一提交`, () => {
    const { root } = legacyTarget(true),
      input = migrationInput(root),
      plan = preview(root);
    assert.throws(
      () =>
        migrateDelivery(input, {
          observeWrite: (current) => {
            if (current === phase) throw new Error(`fixture interruption ${phase}`);
          },
        }),
      { code: 'workspace-write-failed' },
    );
    assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
    assert.equal(scanRunNumbers(root, 'd01').number, plan.expectedNumber + 1);
    const resume = {
      project: root,
      mode: 'resume' as const,
      runRef: plan.migrationRunRef,
      role: 'author',
      actor: input.actor,
    };
    assert.throws(() => migrateDelivery(resume), { code: 'write-conflict' });
    fixtureLockDisposition(root);
    if (phase === 'intent-written')
      assert.throws(() => preview(root), { code: 'migration-commit-pending' });
    assert.throws(() => migrateDelivery({ ...resume, actor: 'other' }), {
      code: 'action-role-mismatch',
    });
    const result = migrateDelivery(resume);
    assert.ok(['migrated', 'already-completed'].includes(result.result));
    assert.deepEqual(readWorkspace(root)!.manifest, plan.manifest);
    assert.equal(scanRunNumbers(root, 'd01').number, plan.expectedNumber + 1);
    const terminal = fs.readFileSync(path.join(root, plan.migrationRunRef));
    assert.equal(migrateDelivery(resume).result, 'already-completed');
    assert.ok(fs.readFileSync(path.join(root, plan.migrationRunRef)).equals(terminal));
    if (phase === 'intent-written') {
      const note = path.join(
        root,
        `.mendi/runs/d01/${String(plan.expectedNumber + 1).padStart(3, '0')}-old-note`,
      );
      fs.mkdirSync(note);
      fs.writeFileSync(path.join(note, 'run.md'), '不参与交接的说明。\n');
      assert.equal(migrateDelivery(resume).result, 'already-completed');
    }
  });
}
