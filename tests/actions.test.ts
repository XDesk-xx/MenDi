import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, sandbox, snapshot } from './helpers.ts';
import { createWorkspace, readWorkspace } from '../src/adapters/workspace.ts';
import { query } from '../src/application/project.ts';
import { renderRun } from '../src/adapters/runs.ts';
import type { ProcessRunner } from '../src/adapters/openspec.ts';
import {
  actionDefinition,
  actionNext,
  assertActionStart,
  parseRun,
  type RunRecord,
} from '../src/core/actions.ts';

const ref = '.mendi/runs/d01/001-changes/proof-entry/001-explore/run.md';
const header: RunRecord = {
  formatVersion: 1,
  recordingMode: 'product',
  deliveryId: 'd01',
  changeId: 'proof-entry',
  runNumber: 1,
  actionId: 'proof-entry-001-explore',
  actionType: 'explore',
  role: 'author',
  actorId: 'author-one',
  status: 'draft',
  stageSkill: 'explore',
  toolGuidance: [],
};
function target() {
  const root = fixture(sandbox());
  fs.mkdirSync(path.join(root, 'openspec/changes/proof-entry'), { recursive: true });
  createWorkspace(
    root,
    {
      formatVersion: 1,
      recordingMode: 'product',
      name: 'test',
      deliveryGroupsDir: '.mendi/delivery-groups',
      activeDeliveryId: 'd01',
      deliveries: [{ id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' }],
    },
    {
      formatVersion: 1,
      recordingMode: 'product',
      id: 'd01',
      title: '测试',
      state: 'open',
      openedOn: '2026-10-10',
      goal: '验证',
      plannedChanges: [{ slot: 'A', title: '入口', dependsOn: [] }],
      activeChangeId: 'proof-entry',
      changeBindings: [
        {
          planningSlot: 'A',
          changeId: 'proof-entry',
          changeRef: 'openspec/changes/proof-entry',
          state: 'active',
          latestRunRef: ref,
          batchId: '001-changes',
        },
      ],
      changeBatches: [
        {
          id: '001-changes',
          firstRun: '001',
          runsRef: '.mendi/runs/d01/001-changes',
          changeIds: ['proof-entry'],
        },
      ],
    },
  );
  fs.mkdirSync(path.dirname(path.join(root, ref)), { recursive: true });
  fs.writeFileSync(path.join(root, ref), renderRun({ ...header }, '工作中\n'));
  const runner: ProcessRunner = (_entry, args, cwd) => ({
    status: 0,
    signal: null,
    stderr: '',
    stdout:
      args[0] === '--version'
        ? '1.14.1'
        : JSON.stringify({
            root: { path: cwd, source: 'nearest' },
            changes: [{ name: 'proof-entry' }],
            changeName: 'proof-entry',
            schemaName: 'spec-driven',
            actionContext: { mode: 'repo-local' },
            isPlanningComplete: true,
            artifacts: [{ id: 'proposal', status: 'done' }],
          }),
  });
  return { root, runner };
}
test('产品 Run 校验真实身份与状态，未知说明不产生路径依赖', () => {
  assert.deepEqual(
    parseRun({ ...header, unknownRef: { nestedRef: '../missing' } }, ref, 'd01', 'proof-entry'),
    header,
  );
  for (const change of [
    { changeId: 'other' },
    { runNumber: 2 },
    { role: 'reviewer' },
    { stageSkill: 'apply' },
    { status: 'draft', verdict: 'approved' },
    { status: 'submitted' },
    { toolGuidance: ['unsupported'] },
    { actionId: 'proof-entry-002-explore' },
  ])
    assert.throws(() => parseRun({ ...header, ...change }, ref, 'd01', 'proof-entry'));
  assert.throws(() => parseRun(header, '../outside/run.md', 'd01', 'proof-entry'));
  assert.throws(() => parseRun(header, ref, 'other', 'proof-entry'));
});
test('Run 进展、Author 完成和三种 Review verdict 产生最小 next', () => {
  assert.equal(actionNext(header, ref).action, 'run-save-or-submit');
  assert.equal(
    actionNext({ ...header, status: 'submitted', outcome: 'continuing', result: '进展' }, ref)
      .action,
    'action-continue',
  );
  assert.equal(
    actionNext({ ...header, status: 'submitted', outcome: 'complete', result: '完成' }, ref).action,
    'review-explore',
  );
  for (const [verdict, next] of [
    ['approved', 'propose'],
    ['changes-requested', 'revise-explore'],
    ['rejected', 'owner-decision'],
  ] as const) {
    const reviewer: RunRecord = {
      ...header,
      actionId: 'proof-entry-002-review-explore',
      runNumber: 2,
      actionType: 'review-explore',
      stageSkill: 'review-explore',
      role: 'reviewer',
      actorId: 'reviewer-one',
      status: 'submitted',
      outcome: 'complete',
      result: '结论',
      authorRunRef: ref,
      verdict,
    };
    const reviewRef = ref.replace('001-explore', '002-review-explore');
    assert.deepEqual(parseRun(reviewer, reviewRef, 'd01', 'proof-entry'), reviewer);
    assert.equal(actionNext(reviewer, reviewRef).action, next);
    assert.equal(actionNext(reviewer, reviewRef).executable, false);
    assert.throws(() =>
      parseRun({ ...reviewer, outcome: 'continuing' }, reviewRef, 'd01', 'proof-entry'),
    );
  }
  assert.equal(actionDefinition('revise-apply').skill, 'apply');
  assert.equal(actionDefinition('archive').skill, 'archive');
  assert.equal(actionDefinition('archive').role, 'author');
  assert.throws(() => actionDefinition('review-archive'));
  assert.throws(() => actionDefinition('revise-archive'));
});
test('查询只解析当前 Run，坏旧 Run 和失效说明不成为运行前置', () => {
  const { root, runner } = target();
  fs.writeFileSync(
    path.join(root, ref),
    renderRun(
      { ...header, historicalRef: 'missing.md', unknownRef: { nestedRef: '../outside' } },
      '正文 [说明](missing.md)\n',
    ),
  );
  const past = path.join(root, '.mendi/runs/d01/001-changes/proof-entry/002-explore');
  fs.mkdirSync(past);
  fs.writeFileSync(path.join(past, 'run.md'), '坏历史正文，不解析');
  const before = snapshot(root);
  const result = query({ project: root }, { runner });
  assert.ok('run' in result);
  assert.equal(result.run?.actionId, header.actionId);
  assert.equal(result.next.action, 'run-save-or-submit');
  assert.deepEqual(snapshot(root), before);
  fs.unlinkSync(path.join(root, ref));
  assert.throws(() => query({ project: root }, { runner }), { code: 'run-input-missing' });
});
test('当前 product 指针和批次身份矛盾不能回退猜历史', () => {
  const { root, runner } = target();
  const file = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  value.changeBindings[0].latestRunRef = '../outside/run.md';
  fs.writeFileSync(file, JSON.stringify(value));
  assert.throws(() => readWorkspace(root), { code: 'invalid-record' });
  value.changeBindings[0].latestRunRef = ref;
  fs.writeFileSync(file, JSON.stringify(value));
  fs.writeFileSync(path.join(root, ref), renderRun({ ...header, changeId: 'foreign' }, '正文'));
  assert.throws(() => query({ project: root }, { runner }), { code: 'invalid-run' });
});
test('阶段 start 拒绝 draft / continuing / 错对象；Review 与局部修订有明确边界', () => {
  assert.doesNotThrow(() => assertActionStart(null, 'explore'));
  assert.throws(() => assertActionStart(null, 'propose'), { code: 'action-state-conflict' });
  assert.throws(() => assertActionStart({ ref, record: header }, 'review-explore', ref));
  const author = {
    ...header,
    status: 'submitted',
    outcome: 'complete',
    result: '完成',
  } as RunRecord;
  assert.doesNotThrow(() => assertActionStart({ ref, record: author }, 'review-explore', ref));
  assert.doesNotThrow(() =>
    assertActionStart({ ref, record: author }, 'revise-explore', undefined, ref),
  );
  assert.throws(() => assertActionStart({ ref, record: author }, 'revise-apply', undefined, ref));
  const review = {
    ...author,
    actionType: 'review-explore',
    role: 'reviewer',
    actorId: 'reviewer',
    authorRunRef: ref,
    verdict: 'approved',
  } as RunRecord;
  assert.doesNotThrow(() => assertActionStart({ ref: 'review', record: review }, 'propose'));
  assert.throws(() =>
    assertActionStart({ ref: 'review', record: { ...review, verdict: 'rejected' } }, 'propose'),
  );
  assert.throws(() => assertActionStart({ ref: 'review', record: review }, 'review-explore', ref));
});
