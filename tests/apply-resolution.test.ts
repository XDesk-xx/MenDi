import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { stageTarget, reviewApply, owner } from './delivery-stage-support.ts';
import { resolveAction } from '../src/application/action-resolution.ts';
import { startAction, saveRun, submitRun } from '../src/application/actions.ts';
import { query } from '../src/application/project.ts';
import { options, author, reviewer, finish } from './action-support.ts';
import { cli, isolatedEnv } from './helpers.ts';

test('真实 CLI Apply 回退参数接线，Review / revise 来源只回到较早阶段', () => {
  const t = stageTarget();
  const r = reviewApply(t, 'approved');
  const result = cli(
    [
      'action',
      'resolve',
      '--project',
      t.root,
      '--run',
      r.run.ref,
      '--role',
      'owner',
      '--actor',
      'fixture-owner',
      '--resolution',
      'rollback',
      '--phase',
      'propose',
      '--revises',
      t.refs.propose,
      '--to-role',
      'author',
      '--to-actor',
      'author-two',
      '--reason',
      '明确回退',
      '--json',
    ],
    t.root,
    isolatedEnv(path.dirname(t.root)),
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const revision = JSON.parse(result.stdout);
  assert.equal(revision.run.actionType, 'revise-propose');
  const further = resolveAction(
    {
      ...owner(t.root, revision.run.ref, 'rollback'),
      phase: 'explore',
      revisesRunRef: t.refs.explore,
    },
    options,
  );
  assert.equal(further.run.actionType, 'revise-explore');
});

test('Apply / Review Apply handoff 和 rejected revise 保持直接对象与重新审核', () => {
  const t = stageTarget();
  const old = fs.readFileSync(path.join(t.root, t.apply.run.ref));
  const handed = resolveAction(owner(t.root, t.apply.run.ref, 'handoff'), options);
  assert.equal(handed.run.actionId, t.apply.run.actionId);
  assert.equal(handed.run.actorId, 'author-two');
  assert.deepEqual(fs.readFileSync(path.join(t.root, t.apply.run.ref)), old);
  assert.throws(() =>
    saveRun({ ...author(t.root), runRef: t.apply.run.ref, bodyFile: 'body.md' }, options),
  );

  const r = stageTarget();
  finish(r.root, r.apply.run.ref);
  const review = startAction(
    {
      ...reviewer(r.root),
      changeId: 'proof-entry',
      type: 'review-apply',
      authorRunRef: r.apply.run.ref,
    },
    options,
  );
  assert.throws(() =>
    resolveAction(
      { ...owner(r.root, review.run.ref, 'handoff'), toRole: 'reviewer', toActor: 'author-one' },
      options,
    ),
  );
  const received = resolveAction(
    { ...owner(r.root, review.run.ref, 'handoff'), toRole: 'reviewer', toActor: 'reviewer-two' },
    options,
  );
  assert.equal(received.run.authorRunRef, r.apply.run.ref);
  assert.equal(received.run.verdict, undefined);

  const rejected = stageTarget();
  const rejectedReview = reviewApply(rejected, 'rejected');
  const verdict = fs.readFileSync(path.join(rejected.root, rejectedReview.run.ref));
  const revised = resolveAction(owner(rejected.root, rejectedReview.run.ref, 'revise'), options);
  assert.equal(revised.run.actionType, 'revise-apply');
  assert.equal(revised.run.revisesRunRef, rejected.apply.run.ref);
  assert.deepEqual(fs.readFileSync(path.join(rejected.root, rejectedReview.run.ref)), verdict);
  fs.unlinkSync(path.join(rejected.root, rejectedReview.run.ref));
  assert.equal(query({ project: rejected.root }, options).next.action, 'run-save-or-submit');
});

test('显式 earlier rollback 建立新 Author 和审核链，不使用过去批准跳到 Apply', () => {
  const t = stageTarget();
  const files = [t.apply.run.ref, t.refs.propose, t.refs.explore];
  const before = files.map((p) => fs.readFileSync(path.join(t.root, p)));
  const revision = resolveAction(
    {
      ...owner(t.root, t.apply.run.ref, 'rollback'),
      phase: 'propose',
      revisesRunRef: t.refs.propose,
    },
    options,
  );
  assert.equal(revision.run.actionType, 'revise-propose');
  assert.equal(revision.run.ownerDecision?.sourceRunRef, t.apply.run.ref);
  assert.equal(revision.run.revisesRunRef, t.refs.propose);
  assert.throws(() =>
    startAction({ ...author(t.root), changeId: 'proof-entry', type: 'apply' }, options),
  );
  const bodyFile = path.join(t.root, 'revised.md');
  fs.writeFileSync(bodyFile, '新修订；旧实现不自动删除。');
  const actor = { project: t.root, role: 'author', actor: 'author-two', runRef: revision.run.ref };
  saveRun({ ...actor, bodyFile }, options);
  const completed = submitRun({ ...actor, outcome: 'complete', result: '修订完成' }, options);
  assert.equal(completed.next.action, 'review-propose');
  assert.throws(() =>
    startAction({ ...author(t.root), changeId: 'proof-entry', type: 'apply' }, options),
  );
  const review = startAction(
    {
      ...reviewer(t.root),
      changeId: 'proof-entry',
      type: 'review-propose',
      authorRunRef: revision.run.ref,
    },
    options,
  );
  finish(t.root, review.run.ref, 'reviewer', 'complete', 'approved');
  assert.equal(
    startAction({ ...author(t.root), changeId: 'proof-entry', type: 'apply' }, options).run
      .actionType,
    'apply',
  );
  files.forEach((p, i) => assert.deepEqual(fs.readFileSync(path.join(t.root, p)), before[i]));

  const e = stageTarget();
  assert.equal(
    resolveAction(
      {
        ...owner(e.root, e.apply.run.ref, 'rollback'),
        phase: 'explore',
        revisesRunRef: e.refs.explore,
      },
      options,
    ).run.actionType,
    'revise-explore',
  );
});

test('Owner 回退非法目标、陈旧对象、写前漂移和持久化失败保留现场', () => {
  const t = stageTarget();
  const input = {
    ...owner(t.root, t.apply.run.ref, 'rollback'),
    phase: 'propose',
    revisesRunRef: t.refs.propose,
  };
  const current = fs.readFileSync(path.join(t.root, t.apply.run.ref));
  for (const patch of [
    { role: 'author' },
    { phase: 'apply' },
    { phase: 'other' },
    { revisesRunRef: t.apply.run.ref },
    { revisesRunRef: '../outside.md' },
    { revisesRunRef: undefined },
    { runRef: t.refs.explore },
    { toRole: 'reviewer' },
  ])
    assert.throws(() => resolveAction({ ...input, ...patch }, options));
  assert.deepEqual(fs.readFileSync(path.join(t.root, t.apply.run.ref)), current);
  assert.throws(() =>
    resolveAction(input, {
      ...options,
      observeWrite: (phase) => {
        if (phase === 'lock-acquired')
          fs.appendFileSync(path.join(t.root, t.refs.propose), '\n外部漂移');
      },
    }),
  );
  assert.equal(fs.existsSync(path.join(t.root, '.mendi/write.lock')), false);
  for (const failure of ['before-manifest-commit', 'before-readback']) {
    const f = stageTarget();
    const before = fs.readFileSync(path.join(f.root, f.apply.run.ref));
    assert.throws(() =>
      resolveAction(
        {
          ...owner(f.root, f.apply.run.ref, 'rollback'),
          phase: 'propose',
          revisesRunRef: f.refs.propose,
        },
        {
          ...options,
          observeWrite: (phase) => {
            if (phase === failure) throw new Error('受控故障');
          },
        },
      ),
    );
    assert.equal(fs.existsSync(path.join(f.root, '.mendi/write.lock')), true);
    assert.deepEqual(fs.readFileSync(path.join(f.root, f.apply.run.ref)), before);
  }
});
