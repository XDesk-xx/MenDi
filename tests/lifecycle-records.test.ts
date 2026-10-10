import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProject, parseWorkspace } from '../src/core/records.ts';
import { completionScope, verificationScope } from '../src/core/delivery-verification.ts';
import { parseDeliveryRun } from '../src/core/delivery-runs.ts';
import { parseArguments } from '../src/drivers/arguments.ts';
import { MendiError } from '../src/core/errors.ts';

const project = {
  formatVersion: 1,
  recordingMode: 'product',
  name: 'fixture',
  deliveryGroupsDir: '.mendi/delivery-groups',
  activeDeliveryId: 'd01',
  archivedChangeCount: 2,
  deliveries: [
    { id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' },
    { id: 'd02', manifestRef: '.mendi/delivery-groups/d02/manifest.json' },
  ],
};
const scope = { goal: '新一轮', plannedChanges: [{ slot: 'B', title: 'B', dependsOn: [] }] };
const old = {
  planningSlot: 'A',
  changeId: 'first',
  state: 'archived',
  archiveOrdinal: 1,
  changeRef: 'openspec/changes/archive/2026-10-10-001-first',
  batchId: '001-changes',
  latestRunRef: '.mendi/runs/d01/001-changes/first/007-archive/run.md',
};
const current = {
  ...old,
  planningSlot: 'B',
  changeId: 'second',
  archiveOrdinal: 2,
  changeRef: 'openspec/changes/archive/2026-10-10-002-second',
  batchId: '010-changes',
  latestRunRef: '.mendi/runs/d01/010-changes/second/016-archive/run.md',
};
const batches = [
  {
    id: '001-changes',
    firstRun: '001',
    runsRef: '.mendi/runs/d01/001-changes',
    changeIds: ['first'],
  },
  {
    id: '010-changes',
    firstRun: '010',
    runsRef: '.mendi/runs/d01/010-changes',
    changeIds: ['second'],
  },
];
const manifest = {
  formatVersion: 1,
  recordingMode: 'product',
  id: 'd01',
  title: 'D01',
  state: 'open',
  openedOn: '2026-10-10',
  ...scope,
  activeChangeId: null,
  changeBindings: [old, current],
  changeBatches: batches,
  currentBatchId: '010-changes',
};
test('多索引和多批次显式选择，旧 ordinal 小于总数可解释，执行准入另核对', () => {
  assert.equal(parseProject(project, 'd02').id, 'd02');
  assert.equal(project.activeDeliveryId, 'd01');
  const workspace = parseWorkspace(parseProject(project), manifest);
  assert.deepEqual(
    completionScope(workspace).completed.map((item) => item.changeId),
    ['second'],
  );
  assert.equal(verificationScope(workspace).completed[0].archiveOrdinal, 2);
  const older = parseWorkspace(parseProject({ ...project, archivedChangeCount: 3 }), manifest);
  assert.equal(completionScope(older).completed.length, 1);
  assert.throws(() => verificationScope(older), MendiError);
  const legacy = {
    ...manifest,
    goal: '原范围',
    plannedChanges: [{ slot: 'A', title: 'A', dependsOn: [] }],
    changeBindings: [old],
    changeBatches: [batches[0]],
    currentBatchId: undefined,
  };
  assert.equal(parseWorkspace(parseProject(project), legacy).bindings.length, 1);
  for (const bad of [
    { ...manifest, currentBatchId: undefined },
    { ...manifest, currentBatchId: 'missing' },
    { ...manifest, currentBatchId: null },
    { ...manifest, activeChangeId: 'first' },
    { ...manifest, changeBatches: [batches[0], { ...batches[1], changeIds: ['first'] }] },
    { ...manifest, changeBatches: [batches[0], batches[0]] },
    { ...manifest, changeBindings: [old, { ...current, archiveOrdinal: 1 }] },
    { ...manifest, changeBindings: [old, { ...current, batchId: '001-changes' }] },
  ])
    assert.throws(() => parseWorkspace(parseProject(project), bad), MendiError);
  for (const bad of [
    { ...project, deliveries: [project.deliveries[0], project.deliveries[0]] },
    { ...project, activeDeliveryId: 'missing' },
  ])
    assert.throws(() => parseProject(bad), MendiError);
});
test('生命周期独立头部拒绝错身份、类型、角色、路径及多余执行字段', () => {
  const ref = '.mendi/runs/d02/001-delivery-open/run.md';
  const run = {
    formatVersion: 1,
    recordingMode: 'product',
    scope: 'delivery',
    deliveryId: 'd02',
    changeId: null,
    runNumber: 1,
    actionId: 'd02-001-delivery-open',
    actionType: 'delivery-open',
    role: 'author',
    actorId: 'a',
    status: 'submitted',
    stageSkill: 'delivery-open',
    toolGuidance: [],
    outcome: 'complete',
    result: 'opened',
    lifecycle: {
      operation: 'delivery-open',
      sourceDeliveryId: null,
      scope,
      recordedOn: '2026-10-10',
      title: 'D02',
    },
  };
  assert.equal(parseDeliveryRun(run, ref, 'd02').lifecycle?.operation, 'delivery-open');
  for (const bad of [
    { ...run, role: 'reviewer' },
    { ...run, stageSkill: 'delivery-close' },
    { ...run, result: 'passed' },
    { ...run, deliveryId: 'd01' },
    { ...run, fullTest: {} },
    { ...run, lifecycle: { ...run.lifecycle, operation: 'delivery-reopen' } },
    { ...run, actorId: '' },
  ])
    assert.throws(() => parseDeliveryRun(bad, ref, 'd02'), MendiError);
  assert.throws(() => parseDeliveryRun(run, ref.replace('d02', 'd01'), 'd02'), MendiError);
});
test('CLI lifecycle resume、记录化首次身份与历史选择参数互斥', () => {
  assert.equal(
    parseArguments([
      'delivery',
      'close',
      '--project',
      'p',
      '--resume',
      'r',
      '--role',
      'author',
      '--actor',
      'a',
    ]).values.resume,
    'r',
  );
  assert.equal(
    parseArguments(['status', '--project', 'p', '--delivery', 'd01']).values.delivery,
    'd01',
  );
  assert.equal(
    parseArguments([
      'test',
      'status',
      '--project',
      'p',
      '--execution',
      '001-full',
      '--delivery',
      'd02',
    ]).values.delivery,
    'd02',
  );
  for (const args of [
    ['delivery', 'close', '--project', 'p', '--input', 'i'],
    [
      'delivery',
      'open',
      '--project',
      'p',
      '--id',
      'd',
      '--title',
      't',
      '--scope',
      's',
      '--role',
      'author',
    ],
    [
      'delivery',
      'reopen',
      '--project',
      'p',
      '--resume',
      'r',
      '--role',
      'author',
      '--actor',
      'a',
      '--input',
      'i',
    ],
    [
      'delivery',
      'open',
      '--project',
      'p',
      '--resume',
      'r',
      '--role',
      'author',
      '--actor',
      'a',
      '--id',
      'd',
    ],
  ])
    assert.throws(() => parseArguments(args), MendiError);
});
test('Close 快照的批准编号必须早于其固定正式入口，查询不读取快照来源正文', () => {
  const acceptance = {
    scope: { ...scope, completed: [{ slot: 'B', changeId: 'second', archiveOrdinal: 2 }] },
    collection: ['unit'],
    basis: { materials: '结构解析夹具，不认证真实执行。', changes: '' },
    approvals: [
      {
        changeId: 'second',
        authorActor: 'author',
        reviewerActor: 'reviewer',
        authorRunRef: '.mendi/runs/d01/010-changes/second/014-apply/run.md',
        reviewRunRef: '.mendi/runs/d01/010-changes/second/015-review-apply/run.md',
        archiveRunRef: current.latestRunRef,
      },
    ],
    entry: { scriptName: 'test:full', scriptText: 'node --test', pnpmBin: 'C:/tools/pnpm.js' },
    phase: 'finished',
    executionId: '001-full',
    outcome: 'passed',
  };
  const ref = '.mendi/runs/d01/019-delivery-close/run.md';
  const run = {
    formatVersion: 1,
    recordingMode: 'product',
    scope: 'delivery',
    deliveryId: 'd01',
    changeId: null,
    runNumber: 19,
    actionId: 'd01-019-delivery-close',
    actionType: 'delivery-close',
    role: 'author',
    actorId: 'author',
    status: 'submitted',
    stageSkill: 'delivery-close',
    toolGuidance: [],
    outcome: 'complete',
    result: 'closed',
    lifecycle: {
      operation: 'delivery-close',
      sourceDeliveryId: 'd01',
      scope,
      recordedOn: '2026-10-10',
      fullTestRunRef: '.mendi/runs/d01/017-delivery-full-test/run.md',
      acceptance,
      applicability: {
        conclusion: 'applicable',
        materials: '结构夹具',
        changes: '',
        reason: '测试必要字段',
      },
    },
  };
  assert.equal(parseDeliveryRun(run, ref, 'd01').lifecycle?.acceptance?.outcome, 'passed');
  const bad = {
    ...run,
    lifecycle: {
      ...run.lifecycle,
      acceptance: {
        ...acceptance,
        approvals: [
          {
            ...acceptance.approvals[0],
            archiveRunRef: current.latestRunRef.replace('016-archive', '018-archive'),
          },
        ],
      },
    },
  };
  assert.throws(() => parseDeliveryRun(bad, ref, 'd01'), MendiError);
});
