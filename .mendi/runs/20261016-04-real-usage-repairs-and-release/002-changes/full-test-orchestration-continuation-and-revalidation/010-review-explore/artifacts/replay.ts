import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  verificationTarget,
  fullInput,
  finishRepair,
  authorActor,
} from '../../../../../../../tests/delivery-support.ts';
import { pnpmEntry, writePackage } from '../../../../../../../tests/test-support.ts';
import { repository } from '../../../../../../../tests/helpers.ts';
import { runTest } from '../../../../../../../src/application/tests.ts';
import { runFullTest, fullTestStatus } from '../../../../../../../src/application/delivery-full-test.ts';
import { startDeliveryRepair, startDeliveryReview } from '../../../../../../../src/application/delivery-repair.ts';
import { scanRunNumbers } from '../../../../../../../src/adapters/runs.ts';
import type { ExecutionProcessOptions } from '../../../../../../../src/adapters/test-process.ts';
import type { TestExecution } from '../../../../../../../src/core/test-execution.ts';

// Explore only: exercise the existing implementation in a rebuildable isolated target.
// Stage approvals below are record fixtures, never this repository's independent review.
const runHome = path.join(
  repository,
  '.mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes',
  'full-test-orchestration-continuation-and-revalidation/010-review-explore/artifacts',
);
const output = path.resolve(process.argv[2] ?? path.join(runHome, 'proof-01'));
assert.ok(output.startsWith(runHome + path.sep));
assert.ok(!fs.existsSync(output), 'use a new evidence directory; do not overwrite an attempt');
fs.mkdirSync(output);
const save = (name: string, value: unknown) =>
  fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + '\n');
const timeline: { label: string; utc: string; elapsedMs: number }[] = [];
const origin = performance.now();
const event = (label: string) => {
  timeline.push({ label, utc: new Date().toISOString(), elapsedMs: performance.now() - origin });
};
event('preparation-start');
const root = verificationTarget();
const checks = path.join(root, 'checks');
fs.cpSync(path.join(repository, 'tests/fixtures/full-test-project'), checks, { recursive: true });
fs.copyFileSync(path.join(checks, 'unit.test.ts'), path.join(checks, 'tail.test.ts'));
writePackage(root, (pkg) => {
  const scripts = pkg.scripts as Record<string, string>;
  scripts['test:full'] =
    'node --test checks/unit.test.ts && node --test checks/integration.test.ts && node --test checks/tail.test.ts';
  scripts['test:fast'] =
    'node --test --test-concurrency=1 checks/unit.test.ts checks/integration.test.ts checks/tail.test.ts';
  scripts['test:focused'] = 'node --test checks/tail.test.ts';
});
const declared = JSON.parse(fs.readFileSync(path.join(root, 'full-test.json'), 'utf8'));
declared.collection = ['unit', 'integration', 'independent-tail'];
declared.basis.materials =
  '受控 producer / consumer 及 unit / integration / tail；真实 pnpm / node:test。批准仅为记录夹具。';
fs.writeFileSync(path.join(root, 'full-test.json'), JSON.stringify(declared, null, 2) + '\n');
event('preparation-finished');
save('preparation-timing.json', {
  started: timeline[0],
  finished: timeline[1],
  wallMs: timeline[1].elapsedMs - timeline[0].elapsedMs,
  scope: 'fresh isolated fixture, explicit offline empty dependencies and real native archive seed',
});
save('setup.json', {
  root,
  candidateBase: '168a4cb54f0c9028eaf9c271b43d9ee14c3ae904',
  fixture: 'tests/fixtures/full-test-project',
  full: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts as object,
  purpose: 'existing opaque command / formal repair admission / material applicability only',
  approvalBoundary: 'synthetic stage records in isolated target, not independent product approval',
});

function trace() {
  const file = path.join(root, 'executed-groups.jsonl');
  return fs.existsSync(file)
    ? fs
        .readFileSync(file, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((v) => JSON.parse(v).group)
    : [];
}
function persistChild(label: string, record: TestExecution) {
  for (const [kind, ref] of [
    ['stdout', record.stdoutRef],
    ['stderr', record.stderrRef],
  ])
    fs.copyFileSync(path.join(root, ref), path.join(output, `${label}-${kind}.log`));
  save(`${label}-child.json`, record);
}
async function observed<T>(
  label: string,
  perform: (options: ExecutionProcessOptions) => Promise<T>,
) {
  const started = performance.now();
  const before = trace().length;
  const stages: { phase: string; elapsedMs: number }[] = [];
  event(`${label}-start`);
  const result = await perform({
    observe(phase) {
      stages.push({ phase, elapsedMs: performance.now() - started });
    },
  });
  const elapsedMs = performance.now() - started;
  const launch = stages.find((s) => s.phase === 'after-launch');
  const terminal = stages.find((s) => s.phase === 'before-terminal-commit');
  const fact = {
    label,
    wallMs: elapsedMs,
    preLaunchMs: launch?.elapsedMs ?? null,
    launchedThroughTerminalMs: launch && terminal ? terminal.elapsedMs - launch.elapsedMs : null,
    terminalThroughReturnMs: terminal ? elapsedMs - terminal.elapsedMs : null,
    groupsActuallyExecuted: trace().slice(before),
    stages,
    limitation:
      'one bounded sample; spans include nested work, not independent additive task costs',
  };
  event(`${label}-finished`);
  save(`${label}-observation.json`, fact);
  save(`${label}-result.json`, result);
  return { result, fact };
}
const ordinary = (kind: string, options: ExecutionProcessOptions = {}) =>
  runTest({ project: root, kind, actor: authorActor, pnpmBin: pnpmEntry }, options);
const first = await observed('opaque-full', (options) => runFullTest(fullInput(root), options));
assert.ok('verification' in first.result && first.result.verification.child);
assert.equal(first.result.verification.outcome, 'failed');
assert.deepEqual(first.fact.groupsActuallyExecuted, ['unit', 'integration']);
persistChild('opaque-full', first.result.verification.child);
assert.ok('run' in first.result && first.result.run);
const failedRef = first.result.run.ref;
const failedBytes = fs.readFileSync(path.join(root, failedRef));
const failedChild = first.result.verification.child;
const failureInputs = [failedRef, failedChild.stdoutRef, failedChild.stderrRef].map((ref) => ({
  ref,
  bytes: fs.readFileSync(path.join(root, ref)),
}));

const collection = await observed('target-collects', (options) => ordinary('fast', options));
assert.equal(collection.result.outcome, 'failed');
assert.deepEqual([...collection.fact.groupsActuallyExecuted].sort(), [
  'integration',
  'unit',
  'unit',
]);
assert.ok('record' in collection.result && collection.result.record);
persistChild('target-collects', collection.result.record);
assert.equal(collection.result.record.scope, 'command');
assert.equal('groups' in collection.result.record, false);

const tail = await observed('tail-continuation', (options) => ordinary('focused', options));
assert.equal(tail.result.outcome, 'passed');
assert.deepEqual(tail.fact.groupsActuallyExecuted, ['unit']);
assert.ok('record' in tail.result && tail.result.record);
persistChild('tail-continuation', tail.result.record);
const numberBefore = scanRunNumbers(root, 'd01').number;
const retry = await runFullTest(fullInput(root));
assert.equal(retry.ok, false);
assert.ok('error' in retry && retry.error);
assert.equal(retry.error.code, 'delivery-state-conflict');
assert.equal(scanRunNumbers(root, 'd01').number, numberBefore);
save('retry-before-review.json', retry);

const repair = startDeliveryRepair({
  project: root,
  from: failedRef,
  role: 'author',
  actor: authorActor,
  reason: '隔离 proof 中修复 producer 契约；不修改 MenDi 实现。',
});
const producer = path.join(checks, 'producer.ts');
const originalProducer = fs.readFileSync(producer, 'utf8');
fs.writeFileSync(path.join(output, 'producer-before.ts'), originalProducer);
fs.writeFileSync(producer, originalProducer.replace('change-completed', 'change-archived'));
finishRepair(root, repair.run.ref);
const review = startDeliveryReview({
  project: root,
  authorRunRef: repair.run.ref,
  role: 'reviewer',
  actor: 'independent-fixture-reviewer',
});
finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
const declarationBytes = fs.readFileSync(path.join(root, 'full-test.json'));
fs.writeFileSync(
  path.join(root, 'full-test.json'),
  JSON.stringify({ ...declared, collection: ['independent-tail'] }),
);
const reduced = await runFullTest(fullInput(root));
assert.equal(reduced.ok, false);
assert.ok('error' in reduced);
assert.equal(reduced.error.code, 'delivery-state-conflict');
save('approved-but-reduced-collection.json', reduced);
fs.writeFileSync(path.join(root, 'full-test.json'), declarationBytes);
writePackage(root, (pkg) => {
  (pkg.scripts as Record<string, string>)['test:focused'] =
    'node --test checks/integration.test.ts';
});
const focused = await observed('repaired-focused', (options) => ordinary('focused', options));
assert.equal(focused.result.outcome, 'passed');
assert.ok('record' in focused.result && focused.result.record);
persistChild('repaired-focused', focused.result.record);
const stillFailed = fullTestStatus({ project: root, runRef: failedRef });
assert.equal(stillFailed.verification.outcome, 'failed');
save('focused-does-not-promote-failure.json', stillFailed);

const fresh = await observed('fresh-whole', (options) => runFullTest(fullInput(root), options));
assert.equal(fresh.result.ok, true);
assert.ok('verification' in fresh.result && fresh.result.verification.child);
assert.deepEqual(fresh.fact.groupsActuallyExecuted, ['unit', 'integration', 'unit']);
persistChild('fresh-whole', fresh.result.verification.child);
assert.ok('run' in fresh.result && fresh.result.run);
fs.writeFileSync(producer, originalProducer);
const oldPass = fullTestStatus({ project: root, runRef: fresh.result.run.ref });
assert.equal(oldPass.verification.outcome, 'passed');
assert.equal(oldPass.verification.commandMatch, 'match');
assert.equal(oldPass.verification.materialApplicability, 'requires-semantic-check');
save('source-changed-old-result.json', oldPass);
const changed = await observed('changed-candidate-focused', (options) =>
  ordinary('focused', options),
);
assert.equal(changed.result.outcome, 'failed');
assert.ok('record' in changed.result && changed.result.record);
persistChild('changed-candidate-focused', changed.result.record);
assert.ok(fs.readFileSync(path.join(root, failedRef)).equals(failedBytes));
for (const item of failureInputs)
  assert.ok(fs.readFileSync(path.join(root, item.ref)).equals(item.bytes), item.ref);
assert.ok(!fs.existsSync(path.join(root, '.mendi/write.lock')));
save('timeline.json', timeline);
save('conclusions.json', {
  result: 'proof-completed',
  root,
  opaqueStopsBeforeTail: true,
  targetCanCollectIndependentTests: true,
  mendiResultStillCommandGranularity: true,
  ordinaryTailPassNotFormal: true,
  failedFormalRetryNeedsReview: true,
  approvedReducedCollectionRejected: true,
  currentContractRunsWholeAgain: true,
  sameCommandDoesNotCertifyCurrentSource: true,
  originalFailureAndLogsPreserved: true,
  limitations: [
    'Existing behavior only; no structured protocol, scheduler or aggregation implemented.',
    'No real independent approval is produced by fixture actor / verdict metadata.',
    'No resource-aware continuation or optimization speedup has been proved.',
    'No root formal Full Test, Close, DreMo access, stable install change or Git write.',
  ],
});
console.log(JSON.stringify({ result: 'proof-completed', output, root }, null, 2));
