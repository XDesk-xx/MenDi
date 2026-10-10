import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { openDelivery, query } from '../src/application/project.ts';
import { fullTestStatus, runFullTest } from '../src/application/delivery-full-test.ts';
import { testStatus, runTest } from '../src/application/tests.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { MendiError } from '../src/core/errors.ts';
import {
  closedTarget,
  openInput,
  archiveNew,
  queryCli,
  lifecycleCli,
  recordLifecycleScene,
} from './lifecycle-support.ts';
import { fullInput } from './delivery-support.ts';
import { testInput, testTarget } from './test-support.ts';
import { scopeFile, cli, isolatedEnv } from './helpers.ts';
import { options } from './action-support.ts';

test('closed 后新 Delivery 追加选择，原生归档累计增长，同名 execution 按显式 ID 读取', async () => {
  const { root, passed } = await closedTarget();
  assert.ok('run' in passed && passed.run && 'verification' in passed && passed.verification.child);
  const old = readWorkspace(root)!;
  const oldBytes = fs.readFileSync(path.join(root, old.manifestRef));
  const oldRun = fs.readFileSync(path.join(root, passed.run.ref));
  openInput(root);
  const opened = lifecycleCli(root, 'open', [
    '--id',
    'd02',
    '--title',
    '新 Delivery',
    '--scope',
    'new-scope.json',
  ]);
  assert.equal(opened.local.deliveryId, 'd02');
  assert.equal(opened.local.state, 'open');
  let current = readWorkspace(root)!;
  assert.equal(current.project.archivedChangeCount, 2);
  assert.equal((current.project.deliveries as unknown[]).length, 2);
  assert.equal(current.manifest.deliveryRunRef, '.mendi/runs/d02/001-delivery-open/run.md');
  assert.equal(current.manifest.fullTestRunRef, undefined);
  assert.equal(current.bindings.length, 0);
  assert.deepEqual(current.manifest.changeBatches, []);
  assert.equal(queryCli(root).local.deliveryId, 'd02');
  assert.equal(queryCli(root, ['--delivery', 'd01']).local.state, 'closed');
  const ordinary = await runTest(testInput(root, 'full'));
  assert.equal(ordinary.ok, true);
  assert.equal(ordinary.executionId, passed.verification.child.executionId);
  const d02 = testStatus({ project: root, execution: ordinary.executionId!, deliveryId: 'd02' });
  const d01 = testStatus({ project: root, execution: ordinary.executionId!, deliveryId: 'd01' });
  assert.ok('record' in d02 && 'record' in d01);
  assert.equal(d02.record.deliveryId, 'd02');
  assert.equal(d01.record.deliveryId, 'd01');
  const historical = cli(
    ['delivery', 'full-test', 'status', '--project', root, '--run', passed.run.ref, '--json'],
    root,
    isolatedEnv(root),
  );
  assert.equal(historical.status, 0, historical.stdout);
  assert.equal(JSON.parse(historical.stdout).local.deliveryId, 'd01');
  archiveNew(root, 'new-delivery-entry', 'N');
  current = readWorkspace(root)!;
  assert.equal(current.project.archivedChangeCount, 3);
  const fresh = await runFullTest(fullInput(root));
  assert.equal(fresh.ok, true, JSON.stringify(fresh));
  const index = fs.readFileSync(path.join(root, '.mendi/project.json'));
  assert.equal(queryCli(root, ['--delivery', 'd01']).local.state, 'closed');
  assert.equal(
    fullTestStatus({ project: root, runRef: passed.run.ref }).verification.outcome,
    'passed',
  );
  assert.ok(fs.readFileSync(path.join(root, '.mendi/project.json')).equals(index));
  assert.ok(fs.readFileSync(path.join(root, old.manifestRef)).equals(oldBytes));
  assert.ok(fs.readFileSync(path.join(root, passed.run.ref)).equals(oldRun));
  assert.equal(readWorkspace(root)!.id, 'd02');
  assert.ok('verification' in fresh && fresh.verification.child && 'record' in ordinary);
  recordLifecycleScene(
    root,
    'new-delivery-chain',
    { old: passed.run, new: current.manifest, formal: fresh.run },
    [passed.verification.child, ordinary.record, fresh.verification.child],
  );
  assert.equal(
    testStatus({ project: root, execution: ordinary.executionId!, deliveryId: 'unknown' }).ok,
    false,
  );
  assert.throws(() => query({ project: root, deliveryId: 'unknown' }, options), MendiError);
});
test('显式首次 Open 记录 001；可选首次绑定退出 Open 指针，旧入口不补 Run', () => {
  const root = testTarget(false);
  const scope = scopeFile(root);
  const opened = openDelivery({
    project: root,
    id: 'first',
    title: '首次',
    scopePath: path.basename(scope),
    role: 'author',
    actor: 'a',
  });
  assert.equal(opened.local.deliveryId, 'first');
  assert.equal(scanRunNumbers(root, 'first').number, 2);
  const plain = testTarget(false);
  openDelivery({ project: plain, id: 'old', title: '兼容', scopePath: scopeFile(plain) });
  assert.equal(scanRunNumbers(plain, 'old').number, 1);
  assert.equal(readWorkspace(plain)!.manifest.openRunRef, undefined);
  const bound = testTarget(false);
  fs.mkdirSync(path.join(bound, 'openspec/changes/proof-entry'), { recursive: true });
  openDelivery(
    {
      project: bound,
      id: 'first',
      title: '首次绑定',
      scopePath: path.basename(scopeFile(bound)),
      role: 'author',
      actor: 'a',
      changeId: 'proof-entry',
      slot: 'A',
    },
    options,
  );
  assert.equal(readWorkspace(bound)!.manifest.deliveryRunRef, undefined);
  assert.equal(
    readWorkspace(bound)!.manifest.openRunRef,
    '.mendi/runs/first/001-delivery-open/run.md',
  );
});
test('新 Open 在写前拒绝 still open、人工历史、重复 / 占用 ID、缺身份与混合 bind', async () => {
  const { root } = await closedTarget();
  const input = openInput(root);
  const before = fs.readFileSync(path.join(root, '.mendi/project.json'));
  for (const bad of [
    { ...input, id: 'd01' },
    { ...input, actor: undefined },
    { ...input, role: 'reviewer' },
    { ...input, changeId: 'next', slot: 'N' },
    { ...input, scopePath: '../outside.json' },
  ])
    assert.throws(() => openDelivery(bad), MendiError);
  assert.ok(fs.readFileSync(path.join(root, '.mendi/project.json')).equals(before));
  fs.mkdirSync(path.join(root, '.mendi/delivery-groups/d02'));
  assert.throws(() => openDelivery(input), MendiError);
  const openRoot = testTarget();
  assert.throws(() => openDelivery(openInput(openRoot)), MendiError);
  assert.throws(
    () =>
      openDelivery({
        project: process.cwd(),
        id: 'root-migration',
        title: '禁止迁移',
        scopePath: 'new-scope.json',
        role: 'author',
        actor: 'a',
      }),
    MendiError,
  );
  assert.equal(
    lifecycleCli(root, 'open', ['--resume', '.mendi/runs/d01/999-delivery-open/run.md'], 1).ok,
    false,
  );
});
