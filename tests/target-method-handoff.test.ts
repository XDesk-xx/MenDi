import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { startAction, continueAction, saveRun, submitRun } from '../src/application/actions.ts';
import { resolveAction } from '../src/application/action-resolution.ts';
import { query } from '../src/application/project.ts';
import { diagnoseWorkspace } from '../src/application/diagnosis.ts';
import { actionTarget, author, reviewer, options, finish, startAuthor } from './action-support.ts';
import { stageTarget, reviewApply, owner } from './delivery-stage-support.ts';
import { prepareTargetMethods } from './target-method-support.ts';

function stateBytes(root: string) {
  const base = path.join(root, '.mendi');
  const files: Record<string, Buffer> = {};
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else files[path.relative(base, file)] = fs.readFileSync(file);
    }
  }
  walk(base);
  return files;
}
function remove(root: string, name: string) {
  fs.unlinkSync(path.join(root, '.agents/skills', name, 'SKILL.md'));
}

test('start / continue 必要方法写前失败；锁内变化释放自身锁、不占号；恢复读取新正文', () => {
  const root = actionTarget();
  remove(root, 'openspec-explore');
  const before = stateBytes(root);
  const start = { ...author(root), changeId: 'proof-entry', type: 'explore' };
  assert.throws(() => startAction(start, options), { code: 'skill-unavailable' });
  assert.deepEqual(stateBytes(root), before);
  prepareTargetMethods(root);
  assert.throws(
    () =>
      startAction(start, {
        ...options,
        observeWrite: (phase) => {
          if (phase === 'lock-acquired') remove(root, 'openspec-explore');
        },
      }),
    { code: 'skill-unavailable' },
  );
  assert.deepEqual(stateBytes(root), before);
  prepareTargetMethods(root);
  const a = startAction(start, options);
  finish(root, a.run.ref, 'author', 'continuing');
  const prior = stateBytes(root);
  remove(root, 'openspec-explore');
  assert.throws(() => continueAction({ ...author(root), actionId: a.run.actionId }, options), {
    code: 'skill-unavailable',
  });
  assert.deepEqual(stateBytes(root), prior);
  assert.equal(query({ project: root }, options).ok, true);
  prepareTargetMethods(root);
  const file = path.join(root, '.agents/skills/openspec-explore/SKILL.md');
  fs.appendFileSync(file, '\n当前新正文\n');
  const b = continueAction({ ...author(root), actionId: a.run.actionId }, options);
  assert.ok('upstream' in b.methods);
  assert.match(b.methods.upstream[0].content, /当前新正文/);
  assert.equal(b.run.actionId, a.run.actionId);
  assert.equal('upstream' in b.run, false);
});

test('缺方法不扩成查询、save / submit、diagnose 或无关历史 Ref 前置；Reviewer 不需 Author 方法', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  remove(root, 'openspec-explore');
  const file = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.historicalRef = 'missing-old-note.md';
  manifest.unknownRef = 'missing-extension.md';
  fs.writeFileSync(file, JSON.stringify(manifest));
  fs.writeFileSync(path.join(root, 'body.md'), '[旧说明](missing.md)\n');
  assert.equal(query({ project: root }, options).ok, true);
  assert.equal(
    saveRun({ ...author(root), runRef: a.run.ref, bodyFile: 'body.md' }, options).ok,
    true,
  );
  assert.equal(
    submitRun(
      { ...author(root), runRef: a.run.ref, outcome: 'complete', result: '受控完成' },
      options,
    ).ok,
    true,
  );
  assert.equal(diagnoseWorkspace({ project: root }).ok, true);
  const r = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: a.run.ref },
    options,
  );
  assert.deepEqual(r.methods.upstream, []);
  const next = resolveAction(
    { ...owner(root, r.run.ref, 'handoff'), toRole: 'reviewer', toActor: 'reviewer-two' },
    options,
  );
  assert.deepEqual(next.methods.upstream, []);
});

test('Owner handoff、rejected revise 与跨阶段 rollback 按接收方法检查，失败保留旧 verdict', () => {
  for (const operation of ['handoff', 'revise', 'rollback']) {
    const root = actionTarget();
    const a = startAuthor(root);
    let current = a.run.ref;
    if (operation !== 'handoff') {
      finish(root, a.run.ref);
      const r = startAction(
        {
          ...reviewer(root),
          changeId: 'proof-entry',
          type: 'review-explore',
          authorRunRef: a.run.ref,
        },
        options,
      );
      finish(
        root,
        r.run.ref,
        'reviewer',
        'complete',
        operation === 'revise' ? 'rejected' : 'approved',
      );
      current = r.run.ref;
      if (operation === 'rollback')
        current = startAction(
          { ...author(root), changeId: 'proof-entry', type: 'propose' },
          options,
        ).run.ref;
    }
    remove(root, 'openspec-explore');
    const prior = stateBytes(root);
    assert.throws(
      () =>
        resolveAction(
          {
            ...owner(root, current, operation),
            ...(operation === 'rollback' ? { phase: 'explore', revisesRunRef: a.run.ref } : {}),
          },
          options,
        ),
      { code: 'skill-unavailable' },
    );
    assert.deepEqual(stateBytes(root), prior);
  }
});

test('Archive 准备缺目标方法不占号、锁内失败释放；已有准备不迁移字段', () => {
  const target = stageTarget(true);
  reviewApply(target, 'approved');
  remove(target.root, 'openspec-archive-change');
  const input = { ...author(target.root), changeId: 'proof-entry', type: 'archive' };
  const before = stateBytes(target.root);
  assert.throws(() => startAction(input), { code: 'skill-unavailable' });
  assert.deepEqual(stateBytes(target.root), before);
  prepareTargetMethods(target.root);
  assert.throws(
    () =>
      startAction(input, {
        observeWrite: (phase) => {
          if (phase === 'lock-acquired') remove(target.root, 'openspec-archive-change');
        },
      }),
    { code: 'skill-unavailable' },
  );
  assert.deepEqual(stateBytes(target.root), before);
  prepareTargetMethods(target.root);
  const prepared = startAction(input);
  assert.equal(prepared.methods.upstream[0].name, 'openspec-archive-change');
  assert.equal('upstream' in prepared.run, false);
});
