import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import {
  cli,
  fixture,
  isolatedEnv,
  prepareChange,
  repository,
  sandbox,
  scopeFile,
  snapshot,
} from './helpers.ts';

function target() {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  const root = fixture(parent);
  scopeFile(root);
  prepareChange(root, env);
  const invoke = (args: string[], status = 0) => {
    const response = cli([...args, '--project', root, '--json'], parent, env);
    assert.equal(response.status, status, response.stdout || response.stderr);
    assert.equal(response.stderr, '');
    return JSON.parse(response.stdout);
  };
  invoke(['delivery', 'open', '--id', 'd01', '--title', '受控串联', '--scope', 'scope.json']);
  invoke(['change', 'bind', '--change', 'proof-entry', '--slot', 'A']);
  return { parent, env, root, invoke };
}
test('真实 CLI 跨进程两次 Author / Reviewer 继续、修订与补审，不改旧提交', () => {
  const { parent, env, root, invoke } = target();
  const outside = path.join(parent, 'outside-body.md');
  fs.writeFileSync(outside, '# 实际受控正文\n目的、方法、结果与限制。\n');
  const input = fs.readFileSync(outside);
  const actor = (role = 'author') => [
    '--role',
    role,
    '--actor',
    role === 'author' ? 'author-one' : 'reviewer-one',
  ];
  const start = (type: string, extra: string[] = [], role = 'author') =>
    invoke([
      'action',
      'start',
      '--change',
      'proof-entry',
      '--type',
      type,
      ...actor(role),
      ...extra,
    ]);
  const finish = (ref: string, outcome: string, role = 'author', verdict?: string) => {
    invoke(['run', 'save', '--run', ref, ...actor(role), '--body', outside]);
    const result = invoke([
      'run',
      'submit',
      '--run',
      ref,
      ...actor(role),
      '--outcome',
      outcome,
      '--result',
      '受控工作完成',
      ...(verdict ? ['--verdict', verdict] : []),
    ]);
    const before = snapshot(root);
    const readback = invoke(['status']);
    assert.equal(readback.run.ref, ref);
    assert.deepEqual(readback.next, result.next);
    assert.deepEqual(snapshot(root), before);
    return result;
  };
  const a1 = start('explore', ['--tool', 'openspec']);
  assert.ok(a1.methods.stage.content.includes('Explore'));
  assert.equal(a1.methods.guidance[0].ref, 'skills/tools/openspec/SKILL.md');
  finish(a1.run.ref, 'continuing');
  const oldA1 = fs.readFileSync(path.join(root, a1.run.ref));
  const a2 = invoke(['action', 'continue', '--action', a1.run.actionId, ...actor()]);
  assert.equal(a2.run.actionId, a1.run.actionId);
  finish(a2.run.ref, 'complete');
  const oldA2 = fs.readFileSync(path.join(root, a2.run.ref));
  assert.equal(
    invoke(['action', 'continue', '--action', a2.run.actionId, ...actor()], 1).error.code,
    'action-state-conflict',
  );
  assert.equal(
    invoke(['run', 'save', '--run', a2.run.ref, ...actor(), '--body', outside], 1).error.code,
    'run-already-submitted',
  );
  assert.equal(
    invoke(
      [
        'run',
        'submit',
        '--run',
        a2.run.ref,
        ...actor(),
        '--outcome',
        'complete',
        '--result',
        '覆盖',
      ],
      1,
    ).error.code,
    'run-already-submitted',
  );
  const r1 = start('review-explore', ['--author-run', a2.run.ref], 'reviewer');
  finish(r1.run.ref, 'continuing', 'reviewer');
  const oldR1 = fs.readFileSync(path.join(root, r1.run.ref));
  const r2 = invoke(['action', 'continue', '--action', r1.run.actionId, ...actor('reviewer')]);
  assert.equal(r2.run.authorRunRef, a2.run.ref);
  assert.equal(r2.run.actionId, r1.run.actionId);
  assert.equal(finish(r2.run.ref, 'complete', 'reviewer', 'approved').next.action, 'propose');
  const oldR2 = fs.readFileSync(path.join(root, r2.run.ref));
  const revision = start('revise-explore', ['--revises', a2.run.ref]);
  assert.equal(revision.run.runNumber, 5);
  assert.notEqual(revision.run.actionId, a2.run.actionId);
  assert.equal(invoke(['next']).next.action, 'run-save-or-submit');
  finish(revision.run.ref, 'complete');
  const supplement = start('review-explore', ['--author-run', revision.run.ref], 'reviewer');
  assert.equal(
    finish(supplement.run.ref, 'complete', 'reviewer', 'approved').next.action,
    'propose',
  );
  // Continue through remaining stage rules with explicit, independent test actors.
  const proposal = start('propose');
  finish(proposal.run.ref, 'complete');
  const reviewProposal = start('review-propose', ['--author-run', proposal.run.ref], 'reviewer');
  assert.equal(
    finish(reviewProposal.run.ref, 'complete', 'reviewer', 'approved').next.action,
    'apply',
  );
  const implementation = start('apply');
  finish(implementation.run.ref, 'complete');
  const reviewApply = start('review-apply', ['--author-run', implementation.run.ref], 'reviewer');
  assert.equal(
    finish(reviewApply.run.ref, 'complete', 'reviewer', 'approved').next.action,
    'archive',
  );
  assert.equal(invoke(['next']).next.executable, false);
  for (const [ref, bytes] of [
    [a1.run.ref, oldA1],
    [a2.run.ref, oldA2],
    [r1.run.ref, oldR1],
    [r2.run.ref, oldR2],
  ] as const)
    assert.deepEqual(fs.readFileSync(path.join(root, ref)), bytes);
  assert.deepEqual(fs.readFileSync(outside), input);
  const dirs = fs.readdirSync(path.join(root, '.mendi/runs/d01/001-changes/proof-entry'));
  assert.equal(dirs.length, 10);
  assert.ok(dirs.includes('010-review-apply'));
  const before = snapshot(root);
  assert.equal(invoke(['archive'], 2).error.code, 'invalid-arguments');
  assert.deepEqual(snapshot(root), before);
  const human = cli(['next', '--project', root], parent, env);
  assert.equal(human.status, 0);
  assert.ok(human.stdout.includes('Action：'));
  assert.ok(human.stdout.includes('下一步：archive'));
});

test('CLI 必填 / 白名单 / 互斥、错角色类型、路径越界均不写目标', () => {
  const { root, invoke } = target();
  const before = snapshot(root);
  const base = [
    'action',
    'start',
    '--change',
    'proof-entry',
    '--type',
    'explore',
    '--role',
    'author',
    '--actor',
    'one',
  ];
  for (const args of [
    ['action', 'start'],
    [...base, '--unknown', 'x'],
    [...base, '--actor', 'two'],
    ['run', 'save', '--run', '../outside', '--role', 'author', '--actor', 'one'],
    [
      'run',
      'submit',
      '--run',
      '../outside',
      '--role',
      'author',
      '--actor',
      'one',
      '--outcome',
      'complete',
    ],
    ['delivery', 'close'],
    ['delivery', 'reopen'],
    ['archive'],
  ])
    assert.equal(invoke(args, 2).error.code, 'invalid-arguments');
  for (const args of [
    [...base, '--author-run', '../outside'],
    base.map((v) => (v === 'explore' ? 'archive' : v)),
    base.map((v) => (v === 'author' ? 'reviewer' : v)),
    [...base, '--tool', 'unknown'],
  ])
    assert.equal(invoke(args, 1).ok, false);
  assert.deepEqual(snapshot(root), before);
  const a = invoke(base);
  fs.writeFileSync(path.join(root, 'body.md'), '正文');
  const draft = snapshot(root);
  for (const ref of [
    '../outside/run.md',
    '.mendi/runs/d01/001-changes/proof-entry/999-explore/run.md',
  ])
    assert.equal(
      invoke(
        ['run', 'save', '--run', ref, '--role', 'author', '--actor', 'one', '--body', 'body.md'],
        1,
      ).error.code,
      'run-not-current',
    );
  assert.deepEqual(snapshot(root), draft);
  assert.equal(a.run.status, 'draft');
});

test('两个真实子进程 Action 写入竞争只允许一个编号，不删除竞争锁', async () => {
  const { parent, env, root, invoke } = target();
  const release = path.join(parent, 'release');
  const writer = fork(path.join(repository, 'tests/fixtures/action-writer.ts'), [root, release], {
    cwd: parent,
    env,
    windowsHide: true,
    stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
  });
  let stderr = '';
  writer.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });
  const exited = once(writer, 'exit');
  const [ready] = await once(writer, 'message');
  assert.equal(ready.ready, true, ready.error);
  const lock = path.join(root, '.mendi/write.lock');
  const owner = fs.readFileSync(lock);
  try {
    const beforeDiagnosis = snapshot(root);
    const diagnosis = invoke(['workspace', 'diagnose']);
    assert.equal(diagnosis.lock.pid, writer.pid);
    assert.equal(diagnosis.lock.liveness, 'alive');
    assert.equal(diagnosis.blockedByLock, true);
    assert.deepEqual(snapshot(root), beforeDiagnosis);
    assert.equal(
      invoke(
        [
          'action',
          'start',
          '--change',
          'proof-entry',
          '--type',
          'explore',
          '--role',
          'author',
          '--actor',
          'competitor',
        ],
        1,
      ).error.code,
      'write-in-progress-or-interrupted',
    );
    assert.deepEqual(fs.readFileSync(lock), owner);
  } finally {
    fs.writeFileSync(release, 'release');
  }
  const [exit] = await exited;
  assert.equal(exit, 0, stderr);
  assert.ok(!fs.existsSync(lock));
  assert.equal(invoke(['status']).run.runNumber, 1);
  assert.deepEqual(fs.readdirSync(path.join(root, '.mendi/runs/d01/001-changes/proof-entry')), [
    '001-explore',
  ]);
});
