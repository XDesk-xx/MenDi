import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { actionTarget, author, reviewer, options, startAuthor, finish } from './action-support.ts';
import { startAction, continueAction, saveRun, submitRun } from '../src/application/actions.ts';
import { query } from '../src/application/project.ts';
import { snapshot, sandbox } from './helpers.ts';
import { readRun, renderRun } from '../src/adapters/runs.ts';
import type { ActionWritePhase } from '../src/adapters/workspace.ts';

test('同 Action 两次 Author / Reviewer 提交、修订补审保留原提交和 verdict', () => {
  const root = actionTarget();
  const a1 = startAuthor(root);
  assert.equal(a1.run.runNumber, 1);
  assert.equal(a1.methods.guidance.length, 1);
  assert.throws(() => continueAction({ ...author(root), actionId: a1.run.actionId }, options));
  finish(root, a1.run.ref, 'author', 'continuing');
  assert.throws(
    () => continueAction({ ...author(root), actor: 'other', actionId: a1.run.actionId }, options),
    { code: 'action-role-mismatch' },
  );
  const oldA1 = fs.readFileSync(path.join(root, a1.run.ref));
  const a2 = continueAction({ ...author(root), actionId: a1.run.actionId }, options);
  assert.equal(a2.run.actionId, a1.run.actionId);
  assert.equal(a2.run.runNumber, 2);
  finish(root, a2.run.ref);
  const oldA2 = fs.readFileSync(path.join(root, a2.run.ref));
  assert.throws(() => continueAction({ ...author(root), actionId: a2.run.actionId }, options));
  assert.throws(() =>
    startAction(
      {
        ...reviewer(root),
        changeId: 'proof-entry',
        type: 'review-explore',
        authorRunRef: a1.run.ref,
      },
      options,
    ),
  );
  assert.throws(
    () =>
      startAction(
        {
          ...reviewer(root),
          actor: 'author-one',
          changeId: 'proof-entry',
          type: 'review-explore',
          authorRunRef: a2.run.ref,
        },
        options,
      ),
    { code: 'self-review' },
  );
  const r1 = startAction(
    {
      ...reviewer(root),
      changeId: 'proof-entry',
      type: 'review-explore',
      authorRunRef: a2.run.ref,
    },
    options,
  );
  finish(root, r1.run.ref, 'reviewer', 'continuing');
  const oldR1 = fs.readFileSync(path.join(root, r1.run.ref));
  const r2 = continueAction({ ...reviewer(root), actionId: r1.run.actionId }, options);
  assert.equal(r2.run.authorRunRef, a2.run.ref);
  assert.equal(r2.run.actionId, r1.run.actionId);
  assert.equal(finish(root, r2.run.ref, 'reviewer', 'complete', 'approved').next.action, 'propose');
  const oldR2 = fs.readFileSync(path.join(root, r2.run.ref));
  const revision = startAction(
    { ...author(root), changeId: 'proof-entry', type: 'revise-explore', revisesRunRef: a2.run.ref },
    options,
  );
  assert.notEqual(revision.run.actionId, a2.run.actionId);
  assert.equal(revision.run.runNumber, 5);
  assert.equal(query({ project: root }, options).next.action, 'run-save-or-submit');
  finish(root, revision.run.ref);
  const supplement = startAction(
    {
      ...reviewer(root),
      changeId: 'proof-entry',
      type: 'review-explore',
      authorRunRef: revision.run.ref,
    },
    options,
  );
  assert.equal(
    finish(root, supplement.run.ref, 'reviewer', 'complete', 'changes-requested').next.action,
    'revise-explore',
  );
  for (const [ref, bytes] of [
    [a1.run.ref, oldA1],
    [a2.run.ref, oldA2],
    [r1.run.ref, oldR1],
    [r2.run.ref, oldR2],
  ] as const)
    assert.deepEqual(fs.readFileSync(path.join(root, ref)), bytes);
});

test('错误输入与方法在占号前拒绝，已提交正文不允许 save / 重提', () => {
  const root = actionTarget();
  const before = snapshot(root);
  for (const patch of [
    { type: 'archive' },
    { role: 'reviewer' },
    { changeId: 'foreign' },
    { tool: 'unknown' },
    { type: 'propose' },
  ])
    assert.throws(() =>
      startAction({ ...author(root), changeId: 'proof-entry', type: 'explore', ...patch }, options),
    );
  assert.throws(
    () =>
      startAction(
        { ...author(root), changeId: 'proof-entry', type: 'explore' },
        { ...options, methodsRoot: sandbox() },
      ),
    { code: 'skill-unavailable' },
  );
  assert.deepEqual(snapshot(root), before);
  const a = startAuthor(root);
  const draft = snapshot(root);
  assert.throws(() =>
    submitRun(
      { ...author(root), runRef: a.run.ref, outcome: 'complete', result: '空正文' },
      options,
    ),
  );
  assert.throws(() =>
    saveRun({ ...author(root), runRef: a.run.ref, bodyFile: 'missing.md' }, options),
  );
  assert.throws(() =>
    saveRun(
      { ...author(root), actor: 'other', runRef: a.run.ref, bodyFile: 'missing.md' },
      options,
    ),
  );
  assert.throws(() =>
    saveRun({ ...reviewer(root), runRef: a.run.ref, bodyFile: 'missing.md' }, options),
  );
  assert.throws(() =>
    saveRun({ ...author(root), runRef: '../outside/run.md', bodyFile: 'missing.md' }, options),
  );
  assert.deepEqual(snapshot(root), draft);
  finish(root, a.run.ref);
  const submitted = snapshot(root);
  assert.throws(
    () => saveRun({ ...author(root), runRef: a.run.ref, bodyFile: 'body.md' }, options),
    { code: 'run-already-submitted' },
  );
  assert.throws(() =>
    submitRun(
      { ...author(root), runRef: a.run.ref, outcome: 'complete', result: '再次提交' },
      options,
    ),
  );
  assert.deepEqual(snapshot(root), submitted);
});

test('提交的必要内容与 verdict 规则，rejected 停止 Owner', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  const bodyFile = path.join(root, 'body.md');
  fs.writeFileSync(bodyFile, '正文');
  saveRun({ ...author(root), runRef: a.run.ref, bodyFile }, options);
  for (const patch of [{ result: '' }, { outcome: 'unknown' }, { verdict: 'approved' }])
    assert.throws(() =>
      submitRun(
        { ...author(root), runRef: a.run.ref, outcome: 'complete', result: '完成', ...patch },
        options,
      ),
    );
  finish(root, a.run.ref);
  const r = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: a.run.ref },
    options,
  );
  saveRun({ ...reviewer(root), runRef: r.run.ref, bodyFile }, options);
  for (const patch of [{}, { verdict: 'unknown' }, { outcome: 'continuing', verdict: 'approved' }])
    assert.throws(() =>
      submitRun(
        { ...reviewer(root), runRef: r.run.ref, outcome: 'complete', result: '结论', ...patch },
        options,
      ),
    );
  assert.equal(
    finish(root, r.run.ref, 'reviewer', 'complete', 'rejected').next.action,
    'owner-decision',
  );
  const rejected = query({ project: root }, options).next;
  assert.ok('role' in rejected);
  assert.equal(rejected.role, 'owner');
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
});

test('固定 Author 丢失仅阻断 Review continue / submit，query 不读其正文', () => {
  for (const continuing of [true, false]) {
    const root = actionTarget();
    const a = startAuthor(root);
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
    if (continuing) finish(root, r.run.ref, 'reviewer', 'continuing');
    else saveRun({ ...reviewer(root), runRef: r.run.ref, bodyFile: 'body.md' }, options);
    fs.unlinkSync(path.join(root, a.run.ref));
    const before = snapshot(root);
    assert.equal(query({ project: root }, options).ok, true);
    if (continuing)
      assert.throws(
        () => continueAction({ ...reviewer(root), actionId: r.run.actionId }, options),
        { code: 'run-input-missing' },
      );
    else
      assert.throws(
        () =>
          submitRun(
            {
              ...reviewer(root),
              runRef: r.run.ref,
              outcome: 'complete',
              result: '结论',
              verdict: 'approved',
            },
            options,
          ),
        { code: 'run-input-missing' },
      );
    assert.deepEqual(snapshot(root), before);
  }
});

test('Review 当前对象身份、阶段、完成状态逐项校验，方法损坏阻断继续', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  finish(root, a.run.ref);
  const file = path.join(root, a.run.ref);
  const original = fs.readFileSync(file);
  const doc = readRun(root, a.run.ref, 'd01', 'proof-entry');
  for (const patch of [
    { status: 'draft', outcome: undefined, result: undefined },
    { outcome: 'continuing' },
    { changeId: 'other' },
    { actionType: 'apply' },
  ]) {
    fs.writeFileSync(file, renderRun({ ...doc.header, ...patch }, doc.body));
    const before = snapshot(root);
    assert.throws(() =>
      startAction(
        {
          ...reviewer(root),
          changeId: 'proof-entry',
          type: 'review-explore',
          authorRunRef: a.run.ref,
        },
        options,
      ),
    );
    assert.deepEqual(snapshot(root), before);
  }
  fs.writeFileSync(file, original);
  const r = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: a.run.ref },
    options,
  );
  finish(root, r.run.ref, 'reviewer', 'continuing');
  const before = snapshot(root);
  assert.throws(
    () =>
      continueAction(
        { ...reviewer(root), actionId: r.run.actionId },
        { ...options, methodsRoot: sandbox() },
      ),
    { code: 'skill-unavailable' },
  );
  assert.deepEqual(snapshot(root), before);
});

for (const phase of [
  'run-written',
  'before-manifest-commit',
  'before-readback',
  'before-lock-release',
] as ActionWritePhase[])
  test(`start 的 ${phase} 失败保留锁、路径与完整文件`, () => {
    const root = actionTarget();
    const manifest = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
    const old = fs.readFileSync(manifest);
    let details: Record<string, unknown> = {};
    assert.throws(
      () =>
        startAction(
          { ...author(root), changeId: 'proof-entry', type: 'explore' },
          {
            ...options,
            observeWrite: (observed) => {
              if (observed === phase) throw new Error('controlled interruption');
            },
          },
        ),
      (error: unknown) => {
        const e = error as { code: string; details: Record<string, unknown> };
        assert.equal(e.code, 'workspace-write-failed');
        details = e.details;
        return true;
      },
    );
    assert.ok((details.committedPaths as string[]).length);
    assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
    if (phase === 'run-written' || phase === 'before-manifest-commit')
      assert.deepEqual(fs.readFileSync(manifest), old);
    else
      assert.equal(
        JSON.parse(fs.readFileSync(manifest, 'utf8')).changeBindings[0].latestRunRef.endsWith(
          '001-explore/run.md',
        ),
        true,
      );
    const run = '.mendi/runs/d01/001-changes/proof-entry/001-explore/run.md';
    assert.equal(readRun(root, run, 'd01', 'proof-entry').record.status, 'draft');
    const scene = snapshot(root);
    assert.throws(() => query({ project: root }, options));
    assert.throws(() => startAuthor(root));
    assert.deepEqual(snapshot(root), scene);
  });

for (const operation of ['save', 'submit'])
  for (const phase of [
    'before-run-commit',
    'before-readback',
    'before-lock-release',
  ] as ActionWritePhase[])
    test(`${operation} 的 ${phase} 失败保留现场及指针`, () => {
      const root = actionTarget();
      const a = startAuthor(root);
      const bodyFile = path.join(root, 'body.md');
      fs.writeFileSync(bodyFile, '新增正文');
      if (operation === 'submit')
        saveRun({ ...author(root), runRef: a.run.ref, bodyFile }, options);
      const file = path.join(root, a.run.ref);
      const old = fs.readFileSync(file);
      const manifest = fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'));
      const failing = {
        ...options,
        observeWrite: (observed: ActionWritePhase) => {
          if (observed === phase) throw new Error('controlled interruption');
        },
      };
      assert.throws(
        () =>
          operation === 'save'
            ? saveRun({ ...author(root), runRef: a.run.ref, bodyFile }, failing)
            : submitRun(
                { ...author(root), runRef: a.run.ref, outcome: 'complete', result: '结论' },
                failing,
              ),
        { code: 'workspace-write-failed' },
      );
      if (phase === 'before-run-commit') assert.deepEqual(fs.readFileSync(file), old);
      else assert.notDeepEqual(fs.readFileSync(file), old);
      assert.deepEqual(
        fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json')),
        manifest,
      );
      assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
      if (phase === 'before-run-commit')
        assert.ok(fs.readdirSync(path.dirname(file)).some((name) => name.endsWith('.tmp')));
    });

test('读回实际内容漂移与 rename 失败均不伪装成功', () => {
  const root = actionTarget();
  assert.throws(
    () =>
      startAction(
        { ...author(root), changeId: 'proof-entry', type: 'explore' },
        {
          ...options,
          observeWrite: (phase, file) => {
            if (phase === 'before-readback') fs.appendFileSync(file, 'unexpected drift');
          },
        },
      ),
    { code: 'workspace-write-failed' },
  );
  assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
  const second = actionTarget();
  const a = startAuthor(second);
  fs.writeFileSync(path.join(second, 'body.md'), '正文');
  const old = fs.readFileSync(path.join(second, a.run.ref));
  const rename = fs.renameSync;
  try {
    fs.renameSync = () => {
      throw new Error('controlled rename failure');
    };
    assert.throws(
      () => saveRun({ ...author(second), runRef: a.run.ref, bodyFile: 'body.md' }, options),
      { code: 'workspace-write-failed' },
    );
  } finally {
    fs.renameSync = rename;
  }
  assert.deepEqual(fs.readFileSync(path.join(second, a.run.ref)), old);
  assert.ok(fs.existsSync(path.join(second, '.mendi/write.lock')));
});

test('实际分配跳过空占号、报告残留；重复号失败不修改现场', () => {
  const root = actionTarget();
  for (const ref of [
    '001-delivery-open',
    '003-changes/past/019-archive',
    '003-changes/past/019-archive/artifacts/999-apply',
  ])
    fs.mkdirSync(path.join(root, '.mendi/runs/d01', ref), { recursive: true });
  const result = startAuthor(root);
  assert.equal(result.run.runNumber, 20);
  assert.ok(result.run.ref.includes('/020-changes/'));
  assert.equal(result.incompleteReservations.length, 2);
  assert.ok(result.incompleteReservations.some((r) => r.number === 19));
  assert.ok(fs.existsSync(path.join(root, '.mendi/runs/d01/003-changes/past/019-archive')));
  finish(root, result.run.ref, 'author', 'continuing');
  fs.mkdirSync(path.join(root, '.mendi/runs/d01/019-delivery-close'));
  const before = snapshot(root);
  assert.throws(() => continueAction({ ...author(root), actionId: result.run.actionId }, options), {
    code: 'run-number-conflict',
  });
  assert.deepEqual(snapshot(root), before);
});

test('save / submit 保留未知说明头部，无需读取所选方法正文', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  const file = path.join(root, a.run.ref);
  const doc = readRun(root, a.run.ref, 'd01', 'proof-entry');
  fs.writeFileSync(
    file,
    renderRun({ ...doc.header, unknownRef: { nestedRef: '../missing' } }, doc.body),
  );
  fs.writeFileSync(path.join(root, 'body.md'), '正文 [旧说明](missing.md)');
  const withoutMethods = { ...options, methodsRoot: sandbox() };
  saveRun({ ...author(root), runRef: a.run.ref, bodyFile: 'body.md' }, withoutMethods);
  submitRun(
    { ...author(root), runRef: a.run.ref, outcome: 'complete', result: '完成' },
    withoutMethods,
  );
  assert.deepEqual(readRun(root, a.run.ref, 'd01', 'proof-entry').header.unknownRef, {
    nestedRef: '../missing',
  });
  assert.equal(query({ project: root }, options).next.action, 'review-explore');
});
