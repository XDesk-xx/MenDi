import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { actionTarget, options, author } from './action-support.ts';
import { startAction } from '../src/application/actions.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { queryRound } from '../src/application/project.ts';
import { legacyTarget, migrationInput, fixtureLockDisposition } from './migration-support.ts';
import { migrateDelivery } from '../src/application/delivery-migration.ts';
import { snapshot } from './helpers.ts';

test('共享写锁内重新检查格式，出现旧格式时不占 Run / 执行业务', () => {
  const root = actionTarget(),
    projectRef = path.join(root, '.mendi/project.json'),
    manifestRef = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const number = scanRunNumbers(root, 'd01').number;
  assert.throws(
    () =>
      startAction(
        { ...author(root), changeId: 'proof-entry', type: 'explore' },
        {
          ...options,
          observeWrite: (phase) => {
            if (phase !== 'lock-acquired') return;
            const project = JSON.parse(fs.readFileSync(projectRef, 'utf8')),
              manifest = JSON.parse(fs.readFileSync(manifestRef, 'utf8'));
            project.formatVersion = 1;
            manifest.formatVersion = 1;
            delete manifest.rounds;
            delete manifest.currentRoundId;
            fs.writeFileSync(projectRef, JSON.stringify(project));
            fs.writeFileSync(manifestRef, JSON.stringify(manifest));
          },
        },
      ),
    { code: 'legacy-product-read-only' },
  );
  assert.equal(scanRunNumbers(root, 'd01').number, number);
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
});

test('manual 历史轮请求明确拒绝，迁移不写人工记录', () => {
  const { root, projectRef, manifestRef } = legacyTarget();
  const project = JSON.parse(fs.readFileSync(projectRef, 'utf8')),
    manifest = JSON.parse(fs.readFileSync(manifestRef, 'utf8'));
  delete project.formatVersion;
  delete manifest.formatVersion;
  project.recordingMode = 'manual-bootstrap';
  manifest.recordingMode = 'manual-bootstrap';
  manifest.next = { action: 'explore', role: 'author', status: 'awaiting-instruction' };
  fs.writeFileSync(projectRef, JSON.stringify(project));
  fs.writeFileSync(manifestRef, JSON.stringify(manifest));
  const before = snapshot(root);
  assert.throws(() => queryRound({ project: root, roundId: 'r001' }, options), {
    code: 'round-query-unsupported',
  });
  assert.throws(() => migrateDelivery({ project: root, mode: 'preview' }), {
    code: 'migration-not-legacy',
  });
  assert.deepEqual(snapshot(root), before);
});

test('迁移锁内复核原输入及占号，发生变化时不创建 intent', () => {
  const { root, manifestRef } = legacyTarget(true),
    input = migrationInput(root);
  const number = scanRunNumbers(root, 'd01').number;
  assert.throws(
    () =>
      migrateDelivery(input, {
        observeWrite: (phase) => {
          if (phase === 'lock-acquired') {
            const manifest = JSON.parse(fs.readFileSync(manifestRef, 'utf8'));
            manifest.note = '直接输入变化';
            fs.writeFileSync(manifestRef, JSON.stringify(manifest));
          }
        },
      }),
    { code: 'migration-preview-stale' },
  );
  assert.equal(scanRunNumbers(root, 'd01').number, number);
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
});

test('迁移 intent 缺失、输入变化或目标错误只诊断；不补造或新占号', () => {
  const { root, started } = legacyTarget(true),
    input = migrationInput(root);
  const plan = JSON.parse(fs.readFileSync(path.join(root, input.inputFile), 'utf8'));
  assert.throws(() =>
    migrateDelivery(input, {
      observeWrite: (phase) => {
        if (phase === 'intent-written') throw new Error('fixture interruption');
      },
    }),
  );
  fixtureLockDisposition(root);
  const resume = {
    project: root,
    mode: 'resume' as const,
    runRef: plan.migrationRunRef,
    role: 'author',
    actor: input.actor,
  };
  const intent = path.join(root, plan.migrationRunRef.replace('run.md', 'artifacts/intent.json'));
  fs.renameSync(intent, intent + '.unavailable');
  let before = snapshot(root);
  assert.throws(() => migrateDelivery(resume));
  assert.deepEqual(snapshot(root), before);
  fs.renameSync(intent + '.unavailable', intent);
  fs.appendFileSync(path.join(root, started!.run.ref), '外部修改当前草稿。\n');
  before = snapshot(root);
  assert.throws(() => migrateDelivery(resume), { code: 'migration-input-changed' });
  assert.throws(() =>
    migrateDelivery({ ...resume, runRef: '.mendi/runs/d01/999-delivery-migrate/run.md' }),
  );
  assert.deepEqual(snapshot(root), before);
});
