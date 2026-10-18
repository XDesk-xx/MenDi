import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { testTarget, execute } from './test-support.ts';
import { legacyFixture, migrationInput, preview } from './migration-support.ts';
import { migrateDelivery } from '../src/application/delivery-migration.ts';
import { testStatus } from '../src/application/tests.ts';
import { snapshot } from './helpers.ts';

test('旧普通测试结果继续可读；prepared / running 阻止迁移，迁移后新增执行使旧 resume 陈旧', async () => {
  const root = testTarget(),
    result = await execute(root);
  assert.equal(result.ok, true);
  assert.ok('record' in result && result.record);
  const ref = `.mendi/delivery-groups/d01/tests/${result.executionId}/result.json`;
  const original = fs.readFileSync(path.join(root, ref));
  legacyFixture(root);
  assert.equal(testStatus({ project: root, execution: result.executionId! }).outcome, 'passed');
  const input = migrationInput(root);
  for (const phase of ['prepared', 'running'] as const) {
    const record = {
      ...result.record,
      executionState: phase,
      finishedAt: null,
      exitCode: null,
      signal: null,
      pid: phase === 'prepared' ? null : result.record.pid,
      outcome: phase === 'prepared' ? 'not-run' : 'unknown',
    };
    fs.writeFileSync(path.join(root, ref), JSON.stringify(record, null, 2) + '\n');
    const before = snapshot(root);
    assert.throws(() => preview(root), { code: 'legacy-recovery-required' });
    assert.throws(() => migrateDelivery(input), { code: 'legacy-recovery-required' });
    assert.deepEqual(snapshot(root), before);
  }
  fs.writeFileSync(path.join(root, ref), original);
  const migrated = migrateDelivery(input);
  assert.ok('run' in migrated && migrated.run);
  assert.equal((await execute(root)).ok, true);
  const before = snapshot(root);
  assert.throws(
    () =>
      migrateDelivery({
        project: root,
        mode: 'resume',
        runRef: migrated.run.ref,
        role: 'author',
        actor: input.actor,
      }),
    { code: 'migration-input-changed' },
  );
  assert.deepEqual(snapshot(root), before);
});
