import assert from 'node:assert/strict';
import test from 'node:test';
import { readScope, parseProject, parseWorkspace, bindingFor } from '../src/core/records.ts';
import { MendiError } from '../src/core/errors.ts';

const valid = {
  goal: '验证最小 Delivery',
  plannedChanges: [
    { slot: 'A', title: '入口', dependsOn: [] },
    { slot: 'B', title: '关联', dependsOn: ['A'] },
  ],
};
const project = {
  formatVersion: 1,
  recordingMode: 'product',
  name: 'test',
  deliveryGroupsDir: '.mendi/delivery-groups',
  activeDeliveryId: 'd01',
  deliveries: [{ id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' }],
};

test('人工归档累计编号与路径一致，保留旧无编号格式', () => {
  const index = parseProject({
    ...project,
    formatVersion: undefined,
    recordingMode: 'manual-bootstrap',
  });
  const manifest = {
    ...valid,
    recordingMode: 'manual-bootstrap',
    id: 'd01',
    title: 'D01',
    state: 'open',
    activeChangeId: null,
    changeBatches: [],
    next: { action: 'delivery-next', status: 'awaiting-owner' },
  };
  const base = { planningSlot: 'A', changeId: 'proof-entry', state: 'archived' };
  for (const archiveOrdinal of [1, 10, 1000]) {
    const binding = {
      ...base,
      archiveOrdinal,
      changeRef: `openspec/changes/archive/2026-10-09-${String(archiveOrdinal).padStart(3, '0')}-proof-entry`,
    };
    assert.equal(
      parseWorkspace(index, { ...manifest, changeBindings: [binding] }).bindings[0].archiveOrdinal,
      archiveOrdinal,
    );
  }
  assert.equal(
    parseWorkspace(index, {
      ...manifest,
      changeBindings: [{ ...base, changeRef: 'openspec/changes/archive/2026-10-09-proof-entry' }],
    }).bindings[0].archiveOrdinal,
    undefined,
  );
  const numbered = {
    ...base,
    archiveOrdinal: 1,
    changeRef: 'openspec/changes/archive/2026-10-09-001-proof-entry',
  };
  for (const binding of [
    { ...numbered, archiveOrdinal: 0 },
    { ...numbered, archiveOrdinal: -1 },
    { ...numbered, archiveOrdinal: 1.5 },
    { ...numbered, archiveOrdinal: '1' },
    { ...numbered, archiveOrdinal: 2 },
    { ...numbered, archiveOrdinal: undefined },
    { ...numbered, changeRef: 'openspec/changes/archive/2026-10-09-01-proof-entry' },
    { ...numbered, state: 'apply-approved' },
  ])
    assert.throws(
      () => parseWorkspace(index, { ...manifest, changeBindings: [binding] }),
      MendiError,
    );
});
test('范围的唯一性、依赖闭合与无环检查', () => {
  assert.equal(readScope(valid).plannedChanges.length, 2);
  for (const input of [
    { ...valid, goal: '' },
    { ...valid, plannedChanges: [] },
    { ...valid, plannedChanges: [valid.plannedChanges[0], valid.plannedChanges[0]] },
    { ...valid, plannedChanges: [{ slot: 'A', title: 'A', dependsOn: ['missing'] }] },
    {
      ...valid,
      plannedChanges: [
        { slot: 'A', title: 'A', dependsOn: ['B'] },
        { slot: 'B', title: 'B', dependsOn: ['A'] },
      ],
    },
  ])
    assert.throws(() => readScope(input), MendiError);
  assert.throws(() => bindingFor(readScope(valid), 'missing', 'proof-entry'), MendiError);
});
test('记录格式、身份、关联与版本必须一致', () => {
  const index = parseProject(project);
  const manifest = {
    ...valid,
    formatVersion: 1,
    recordingMode: 'product',
    id: 'd01',
    title: 'D01',
    state: 'open',
    openedOn: '2026-10-09',
    activeChangeId: null,
    changeBindings: [],
    changeBatches: [],
  };
  assert.equal(parseWorkspace(index, manifest).mode, 'product');
  for (const input of [
    { ...project, formatVersion: 2 },
    { ...project, formatVersion: undefined, recordingMode: undefined },
    { ...project, activeDeliveryId: 'missing' },
    { ...project, deliveries: [{ id: 'd01', manifestRef: '../outside' }] },
  ])
    assert.throws(() => parseProject(input), MendiError);
  for (const input of [
    { ...manifest, id: 'other' },
    { ...manifest, activeChangeId: 'missing' },
    {
      ...manifest,
      changeBindings: [bindingFor(readScope(valid), 'A', 'proof-entry')],
      activeChangeId: null,
    },
  ])
    assert.throws(() => parseWorkspace(index, input), MendiError);
});
