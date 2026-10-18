import test from 'node:test';
import assert from 'node:assert/strict';
import { readScope } from '../src/core/records.ts';
import { checkBaselineSnapshot } from '../src/core/baselines.ts';

const dependency = {
  deliveryId: 'd01',
  planningSlot: 'P09',
  closeRunRef: '.mendi/runs/d01/010-delivery-close/run.md',
};
const scope = (baselines: unknown) => ({
  goal: '基线',
  plannedChanges: [{ slot: 'P10', title: '后续', dependsOn: [], baselineDependencies: baselines }],
});
test('本轮 DAG 与基线分开，省略 / 空声明一致，非法 / 重复基线明确拒绝', () => {
  assert.deepEqual(
    readScope(scope([])),
    readScope({ goal: '基线', plannedChanges: [{ slot: 'P10', title: '后续', dependsOn: [] }] }),
  );
  assert.deepEqual(readScope(scope([dependency])).plannedChanges[0].baselineDependencies, [
    dependency,
  ]);
  for (const value of [
    null,
    {},
    [dependency, dependency],
    [{ ...dependency, deliveryId: '../d01' }],
    [{ ...dependency, closeRunRef: '.mendi/runs/d02/010-delivery-close/run.md' }],
    [{ ...dependency, closeRunRef: '.mendi/runs/d01/009-delivery-full-test/run.md' }],
    [{ ...dependency, closeRunRef: '../outside.md' }],
    [{ ...dependency, planningSlot: '' }],
  ]) {
    assert.throws(() => readScope(scope(value)));
  }
  assert.throws(() =>
    readScope({
      goal: '基线',
      plannedChanges: [
        { slot: 'P10', title: '后续', dependsOn: ['P09'], baselineDependencies: [dependency] },
      ],
    }),
  );
  const parsed = readScope(scope([dependency]));
  const fact = { targetSlot: 'P10', ...dependency, changeId: 'entry', archiveOrdinal: 1 };
  assert.doesNotThrow(() => checkBaselineSnapshot(parsed, [fact]));
  for (const facts of [
    undefined,
    [],
    [{ ...fact, targetSlot: 'OTHER' }],
    [{ ...fact, archiveOrdinal: 0 }],
  ])
    assert.throws(() => checkBaselineSnapshot(parsed, facts));
});
