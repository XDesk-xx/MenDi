import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cli,
  fixture,
  isolatedEnv,
  repository,
  sandbox,
  scopeFile,
  snapshot,
  prepareChange,
} from './helpers.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { MendiError } from '../src/core/errors.ts';
import { query } from '../src/application/project.ts';
import { type ProcessRunner } from '../src/adapters/openspec.ts';

function json(args: string[], cwd: string, env: NodeJS.ProcessEnv, status = 0) {
  const result = cli([...args, '--json'], cwd, env);
  assert.equal(result.status, status, result.stdout || result.stderr);
  return JSON.parse(result.stdout);
}
test('真实上游 planning complete 不自动批准或推进本地 Explore', () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  const root = fixture(parent);
  scopeFile(root);
  prepareChange(root, env);
  const change = path.join(root, 'openspec/changes/proof-entry');
  for (const name of ['proposal.md', 'design.md', 'tasks.md'])
    fs.writeFileSync(
      path.join(change, name),
      '# 受控文件齐备夹具\n仅供测试上游 existence 状态，不代表合法方案或批准。\n',
    );
  fs.mkdirSync(path.join(change, 'specs/example'), { recursive: true });
  fs.writeFileSync(path.join(change, 'specs/example/spec.md'), '# 受控规格夹具\n');
  json(
    [
      'delivery',
      'open',
      '--project',
      root,
      '--id',
      'd01',
      '--title',
      '测试',
      '--scope',
      'scope.json',
      '--change',
      'proof-entry',
      '--slot',
      'A',
    ],
    parent,
    env,
  );
  const before = snapshot(root);
  const status = json(['status', '--project', root], parent, env);
  assert.equal(status.upstream.isPlanningComplete, true);
  assert.equal(status.next.action, 'explore');
  assert.equal(status.next.executable, false);
  assert.deepEqual(snapshot(root), before);
});
test('人工 bootstrap 查询保留交接引用，产品 bind 拒绝改写', () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  const root = fixture(parent);
  prepareChange(root, env);
  const records = JSON.parse(
    fs.readFileSync(path.join(repository, 'tests/fixtures/manual-bootstrap-records.json'), 'utf8'),
  );
  const manifest = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  fs.mkdirSync(path.dirname(manifest), { recursive: true });
  fs.writeFileSync(path.join(root, '.mendi/project.json'), JSON.stringify(records.project));
  fs.writeFileSync(manifest, JSON.stringify(records.manifest));
  for (const ref of records.fixtureReferences as string[]) {
    const file = path.join(root, ref);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '受控夹具，非实际审核证据。\n');
  }
  const before = snapshot(root);
  const query = json(['status', '--project', root], parent, env);
  assert.equal(query.local.source, 'manual-bootstrap');
  assert.equal(query.next.action, 'review-propose');
  assert.equal(query.next.executable, false);
  assert.equal(query.local.recorded.next.reviewRunRef, records.manifest.next.reviewRunRef);
  assert.equal(query.local.recorded.openCheckpoint.commit, 'fixture-only');
  assert.equal(
    json(
      ['change', 'bind', '--project', root, '--change', 'proof-entry', '--slot', 'A'],
      parent,
      env,
      1,
    ).error.code,
    'manual-state-read-only',
  );
  assert.deepEqual(snapshot(root), before);
  records.manifest.next.authorRunRef = '../outside';
  fs.writeFileSync(manifest, JSON.stringify(records.manifest));
  const historical = snapshot(root);
  assert.equal(json(['next', '--project', root], parent, env).next.authorRunRef, '../outside');
  assert.deepEqual(snapshot(root), historical);
  for (const args of [
    ['action', 'start', '--change', 'proof-entry', '--type', 'explore'],
    ['action', 'continue', '--action', 'proof-entry-001-explore'],
    ['run', 'save', '--run', 'missing.md', '--body', 'missing.md'],
    ['run', 'submit', '--run', 'missing.md', '--outcome', 'complete', '--result', '说明'],
  ])
    assert.equal(
      json([...args, '--project', root, '--role', 'author', '--actor', 'one'], parent, env, 1).error
        .code,
      'manual-state-read-only',
    );
  assert.deepEqual(snapshot(root), historical);
});

function manualTarget(folder: string) {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  const root = fixture(parent, 'minimal-project', folder);
  const records = JSON.parse(
    fs.readFileSync(path.join(repository, 'tests/fixtures/manual-bootstrap-records.json'), 'utf8'),
  );
  const manifestFile = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
  fs.writeFileSync(path.join(root, '.mendi/project.json'), JSON.stringify(records.project));
  const save = () => fs.writeFileSync(manifestFile, JSON.stringify(records.manifest));
  save();
  return { parent, env, root, records, save };
}

test('历史链接、旧 Delivery 和未知 Ref 不成为活动查询输入', () => {
  const { parent, env, root, records, save } = manualTarget('historical-links');
  prepareChange(root, env);
  records.project.deliveries.push({
    id: 'past',
    manifestRef: '.mendi/delivery-groups/past/manifest.json',
  });
  records.project.unknownRef = { nestedRef: 42 };
  fs.writeFileSync(path.join(root, '.mendi/project.json'), JSON.stringify(records.project));
  records.manifest.roadmapRef = 'missing-roadmap.md';
  records.manifest.next.proposalRunRef = 'missing-proposal.md';
  records.manifest.extension = {
    unavailableRef: '../outside',
    remoteRef: 'https://example.invalid/doc',
    nestedRef: [false, null],
  };
  save();
  const before = snapshot(root);
  for (const command of ['status', 'next']) {
    const result = json([command, '--project', root], parent, env);
    assert.equal(result.next.source, 'manual-bootstrap');
    assert.deepEqual(result.local.recorded.extension, records.manifest.extension);
    assert.equal(result.next.proposalRunRef, 'missing-proposal.md');
    assert.deepEqual(snapshot(root), before);
  }
  // None of the historical fixtureReferences were materialized in this target.
  for (const ref of records.fixtureReferences as string[])
    assert.ok(!fs.existsSync(path.join(root, ref)));
});

test('人工归档交接在旧目录缺失时只读查询，不调用活动 status', () => {
  const { parent, env, root, records, save } = manualTarget('archive-handoff');
  records.manifest.activeChangeId = null;
  records.manifest.changeBindings[0].state = 'archived';
  records.manifest.changeBindings[0].archiveOrdinal = 1;
  records.manifest.changeBindings[0].changeRef =
    'openspec/changes/archive/2026-10-09-001-proof-entry';
  records.manifest.next = {
    action: 'delivery-next',
    status: 'awaiting-owner-instruction',
    role: 'author',
    archiveRunRef: 'missing-historical-run.md',
  };
  save();
  const calls: string[][] = [];
  const runner: ProcessRunner = (_entry, args, cwd) => {
    calls.push(args);
    if (args[0] === 'status') throw new Error('Archived Change must not receive active status');
    return {
      status: 0,
      signal: null,
      stdout:
        args[0] === '--version'
          ? '1.14.1'
          : JSON.stringify({ root: { path: cwd, source: 'nearest' }, changes: [] }),
      stderr: '',
    };
  };
  const before = snapshot(root);
  assert.equal(query({ project: root }, { runner }).upstream, null);
  assert.deepEqual(calls, [['--version'], ['list', '--json']]);
  for (const command of ['status', 'next']) {
    const result = json([command, '--project', root], parent, env);
    assert.equal(result.local.activeChangeId, null);
    assert.equal(result.local.changeBindings[0].state, 'archived');
    assert.equal(result.upstream, null);
    assert.equal(result.next.action, 'delivery-next');
    assert.equal(result.next.executable, false);
    assert.deepEqual(snapshot(root), before);
  }
  assert.ok(!fs.existsSync(path.join(root, 'openspec/changes/proof-entry')));
  const human = cli(['status', '--project', root], parent, env);
  assert.equal(human.status, 0);
  assert.ok(human.stdout.includes('已归档、当前无活动 Change'));
  assert.deepEqual(snapshot(root), before);
  // Local handoff remains readable without treating archive contents as proof input.
  assert.ok(!fs.existsSync(path.join(root, records.manifest.changeBindings[0].changeRef)));
  const archive = path.join(root, records.manifest.changeBindings[0].changeRef);
  fs.mkdirSync(archive, { recursive: true });
  fs.writeFileSync(path.join(archive, 'proposal.md'), '受控归档位置，不是实际 Archive 执行。\n');
  const withArchive = snapshot(root);
  assert.equal(json(['status', '--project', root], parent, env).upstream, null);
  assert.deepEqual(snapshot(root), withArchive);
  assert.equal(
    json(
      ['change', 'bind', '--project', root, '--change', 'proof-entry', '--slot', 'A'],
      parent,
      env,
      1,
    ).error.code,
    'manual-state-read-only',
  );
  assert.deepEqual(snapshot(root), withArchive);
});

test('必要 binding 的越界 junction 及矛盾归档记录仍拒绝', () => {
  for (const kind of [
    'missing-active',
    'active-archived',
    'wrong-id',
    'invalid-date',
    'missing-ref',
    'wrong-state',
    'escape',
    'junction',
  ]) {
    const { parent, env, root, records, save } = manualTarget(kind);
    const binding = records.manifest.changeBindings[0];
    if (kind !== 'missing-active') {
      records.manifest.activeChangeId = null;
      binding.state = 'archived';
      binding.changeRef = 'openspec/changes/archive/2026-10-09-proof-entry';
    }
    if (kind === 'active-archived') records.manifest.activeChangeId = 'proof-entry';
    if (kind === 'wrong-id') binding.changeRef = 'openspec/changes/archive/2026-10-09-other';
    if (kind === 'invalid-date')
      binding.changeRef = 'openspec/changes/archive/2026-02-30-proof-entry';
    if (kind === 'missing-ref') delete binding.changeRef;
    if (kind === 'wrong-state') binding.state = 'apply-approved';
    if (kind === 'escape') binding.changeRef = '../outside';
    if (kind === 'junction') {
      const outside = path.join(parent, 'outside');
      fs.mkdirSync(outside);
      fs.mkdirSync(path.join(root, 'openspec/changes'), { recursive: true });
      fs.symlinkSync(outside, path.join(root, 'openspec/changes/archive'), 'junction');
    }
    save();
    const before = snapshot(root);
    const result = json(['status', '--project', root], parent, env, 1);
    assert.equal(result.ok, false);
    assert.equal(
      result.error.code,
      kind === 'missing-active'
        ? 'incomplete-mendi-state'
        : kind === 'junction'
          ? 'unsafe-reference'
          : kind === 'missing-ref'
            ? 'invalid-data'
            : 'invalid-record',
    );
    assert.deepEqual(snapshot(root), before);
  }
});
test('缺入口 / manifest / 坏 JSON / 身份不符 / 残留锁只诊断不修复', () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  for (const kind of [
    'missing-entry',
    'missing-manifest',
    'bad-json',
    'identity',
    'lock',
    'unknown-version',
    'unsafe-ref',
  ]) {
    const root = fixture(parent, 'minimal-project', kind);
    scopeFile(root);
    if (kind === 'missing-entry') fs.mkdirSync(path.join(root, '.mendi'));
    else {
      json(
        [
          'delivery',
          'open',
          '--project',
          root,
          '--id',
          'd01',
          '--title',
          '验证',
          '--scope',
          'scope.json',
        ],
        parent,
        env,
      );
      const projectFile = path.join(root, '.mendi/project.json');
      const manifestFile = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
      if (kind === 'missing-manifest') fs.unlinkSync(manifestFile);
      if (kind === 'bad-json') fs.writeFileSync(projectFile, '{bad json');
      if (kind === 'lock')
        fs.writeFileSync(path.join(root, '.mendi/write.lock'), 'interrupted owner');
      if (kind === 'identity') {
        const value = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        value.id = 'other';
        fs.writeFileSync(manifestFile, JSON.stringify(value));
      }
      if (kind === 'unknown-version' || kind === 'unsafe-ref') {
        const value = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
        if (kind === 'unknown-version') value.formatVersion = 2;
        else value.deliveries[0].manifestRef = '../outside';
        fs.writeFileSync(projectFile, JSON.stringify(value));
      }
    }
    const before = snapshot(root);
    const result = json(['status', '--project', root], parent, env, 1);
    assert.equal(result.ok, false);
    assert.ok(result.error.code);
    assert.equal(result.next, undefined);
    assert.deepEqual(snapshot(root), before);
    assert.throws(() => readWorkspace(root), MendiError);
  }
});
