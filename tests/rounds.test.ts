import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProject, parseWorkspace } from '../src/core/records.ts';
import { projectRound, requireWritable, type DeliveryRound } from '../src/core/rounds.ts';

const project = {
  recordingMode: 'product',
  formatVersion: 2,
  name: 'round-tests',
  deliveryGroupsDir: '.mendi/delivery-groups',
  activeDeliveryId: 'd01',
  archivedChangeCount: 2,
  deliveries: [
    { id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' },
    { id: 'old', manifestRef: '.mendi/delivery-groups/old/manifest.json' },
  ],
};
function scope(...slots: string[]) {
  return {
    goal: slots.join(' / '),
    plannedChanges: slots.map((slot) => ({ slot, title: slot, dependsOn: [] })),
  };
}
function manifest() {
  const rounds: DeliveryRound[] = [
    {
      id: 'r001',
      origin: { kind: 'open', runRef: '.mendi/runs/d01/001-delivery-open/run.md' },
      openedOn: '2026-10-16',
      scope: scope('P09', 'P10-L'),
      state: 'closed',
      currentBatchId: '002-changes',
      closedOn: '2026-10-16',
      fullTestRunRef: '.mendi/runs/d01/009-delivery-full-test/run.md',
      deliveryRunRef: '.mendi/runs/d01/010-delivery-close/run.md',
      closeRunRef: '.mendi/runs/d01/010-delivery-close/run.md',
    },
    {
      id: 'r002',
      origin: { kind: 'reopen', runRef: '.mendi/runs/d01/011-delivery-reopen/run.md' },
      openedOn: '2026-10-16',
      reason: '继续扩展',
      scope: scope('P10', 'P13'),
      state: 'open',
      currentBatchId: null,
      deliveryRunRef: '.mendi/runs/d01/011-delivery-reopen/run.md',
    },
  ];
  return projectRound(
    {
      recordingMode: 'product',
      formatVersion: 2,
      id: 'd01',
      title: 'D01',
      openedOn: '2026-10-16',
      activeChangeId: null,
      changeBindings: ['P09', 'P10-L'].map((planningSlot, i) => ({
        planningSlot,
        changeId: `change-${i}`,
        archiveOrdinal: i + 1,
        state: 'archived',
        changeRef: `openspec/changes/archive/2026-10-16-00${i + 1}-change-${i}`,
        batchId: '002-changes',
        latestRunRef: `.mendi/runs/d01/002-changes/change-${i}/00${i + 3}-archive/run.md`,
      })),
      changeBatches: [
        {
          id: '002-changes',
          firstRun: '002',
          runsRef: '.mendi/runs/d01/002-changes',
          changeIds: ['change-0', 'change-1'],
        },
      ],
    },
    rounds,
    'r002',
  );
}
function read(value: Record<string, unknown> = manifest()) {
  return parseWorkspace(parseProject(project), value);
}

test('两轮保存真实范围与旧指针，当前投影不继承旧 PASS / Close；解析无写入', () => {
  const input = manifest(),
    before = structuredClone(input);
  const workspace = read(input);
  assert.equal(workspace.currentRoundId, 'r002');
  assert.deepEqual(workspace.scope, scope('P10', 'P13'));
  assert.deepEqual(workspace.rounds![0].scope, scope('P09', 'P10-L'));
  assert.equal(workspace.rounds![0].closeRunRef, '.mendi/runs/d01/010-delivery-close/run.md');
  assert.equal(workspace.manifest.fullTestRunRef, undefined);
  assert.equal(workspace.manifest.closeRunRef, undefined);
  assert.equal(workspace.manifest.reopenedOn, '2026-10-16');
  assert.equal(workspace.manifest.openedOn, '2026-10-16');
  assert.deepEqual(input, before);
  assert.doesNotThrow(() => requireWritable(workspace));
});

test('v2 索引可解释登记 v1；v1 单批次和 manual 不补轮次，不接受反向版本混合', () => {
  const legacy = {
    recordingMode: 'product',
    formatVersion: 1,
    id: 'old',
    title: 'old',
    openedOn: '2026-10-16',
    state: 'open',
    ...scope('A'),
    activeChangeId: 'old-change',
    changeBindings: [
      {
        planningSlot: 'A',
        changeId: 'old-change',
        changeRef: 'openspec/changes/old-change',
        state: 'active',
        batchId: '001-changes',
        latestRunRef: '.mendi/runs/old/001-changes/old-change/001-explore/run.md',
      },
    ],
    changeBatches: [
      {
        id: '001-changes',
        firstRun: '001',
        runsRef: '.mendi/runs/old/001-changes',
        changeIds: ['old-change'],
      },
    ],
  };
  for (const version of [1, 2]) {
    const workspace = parseWorkspace(
      parseProject({ ...project, formatVersion: version }, 'old'),
      legacy,
    );
    assert.equal(workspace.rounds, undefined);
    assert.throws(() => requireWritable(workspace), { code: 'legacy-product-read-only' });
  }
  assert.throws(() => parseWorkspace(parseProject({ ...project, formatVersion: 1 }), manifest()), {
    code: 'invalid-record',
  });
  for (const version of [0, 3, '2', null])
    assert.throws(() => parseProject({ ...project, formatVersion: version }), {
      code: 'unsupported-record-format',
    });
  const manual = parseWorkspace(
    parseProject(
      { ...project, recordingMode: 'manual-bootstrap', formatVersion: undefined },
      'old',
    ),
    {
      ...legacy,
      recordingMode: 'manual-bootstrap',
      formatVersion: undefined,
      changeBindings: [],
      activeChangeId: null,
      changeBatches: [],
      next: { action: 'explore', status: 'awaiting-instruction' },
    },
  );
  assert.equal(manual.rounds, undefined);
  assert.throws(() => requireWritable(manual), { code: 'manual-history-read-only' });
});

test('拒绝重复轮次、跨轮槽位、错误当前选择和矛盾投影', () => {
  for (const change of [
    (m: Record<string, unknown>) => {
      m.rounds = [];
    },
    (m: Record<string, unknown>) => {
      (m.rounds as DeliveryRound[])[1].id = 'r001';
    },
    (m: Record<string, unknown>) => {
      (m.rounds as DeliveryRound[])[1].scope = scope('P09');
    },
    (m: Record<string, unknown>) => {
      m.currentRoundId = 'r001';
    },
    (m: Record<string, unknown>) => {
      m.goal = '被覆盖';
    },
    (m: Record<string, unknown>) => {
      m.plannedChanges = scope('OTHER').plannedChanges;
    },
    (m: Record<string, unknown>) => {
      m.fullTestRunRef = '.mendi/runs/d01/009-delivery-full-test/run.md';
    },
    (m: Record<string, unknown>) => {
      m.currentBatchId = '002-changes';
    },
    (m: Record<string, unknown>) => {
      m.reopenedOn = '2026-10-17';
    },
    (m: Record<string, unknown>) => {
      (m.rounds as DeliveryRound[])[0].openedOn = '2026-02-30';
    },
    (m: Record<string, unknown>) => {
      (m.rounds as DeliveryRound[])[0].state = 'open';
    },
    (m: Record<string, unknown>) => {
      (m.rounds as DeliveryRound[])[0].closeRunRef = undefined;
    },
  ]) {
    const value = manifest();
    change(value);
    assert.throws(() => read(value), { code: 'invalid-rounds' });
  }
});

test('关联和批次必须唯一归属，不给旧 binding / Run 补写 roundId', () => {
  const m = manifest(),
    rounds = m.rounds as DeliveryRound[];
  rounds[1].currentBatchId = '012-changes';
  delete rounds[1].deliveryRunRef;
  const bindings = m.changeBindings as Record<string, unknown>[];
  bindings.push({
    planningSlot: 'P10',
    changeId: 'new-change',
    changeRef: 'openspec/changes/new-change',
    state: 'active',
    batchId: '012-changes',
    latestRunRef: '.mendi/runs/d01/012-changes/new-change/012-explore/run.md',
  });
  (m.changeBatches as Record<string, unknown>[]).push({
    id: '012-changes',
    firstRun: '012',
    runsRef: '.mendi/runs/d01/012-changes',
    changeIds: ['new-change'],
  });
  m.activeChangeId = 'new-change';
  const valid = projectRound(m, rounds, 'r002');
  const workspace = read(valid);
  assert.equal(workspace.bindings[0].batchId, '002-changes');
  assert.equal(workspace.bindings[2].batchId, '012-changes');
  assert.ok(workspace.bindings.every((b) => !('roundId' in b)));
  const unowned = structuredClone(valid);
  (unowned.changeBindings as Record<string, unknown>[])[0].planningSlot = 'UNKNOWN';
  assert.throws(() => read(unowned), { code: 'invalid-rounds' });
  const mixed = structuredClone(valid);
  (mixed.changeBindings as Record<string, unknown>[])[2].planningSlot = 'P13';
  (mixed.rounds as DeliveryRound[])[0].scope = scope('P09', 'P10');
  (mixed.changeBindings as Record<string, unknown>[])[1].planningSlot = 'P10';
  (mixed.rounds as DeliveryRound[])[1].scope = scope('P10-L', 'P13');
  // Move a historical member into the new scope while retaining its old batch.
  (mixed.changeBindings as Record<string, unknown>[])[0].planningSlot = 'P10-L';
  const projected = projectRound(mixed, mixed.rounds as DeliveryRound[], 'r002');
  assert.throws(() => read(projected));
});

test('legacy-baseline 只保存实际来源，不伪造 Open；可保留合法未收口首轮', () => {
  const m = manifest();
  const first: DeliveryRound = {
    id: 'r001',
    origin: { kind: 'legacy-baseline', sourceRefs: ['.mendi/delivery-groups/d01/manifest.json'] },
    openedOn: '2026-10-16',
    scope: scope('A'),
    state: 'open',
    currentBatchId: null,
  };
  m.changeBindings = [];
  m.changeBatches = [];
  const valid = projectRound(m, [first], 'r001');
  assert.equal(read(valid).rounds![0].origin.runRef, undefined);
  for (const origin of [
    { kind: 'legacy-baseline', sourceRefs: [] },
    { kind: 'legacy-baseline', sourceRefs: ['../other'] },
    { kind: 'legacy-baseline', sourceRefs: ['.mendi/runs/d01/../other'] },
    { ...first.origin, runRef: '.mendi/runs/d01/001-delivery-open/run.md' },
  ])
    assert.throws(() => read(projectRound(m, [{ ...first, origin } as DeliveryRound], 'r001')));
});
