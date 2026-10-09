import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectProject } from '../src/adapters/project.ts';
import { managedPath } from '../src/adapters/paths.ts';
import { MendiError } from '../src/core/errors.ts';
import { sandbox, fixture, snapshot } from './helpers.ts';

function code(expected: string) {
  return (error: unknown) => error instanceof MendiError && error.code === expected;
}
test('本地新 / 已有配置按显式目标读取并保留原字节', () => {
  const parent = sandbox();
  for (const name of ['minimal-project', 'existing-openspec-project']) {
    const target = fixture(parent, name);
    const before = snapshot(target);
    assert.equal(inspectProject(target).root, target);
    assert.deepEqual(snapshot(target), before);
  }
});
test('config.yml 仅在主配置不存在时使用，损坏主配置不回退', () => {
  const target = fixture(sandbox());
  fs.renameSync(
    path.join(target, 'openspec/config.yaml'),
    path.join(target, 'openspec/config.yml'),
  );
  assert.ok(inspectProject(target).configPath.endsWith('config.yml'));
  fs.writeFileSync(path.join(target, 'openspec/config.yaml'), 'schema: [broken\n');
  const before = snapshot(target);
  assert.throws(() => inspectProject(target), code('invalid-local-config'));
  assert.deepEqual(snapshot(target), before);
});
test('有效主配置存在时不解析未选用的 config.yml junction', () => {
  const parent = sandbox();
  const target = fixture(parent);
  const outside = path.join(parent, 'unused-config');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(target, 'openspec/config.yml'), 'junction');
  assert.ok(inspectProject(target).configPath.endsWith('config.yaml'));
});
test('store / 坏 YAML / schema / 子目录 / 裸目录在写前拒绝', () => {
  const parent = sandbox();
  for (const [name, expected] of [
    ['declared-store-project', 'unsupported-store-declaration'],
    ['invalid-openspec-project', 'invalid-local-config'],
  ]) {
    const target = fixture(parent, name);
    fs.mkdirSync(path.join(target, 'openspec/changes'));
    const before = snapshot(target);
    assert.throws(() => inspectProject(target), code(expected));
    assert.deepEqual(snapshot(target), before);
  }
  const target = fixture(parent);
  fs.writeFileSync(path.join(target, 'openspec/config.yaml'), 'schema: custom\n');
  assert.throws(() => inspectProject(target), code('unsupported-schema'));
  const child = path.join(target, 'child');
  fs.mkdirSync(child);
  assert.throws(() => inspectProject(child), code('local-config-missing'));
  fs.mkdirSync(path.join(child, 'openspec'));
  assert.throws(() => inspectProject(child), code('local-config-missing'));
  assert.throws(() => inspectProject(path.join(parent, 'missing')), code('invalid-project'));
});
test('受管路径拒绝越界和指向外部的 junction', () => {
  const parent = sandbox();
  const target = fixture(parent);
  const outside = path.join(parent, 'outside');
  fs.mkdirSync(outside);
  for (const ref of ['../outside', 'C:/outside', '/outside', '.mendi/../other'])
    assert.throws(() => managedPath(target, ref), code('unsafe-reference'));
  fs.symlinkSync(outside, path.join(target, '.mendi'), 'junction');
  assert.throws(() => managedPath(target, '.mendi/project.json'), code('unsafe-reference'));
  assert.deepEqual(fs.readdirSync(outside), []);
});
