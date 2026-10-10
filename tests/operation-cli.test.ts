import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { stageTarget } from './delivery-stage-support.ts';
import { cli, isolatedEnv } from './helpers.ts';

test('真实 CLI operation inputs 只读、互斥、当前阶段和 Action 约束', () => {
  const { root, change, apply } = stageTarget();
  const env = isolatedEnv(path.dirname(root));
  const files = [
    path.join(root, apply.run.ref),
    path.join(root, '.mendi/project.json'),
    path.join(root, '.mendi/delivery-groups/d01/manifest.json'),
    path.join(change, 'tasks.md'),
  ];
  const before = files.map((p) => fs.readFileSync(p));
  const invoke = (args: string[], exit = 0) => {
    const result = cli(['action', 'instructions', '--project', root, '--json', ...args], root, env);
    assert.equal(result.status, exit, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const result = invoke(['--action', apply.run.actionId, '--operation', 'apply']);
  assert.equal(result.instructions.state, 'ready');
  assert.equal(result.instructions.progress.complete, 0);
  for (const [args, exit] of [
    [['--action', apply.run.actionId, '--artifact', 'tasks', '--operation', 'apply'], 2],
    [['--action', apply.run.actionId], 2],
    [['--action', 'stale', '--operation', 'apply'], 1],
    [['--action', apply.run.actionId, '--operation', 'archive'], 1],
    [['--action', apply.run.actionId, '--artifact', 'tasks'], 1],
  ] as [string[], number][])
    invoke(args, exit);
  files.forEach((p, i) => assert.deepEqual(fs.readFileSync(p), before[i]));
});
