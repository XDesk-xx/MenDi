import assert from 'node:assert/strict';
import test from 'node:test';
import { groupPlan, candidate, selectGroups } from '../src/core/group-plan.ts';
import { interpretReport, stageTimings, type GroupRequest } from '../src/core/group-report.ts';
import type { TestExecution } from '../src/core/test-execution.ts';
import { parseImpact } from '../src/core/repair-record.ts';

const group = {
  id: 'unit',
  title: '业务单元',
  kind: 'tests',
  required: true,
  dependsOn: [],
  resources: [],
  selection: ['unit.test.ts'],
  completion: '真实断言及容器结束',
  preparation: '无外部资源',
  exclusions: [],
};
export const planValue = { protocol: 'mendi-group-tests/1', groups: [group] };
export const candidateValue = {
  id: 'c1',
  basis: { materials: '受控代码、测试与配置', changes: '' },
};
test('计划版本、前向依赖、非必需排除与选择均明确', () => {
  const p = groupPlan(planValue);
  assert.deepEqual(selectGroups(p, ['unit']), ['unit']);
  candidate(candidateValue);
  for (const value of [
    { ...planValue, protocol: 'v2' },
    { ...planValue, groups: [group, group] },
    { ...planValue, groups: [{ ...group, dependsOn: ['later'] }] },
    { ...planValue, groups: [{ ...group, required: false }] },
  ])
    assert.throws(() => groupPlan(value));
  assert.throws(() => selectGroups(p, ['unknown']));
  const expanded = {
    ...planValue,
    groups: [group, { ...group, id: 'tail', selection: ['tail.test.ts'] }],
  };
  for (const extent of ['common', 'unknown'])
    assert.throws(() =>
      parseImpact(
        {
          candidate: candidateValue,
          affectedGroupIds: ['unit'],
          retained: [{ id: 'tail', reason: '不能缩小公共影响' }],
          extent,
          reason: '公共变动',
        },
        expanded,
      ),
    );
  assert.deepEqual(
    parseImpact(
      {
        candidate: candidateValue,
        affectedGroupIds: ['unit', 'tail'],
        retained: [],
        extent: 'common',
        reason: '公共配置变化须全部复验',
      },
      expanded,
    ).affectedGroupIds,
    ['unit', 'tail'],
  );
});
test('覆盖、退出、协议矛盾与资源未知分别解释', () => {
  const request = {
    protocol: 'mendi-group-tests/1',
    projectRoot: 'target',
    deliveryId: 'd01',
    roundId: 'r001',
    runRef: 'run',
    executionId: '001-full',
    candidate: candidate(candidateValue),
    plan: groupPlan(planValue),
    selection: ['unit'],
    prerequisites: [],
    reportRef: 'report',
    eventsRef: 'events',
  } as GroupRequest;
  const child = { outcome: 'passed', exitCode: 0, executionState: 'finished' } as TestExecution;
  const receipt = {
    id: 'unit',
    state: 'passed',
    selection: group.selection,
    enumerated: true,
    finished: true,
    cleanup: 'confirmed',
    exclusions: [],
    exitCode: 0,
    counts: { total: 1, passed: 1, failed: 0, cancelled: 0, skipped: 0, todo: 0, pending: 0 },
  };
  const report = {
    protocol: request.protocol,
    request,
    complete: true,
    cleanup: 'confirmed',
    groups: [receipt],
  };
  assert.equal(interpretReport(report, request, child).protocolState, 'valid');
  for (const counts of [
    { total: 1, passed: 0, failed: 0, cancelled: 0, skipped: 1, todo: 0, pending: 0 },
    { total: 0, passed: 0, failed: 0, cancelled: 0, skipped: 0, todo: 0, pending: 0 },
  ]) {
    const observation = interpretReport(
      { ...report, groups: [{ ...receipt, counts }] },
      request,
      child,
    );
    assert.equal(observation.protocolState, 'invalid');
    assert.equal(observation.groups[0].state, 'failed');
  }
  assert.equal(
    interpretReport({ ...report, cleanup: 'unknown' }, request, child).protocolState,
    'unconfirmed',
  );
  assert.equal(
    interpretReport({ ...report, request: { ...request, executionId: 'old' } }, request, child)
      .protocolState,
    'invalid',
  );
  assert.equal(
    interpretReport(report, request, { ...child, outcome: 'failed', exitCode: 7 }).protocolState,
    'invalid',
  );
  assert.equal(
    interpretReport(report, request, { ...child, outcome: 'interrupted' }).groups[0].state,
    'interrupted',
  );
});
test('阶段包含关系不跨时钟相减', () => {
  const parent = {
    id: 'root',
    clock: 'runner',
    utc: new Date().toISOString(),
    startMs: 0,
    durationMs: 10,
    phase: '执行',
  };
  assert.equal(
    stageTimings([parent, { ...parent, id: 'child', parent: 'root', startMs: 1, durationMs: 2 }])
      .length,
    2,
  );
  assert.throws(() =>
    stageTimings([parent, { ...parent, id: 'child', parent: 'root', clock: 'other' }]),
  );
});
