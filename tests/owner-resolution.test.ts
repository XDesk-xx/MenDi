import { actionInstructions } from '../src/application/action-instructions.ts';
import { resolveAction } from '../src/application/action-resolution.ts';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { actionTarget, startAuthor, options, author, reviewer, finish } from './action-support.ts';
import { startAction, saveRun, submitRun, continueAction } from '../src/application/actions.ts';
import { query } from '../src/application/project.ts';
import { parseRun } from '../src/core/actions.ts';
import { readRun } from '../src/adapters/runs.ts';
import { snapshot } from './helpers.ts';
const owner = (project: string, runRef: string) => ({
  project,
  runRef,
  role: 'owner',
  actor: 'fixture-owner',
  reason: '受控交接',
  resolution: 'handoff',
  toRole: 'author',
  toActor: 'author-two',
});
test('handoff 保持 Action 和笔记，旧 actor 拒绝，新查询不读来源，continue 仅承接最近决策', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  fs.writeFileSync(path.join(root, 'body.md'), '待继续笔记');
  saveRun({ ...author(root), runRef: a.run.ref, bodyFile: 'body.md' });
  const bytes = fs.readFileSync(path.join(root, a.run.ref));
  const b = resolveAction(owner(root, a.run.ref), options);
  assert.equal(b.run.actionId, a.run.actionId);
  assert.equal(b.run.ownerDecision?.sourceRunRef, a.run.ref);
  assert.equal(readRun(root, b.run.ref, 'd01', 'proof-entry').body, '待继续笔记');
  assert.deepEqual(fs.readFileSync(path.join(root, a.run.ref)), bytes);
  assert.throws(() => saveRun({ ...author(root), runRef: a.run.ref, bodyFile: 'body.md' }));
  assert.throws(() => saveRun({ ...author(root), runRef: b.run.ref, bodyFile: 'body.md' }));
  const doc = readRun(root, b.run.ref, 'd01', 'proof-entry');
  for (const patch of [
    { targetRole: 'reviewer' },
    { targetActorId: 'other' },
    { role: 'author' },
    { resolution: 'wrong' },
    { phase: 'propose' },
    { reason: '' },
    { sourceRunRef: b.run.ref },
    { sourceRunRef: '../outside' },
  ])
    assert.throws(() =>
      parseRun(
        { ...doc.header, ownerDecision: { ...b.run.ownerDecision, ...patch } },
        b.run.ref,
        'd01',
        'proof-entry',
      ),
    );
  fs.unlinkSync(path.join(root, a.run.ref));
  const queried = query({ project: root }, options);
  assert.ok('run' in queried);
  assert.equal(queried.run?.actorId, 'author-two');
  submitRun(
    {
      ...author(root),
      actor: 'author-two',
      runRef: b.run.ref,
      outcome: 'continuing',
      result: 'fixture progress',
    },
    options,
  );
  const c = continueAction(
    { ...author(root), actor: 'author-two', actionId: b.run.actionId },
    options,
  );
  assert.deepEqual(c.run.ownerDecision, b.run.ownerDecision);
  const d = resolveAction({ ...owner(root, c.run.ref), toActor: 'author-three' }, options);
  assert.equal(d.run.ownerDecision?.sourceRunRef, c.run.ref);
});
test('Reviewer handoff 不改 Author/原 Review，不产生 verdict；固定对象和自签写前拒绝', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  finish(root, a.run.ref);
  const r = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: a.run.ref },
    options,
  );
  const before = snapshot(root);
  const fixedAuthor = fs.readFileSync(path.join(root, a.run.ref));
  const oldReview = fs.readFileSync(path.join(root, r.run.ref));
  const input = { ...owner(root, r.run.ref), toRole: 'reviewer', toActor: 'reviewer-two' };
  assert.throws(() => resolveAction({ ...input, toActor: 'author-one' }, options));
  assert.deepEqual(snapshot(root), before);
  const next = resolveAction(input, options);
  assert.equal(next.run.authorRunRef, a.run.ref);
  assert.equal(next.run.actionId, r.run.actionId);
  assert.equal(next.run.verdict, undefined);
  assert.deepEqual(fs.readFileSync(path.join(root, a.run.ref)), fixedAuthor);
  assert.deepEqual(fs.readFileSync(path.join(root, r.run.ref)), oldReview);
  const authorBytes = fs.readFileSync(path.join(root, a.run.ref));
  fs.unlinkSync(path.join(root, a.run.ref));
  const missing = snapshot(root);
  assert.throws(() =>
    resolveAction({ ...input, runRef: next.run.ref, toActor: 'reviewer-three' }, options),
  );
  assert.deepEqual(snapshot(root), missing);
  fs.writeFileSync(path.join(root, a.run.ref), authorBytes);
});
test('rejected 只能 Owner 同阶段新修订，旧 verdict 不改；普通 start/continue 仍拒绝', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  finish(root, a.run.ref);
  const r = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: a.run.ref },
    options,
  );
  finish(root, r.run.ref, 'reviewer', 'complete', 'rejected');
  const before = snapshot(root);
  assert.throws(() =>
    startAction(
      {
        ...author(root),
        changeId: 'proof-entry',
        type: 'revise-explore',
        revisesRunRef: a.run.ref,
      },
      options,
    ),
  );
  assert.throws(() => continueAction({ ...reviewer(root), actionId: r.run.actionId }, options));
  for (const patch of [
    { role: 'author' },
    { reason: '' },
    { runRef: a.run.ref },
    { resolution: 'handoff', toRole: 'reviewer', toActor: 'reviewer-two' },
    { toRole: 'reviewer' },
  ])
    assert.throws(() =>
      resolveAction({ ...owner(root, r.run.ref), resolution: 'revise', ...patch }, options),
    );
  assert.deepEqual(snapshot(root), before);
  const old = fs.readFileSync(path.join(root, r.run.ref));
  const revised = resolveAction({ ...owner(root, r.run.ref), resolution: 'revise' }, options);
  assert.equal(revised.run.actionType, 'revise-explore');
  assert.equal(revised.run.revisesRunRef, a.run.ref);
  assert.notEqual(revised.run.actionId, a.run.actionId);
  assert.equal(readRun(root, revised.run.ref, 'd01', 'proof-entry').body, '');
  fs.writeFileSync(path.join(root, 'body.md'), '受控修订');
  saveRun({ ...author(root), actor: 'author-two', runRef: revised.run.ref, bodyFile: 'body.md' });
  assert.equal(
    submitRun(
      {
        ...author(root),
        actor: 'author-two',
        runRef: revised.run.ref,
        outcome: 'complete',
        result: '受控修订完成',
      },
      options,
    ).next.action,
    'review-explore',
  );
  assert.deepEqual(fs.readFileSync(path.join(root, r.run.ref)), old);
});
test('Owner 参数和完整 / 非 rejected / 未完成 Apply 的 revise 处置拒绝，写前无新增占号', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  const before = snapshot(root);
  for (const patch of [
    { role: 'reviewer' },
    { actor: '' },
    { reason: '' },
    { toActor: 'author-one' },
    { toRole: 'reviewer' },
    { resolution: 'revise' },
    { resolution: 'stop' },
  ])
    assert.throws(() => resolveAction({ ...owner(root, a.run.ref), ...patch }, options));
  assert.deepEqual(snapshot(root), before);
  finish(root, a.run.ref);
  assert.throws(() => resolveAction(owner(root, a.run.ref), options));
  const review = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: a.run.ref },
    options,
  );
  finish(root, review.run.ref, 'reviewer', 'complete', 'approved');
  assert.throws(() =>
    resolveAction({ ...owner(root, review.run.ref), resolution: 'revise' }, options),
  );
  const p = startAction({ ...author(root), changeId: 'proof-entry', type: 'propose' }, options);
  finish(root, p.run.ref);
  const rp = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-propose', authorRunRef: p.run.ref },
    options,
  );
  finish(root, rp.run.ref, 'reviewer', 'complete', 'approved');
  const apply = startAction({ ...author(root), changeId: 'proof-entry', type: 'apply' }, options);
  const actual = snapshot(root);
  assert.throws(() =>
    actionInstructions(
      { project: root, actionId: apply.run.actionId, artifact: 'proposal' },
      options,
    ),
  );
  assert.throws(() =>
    resolveAction({ ...owner(root, apply.run.ref), resolution: 'revise' }, options),
  );
  assert.deepEqual(snapshot(root), actual);
});

test('Reviewer handoff 锁内固定 Author 内容变化或输入不完整时拒绝，不分配新 Run', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  finish(root, a.run.ref);
  const r = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: a.run.ref },
    options,
  );
  const file = path.join(root, a.run.ref);
  const bytes = fs.readFileSync(file);
  const input = { ...owner(root, r.run.ref), toRole: 'reviewer', toActor: 'reviewer-two' };
  assert.throws(() =>
    resolveAction(input, {
      ...options,
      observeWrite: (phase) => {
        if (phase === 'lock-acquired') fs.appendFileSync(file, 'controlled fixed input drift');
      },
    }),
  );
  assert.equal(
    fs.existsSync(path.join(root, '.mendi/runs/d01/001-changes/proof-entry/003-review-explore')),
    false,
  );
  fs.writeFileSync(file, bytes.toString().replace('outcome: complete', 'outcome: continuing'));
  const before = snapshot(root);
  assert.throws(() => resolveAction(input, options));
  assert.deepEqual(snapshot(root), before);
});
for (const phase of ['before-manifest-commit', 'before-readback'] as const)
  test(`Owner ${phase} 故障保留旧记录和占号现场`, () => {
    const root = actionTarget();
    const a = startAuthor(root);
    const old = fs.readFileSync(path.join(root, a.run.ref));
    assert.throws(() =>
      resolveAction(owner(root, a.run.ref), {
        ...options,
        observeWrite: (observed) => {
          if (observed === phase) throw new Error('controlled interruption');
        },
      }),
    );
    assert.deepEqual(fs.readFileSync(path.join(root, a.run.ref)), old);
    assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
    assert.ok(
      fs.existsSync(path.join(root, '.mendi/runs/d01/001-changes/proof-entry/002-explore/run.md')),
    );
  });
test('resolve 锁内复核当前指针、正文；残留占号跳过，竞争锁不删除', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  const file = path.join(root, a.run.ref);
  fs.mkdirSync(path.join(root, '.mendi/runs/d01/001-changes/proof-entry/019-explore'), {
    recursive: true,
  });
  const before = snapshot(root);
  fs.writeFileSync(path.join(root, '.mendi/write.lock'), '竞争锁');
  assert.throws(() => resolveAction(owner(root, a.run.ref), options));
  assert.equal(fs.readFileSync(path.join(root, '.mendi/write.lock'), 'utf8'), '竞争锁');
  fs.unlinkSync(path.join(root, '.mendi/write.lock'));
  assert.deepEqual(snapshot(root), before);
  assert.throws(() =>
    resolveAction(owner(root, a.run.ref), {
      ...options,
      observeWrite: (phase) => {
        if (phase === 'lock-acquired') fs.appendFileSync(file, 'concurrent note');
      },
    }),
  );
  assert.equal(
    fs.existsSync(path.join(root, '.mendi/runs/d01/001-changes/proof-entry/020-explore')),
    false,
  );
  const received = resolveAction(owner(root, a.run.ref), options);
  assert.equal(received.run.runNumber, 20);
  assert.ok(received.incompleteReservations.some((r) => r.number === 19));
});
