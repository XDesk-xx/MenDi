import { actionInstructions } from '../src/application/action-instructions.ts';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { type ProcessRunner } from '../src/adapters/openspec.ts';
import { saveRun, submitRun, continueAction } from '../src/application/actions.ts';
import {
  actionTarget,
  startAuthor,
  author,
  runner,
  options,
  finish,
  reviewer,
} from './action-support.ts';
import { startAction } from '../src/application/actions.ts';
import { snapshot, sandbox } from './helpers.ts';

function instructionsRunner(patch: Record<string, unknown> = {}): ProcessRunner {
  return (entry, args, cwd) =>
    args[0] !== 'instructions'
      ? runner(entry, args, cwd)
      : {
          status: 0,
          signal: null,
          stderr: '',
          stdout: JSON.stringify({
            root: { path: cwd, source: 'nearest' },
            changeName: 'proof-entry',
            artifactId: args[1],
            instruction: '读项目约束和依赖后写作',
            template: '# Why',
            outputPath: 'proposal.md',
            resolvedOutputPath: path.join(cwd, 'openspec/changes/proof-entry/proposal.md'),
            dependencies: [],
            context: '中文产品文档',
            rules: ['明确范围'],
            unknownRef: '../missing',
            ...patch,
          }),
        };
}
test('完整 instructions 按当前阶段只读，坏内容和身份拒绝，blocked 依赖不伪报完成', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  const before = snapshot(root);
  const input = { project: root, actionId: a.run.actionId, artifact: 'proposal' };
  const result = actionInstructions(input, {
    runner: instructionsRunner({
      dependencies: [{ id: 'design', done: false, path: 'design.md' }],
    }),
  });
  assert.equal(result.instructions.dependencies[0].done, false);
  assert.equal(result.instructions.context, '中文产品文档');
  for (const patch of [
    { instruction: undefined },
    { template: 3 },
    { changeName: 'other' },
    { artifactId: 'design' },
    { schemaName: 'custom' },
    { dependencies: [{}] },
    { dependencies: [{ id: 'proposal', done: 'true', path: 'proposal.md' }] },
    { dependencies: [{ id: 'proposal', done: true, path: '../outside.md' }] },
    { outputPath: '../x' },
    { resolvedOutputPath: path.join(root, 'outside.md') },
    { rules: [1] },
    { context: 3 },
  ])
    assert.throws(() => actionInstructions(input, { runner: instructionsRunner(patch) }));
  assert.throws(() => actionInstructions({ ...input, artifact: 'tasks' }, options));
  assert.throws(() => actionInstructions({ ...input, actionId: 'stale' }, options));
  const external = sandbox();
  fs.symlinkSync(external, path.join(root, 'openspec/changes/proof-entry/specs'), 'junction');
  assert.throws(() =>
    actionInstructions(input, {
      runner: instructionsRunner({
        outputPath: 'specs/**/*.md',
        resolvedOutputPath: path.join(root, 'openspec/changes/proof-entry/specs/**/*.md'),
      }),
    }),
  );
  fs.unlinkSync(path.join(root, 'openspec/changes/proof-entry/specs'));
  assert.deepEqual(snapshot(root), before);
});
test('local save 不构造上游，缺入口/版本/status 故障不影响保存，正式操作仍失败', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  const bodyFile = path.join(root, 'body.md');
  fs.writeFileSync(bodyFile, '故障说明');
  const forbidden: ProcessRunner = () => {
    throw new Error('不得调用');
  };
  const saved = saveRun(
    { ...author(root), runRef: a.run.ref, bodyFile, openspecBin: path.join(root, 'missing.js') },
    { runner: forbidden },
  );
  assert.equal(saved.openspec, null);
  assert.equal(saved.executionMode, 'local-only');
  assert.equal(saved.run.status, 'draft');
  assert.throws(() =>
    submitRun({
      ...author(root),
      runRef: a.run.ref,
      outcome: 'complete',
      result: '完成',
      openspecBin: path.join(root, 'missing.js'),
    }),
  );
  const failing: ProcessRunner = (entry, args, cwd) =>
    args[0] === 'status'
      ? { status: 9, signal: null, stderr: '故障', stdout: '' }
      : runner(entry, args, cwd);
  saveRun({ ...author(root), runRef: a.run.ref, bodyFile }, { runner: failing });
  assert.throws(() =>
    submitRun(
      { ...author(root), runRef: a.run.ref, outcome: 'continuing', result: '进展' },
      { runner: failing },
    ),
  );
  finish(root, a.run.ref, 'author', 'continuing');
  assert.throws(() =>
    continueAction({ ...author(root), actionId: a.run.actionId }, { runner: failing }),
  );
});
test('save 校验拒绝不改字节，替换后读回失败保留实际正文与锁', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  const bodyFile = path.join(root, 'body.md');
  fs.writeFileSync(bodyFile, '实际新正文');
  const base = { ...author(root), runRef: a.run.ref, bodyFile };
  const before = snapshot(root);
  for (const patch of [
    { actor: 'wrong' },
    { role: 'owner' },
    { runRef: '../x' },
    { bodyFile: 'missing.md' },
  ])
    assert.throws(() => saveRun({ ...base, ...patch }));
  assert.deepEqual(snapshot(root), before);
  assert.throws(() =>
    saveRun(base, {
      observeWrite: (phase) => {
        if (phase === 'before-readback') throw new Error('读回故障');
      },
    }),
  );
  assert.ok(fs.readFileSync(path.join(root, a.run.ref), 'utf8').includes('实际新正文'));
  assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
});
test('Reviewer 无固定 Author 正文可保存，submit 和 continue 保留固定对象检查', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  finish(root, a.run.ref);
  const r = startAction(
    { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: a.run.ref },
    options,
  );
  fs.unlinkSync(path.join(root, a.run.ref));
  const bodyFile = path.join(root, 'body.md');
  fs.writeFileSync(bodyFile, '固定输入缺失，请核对');
  saveRun({ ...reviewer(root), runRef: r.run.ref, bodyFile });
  assert.throws(() =>
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
  );
  // A continuing Reviewer fixture is constructed without fabricating a submitted success.
  const file = path.join(root, r.run.ref);
  fs.writeFileSync(
    file,
    fs
      .readFileSync(file, 'utf8')
      .replace('status: draft', 'status: submitted\noutcome: continuing\nresult: fixture-progress'),
  );
  assert.throws(() => continueAction({ ...reviewer(root), actionId: r.run.actionId }, options));
});

test('local save 缺配置/活动目录/当前 Run、损坏配置/受管指针和 junction 逐项拒绝', () => {
  for (const problem of [
    'config-missing',
    'config-invalid',
    'change-missing',
    'run-missing',
    'unsafe-pointer',
    'junction',
    'lock',
    'config-changed-under-lock',
  ]) {
    const root = actionTarget();
    const a = startAuthor(root);
    fs.writeFileSync(path.join(root, 'body.md'), '待保存');
    const config = path.join(root, 'openspec/config.yaml');
    const change = path.join(root, 'openspec/changes/proof-entry');
    const runFile = path.join(root, a.run.ref);
    const manifestFile = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
    if (problem === 'config-missing') fs.renameSync(config, config + '.held');
    if (problem === 'config-invalid') fs.writeFileSync(config, 'schema: unsupported');
    if (problem === 'change-missing') fs.renameSync(change, change + '.held');
    if (problem === 'run-missing') fs.renameSync(runFile, runFile + '.held');
    if (problem === 'unsafe-pointer') {
      const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      manifest.changeBindings[0].latestRunRef = '../external/run.md';
      fs.writeFileSync(manifestFile, JSON.stringify(manifest));
    }
    if (problem === 'junction') {
      fs.renameSync(change, change + '.held');
      fs.symlinkSync(sandbox(), change, 'junction');
    }
    if (problem === 'lock') fs.writeFileSync(path.join(root, '.mendi/write.lock'), 'existing-lock');
    const before = snapshot(root);
    const oldRun = fs.existsSync(runFile) ? fs.readFileSync(runFile) : null;
    assert.throws(() =>
      saveRun(
        { ...author(root), runRef: a.run.ref, bodyFile: 'body.md' },
        problem === 'config-changed-under-lock'
          ? {
              observeWrite: (phase) => {
                if (phase === 'lock-acquired') fs.writeFileSync(config, 'schema: unsupported');
              },
            }
          : {},
      ),
    );
    if (problem === 'config-changed-under-lock') assert.deepEqual(fs.readFileSync(runFile), oldRun);
    else assert.deepEqual(snapshot(root), before);
  }
});
