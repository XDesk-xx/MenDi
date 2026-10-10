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

function json(args: string[], cwd: string, env: NodeJS.ProcessEnv, status = 0) {
  const result = cli([...args, '--json'], cwd, env);
  assert.equal(result.status, status, result.stdout || result.stderr);
  return JSON.parse(result.stdout);
}

for (const field of ['store', 'schema'] as const) {
  for (const machine of [false, true]) {
    test(`自引用 YAML ${field} 返回完整${machine ? ' JSON' : '人读'}错误且不写目标`, () => {
      const parent = sandbox();
      const env = isolatedEnv(parent);
      const root = fixture(parent);
      const configPath = path.join(root, 'openspec/config.yaml');
      fs.writeFileSync(
        configPath,
        `${field === 'store' ? 'schema: spec-driven\n' : ''}${field}: &loop\n  self: *loop\n`,
      );
      scopeFile(root);
      const before = snapshot(root);
      const expected = field === 'store' ? 'unsupported-store-declaration' : 'unsupported-schema';
      for (const args of [
        ['status', '--project', root],
        [
          'delivery',
          'open',
          '--project',
          root,
          '--id',
          'd01',
          '--title',
          '拒绝配置',
          '--scope',
          'scope.json',
        ],
      ]) {
        const result = cli([...args, ...(machine ? ['--json'] : [])], parent, env);
        assert.equal(result.status, 1);
        assert.equal(result.signal, null);
        if (machine) {
          assert.equal(result.stderr, '');
          const failure = JSON.parse(result.stdout);
          assert.equal(failure.ok, false);
          assert.equal(failure.error.code, expected);
          assert.equal(failure.error.details.configPath, configPath);
          assert.equal(failure.error.details[`${field}Type`], 'object');
          assert.ok(!Object.hasOwn(failure.error.details, field));
          assert.equal(typeof failure.error.message, 'string');
          assert.ok(failure.error.fix.length > 0);
        } else {
          assert.equal(result.stdout, '');
          assert.ok(result.stderr.includes(expected));
          const lines = result.stderr.trim().split(/\r?\n/);
          assert.ok(lines[1].length > 0);
          const details = JSON.parse(lines[2]);
          assert.equal(details.configPath, configPath);
          assert.equal(details[`${field}Type`], 'object');
          assert.ok(!Object.hasOwn(details, field));
          assert.ok(!result.stderr.includes('TypeError'));
        }
        assert.deepEqual(snapshot(root), before);
        assert.ok(!fs.existsSync(path.join(root, '.mendi')));
      }
    });
  }
}
test('帮助及错误参数无需初始化，项目和 scope 的相对基准明确', () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  assert.equal(cli(['--help'], parent, env).status, 0);
  assert.deepEqual(fs.readdirSync(parent), []);
  assert.equal(json(['other'], parent, env, 2).error.code, 'invalid-arguments');
  assert.equal(json(['status'], parent, env, 2).error.code, 'invalid-arguments');
  const root = fixture(parent, 'minimal-project', 'project with spaces');
  scopeFile(root);
  const query = json(['status', '--project', 'project with spaces'], parent, env);
  assert.equal(query.projectRoot, root);
  assert.equal(query.next.action, 'delivery-open');
  const opened = json(
    [
      'delivery',
      'open',
      '--project',
      'project with spaces',
      '--id',
      'd01',
      '--title',
      '示例',
      '--scope',
      'scope.json',
    ],
    parent,
    env,
  );
  assert.equal(opened.local.plannedChanges.length, 2);
  assert.equal(json(['next', '--project', root], repository, env).next.action, 'change-bind');
});
test('真实新 / 已有配置项目跨进程 Open 与查询，重复 Open 不覆盖', () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  for (const name of ['minimal-project', 'existing-openspec-project']) {
    const root = fixture(parent, name);
    scopeFile(root);
    const before = snapshot(root);
    json(
      [
        'delivery',
        'open',
        '--project',
        root,
        '--id',
        'd01',
        '--title',
        '入口',
        '--scope',
        'scope.json',
      ],
      parent,
      env,
    );
    const query = json(['status', '--project', root], parent, env);
    assert.equal(query.local.goal, '验证目标项目的最小 Delivery Open 与首个 Change 关联');
    for (const [file, hash] of Object.entries(before))
      assert.equal(snapshot(root)[file], hash, file);
    const opened = snapshot(root);
    for (const id of ['d01', 'd02'])
      assert.equal(
        json(
          [
            'delivery',
            'open',
            '--project',
            root,
            '--id',
            id,
            '--title',
            '重复',
            '--scope',
            'scope.json',
          ],
          parent,
          env,
          1,
        ).error.code,
        'existing-mendi-state',
      );
    assert.deepEqual(snapshot(root), opened);
    fs.unlinkSync(path.join(root, 'scope.json'));
    assert.equal(
      json(['status', '--project', root], parent, env).local.plannedChanges[1].slot,
      'B',
    );
    assert.ok(!fs.existsSync(path.join(root, '.mendi/runs')));
  }
});
test('真实 Open 时关联 / Open 后 bind，重复关联拒绝，readiness 不推进本地阶段', () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  for (const atOpen of [true, false]) {
    const root = fixture(parent, 'existing-openspec-project', atOpen ? 'at-open' : 'after-open');
    prepareChange(root, env);
    scopeFile(root);
    const before = snapshot(root);
    json(
      [
        'delivery',
        'open',
        '--project',
        root,
        '--id',
        'd01',
        '--title',
        '关联',
        '--scope',
        'scope.json',
        ...(atOpen ? ['--change', 'proof-entry', '--slot', 'A'] : []),
      ],
      parent,
      env,
    );
    if (!atOpen) {
      const original = snapshot(root);
      assert.equal(
        json(
          ['change', 'bind', '--project', root, '--change', 'missing', '--slot', 'A'],
          parent,
          env,
          1,
        ).error.code,
        'change-not-found',
      );
      assert.equal(
        json(
          ['change', 'bind', '--project', root, '--change', 'proof-entry', '--slot', 'missing'],
          parent,
          env,
          1,
        ).error.code,
        'planning-slot-not-found',
      );
      assert.deepEqual(snapshot(root), original);
      json(
        ['change', 'bind', '--project', root, '--change', 'proof-entry', '--slot', 'A'],
        parent,
        env,
      );
    }
    const bound = snapshot(root);
    assert.equal(
      json(
        ['change', 'bind', '--project', root, '--change', 'proof-entry', '--slot', 'A'],
        parent,
        env,
        1,
      ).error.code,
      'change-bind-conflict',
    );
    assert.equal(
      json(
        ['change', 'bind', '--project', root, '--change', 'another', '--slot', 'B'],
        parent,
        env,
        1,
      ).error.code,
      'change-bind-conflict',
    );
    const status = json(['status', '--project', root], parent, env);
    const next = json(['next', '--project', root], parent, env);
    assert.deepEqual(status.next, next.next);
    assert.equal(next.next.action, 'explore');
    assert.equal(next.next.executable, false);
    assert.equal(status.upstream.artifacts[0].status, 'ready');
    assert.deepEqual(snapshot(root), bound);
    for (const [file, hash] of Object.entries(before))
      assert.equal(snapshot(root)[file], hash, file);
    const change = path.join(root, 'openspec/changes/proof-entry');
    const moved = path.join(root, 'gone-change');
    assert.equal(path.relative(root, change), path.join('openspec', 'changes', 'proof-entry'));
    assert.equal(path.dirname(moved), root);
    fs.renameSync(change, moved);
    const missingBefore = snapshot(root);
    const missing = json(['status', '--project', root], parent, env, 1);
    assert.equal(missing.error.code, 'incomplete-mendi-state');
    assert.ok(missing.error.details.file.endsWith('proof-entry'));
    assert.deepEqual(snapshot(root), missingBefore);
  }
});
test('关联与范围不成立的 Open 在写前拒绝', () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  const root = fixture(parent);
  scopeFile(root);
  prepareChange(root, env);
  const base = [
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
  ];
  const before = snapshot(root);
  assert.equal(
    json([...base, '--change', 'missing', '--slot', 'A'], parent, env, 1).error.code,
    'change-not-found',
  );
  assert.equal(
    json([...base, '--change', 'proof-entry', '--slot', 'missing'], parent, env, 1).error.code,
    'planning-slot-not-found',
  );
  assert.equal(
    json([...base, '--change', 'proof-entry'], parent, env, 2).error.code,
    'invalid-arguments',
  );
  assert.deepEqual(snapshot(root), before);
});
