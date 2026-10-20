import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { groupTarget } from './group-support.ts';
import { cli, command, isolatedEnv } from './helpers.ts';
import { pnpmEntry } from './test-support.ts';
import { disposeStoppedFixtureLock } from './archive-support.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { renderRun } from '../src/adapters/runs.ts';

function invoke(root: string, args: string[], exit = 0) {
  const result = cli([...args, '--project', root, '--json'], root, isolatedEnv(root));
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
test('真实 CLI v2 正式 passed / typed Close 恢复 / Reopen 与历史读回', () => {
  const { root, declaration } = groupTarget();
  const actor = ['--role', 'author', '--actor', 'delivery-author'];
  const run = invoke(root, [
    'delivery',
    'full-test',
    'run',
    '--input',
    'group-input.json',
    '--pnpm-bin',
    pnpmEntry,
    ...actor,
  ]);
  assert.equal(run.run.actionType, 'delivery-test-attempt');
  assert.equal(run.groupExecution.protocolState, 'valid');
  const status = invoke(root, ['delivery', 'full-test', 'status', '--run', run.run.ref]);
  assert.equal(status.groupExecution.child.outcome, 'passed');
  const human = cli(
    ['delivery', 'full-test', 'status', '--run', run.run.ref, '--project', root],
    root,
    isolatedEnv(root),
  );
  assert.equal(human.status, 0);
  assert.match(human.stdout, /组尝试.*原命令:passed/);
  assert.equal(run.run.attempt.version, 2);
  assert.equal(run.groupExecution.formalOutcome, 'passed');
  assert.equal(run.next.action, 'delivery-close');
  assert.equal(invoke(root, ['next']).next.action, 'delivery-close');
  // 已核对的本轮快照可沿用；后续完整执行不重新消费这些历史正文。
  for (const f of run.run.attempt.approvals)
    for (const ref of [f.archiveRunRef, f.reviewRunRef, f.authorRunRef])
      fs.unlinkSync(path.join(root, ref));
  fs.writeFileSync(path.join(root, 'verify.json'), JSON.stringify({ fromRunRef: run.run.ref }));
  invoke(root, ['delivery', 'verification', 'create', '--input', 'verify.json', ...actor], 1);
  fs.writeFileSync(
    path.join(root, 'group-input.json'),
    JSON.stringify({ ...declaration, fromRunRef: run.run.ref }),
  );
  const later = invoke(root, [
    'delivery',
    'full-test',
    'run',
    '--input',
    'group-input.json',
    '--pnpm-bin',
    pnpmEntry,
    ...actor,
  ]);
  assert.equal(invoke(root, ['status']).run.ref, later.run.ref);
  const applicability = {
    conclusion: 'applicable',
    materials: declaration.candidate.basis.materials,
    changes: '',
    reason: '本次完整执行及当前材料一致',
  };
  for (const selector of [
    { testAttemptRunRef: run.run.ref },
    { fullTestRunRef: later.run.ref },
    { verificationRunRef: later.run.ref },
    { testAttemptRunRef: later.run.ref, fullTestRunRef: later.run.ref },
  ]) {
    fs.writeFileSync(path.join(root, 'close.json'), JSON.stringify({ ...selector, applicability }));
    invoke(root, ['delivery', 'close', '--input', 'close.json', ...actor], 1);
  }
  const original = fs.readFileSync(path.join(root, later.run.ref));
  const document = readDeliveryRun(root, later.run.ref, 'd01');
  for (const attempt of [
    { ...document.record.attempt!, version: 3 },
    { ...document.record.attempt!, formalOutcome: 'failed' },
    { ...document.record.attempt!, purpose: 'continue' },
  ]) {
    fs.writeFileSync(
      path.join(root, later.run.ref),
      renderRun({ ...document.header, attempt }, document.body),
    );
    invoke(root, ['status'], 1);
    fs.writeFileSync(path.join(root, later.run.ref), original);
  }
  fs.writeFileSync(
    path.join(root, 'close.json'),
    JSON.stringify({ testAttemptRunRef: later.run.ref, applicability }),
  );
  const worker = command(
    'tests/lifecycle-worker.ts',
    [root, 'close', 'lifecycle-manifest-written'],
    process.cwd(),
    isolatedEnv(root),
  );
  assert.equal(worker.status, 1, worker.stdout + worker.stderr);
  const index = JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8'));
  const pending = index.pendingDeliveryRunRef;
  assert.equal(typeof pending, 'string');
  disposeStoppedFixtureLock(root);
  const close = invoke(root, ['delivery', 'close', '--resume', pending, ...actor]);
  assert.equal(close.local.state, 'closed');
  assert.equal(close.run.lifecycle.acceptance.version, 2);
  assert.equal(close.run.lifecycle.testAttemptRunRef, later.run.ref);
  assert.equal(
    invoke(root, ['delivery', 'close', '--resume', pending, ...actor]).alreadyCompleted,
    true,
  );
  fs.writeFileSync(
    path.join(root, 'reopen.json'),
    JSON.stringify({
      goal: '新的独立增量',
      plannedChanges: [
        {
          slot: 'C',
          title: '新工作',
          dependsOn: [],
          baselineDependencies: [{ deliveryId: 'd01', planningSlot: 'A', closeRunRef: pending }],
        },
      ],
    }),
  );
  const reopened = invoke(root, [
    'delivery',
    'reopen',
    '--scope',
    'reopen.json',
    '--reason',
    '显式新轮范围',
    ...actor,
  ]);
  assert.equal(reopened.local.currentRoundId, 'r002');
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'), 'utf8'),
  );
  assert.equal(manifest.testAttemptRunRef, undefined);
  assert.equal(manifest.verificationRunRef, undefined);
  assert.equal(manifest.rounds[0].testAttemptRunRef, later.run.ref);
  const historic = invoke(root, ['delivery', 'full-test', 'status', '--run', later.run.ref]);
  assert.equal(historic.groupExecution.current, false);
  assert.equal(historic.groupExecution.formalOutcome, 'passed');
  invoke(root, ['delivery', 'close', '--input', 'close.json', ...actor], 1);
});
