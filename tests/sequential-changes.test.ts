import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { sequentialTarget, associateSecond, stage, approvedArchive } from './sequential-support.ts';
import { archiveAction } from '../src/application/archive.ts';
import { bindChange, query, openDelivery } from '../src/application/project.ts';
import { currentRun } from '../src/adapters/runs.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { diagnoseWorkspace } from '../src/application/diagnosis.ts';
import { archiveCli, archiveInput, worker, disposeStoppedFixtureLock } from './archive-support.ts';
import { cli, isolatedEnv, scopeFile, snapshot } from './helpers.ts';
import { execute, statusCli, testTarget } from './test-support.ts';
import { testStatus } from '../src/application/tests.ts';

test('真实原生两次 Archive / 第二 bind / 无 Run 查询 / 共享批次 / 新进程 / 累计 2', async () => {
  const { root, first, firstBinding } = sequentialTarget();
  const oldRun = fs.readFileSync(path.join(root, first.run.ref));
  const next = associateSecond(root);
  assert.equal(next.local.changeBindings[1].batchId, '001-changes');
  assert.equal(next.local.changeBindings[1].latestRunRef, undefined);
  assert.equal(currentRun(root, readWorkspace(root)!), null);
  assert.equal(query({ project: root }).next.action, 'explore');
  assert.throws(() => archiveAction(archiveInput(root, first.run.ref, 'finish')), /当前 Archive/);
  assert.throws(() => archiveAction(archiveInput(root, first.run.ref, 'execute')), /当前 Archive/);
  assert.equal(diagnoseWorkspace({ project: root }).current, null);
  const empty = path.join(root, '.mendi/runs/d01/001-changes/proof-entry/008-propose');
  fs.mkdirSync(empty);
  const explore = stage(root, 'second-entry', 'explore');
  assert.equal(explore.run.runNumber, 9);
  assert.equal(explore.incompleteReservations.length, 1);
  stage(root, 'second-entry', 'review-explore', explore.run.ref);
  for (const phase of ['propose', 'apply']) {
    const author = stage(root, 'second-entry', phase);
    stage(root, 'second-entry', 'review-' + phase, author.run.ref);
  }
  const queryProcess = cli(
    ['status', '--project', root, '--json'],
    path.dirname(root),
    isolatedEnv(root),
  );
  assert.equal(queryProcess.status, 0, queryProcess.stdout);
  assert.equal(JSON.parse(queryProcess.stdout).run.changeId, 'second-entry');
  const ordinary = await execute(root);
  assert.equal(ordinary.outcome, 'passed', JSON.stringify(ordinary));
  if ('record' in ordinary) assert.equal(ordinary.record.changeId, 'second-entry');
  const draft = (await import('../src/application/actions.ts')).startAction({
    project: root,
    changeId: 'second-entry',
    type: 'archive',
    role: 'author',
    actor: 'archive-author',
  });
  const finished = archiveAction(archiveInput(root, draft.run.ref));
  assert.equal(finished.result, 'archived');
  assert.equal(finished.run.archive!.ordinal, 2);
  assert.deepEqual(finished.local.changeBindings[0], firstBinding);
  assert.deepEqual(fs.readFileSync(path.join(root, first.run.ref)), oldRun);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8')).archivedChangeCount,
    2,
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'), 'utf8'),
  );
  assert.deepEqual(manifest.changeBatches[0].changeIds, ['proof-entry', 'second-entry']);
  assert.match(finished.local.changeBindings[1].changeRef, /\d{4}-\d{2}-\d{2}-002-second-entry$/);
  assert.equal(query({ project: root }).next.action, 'delivery-next');
  const terminal = fs.readFileSync(path.join(root, draft.run.ref));
  assert.equal(archiveCli(root, draft.run.ref).result, 'already-completed');
  assert.deepEqual(fs.readFileSync(path.join(root, draft.run.ref)), terminal);
  const full = await execute(root, 'full');
  assert.equal(full.outcome, 'passed', JSON.stringify(full));
  if ('record' in full) {
    assert.equal(full.record.changeId, null);
    assert.equal(full.record.formalDeliveryTest, false);
    assert.equal(statusCli(root, full.executionId!).outcome, 'passed');
  }
  fs.unlinkSync(path.join(root, first.run.ref));
  fs.unlinkSync(path.join(root, firstBinding.changeRef, '.openspec.yaml'));
  const archivedQuery = query({ project: root });
  assert.ok('run' in archivedQuery);
  if ('run' in archivedQuery) assert.equal(archivedQuery.run!.changeId, 'second-entry');
  fs.unlinkSync(path.join(root, draft.run.ref));
  assert.throws(() => query({ project: root }));
  assert.equal(testStatus({ project: root, execution: full.executionId! }).outcome, 'passed');
});
test('第二 Archive 计数 / 终态 / manifest 真实中断，新进程只定向收口一次，旧项保持', () => {
  for (const fault of [
    'after-count-commit',
    'after-archive-run-commit',
    'before-manifest-commit',
  ]) {
    const { root, first, firstBinding } = sequentialTarget();
    const bytes = fs.readFileSync(path.join(root, first.run.ref));
    associateSecond(root);
    const draft = approvedArchive(root, 'second-entry');
    const failed = worker(root, draft.run.ref, 'execute', fault);
    assert.equal(failed.status, 88, failed.stdout + failed.stderr);
    const prior = currentRun(root, readWorkspace(root, true)!)!;
    const terminal =
      prior.record.status === 'submitted' ? fs.readFileSync(path.join(root, draft.run.ref)) : null;
    disposeStoppedFixtureLock(root);
    assert.equal(query({ project: root }).next.action, 'archive-finish');
    const pendingBytes = snapshot(root);
    const blocked = cli(
      [
        'test',
        'run',
        '--project',
        root,
        '--kind',
        'focused',
        '--actor',
        'test-author',
        '--pnpm-bin',
        'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js',
        '--json',
      ],
      root,
      isolatedEnv(root),
    );
    assert.equal(blocked.status, 1, blocked.stdout);
    assert.equal(JSON.parse(blocked.stdout).outcome, 'not-run');
    assert.deepEqual(snapshot(root), pendingBytes);
    const done = archiveCli(root, draft.run.ref, 'finish', 0, path.join(root, 'missing.js'));
    assert.equal(done.run.archive.ordinal, 2);
    assert.deepEqual(done.local.changeBindings[0], firstBinding);
    assert.deepEqual(fs.readFileSync(path.join(root, first.run.ref)), bytes);
    if (terminal) assert.deepEqual(fs.readFileSync(path.join(root, draft.run.ref)), terminal);
    assert.equal(archiveCli(root, draft.run.ref).result, 'already-completed');
    assert.equal(fs.readFileSync(path.join(root, 'native-calls.txt'), 'utf8'), 'archive\n');
  }
});
test('必要当前缺失 / 坏身份仍拒绝，旧历史 / 未知 Ref 不成为输入；依赖和陈旧关联拒绝', () => {
  const { root, first } = sequentialTarget();
  associateSecond(root);
  const old = path.join(root, first.run.ref);
  fs.unlinkSync(old);
  const mf = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
  m.changeBindings[0].unknownRef = '../missing';
  m.unknownRef = { unavailable: true };
  fs.writeFileSync(mf, JSON.stringify(m));
  assert.equal(query({ project: root }).next.action, 'explore');
  const fresh = stage(root, 'second-entry', 'explore');
  const file = path.join(root, fresh.run.ref);
  const source = fs.readFileSync(file);
  fs.writeFileSync(file, 'broken');
  assert.throws(() => query({ project: root }));
  fs.writeFileSync(file, source);
  fs.unlinkSync(file);
  assert.throws(() => query({ project: root }));
  const before = snapshot(root);
  assert.throws(() => bindChange({ project: root, changeId: 'proof-entry', slot: 'A' }));
  assert.deepEqual(snapshot(root), before);
  const unbound = testTarget(false);
  assert.throws(
    () =>
      openDelivery({
        project: unbound,
        id: 'd01',
        title: 'dep',
        scopePath: scopeFile(unbound),
        changeId: 'second-entry',
        slot: 'B',
      }),
    /依赖/,
  );
  assert.equal(fs.existsSync(path.join(unbound, '.mendi')), false);
});
