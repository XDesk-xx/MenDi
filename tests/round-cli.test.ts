import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { cli, isolatedEnv, scopeFile, snapshot } from './helpers.ts';
import { testTarget, pnpmEntry } from './test-support.ts';
import { legacyTarget } from './migration-support.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';

function invoke(root: string, args: string[], exit = 0) {
  const result = cli([...args, '--project', root, '--json'], root, isolatedEnv(root));
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
test('真实 CLI 两种首次入口保存 v2，轮次查询跨进程只读，next 不接受历史选择', () => {
  for (const recorded of [false, true]) {
    const root = testTarget(false);
    scopeFile(root);
    const opened = invoke(root, [
      'delivery',
      'open',
      '--id',
      'd01',
      '--title',
      '首轮',
      '--scope',
      'scope.json',
      ...(recorded ? ['--role', 'author', '--actor', 'cli-author'] : []),
    ]);
    assert.equal(opened.local.currentRoundId, 'r001');
    const workspace = readWorkspace(root)!;
    assert.equal(workspace.project.formatVersion, 2);
    assert.equal(workspace.manifest.formatVersion, 2);
    assert.deepEqual(workspace.manifest.changeBatches, []);
    const before = snapshot(root);
    const historical = invoke(root, ['status', '--round', 'r001']);
    assert.equal(historical.readOnly, true);
    assert.equal(historical.historicalRound.scope.goal, workspace.scope.goal);
    assert.equal(historical.next, undefined);
    assert.equal(invoke(root, ['status', '--round', 'r999'], 1).error.code, 'round-not-found');
    assert.equal(invoke(root, ['next', '--round', 'r001'], 2).error.code, 'invalid-arguments');
    const human = cli(['status', '--project', root, '--round', 'r001'], root, isolatedEnv(root));
    assert.equal(human.status, 0);
    assert.match(human.stdout, /r001.*只读/);
    assert.deepEqual(snapshot(root), before);
    assert.equal(readWorkspace(root)!.currentRoundId, 'r001');
    const currentHuman = cli(['status', '--project', root], root, isolatedEnv(root));
    assert.equal(currentHuman.status, 0);
    assert.match(currentHuman.stdout, /当前轮：r001.*历轮：r001/);
  }
});

test('真实 CLI 旧格式全类写请求写前拒绝，查询及 instructions 保持只读；迁移命令本地接线', () => {
  const { root, started } = legacyTarget(true),
    run = started!.run;
  const entryRef = path.join(root, '.mendi/project.json');
  const entry = JSON.parse(fs.readFileSync(entryRef, 'utf8'));
  const otherRef = '.mendi/delivery-groups/other/manifest.json';
  fs.mkdirSync(path.dirname(path.join(root, otherRef)), { recursive: true });
  const otherBytes =
    JSON.stringify(
      {
        formatVersion: 1,
        recordingMode: 'product',
        id: 'other',
        title: '其他旧 Delivery',
        state: 'open',
        openedOn: '2026-10-16',
        goal: '保留其他已登记对象',
        plannedChanges: [{ slot: 'OTHER', title: '旧范围', dependsOn: [] }],
        activeChangeId: null,
        changeBindings: [],
        changeBatches: [],
      },
      null,
      2,
    ) + '\n';
  fs.writeFileSync(path.join(root, otherRef), otherBytes);
  entry.deliveries.push({ id: 'other', manifestRef: otherRef });
  fs.writeFileSync(entryRef, JSON.stringify(entry, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'body.md'), '实际正文输入。\n');
  fs.writeFileSync(
    path.join(root, 'openspec/changes/proof-entry/.openspec.yaml'),
    'schema: spec-driven\ncreated: 2026-10-16\n',
  );
  const actor = ['--role', 'author', '--actor', 'author-one'];
  const cases = [
    ['change', 'bind', '--change', 'other', '--slot', 'A'],
    ['action', 'start', '--change', 'proof-entry', '--type', 'explore', ...actor],
    ['action', 'continue', '--action', run.actionId, ...actor],
    [
      'action',
      'resolve',
      '--run',
      run.ref,
      '--role',
      'owner',
      '--actor',
      'owner',
      '--resolution',
      'handoff',
      '--to-role',
      'author',
      '--to-actor',
      'other',
      '--reason',
      '测试',
    ],
    ['run', 'save', '--run', run.ref, '--body', 'body.md', ...actor],
    ['run', 'submit', '--run', run.ref, '--outcome', 'complete', '--result', '测试', ...actor],
    ['action', 'archive', '--run', run.ref, '--mode', 'execute', ...actor],
    ['action', 'archive', '--run', run.ref, '--mode', 'finish', ...actor],
    ['test', 'run', '--kind', 'full', '--actor', 'author-one', '--pnpm-bin', pnpmEntry],
    ['delivery', 'full-test', 'run', '--input', 'not-read.json', '--pnpm-bin', pnpmEntry, ...actor],
    ['delivery', 'repair', 'start', '--from', 'not-read', '--reason', '测试', ...actor],
    [
      'delivery',
      'repair',
      'review',
      '--author-run',
      'not-read',
      '--role',
      'reviewer',
      '--actor',
      'reviewer',
    ],
    ['delivery', 'close', '--input', 'not-read.json', ...actor],
    ['delivery', 'reopen', '--scope', 'not-read.json', '--reason', '测试', ...actor],
    ['delivery', 'reopen', '--resume', 'not-read', ...actor],
    ['delivery', 'open', '--resume', 'not-read', ...actor],
  ];
  const before = snapshot(root);
  for (const args of cases) {
    const result = invoke(root, args, 1);
    assert.equal(result.error.code, 'legacy-product-read-only', JSON.stringify({ args, result }));
    assert.deepEqual(snapshot(root), before);
  }
  assert.equal(invoke(root, ['status']).local.compatibility, 'legacy-product-read-only');
  const legacyHuman = cli(['status', '--project', root], root, isolatedEnv(root));
  assert.equal(legacyHuman.status, 0);
  assert.match(legacyHuman.stdout, /旧 product，只读.*显式迁移/);
  assert.equal(
    invoke(root, ['status', '--round', 'r001'], 1).error.code,
    'round-query-unsupported',
  );
  assert.equal(
    invoke(root, ['action', 'instructions', '--action', run.actionId, '--artifact', 'proposal'])
      .instructions.artifactId,
    'proposal',
  );
  assert.deepEqual(snapshot(root), before);
  const preview = invoke(root, ['delivery', 'migrate', 'preview']);
  assert.equal(preview.executionMode, 'local-only');
  assert.equal(preview.openspec, null);
  assert.equal(preview.upstreamAccess, 'not-required');
  assert.deepEqual(snapshot(root), before);
  fs.writeFileSync(
    path.join(root, 'migration-preview.json'),
    JSON.stringify(preview, null, 2) + '\n',
  );
  const applied = invoke(root, [
    'delivery',
    'migrate',
    'apply',
    '--input',
    'migration-preview.json',
    ...actor,
  ]);
  assert.equal(applied.result, 'migrated');
  assert.equal(applied.openspec, null);
  assert.equal(fs.readFileSync(path.join(root, otherRef), 'utf8'), otherBytes);
  assert.equal(
    invoke(root, ['status', '--delivery', 'other']).local.compatibility,
    'legacy-product-read-only',
  );
  assert.equal(readWorkspace(root)!.id, 'd01');
  const resumed = invoke(root, [
    'delivery',
    'migrate',
    'resume',
    '--run',
    applied.run.ref,
    ...actor,
  ]);
  assert.equal(resumed.result, 'already-completed');
  assert.equal(invoke(root, ['status']).run.actorId, run.actorId);
});
