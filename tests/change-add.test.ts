import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { addDeliveryChanges } from '../src/application/delivery-change-add.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { input, write, execute, evidence } from './change-add-support.ts';
import { authorActor } from './delivery-support.ts';
import { additions } from './change-add-support.ts';
import { verificationTarget } from './delivery-support.ts';
import { snapshot, scopeFile } from './helpers.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { parseDeliveryRun } from '../src/core/delivery-runs.ts';
import { projectRound } from '../src/core/rounds.ts';
import { recordRound } from '../src/core/round-records.ts';
import { sequentialTarget, associateSecond, stage } from './sequential-support.ts';
import { parseArguments } from '../src/drivers/arguments.ts';
import { testTarget } from './test-support.ts';
import { openDelivery } from '../src/application/project.ts';

test('真实追加独立 typed 收据、同轮范围和共享编号；新进程 bind next、请求重放和冲突', () => {
  const root = verificationTarget();
  write(root);
  const before = readWorkspace(root)!,
    old = snapshot(path.join(root, '.mendi/runs'));
  const number = scanRunNumbers(root, before.id).number;
  const result = execute(root, [
    'delivery',
    'change',
    'add',
    '--input',
    'append.json',
    '--role',
    'author',
    '--actor',
    authorActor,
  ]);
  const after = readWorkspace(root)!;
  assert.equal(result.run.runNumber, number);
  assert.equal(after.currentRoundId, before.currentRoundId);
  assert.equal(after.rounds!.length, before.rounds!.length);
  assert.equal(after.manifest.deliveryRunRef, undefined);
  assert.equal(after.manifest.scopeAddRunRef, result.run.ref);
  assert.deepEqual(after.bindings, before.bindings);
  assert.deepEqual(after.project, before.project);
  assert.deepEqual(after.scope.plannedChanges.slice(0, 2), before.scope.plannedChanges);
  for (const [ref, hash] of Object.entries(old))
    assert.equal(snapshot(path.join(root, '.mendi/runs'))[ref], hash);
  assert.equal(execute(root, ['next']).next.action, 'change-bind');
  const stable = snapshot(path.join(root, '.mendi'));
  const replay = execute(root, [
    'delivery',
    'change',
    'add',
    '--input',
    'append.json',
    '--role',
    'author',
    '--actor',
    authorActor,
  ]);
  assert.equal(replay.alreadyCompleted, true);
  assert.equal(replay.run.ref, result.run.ref);
  assert.deepEqual(snapshot(path.join(root, '.mendi')), stable);
  write(root, { reason: '不同请求内容' });
  assert.throws(() => addDeliveryChanges(input(root)), /requestId/);
  assert.deepEqual(snapshot(path.join(root, '.mendi')), stable);
  const run = readDeliveryRun(root, result.run.ref, before.id);
  for (const patch of [
    { role: 'reviewer' },
    { runNumber: number + 1 },
    { actionType: 'delivery-full-test' },
    { verdict: 'approved' },
    { changeAdd: { ...run.record.changeAdd!, version: 2 } },
    { changeAdd: { ...run.record.changeAdd!, priorPointers: {} } },
  ])
    assert.throws(() => parseDeliveryRun({ ...run.header, ...patch }, run.ref, before.id));
  evidence('append-and-replay', root, { before, result, after });
});

test('实际记录 Open 在追加后仍按原范围归属，单项追加不 bind 或创建 Change', () => {
  const root = testTarget(false);
  scopeFile(root);
  const opened = openDelivery({
    project: root,
    id: 'd01',
    title: '追加 Open',
    scopePath: 'scope.json',
    role: 'author',
    actor: authorActor,
  });
  assert.ok('run' in opened && opened.run);
  const original = fs.readFileSync(path.join(root, opened.run!.ref));
  write(root, { additions: [additions[0]] });
  addDeliveryChanges(input(root));
  const w = readWorkspace(root)!;
  assert.equal(recordRound(w, readDeliveryRun(root, opened.run!.ref, w.id).record)?.id, 'r001');
  assert.equal(w.activeChangeId, null);
  assert.equal(w.bindings.length, 0);
  assert.equal(execute(root, ['next']).next.action, 'change-bind');
  assert.ok(fs.readFileSync(path.join(root, opened.run!.ref)).equals(original));
});

test('负输入、角色、越界、依赖、基线及伪 bind 整体拒绝，不占号；manual / legacy 只读', () => {
  const root = verificationTarget();
  const stable = snapshot(path.join(root, '.mendi'));
  for (const patch of [
    { requestId: '' },
    { ownerDecision: '' },
    { reason: '' },
    { additions: [] },
    { additions: [{ slot: 'A', title: '重复', dependsOn: [] }] },
    { additions: [{ slot: 'C', title: '悬空', dependsOn: ['missing'] }] },
    {
      additions: [
        { slot: 'C', title: '环', dependsOn: ['D'] },
        { slot: 'D', title: '环', dependsOn: ['C'] },
      ],
    },
    { additions: [{ slot: 'C', title: '伪绑定', dependsOn: [], changeId: 'x' }] },
    {
      additions: [
        {
          slot: 'C',
          title: '基线',
          dependsOn: [],
          baselineDependencies: [
            {
              deliveryId: 'missing',
              planningSlot: 'A',
              closeRunRef: '.mendi/runs/missing/001-delivery-close/run.md',
            },
          ],
        },
      ],
    },
    { bind: true },
  ]) {
    write(root, patch);
    assert.throws(() => addDeliveryChanges(input(root)));
    assert.deepEqual(snapshot(path.join(root, '.mendi')), stable);
  }
  write(root);
  for (const changed of [{ role: 'reviewer' }, { actor: '' }, { inputFile: '../outside.json' }])
    assert.throws(() => addDeliveryChanges({ ...input(root), ...changed }));
  for (const args of [
    [],
    ['--input', 'append.json'],
    ['--role', 'author', '--actor', authorActor],
    ['--role', 'author', '--actor', authorActor, '--input', 'append.json', '--resume', 'x'],
    ['--change', 'x'],
  ])
    assert.throws(() => parseArguments(['delivery', 'change', 'add', '--project', root, ...args]));
  assert.deepEqual(snapshot(path.join(root, '.mendi')), stable);
  for (const mode of ['legacy', 'manual']) {
    const target = verificationTarget();
    write(target);
    const ref = path.join(target, '.mendi/delivery-groups/d01/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(ref, 'utf8'));
    if (mode === 'legacy') {
      manifest.formatVersion = 1;
      delete manifest.rounds;
      delete manifest.currentRoundId;
    } else {
      delete manifest.formatVersion;
      manifest.recordingMode = 'manual-bootstrap';
      const file = path.join(target, '.mendi/project.json'),
        project = JSON.parse(fs.readFileSync(file, 'utf8'));
      delete project.formatVersion;
      project.recordingMode = 'manual-bootstrap';
      fs.writeFileSync(file, JSON.stringify(project));
    }
    fs.writeFileSync(ref, JSON.stringify(manifest));
    const original = snapshot(path.join(target, '.mendi'));
    assert.throws(() => addDeliveryChanges(input(target)));
    assert.deepEqual(snapshot(path.join(target, '.mendi')), original);
  }
});

test('多次追加快照连续、实际收据缺失/伪造、坏链、跨轮与未知历史范围拒绝', () => {
  const root = verificationTarget();
  write(root, { additions: [additions[0]] });
  const first = addDeliveryChanges(input(root));
  write(root, { requestId: 'second', additions: [additions[1]] });
  const second = addDeliveryChanges(input(root));
  const w = readWorkspace(root)!;
  assert.equal(w.rounds![0].scopeAdditions!.length, 2);
  const initial = w.rounds![0].scopeAdditions![0].beforeScope;
  const fake = readDeliveryRun(root, first.run.ref, w.id);
  const lifecycle = {
    ...fake.record,
    changeAdd: undefined,
    runNumber: first.run.runNumber - 1,
    lifecycle: { scope: initial, roundId: 'r001' },
  };
  assert.equal(recordRound(w, lifecycle as never)?.id, 'r001');
  assert.throws(() => recordRound(w, { ...lifecycle, runNumber: first.run.runNumber } as never));
  assert.throws(() =>
    recordRound(w, { ...lifecycle, runNumber: first.run.runNumber + 1 } as never),
  );
  assert.throws(() =>
    recordRound(w, { ...lifecycle, runNumber: second.run.runNumber + 1 } as never),
  );
  assert.throws(() =>
    recordRound(w, { ...lifecycle, lifecycle: { scope: initial, roundId: 'r002' } } as never),
  );
  assert.throws(() =>
    recordRound(w, {
      ...lifecycle,
      lifecycle: { scope: { ...initial, goal: '伪范围' }, roundId: 'r001' },
    } as never),
  );
  const file = path.join(root, second.run.ref),
    bytes = fs.readFileSync(file);
  fs.writeFileSync(file, bytes.toString().replace('role: author', 'role: reviewer'));
  assert.throws(() => readWorkspace(root));
  fs.writeFileSync(file, bytes);
  fs.renameSync(file, file + '.saved');
  assert.throws(() => readWorkspace(root));
  fs.renameSync(file + '.saved', file);
  const manifestRef = path.join(root, w.manifestRef),
    manifestBytes = fs.readFileSync(manifestRef);
  const broken = structuredClone(w.rounds!);
  broken[0].scopeAdditions![1].beforeScope = initial;
  fs.writeFileSync(
    manifestRef,
    JSON.stringify(projectRound(w.manifest, broken, w.currentRoundId!)),
  );
  assert.throws(() => readWorkspace(root));
  fs.writeFileSync(manifestRef, manifestBytes);
  assert.equal(execute(root, ['status', '--round', 'r001']).ok, true);
});

test('活动 Change 的最新 Run、角色和阶段不被追加收据抢占', () => {
  const { root } = sequentialTarget();
  associateSecond(root);
  const run = stage(root, 'second-entry', 'explore');
  const before = execute(root, ['next']);
  write(root);
  const result = addDeliveryChanges(input(root));
  const after = execute(root, ['next']);
  assert.equal(after.run.ref, run.run.ref);
  assert.deepEqual(after.next, before.next);
  assert.equal(result.next.action, before.next.action);
  assert.equal(readWorkspace(root)!.activeChangeId, 'second-entry');
});
