import { legacyFullTestStatus } from './delivery-support.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  closedTarget,
  reopenInput,
  archiveNew,
  closeInput,
  queryCli,
  prepareLifecycleChange,
} from './lifecycle-support.ts';
import { formal } from './delivery-support.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { migrateDelivery } from '../src/application/delivery-migration.ts';
import { openDelivery, bindChange } from '../src/application/project.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { legacyFixture, preview, migrationInput } from './migration-support.ts';
import { snapshot, scopeFile } from './helpers.ts';
import { testTarget } from './test-support.ts';
import { options } from './action-support.ts';
import { testStatus } from '../src/application/tests.ts';

test('记录化旧首次 Open 尚未 Close 可迁移，不制造收口', () => {
  const root = testTarget(false);
  scopeFile(root);
  const opened = openDelivery(
    {
      project: root,
      id: 'd01',
      title: '记录化旧首轮',
      scopePath: 'scope.json',
      role: 'author',
      actor: 'fixture-author',
    },
    options,
  );
  assert.ok('run' in opened);
  legacyFixture(root);
  const plan = preview(root);
  const round = (plan.manifest.rounds as { origin: { kind: string }; state: string }[])[0];
  assert.equal(round.origin.kind, 'open');
  assert.equal(round.state, 'open');
  assert.equal(plan.manifest.closeRunRef, undefined);
  migrateDelivery(migrationInput(root));
  assert.equal(readWorkspace(root)!.state, 'open');
});

test('真实同日多次 Reopen 转旧输入后只读重建三轮；保留全部旧 Run、历史 scope 与未知扩展', async () => {
  const { root } = await closedTarget();
  deliveryLifecycle('delivery-reopen', reopenInput(root));
  archiveNew(root, 'second-round-work', 'C');
  const second = await formal(root);
  assert.equal(second.ok, true, JSON.stringify(second));
  deliveryLifecycle('delivery-close', closeInput(root));
  deliveryLifecycle('delivery-reopen', reopenInput(root, 'D'));
  prepareLifecycleChange(root, 'third-round-active');
  bindChange({ project: root, changeId: 'third-round-active', slot: 'D' });
  const model = readWorkspace(root)!.rounds!;
  assert.deepEqual(
    model.map((r) => r.id),
    ['r001', 'r002', 'r003'],
  );
  assert.equal(new Set(model.map((r) => r.openedOn)).size, 1);
  legacyFixture(root);
  const manifestFile = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const legacy = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  legacy.explanatoryRef = '../unavailable-history';
  fs.writeFileSync(manifestFile, JSON.stringify(legacy));
  const before = snapshot(root),
    plan = preview(root);
  assert.ok('run' in second && second.run && 'verification' in second && second.verification.child);
  assert.equal(
    legacyFullTestStatus({ project: root, runRef: second.run.ref }).verification.outcome,
    'passed',
  );
  assert.equal(
    testStatus({ project: root, execution: second.verification.child.executionId }).outcome,
    'passed',
  );
  assert.deepEqual(snapshot(root), before);
  assert.equal((plan.manifest.rounds as unknown[]).length, 3);
  assert.equal(plan.manifest.fullTestRunRef, undefined);
  assert.equal(plan.manifest.closeRunRef, undefined);
  assert.equal(plan.manifest.currentRoundId, 'r003');
  assert.equal(plan.progress.activeChangeId, 'third-round-active');
  assert.equal(plan.manifest.explanatoryRef, '../unavailable-history');
  const beforeRef = plan.inputs.find((i) => i.ref.endsWith('/before-manifest.json'))!.ref;
  const originalBefore = fs.readFileSync(path.join(root, beforeRef));
  fs.renameSync(path.join(root, beforeRef), path.join(root, beforeRef) + '.unavailable');
  const gap = snapshot(root);
  assert.throws(() => preview(root));
  assert.deepEqual(snapshot(root), gap);
  fs.renameSync(path.join(root, beforeRef) + '.unavailable', path.join(root, beforeRef));
  const stored = JSON.parse(originalBefore.toString());
  const changed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  changed.goal = '与原 Run 矛盾的旧目标';
  fs.writeFileSync(
    path.join(root, beforeRef),
    JSON.stringify(typeof stored === 'string' ? JSON.stringify(changed) : changed),
  );
  assert.throws(() => preview(root));
  fs.writeFileSync(path.join(root, beforeRef), originalBefore);
  const originals = Object.keys(before).filter(
    (f) =>
      ![
        path.join('.mendi', 'project.json'),
        path.join('.mendi', 'delivery-groups', 'd01', 'manifest.json'),
      ].includes(f),
  );
  migrateDelivery(migrationInput(root));
  const after = snapshot(root);
  for (const ref of originals) assert.equal(after[ref], before[ref], ref);
  const current = readWorkspace(root)!;
  assert.deepEqual(
    current.rounds!.map((r) => r.scope),
    model.map((r) => r.scope),
  );
  assert.equal(queryCli(root, ['--round', 'r001']).historicalRound.scope.goal, model[0].scope.goal);
  assert.equal(
    queryCli(root, ['--round', 'r002']).historicalRound.closeRunRef,
    model[1].closeRunRef,
  );
  fs.renameSync(path.join(root, beforeRef), path.join(root, beforeRef) + '.unavailable');
  assert.equal(queryCli(root, ['--round', 'r001']).historicalRound.scope.goal, model[0].scope.goal);
  fs.renameSync(path.join(root, beforeRef) + '.unavailable', path.join(root, beforeRef));
  assert.equal(current.project.archivedChangeCount, 3);
});
