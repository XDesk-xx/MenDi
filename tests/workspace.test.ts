import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWorkspace,
  readWorkspace,
  updateWorkspace,
  type WritePhase,
} from '../src/adapters/workspace.ts';
import { MendiError } from '../src/core/errors.ts';
import { bindChange } from '../src/application/project.ts';
import { openspecEntry } from './helpers.ts';
import { fixture, sandbox, snapshot } from './helpers.ts';

function records() {
  const project = {
    formatVersion: 1,
    recordingMode: 'product',
    name: 'test',
    deliveryGroupsDir: '.mendi/delivery-groups',
    activeDeliveryId: 'd01',
    deliveries: [{ id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' }],
  };
  const manifest = {
    formatVersion: 1,
    recordingMode: 'product',
    id: 'd01',
    title: 'D01',
    state: 'open',
    openedOn: '2026-10-09',
    goal: '验证',
    plannedChanges: [{ slot: 'A', title: '入口', dependsOn: [] }],
    activeChangeId: null,
    changeBindings: [],
    changeBatches: [],
  };
  return { project, manifest };
}
function code(expected: string) {
  return (e: unknown) => e instanceof MendiError && e.code === expected;
}
test('完整提交可读回，重复 Open 保留原文件', () => {
  const root = fixture(sandbox());
  const { project, manifest } = records();
  assert.equal(createWorkspace(root, project, manifest).id, 'd01');
  const before = snapshot(root);
  assert.throws(() => createWorkspace(root, project, manifest), code('existing-mendi-state'));
  assert.deepEqual(snapshot(root), before);
  assert.equal(readWorkspace(root)?.scope.goal, '验证');
});
test('manifest 后 / entry 前 / 读回 / 锁释放故障均不伪报完整成功', () => {
  for (const phase of [
    'manifest-written',
    'before-entry-commit',
    'before-readback',
    'before-lock-release',
  ] as WritePhase[]) {
    const root = fixture(sandbox());
    const { project, manifest } = records();
    assert.throws(
      () =>
        createWorkspace(root, project, manifest, (current) => {
          if (current === phase) throw new Error('controlled failure: ' + phase);
        }),
      (error: unknown) => {
        assert.ok(error instanceof MendiError);
        assert.equal(error.code, 'workspace-write-failed');
        assert.ok(Array.isArray((error.details as Record<string, unknown>).committedPaths));
        return true;
      },
    );
    if (phase === 'manifest-written' || phase === 'before-entry-commit')
      assert.throws(() => readWorkspace(root), code('incomplete-mendi-state'));
    if (phase === 'before-readback') assert.equal(readWorkspace(root)?.id, 'd01');
    if (phase === 'before-lock-release')
      assert.throws(() => readWorkspace(root), code('write-in-progress-or-interrupted'));
    const before = snapshot(root);
    assert.throws(() => createWorkspace(root, project, manifest), code('existing-mendi-state'));
    assert.deepEqual(snapshot(root), before);
  }
});
test('更新替换失败保持原文件并保留临时现场', () => {
  const root = fixture(sandbox());
  const { project, manifest } = records();
  createWorkspace(root, project, manifest);
  const file = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const original = fs.readFileSync(file);
  assert.throws(
    () =>
      updateWorkspace(
        root,
        (current) => ({ ...current.manifest, title: '新标题' }),
        (phase) => {
          if (phase === 'before-manifest-commit') throw new Error('replacement failed');
        },
      ),
    code('workspace-write-failed'),
  );
  assert.deepEqual(fs.readFileSync(file), original);
  assert.equal(readWorkspace(root)?.title, 'D01');
  assert.ok(fs.readdirSync(path.dirname(file)).some((file) => file.endsWith('.tmp')));
});
test('实际 rename 调用失败时正式 manifest 字节不变', (t) => {
  const root = fixture(sandbox());
  const { project, manifest } = records();
  createWorkspace(root, project, manifest);
  const file = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const original = fs.readFileSync(file);
  t.mock.method(fs, 'renameSync', () => {
    throw Object.assign(new Error('controlled EACCES'), { code: 'EACCES' });
  });
  assert.throws(
    () => updateWorkspace(root, (current) => ({ ...current.manifest, title: '新标题' })),
    code('workspace-write-failed'),
  );
  assert.deepEqual(fs.readFileSync(file), original);
  assert.equal(readWorkspace(root)?.title, 'D01');
});
test('并发写冲突不会删除他人的锁，锁归属改变也不删除', () => {
  const root = fixture(sandbox());
  const { project, manifest } = records();
  createWorkspace(root, project, manifest);
  updateWorkspace(
    root,
    (current) => current.manifest,
    (phase, file) => {
      if (phase === 'lock-acquired') {
        const lock = fs.readFileSync(file);
        assert.throws(
          () => updateWorkspace(root, (c) => c.manifest),
          code('write-in-progress-or-interrupted'),
        );
        assert.deepEqual(fs.readFileSync(file), lock);
      }
    },
  );
  const lockPath = path.join(root, '.mendi/write.lock');
  assert.throws(
    () =>
      updateWorkspace(
        root,
        (current) => current.manifest,
        (phase) => {
          if (phase === 'before-lock-release') fs.writeFileSync(lockPath, 'another owner');
        },
      ),
    code('workspace-write-failed'),
  );
  assert.equal(fs.readFileSync(lockPath, 'utf8'), 'another owner');
});
test('已有关联的 bind 在创建锁前拒绝', (t) => {
  const root = fixture(sandbox());
  const { project, manifest } = records();
  const changeRef = 'openspec/changes/proof-entry';
  fs.mkdirSync(path.join(root, changeRef), { recursive: true });
  createWorkspace(root, project, {
    ...manifest,
    activeChangeId: 'proof-entry',
    changeBindings: [{ changeId: 'proof-entry', planningSlot: 'A', changeRef, state: 'explore' }],
  });
  const before = snapshot(root);
  const opened = fs.openSync;
  let locks = 0;
  t.mock.method(fs, 'openSync', (...args: Parameters<typeof fs.openSync>) => {
    if (String(args[0]).endsWith('write.lock')) locks++;
    return opened(...args);
  });
  const runner = (_entry: string, args: string[]) => ({
    status: 0,
    signal: null,
    stdout:
      args[0] === '--version'
        ? '1.14.1'
        : JSON.stringify({
            root: { path: root, source: 'nearest' },
            changes: [{ name: 'proof-entry' }],
          }),
    stderr: '',
  });
  assert.throws(
    () =>
      bindChange(
        { project: root, openspecBin: openspecEntry, changeId: 'proof-entry', slot: 'A' },
        { runner },
      ),
    code('change-bind-conflict'),
  );
  assert.equal(locks, 0);
  assert.deepEqual(snapshot(root), before);
});
