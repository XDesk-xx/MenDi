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
test('真实 CLI run / verification / Close恢复 / Reopen：新轮不继承候选', () => {
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
  fs.writeFileSync(
    path.join(root, 'verify.json'),
    JSON.stringify({
      fromRunRef: run.run.ref,
      planRef: 'group-plan.json',
      candidate: declaration.candidate,
      sources: ['prefix', 'middle', 'tail'].map((id) => ({
        id,
        runRef: run.run.ref,
        applicability: '同候选本次真实完成',
      })),
    }),
  );
  let verified = invoke(root, [
    'delivery',
    'verification',
    'create',
    '--input',
    'verify.json',
    ...actor,
  ]);
  assert.equal(verified.candidateVerification.conclusion, 'verified');
  assert.equal(
    invoke(root, ['delivery', 'verification', 'status', '--run', verified.run.ref])
      .candidateVerification.conclusion,
    'verified',
  );
  const oldVerified = verified;
  assert.equal(verified.candidateVerification.current, true);
  assert.equal(verified.next.role, 'owner');
  fs.writeFileSync(
    path.join(root, 'group-input.json'),
    JSON.stringify({ ...declaration, fromRunRef: verified.run.ref }),
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
  fs.writeFileSync(
    path.join(root, 'close.json'),
    JSON.stringify({
      verificationRunRef: oldVerified.run.ref,
      applicability: {
        conclusion: 'applicable',
        materials: '旧当前候选',
        changes: '',
        reason: '陈旧指针负例',
      },
    }),
  );
  invoke(root, ['delivery', 'close', '--input', 'close.json', ...actor], 1);
  fs.writeFileSync(
    path.join(root, 'verify.json'),
    JSON.stringify({
      fromRunRef: later.run.ref,
      planRef: 'group-plan.json',
      candidate: declaration.candidate,
      sources: ['prefix', 'middle', 'tail'].map((id) => ({
        id,
        runRef: later.run.ref,
        applicability: '本次新尝试通过',
      })),
    }),
  );
  verified = invoke(root, [
    'delivery',
    'verification',
    'create',
    '--input',
    'verify.json',
    ...actor,
  ]);
  const original = fs.readFileSync(path.join(root, verified.run.ref));
  const document = readDeliveryRun(root, verified.run.ref, 'd01');
  for (const sources of [
    document.record.verification!.sources.slice(1),
    document.record.verification!.sources.map((s, i) =>
      i === 0 ? { ...s, executionId: '000-full' } : s,
    ),
  ]) {
    fs.writeFileSync(
      path.join(root, verified.run.ref),
      renderRun(
        { ...document.header, verification: { ...document.record.verification!, sources } },
        document.body,
      ),
    );
    invoke(root, ['status'], 1);
    fs.writeFileSync(path.join(root, verified.run.ref), original);
  }
  fs.writeFileSync(
    path.join(root, 'close.json'),
    JSON.stringify({
      verificationRunRef: verified.run.ref,
      applicability: {
        conclusion: 'applicable',
        materials: declaration.candidate.basis.materials,
        changes: '',
        reason: '实际当前组完成且全部来源一致',
      },
    }),
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
  assert.equal(close.run.lifecycle.acceptance.kind, 'candidate-verification');
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
  assert.equal(manifest.rounds[0].verificationRunRef, verified.run.ref);
  assert.equal(
    invoke(root, ['delivery', 'verification', 'status', '--run', verified.run.ref])
      .candidateVerification.conclusion,
    'verified',
  );
  const historic = invoke(root, ['delivery', 'verification', 'status', '--run', verified.run.ref]);
  assert.equal(historic.candidateVerification.current, false);
  assert.equal(historic.candidateVerification.roundId, 'r001');
  invoke(root, ['delivery', 'close', '--input', 'close.json', ...actor], 1);
});
