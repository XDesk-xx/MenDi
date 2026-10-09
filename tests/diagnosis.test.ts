import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnoseWorkspace } from '../src/application/diagnosis.ts';
import { actionTarget, startAuthor, options, author } from './action-support.ts';
import { startAction, submitRun, saveRun } from '../src/application/actions.ts';
import { query } from '../src/application/project.ts';
import { snapshot, sandbox, repository } from './helpers.ts';
import { parseArguments } from '../src/drivers/arguments.ts';
function lock(root: string, pid = process.pid) {
  fs.writeFileSync(
    path.join(root, '.mendi/write.lock'),
    JSON.stringify({ token: 'fixture-token', pid, operation: 'fixture-write' }),
  );
}
test('diagnose 本地只读 alive/unknown/not-found，无锁；普通 query 锁行为不变', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  assert.equal(diagnoseWorkspace({ project: root }).classification, 'no-lock-observed');
  lock(root);
  const before = snapshot(root);
  const result = diagnoseWorkspace({ project: root });
  assert.equal(result.lock?.liveness, 'alive');
  assert.equal(result.classification, 'draft-observed');
  assert.equal(result.openspec, null);
  assert.equal(
    diagnoseWorkspace({ project: root }, { probe: () => 'unknown' }).lock?.liveness,
    'unknown',
  );
  assert.equal(
    diagnoseWorkspace({ project: root }, { probe: () => 'not-found' }).lock?.liveness,
    'not-found',
  );
  assert.equal(
    diagnoseWorkspace(
      { project: root },
      {
        probe: () => {
          throw new Error('denied');
        },
      },
    ).lock?.liveness,
    'unknown',
  );
  assert.throws(() => query({ project: root }, options));
  assert.deepEqual(snapshot(root), before);
  assert.equal(result.current?.ref, a.run.ref);
});
test('真实写入故障的未关联和实际 submitted 区分，临时路径只是观察，不改现场', () => {
  const root = actionTarget();
  assert.throws(() =>
    startAction(
      { ...author(root), changeId: 'proof-entry', type: 'explore' },
      {
        ...options,
        observeWrite: (phase) => {
          if (phase === 'before-manifest-commit') throw new Error('fault');
        },
      },
    ),
  );
  const ref = '.mendi/runs/d01/001-changes/proof-entry/001-explore/run.md';
  const before = snapshot(root);
  const result = diagnoseWorkspace({ project: root, runRef: ref });
  assert.equal(result.classification, 'unreferenced-run-observed');
  assert.equal(result.reservation?.isCurrent, false);
  assert.equal(result.current, null);
  assert.equal(result.temporaryPaths.length, 1);
  assert.deepEqual(snapshot(root), before);
  const second = actionTarget();
  const a = startAuthor(second);
  fs.writeFileSync(path.join(second, 'body.md'), '实际正文');
  saveRun({ ...author(second), runRef: a.run.ref, bodyFile: 'body.md' });
  assert.throws(() =>
    submitRun(
      { ...author(second), runRef: a.run.ref, outcome: 'complete', result: '受控完成' },
      {
        ...options,
        observeWrite: (phase) => {
          if (phase === 'before-readback') throw new Error('fault after commit');
        },
      },
    ),
  );
  const after = snapshot(second);
  const observed = diagnoseWorkspace({ project: second });
  assert.equal(observed.classification, 'current-submitted-observed');
  assert.equal(observed.current?.outcome, 'complete');
  assert.deepEqual(snapshot(second), after);
});
test('诊断坏锁、必要记录损坏、读中变化失败，路径/身份/junction不读取外部', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  const file = path.join(root, a.run.ref);
  for (const content of [
    'bad-json',
    JSON.stringify({ pid: 0, token: 'x', operation: 'x' }),
    JSON.stringify({ pid: process.pid, operation: 'x' }),
  ]) {
    fs.writeFileSync(path.join(root, '.mendi/write.lock'), content);
    const before = snapshot(root);
    assert.equal(diagnoseWorkspace({ project: root }).ok, false);
    assert.deepEqual(snapshot(root), before);
  }
  lock(root);
  const base = snapshot(root);
  for (const ref of [
    '../outside/run.md',
    a.run.ref.replace('/d01/', '/d02/'),
    a.run.ref.replace('proof-entry/', 'other/'),
    a.run.ref.replace('001-explore', '099-explore'),
  ])
    assert.equal(diagnoseWorkspace({ project: root, runRef: ref }).ok, false);
  assert.deepEqual(snapshot(root), base);
  const external = sandbox();
  fs.symlinkSync(
    external,
    path.join(root, '.mendi/runs/d01/001-changes/proof-entry/099-explore'),
    'junction',
  );
  assert.equal(
    diagnoseWorkspace({ project: root, runRef: a.run.ref.replace('001-explore', '099-explore') })
      .ok,
    false,
  );
  fs.unlinkSync(path.join(root, '.mendi/runs/d01/001-changes/proof-entry/099-explore'));
  const changed = diagnoseWorkspace(
    { project: root },
    { observeRead: () => fs.appendFileSync(file, 'observed drift') },
  );
  assert.equal(changed.ok, false);
  assert.equal(changed.observation, 'changed-during-read');
  assert.equal(changed.classification, 'unknown');
  fs.writeFileSync(file, 'malformed Run');
  const malformed = snapshot(root);
  assert.equal(diagnoseWorkspace({ project: root }).ok, false);
  assert.deepEqual(snapshot(root), malformed);
  fs.unlinkSync(path.join(root, '.mendi/project.json'));
  assert.equal(diagnoseWorkspace({ project: root }).ok, false);
});
test('人工 bootstrap 不解析人工 Run，不支持 --run；参数无 unlock/kill/ignore-lock/工具入口', () => {
  const before = fs.readFileSync(path.join(repository, '.mendi/project.json'));
  const manual = diagnoseWorkspace({ project: repository });
  assert.equal(manual.ok, true);
  assert.equal(manual.local?.source, 'manual-bootstrap');
  assert.equal(manual.current, null);
  assert.equal(diagnoseWorkspace({ project: repository, runRef: 'anything' }).ok, false);
  assert.deepEqual(fs.readFileSync(path.join(repository, '.mendi/project.json')), before);
  for (const args of [
    ['workspace', 'unlock'],
    ['workspace', 'kill'],
    ['workspace', 'diagnose', '--project', 'x', '--ignore-lock', 'true'],
    ['workspace', 'diagnose', '--project', 'x', '--openspec-bin', 'x'],
  ])
    assert.throws(() => parseArguments(args));
});

test('显式 reservation 等于 current 时，第二次读取不能覆盖首次快照并漏报变化', () => {
  const root = actionTarget();
  const a = startAuthor(root);
  lock(root);
  const file = path.join(root, a.run.ref);
  const read = fs.readFileSync;
  let reads = 0;
  try {
    fs.readFileSync = ((...args: Parameters<typeof read>) => {
      const bytes = Reflect.apply(read, fs, args);
      if (args[0] === file && ++reads === 2) fs.appendFileSync(file, 'controlled drift');
      return bytes;
    }) as typeof read;
    const result = diagnoseWorkspace({ project: root, runRef: a.run.ref });
    assert.equal(result.ok, false);
    assert.equal(result.observation, 'changed-during-read');
  } finally {
    fs.readFileSync = read;
  }
});
