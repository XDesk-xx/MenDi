import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { testTarget, pnpmEntry, writePackage } from './test-support.ts';
import { capturePnpm } from '../src/adapters/test-entries.ts';

test('空依赖副本使用各自目标路径，修改一个沙箱不污染其他目标或种子', () => {
  const first = testTarget();
  const second = testTarget();
  const stateRef = 'node_modules/.pnpm-workspace-state-v1.json';
  for (const root of [first, second]) {
    const state = JSON.parse(fs.readFileSync(path.join(root, stateRef), 'utf8'));
    assert.deepEqual(Object.keys(state.projects), [root]);
    assert.equal(capturePnpm(root, pnpmEntry, ['run'], 'error').exitCode, 0);
  }
  const manifestRef = '.mendi/delivery-groups/d01/manifest.json';
  const secondManifest = fs.readFileSync(path.join(second, manifestRef));
  const secondState = fs.readFileSync(path.join(second, stateRef));
  fs.writeFileSync(path.join(first, manifestRef), '{}\n');
  fs.writeFileSync(path.join(first, stateRef), '{}\n');
  assert.deepEqual(fs.readFileSync(path.join(second, manifestRef)), secondManifest);
  assert.deepEqual(fs.readFileSync(path.join(second, stateRef)), secondState);
  const third = testTarget();
  assert.equal(capturePnpm(third, pnpmEntry, ['run'], 'error').exitCode, 0);
});

test('复用空依赖准备不掩盖缺失准备或新增未安装依赖', () => {
  const unprepared = testTarget(true, false);
  assert.equal(fs.existsSync(path.join(unprepared, 'node_modules')), false);
  assert.notEqual(capturePnpm(unprepared, pnpmEntry, ['run'], 'error').exitCode, 0);
  const prepared = testTarget();
  writePackage(prepared, (pkg) => {
    pkg.dependencies = { 'missing-fixture-package': '99.99.99' };
  });
  assert.notEqual(capturePnpm(prepared, pnpmEntry, ['run'], 'error').exitCode, 0);
});
