import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  closedTarget,
  closeInput,
  prepareLifecycleChange,
  queryCli,
  writeJson,
} from '../tests/lifecycle-support.ts';
import { sandbox, repository } from '../tests/helpers.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';
import { bindChange } from '../src/application/project.ts';
import { startAction } from '../src/application/actions.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { parseProject, parseWorkspace, readScope } from '../src/core/records.ts';
import { completionScope } from '../src/core/delivery-verification.ts';
import { MendiError } from '../src/core/errors.ts';

// Baseline investigation only: no new round model, migration algorithm or product changes.
const destination = path.resolve(process.argv[2] ?? '');
assert.ok(process.argv[2], '指定当前 Run artifacts 下的新输出目录。');
const relative = path.relative(repository, destination);
assert.ok(relative.startsWith(`.mendi${path.sep}runs${path.sep}`));
assert.ok(!relative.split(path.sep).includes('..'));
fs.mkdirSync(destination);
const events: unknown[] = [];
function record(name: string, facts: unknown) {
  const event = { name, facts };
  events.push(event);
  fs.appendFileSync(path.join(destination, 'observations.jsonl'), JSON.stringify(event) + '\n');
  process.stdout.write(`${name}: observed\n`);
}
function rejection(action: () => unknown): { code: string; message: string } {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof MendiError, '预期产品明确拒绝，不将任意异常计为符合预期。');
  return { code: caught.code, message: caught.message };
}

const { root, passed, close } = await closedTarget();
assert.ok('run' in passed && passed.run);
const before = readWorkspace(root)!;
const manifestFile = path.join(root, before.manifestRef);
const manifestBytes = fs.readFileSync(manifestFile);
const number = scanRunNumbers(root, before.id).number;
const previousRuns = [passed.run.ref, close.run.ref];
const previousBytes = new Map(
  previousRuns.map((ref) => [ref, fs.readFileSync(path.join(root, ref))]),
);
const scope = {
  goal: '隔离 proof：原 A/B 对应已交付基线，新轮仅承诺 P10/P13。',
  plannedChanges: [
    { slot: 'P10', title: '新轮 P10', dependsOn: [] },
    { slot: 'P13', title: '新轮 P13', dependsOn: ['P10'] },
  ],
};
const input = {
  project: root,
  role: 'author',
  actor: 'delivery-author',
  scopePath: 'round-scope.json',
  reason: '隔离探索，不修改真实目标。',
};

for (const [name, candidate] of [
  [
    'cross-round-dependency',
    {
      ...scope,
      plannedChanges: [
        { ...scope.plannedChanges[0], dependsOn: [before.scope.plannedChanges[0].slot] },
      ],
    },
  ],
  [
    'old-scope-union',
    { ...scope, plannedChanges: [...before.scope.plannedChanges, ...scope.plannedChanges] },
  ],
] as const) {
  writeJson(root, input.scopePath, candidate);
  const rejected = rejection(() => deliveryLifecycle('delivery-reopen', input));
  assert.equal(rejected.code, 'invalid-scope');
  assert.ok(fs.readFileSync(manifestFile).equals(manifestBytes));
  assert.equal(scanRunNumbers(root, before.id).number, number);
  record(name, { rejected, noReservation: true, manifestUnchanged: true });
}

writeJson(root, input.scopePath, scope);
const reopened = deliveryLifecycle('delivery-reopen', input);
const after = readWorkspace(root)!;
assert.deepEqual(after.scope.plannedChanges, scope.plannedChanges);
assert.notEqual(after.scope.goal, before.scope.goal);
assert.equal(after.id, before.id);
assert.equal(after.manifest.openedOn, before.manifest.openedOn);
assert.deepEqual(after.manifest.changeBindings, before.manifest.changeBindings);
assert.deepEqual(after.manifest.changeBatches, before.manifest.changeBatches);
assert.equal(after.manifest.currentBatchId, null);
assert.equal(after.manifest.closeRunRef, close.run.ref);
assert.equal(after.manifest.fullTestRunRef, passed.run.ref);
assert.equal(after.manifest.rounds, undefined);
record('real-reopen-scope-replacement', {
  root,
  priorScope: before.scope,
  currentScope: after.scope,
  reopenRun: reopened.run.ref,
  identityAndOriginalDatePreserved: true,
  oldBindingsAndBatchesPreserved: true,
  structuredRoundsAbsent: true,
});

const reopenedQuery = queryCli(root);
assert.equal(reopenedQuery.next.action, 'change-bind');
assert.equal(reopenedQuery.upstream, null);
assert.equal(reopenedQuery.verification, undefined);
const oldResult = fullTestStatus({ project: root, runRef: passed.run.ref });
assert.equal(oldResult.verification.outcome, 'passed');
assert.equal(oldResult.verification.scopeMatch, 'changed');
const closeDenied = rejection(() =>
  deliveryLifecycle('delivery-close', closeInput(root, passed.run!.ref)),
);
assert.equal(closeDenied.code, 'delivery-state-conflict');
const incomplete = rejection(() => completionScope(after));
assert.equal(incomplete.code, 'delivery-scope-incomplete');
record('old-pass-is-history', {
  oldOutcome: oldResult.verification.outcome,
  scopeMatch: oldResult.verification.scopeMatch,
  next: reopenedQuery.next,
  closeDenied,
  newScopeIncomplete: incomplete,
});

const history = path.join(root, path.dirname(reopened.run.ref), 'artifacts/before-manifest.json');
const snapshotBytes = fs.readFileSync(history);
const directPrior = JSON.parse(JSON.parse(snapshotBytes.toString('utf8')));
assert.deepEqual(readScope(directPrior), before.scope);
fs.renameSync(history, history + '.unavailable');
try {
  assert.equal(queryCli(root).ok, true);
  const missing = rejection(() =>
    deliveryLifecycle('delivery-reopen', { ...input, resumeRef: reopened.run.ref }),
  );
  assert.equal(missing.code, 'incomplete-mendi-state');
  record('direct-history-gap', {
    priorScopeRecoveredFromDirectSnapshot: true,
    queryStillWorksWithoutSnapshot: true,
    explicitResumeRejectsMissingBasis: missing,
    limitation:
      'No migration is implemented; missing direct snapshots cannot be invented from current top-level scope.',
  });
} finally {
  fs.renameSync(history + '.unavailable', history);
}

const contradictory = {
  ...after.manifest,
  currentRoundId: 'untrusted-first',
  rounds: [{ id: 'untrusted-first', scope: before.scope }],
};
const ignored = parseWorkspace(parseProject(after.project), contradictory);
assert.deepEqual(ignored.scope, after.scope);
const futureFormat = rejection(() => parseProject({ ...after.project, formatVersion: 2 }));
assert.equal(futureFormat.code, 'unsupported-record-format');
record('format-boundary', {
  versionOneUnknownRoundFieldsDoNotSelectScope: true,
  futureFormatRejected: futureFormat,
  limitation:
    'Adding round fields to v1 without changing readers would keep selecting the old top-level scope.',
});

prepareLifecycleChange(root, 'round-entry');
bindChange({ project: root, changeId: 'round-entry', slot: 'P10' });
assert.equal(readWorkspace(root)!.manifest.currentBatchId, null);
const started = startAction({
  project: root,
  changeId: 'round-entry',
  type: 'explore',
  role: 'author',
  actor: 'fixture-author',
});
const current = readWorkspace(root)!;
assert.equal(current.bindings.at(-1)?.planningSlot, 'P10');
assert.notEqual(current.bindings.at(-1)?.batchId, before.bindings.at(-1)?.batchId);
assert.deepEqual(
  (current.manifest.changeBatches as unknown[])[0],
  (before.manifest.changeBatches as unknown[])[0],
);
assert.equal(
  readDeliveryRun(root, reopened.run.ref, before.id).record.lifecycle!.scope.goal,
  scope.goal,
);
for (const [ref, bytes] of previousBytes)
  assert.ok(fs.readFileSync(path.join(root, ref)).equals(bytes));
record('first-current-round-run', {
  bindingSlot: current.bindings.at(-1)?.planningSlot,
  currentBatch: current.manifest.currentBatchId,
  newRun: started.run.ref,
  originalBatchUnchanged: true,
  priorFormalAndCloseBytesUnchanged: true,
});

const manualRoot = path.join(sandbox(), 'manual');
const projectRef = '.mendi/project.json';
const project = JSON.parse(fs.readFileSync(path.join(repository, projectRef), 'utf8'));
const manualManifest = JSON.parse(
  fs.readFileSync(path.join(path.dirname(destination), 'before-manifest.json'), 'utf8'),
);
fs.mkdirSync(path.join(manualRoot, 'openspec'), { recursive: true });
fs.writeFileSync(path.join(manualRoot, 'openspec/config.yaml'), 'schema: spec-driven\n');
fs.mkdirSync(path.join(manualRoot, path.dirname(project.deliveries.at(-1).manifestRef)), {
  recursive: true,
});
writeJson(manualRoot, projectRef, project);
writeJson(manualRoot, project.deliveries.at(-1).manifestRef, manualManifest);
const manualInputs = [projectRef, project.deliveries.at(-1).manifestRef];
const bytes = new Map(
  manualInputs.map((ref) => [ref, fs.readFileSync(path.join(manualRoot, ref))]),
);
assert.equal(queryCli(manualRoot).local.source, 'manual-bootstrap');
const denied = rejection(() =>
  deliveryLifecycle('delivery-reopen', { ...input, project: manualRoot }),
);
assert.equal(denied.code, 'manual-state-read-only');
for (const [ref, expected] of bytes)
  assert.ok(fs.readFileSync(path.join(manualRoot, ref)).equals(expected));
record('manual-read-only', {
  manualRoot,
  queryPassed: true,
  writerRejected: denied,
  directInputsUnchanged: true,
});

fs.writeFileSync(
  path.join(destination, 'result.json'),
  JSON.stringify(
    {
      result: 'baseline-observed',
      authority:
        'Only isolated fixtures. Approval records are synthetic; full command, Close, Reopen and fresh CLI queries are real. No MVP-D04-A product implementation or review approval.',
      root,
      events,
      limits: [
        'No new-format acceptance or migration implementation.',
        'No DreMo or stable-installation writes.',
        'No repeated full lifecycle or new-format interruption matrix.',
        'Existing A/B fixture slots stand for prior delivery; P10/P13 are actual new input slots.',
      ],
    },
    null,
    2,
  ) + '\n',
);
