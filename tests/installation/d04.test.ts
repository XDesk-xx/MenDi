import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { installedSession, installedCommand } from './support.ts';
import { legacyTarget } from '../migration-support.ts';
import { groupTarget, writeGroupInput } from '../group-support.ts';
import { pnpmEntry } from '../test-support.ts';
import { repository } from '../helpers.ts';
import { loadChangeMethods } from '../../src/adapters/methods.ts';

test('安装后CLI：旧活动draft只读 / 预览 / 显式迁移，pending拒绝且保留原记录', () => {
  const session = installedSession(),
    invoke = installedCommand(session, 'd04-migration');
  const { root, started, projectRef, manifestRef } = legacyTarget(true);
  const ref = started!.run.ref,
    original = fs.readFileSync(path.join(root, ref));
  const p = fs.readFileSync(projectRef),
    m = fs.readFileSync(manifestRef);
  assert.equal(invoke(root, ['status']).ok, true);
  const preview = invoke(root, ['delivery', 'migrate', 'preview']);
  assert.ok(fs.readFileSync(projectRef).equals(p) && fs.readFileSync(manifestRef).equals(m));
  fs.writeFileSync(path.join(root, 'preview.json'), JSON.stringify(preview.plan));
  const migrated = invoke(root, [
    'delivery',
    'migrate',
    'apply',
    '--input',
    'preview.json',
    '--role',
    'author',
    '--actor',
    'migration-author',
  ]);
  assert.equal(migrated.result, 'migrated');
  assert.ok(fs.readFileSync(path.join(root, ref)).equals(original));
  const current = JSON.parse(fs.readFileSync(manifestRef, 'utf8'));
  assert.equal(current.activeChangeId, 'proof-entry');
  assert.equal(current.changeBindings[0].latestRunRef, ref);
  const pending = legacyTarget(true),
    index = JSON.parse(fs.readFileSync(pending.projectRef, 'utf8'));
  index.pendingDeliveryRunRef = '.mendi/runs/d01/002-delivery-close/run.md';
  fs.writeFileSync(pending.projectRef, JSON.stringify(index));
  const bytes = fs.readFileSync(pending.projectRef);
  const rejected = invoke(pending.root, ['delivery', 'migrate', 'preview'], 1);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, 'delivery-commit-pending');
  assert.equal(rejected.error.details.pendingDeliveryRunRef, index.pendingDeliveryRunRef);
  assert.ok(fs.readFileSync(pending.projectRef).equals(bytes));
  assert.equal(fs.existsSync(path.join(pending.root, '.mendi/write.lock')), false);
});

test('安装后CLI：失败 / 尾项续测 / 原失败修复与审核夹具 / 局部复验 / 多来源 / Close及Reopen', () => {
  const session = installedSession(),
    invoke = installedCommand(session, 'd04-groups');
  const { root, declaration } = groupTarget();
  const author = ['--role', 'author', '--actor', 'delivery-author'];
  const reviewer = ['--role', 'reviewer', '--actor', 'independent-fixture-reviewer'];
  const write = (file: string, value: unknown) =>
    fs.writeFileSync(path.join(root, file), JSON.stringify(value));
  const run = (exit = 0) =>
    invoke(
      root,
      [
        'delivery',
        'full-test',
        'run',
        '--input',
        'group-input.json',
        '--pnpm-bin',
        pnpmEntry,
        ...author,
      ],
      exit,
    );
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('middle',()=>{throw Error('controlled middle failure')});",
  );
  write('group-control.json', { stopAfter: 'middle' });
  const first = run(1),
    original = fs.readFileSync(path.join(root, first.run.ref));
  assert.equal(first.groupExecution.protocolState, 'valid');
  write('group-control.json', {});
  writeGroupInput(root, {
    ...declaration,
    purpose: 'continue',
    selection: ['tail'],
    fromRunRef: first.run.ref,
  });
  const tail = run();
  assert.deepEqual(
    tail.run.attempt.progress.map((p: { state: string }) => p.state),
    ['passed', 'failed', 'passed'],
  );
  const candidate = {
    ...declaration.candidate,
    id: 'c2',
    basis: {
      ...declaration.candidate.basis,
      changes: '只修复middle真实断言，prefix / tail材料与依赖未变',
    },
  };
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('middle',()=>{});",
  );
  write('impact.json', {
    candidate,
    extent: 'local',
    affectedGroupIds: ['middle'],
    retained: ['prefix', 'tail'].map((id) => ({
      id,
      reason: '该组材料和依赖未被middle局部修复影响',
    })),
    reason: '受控局部修复，阶段标签只为准入夹具',
  });
  const repair = invoke(root, [
    'delivery',
    'repair',
    'start',
    '--from',
    first.run.ref,
    '--reason',
    '受控middle修复',
    '--input',
    'impact.json',
    ...author,
  ]);
  const submit = (ref: string, actor: string[], review = false) => {
    fs.writeFileSync(
      path.join(root, 'body.md'),
      '隔离安装接线测试的完整阶段正文；不批准MenDi根工作。\n',
    );
    invoke(root, ['run', 'save', '--run', ref, '--body', 'body.md', ...actor]);
    return invoke(root, [
      'run',
      'submit',
      '--run',
      ref,
      '--outcome',
      'complete',
      '--result',
      '受控修复核对完成',
      ...(review ? ['--verdict', 'approved'] : []),
      ...actor,
    ]);
  };
  submit(repair.run.ref, author);
  const review = invoke(root, [
    'delivery',
    'repair',
    'review',
    '--author-run',
    repair.run.ref,
    ...reviewer,
  ]);
  submit(review.run.ref, reviewer, true);
  writeGroupInput(root, {
    ...declaration,
    purpose: 'retest',
    candidate,
    selection: ['middle'],
    fromRunRef: review.run.ref,
  });
  const retest = run();
  assert.deepEqual(retest.run.attempt.selection, ['middle']);
  write('verify.json', {
    fromRunRef: retest.run.ref,
    planRef: 'group-plan.json',
    candidate,
    sources: [
      { id: 'prefix', runRef: first.run.ref, applicability: '当前修复审核认可原prefix材料仍适用' },
      { id: 'middle', runRef: retest.run.ref, applicability: '当前候选真实局部复验' },
      { id: 'tail', runRef: tail.run.ref, applicability: '当前修复审核认可tail材料仍适用' },
    ],
  });
  const verified = invoke(root, [
    'delivery',
    'verification',
    'create',
    '--input',
    'verify.json',
    ...author,
  ]);
  assert.equal(verified.candidateVerification.conclusion, 'verified');
  assert.ok(fs.readFileSync(path.join(root, first.run.ref)).equals(original));
  write('close.json', {
    verificationRunRef: verified.run.ref,
    applicability: {
      conclusion: 'applicable',
      materials: candidate.basis.materials,
      changes: candidate.basis.changes,
      reason: '实际安装候选由本轮多来源覆盖',
    },
  });
  const closed = invoke(root, ['delivery', 'close', '--input', 'close.json', ...author]);
  assert.equal(closed.local.state, 'closed');
  write('reopen.json', {
    goal: '独立新轮',
    plannedChanges: [{ slot: 'C', title: '增量工作', dependsOn: [] }],
  });
  const reopened = invoke(root, [
    'delivery',
    'reopen',
    '--scope',
    'reopen.json',
    '--reason',
    '受控新轮',
    ...author,
  ]);
  assert.equal(reopened.local.currentRoundId, 'r002');
  assert.equal(reopened.local.verificationRunRef, undefined);
});

test('候选包六阶段正文与当前来源一致，Reviewer无Author上游，未选Storybook不强制加载', () => {
  const session = installedSession(),
    { root } = legacyTarget();
  for (const stage of [
    'explore',
    'propose',
    'review-explore',
    'review-propose',
    'apply',
    'review-apply',
  ] as const) {
    const actual = fs.readFileSync(
      path.join(session.installedRoot, `skills/actions/${stage}/SKILL.md`),
    );
    assert.ok(
      actual.equals(fs.readFileSync(path.join(repository, `skills/actions/${stage}/SKILL.md`))),
    );
    if (stage.startsWith('review-')) {
      const method = loadChangeMethods(stage, [], root, session.installedRoot);
      assert.equal(method.stage.content, actual.toString());
      assert.equal(method.upstream.length, 0);
      assert.equal(method.guidance.length, 0);
    }
  }
});
