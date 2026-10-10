import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProject, parseWorkspace } from '../src/core/records.ts';
import { currentBinding } from '../src/core/associations.ts';
const project = {
  formatVersion: 1,
  recordingMode: 'product',
  name: 'test',
  deliveryGroupsDir: '.mendi/delivery-groups',
  activeDeliveryId: 'd01',
  archivedChangeCount: 2,
  deliveries: [{ id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' }],
};
const batch = {
  id: '001-changes',
  firstRun: '001',
  runsRef: '.mendi/runs/d01/001-changes',
  changeIds: ['first', 'second'],
};
const old = {
  planningSlot: 'A',
  changeId: 'first',
  changeRef: 'openspec/changes/archive/2026-10-10-001-first',
  state: 'archived',
  archiveOrdinal: 1,
  batchId: '001-changes',
  latestRunRef: '.mendi/runs/d01/001-changes/first/007-archive/run.md',
};
const active = {
  planningSlot: 'B',
  changeId: 'second',
  changeRef: 'openspec/changes/second',
  state: 'explore',
  batchId: '001-changes',
};
const manifest = {
  ...project,
  id: 'd01',
  title: '范围',
  state: 'open',
  openedOn: '2026-10-10',
  goal: '顺序',
  plannedChanges: [
    { slot: 'A', title: 'A', dependsOn: [] },
    { slot: 'B', title: 'B', dependsOn: ['A'] },
  ],
  activeChangeId: 'second',
  changeBindings: [old, active],
  changeBatches: [batch],
};
test('追加顺序选择活动末项，无 Run 仍选择新项；全部归档选择最后项', () => {
  const w = parseWorkspace(parseProject(project), { ...manifest, unknownRef: '../unavailable' });
  assert.equal(currentBinding(w)?.changeId, 'second');
  assert.equal(currentBinding(w)?.latestRunRef, undefined);
  const second = {
    ...active,
    state: 'archived',
    archiveOrdinal: 2,
    changeRef: 'openspec/changes/archive/2026-10-10-002-second',
    latestRunRef: '.mendi/runs/d01/001-changes/second/014-archive/run.md',
  };
  assert.equal(
    currentBinding(
      parseWorkspace(parseProject(project), {
        ...manifest,
        activeChangeId: null,
        changeBindings: [old, second],
      }),
    )?.changeId,
    'second',
  );
});
test('拒绝错顺序、多活动、编号倒序 / 重复 / 超计数、错批次成员与 Run 身份', () => {
  for (const value of [
    { ...manifest, activeChangeId: 'first' },
    {
      ...manifest,
      changeBindings: [
        { ...old, state: 'active', changeRef: 'openspec/changes/first', archiveOrdinal: undefined },
        active,
      ],
    },
    ...[0, 1, 3].map((archiveOrdinal) => ({
      ...manifest,
      activeChangeId: null,
      changeBindings: [
        old,
        {
          ...active,
          state: 'archived',
          archiveOrdinal,
          changeRef:
            'openspec/changes/archive/2026-10-10-' +
            String(archiveOrdinal).padStart(3, '0') +
            '-second',
          latestRunRef: '.mendi/runs/d01/001-changes/second/014-archive/run.md',
        },
      ],
    })),
    { ...manifest, changeBatches: [{ ...batch, changeIds: ['first', 'first'] }] },
    { ...manifest, changeBatches: [{ ...batch, changeIds: ['second', 'first'] }] },
    {
      ...manifest,
      changeBindings: [
        { ...old, latestRunRef: '.mendi/runs/d01/001-changes/second/007-archive/run.md' },
        active,
      ],
    },
    { ...manifest, changeBindings: [old, { ...active, batchId: '008-changes' }] },
  ])
    assert.throws(() => parseWorkspace(parseProject(project), value));
});
