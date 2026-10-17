import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { testTarget, testInput, writePackage } from '../../../../../../../tests/test-support.ts';
import { verificationTarget, fullInput } from '../../../../../../../tests/delivery-support.ts';
import { runTest } from '../../../../../../../src/application/tests.ts';
import { runFullTest } from '../../../../../../../src/application/delivery-full-test.ts';

const home = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(home, 'results');
assert.ok(!fs.existsSync(output), 'never overwrite an attempt');
fs.mkdirSync(output);
const save = (name: string, value: unknown) => fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + '\n');
interface Event { type: string; data?: { file?: string; name?: string; skip?: unknown; todo?: unknown; details?: unknown }; }
function events(label: string, names: string[], mode = 'normal') {
  const result = spawnSync(process.execPath, [path.join(home, 'event-worker.ts'), mode,
    ...names.map((name) => path.join(home, 'fixtures', name))], {
    encoding: 'utf8', timeout: 15000, windowsHide: true,
  });
  fs.writeFileSync(path.join(output, `${label}.jsonl`), result.stdout ?? '');
  fs.writeFileSync(path.join(output, `${label}.stderr.log`), result.stderr ?? '');
  assert.ifError(result.error);
  const observed: Event[] = result.stdout.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  assert.ok(observed.some((event) => event.type === 'reviewer:stream-ended'));
  const passed = observed.filter((event) => event.type === 'test:pass');
  const failed = observed.filter((event) => event.type === 'test:fail');
  const summary = { status: result.status, signal: result.signal, passed, failed,
    summaries: observed.filter((event) => event.type === 'test:summary') };
  save(`${label}-summary.json`, summary);
  return summary;
}
const skipped = events('skip-todo', ['skip.ts']);
assert.equal(skipped.status, 0);
assert.ok(skipped.passed.some((event) => event.data?.skip));
assert.ok(skipped.passed.some((event) => event.data?.todo));
assert.equal(skipped.failed.length, 0);
const mixed = events('mixed-and-tail', ['mixed.ts', 'tail.ts']);
assert.equal(mixed.status, 0, 'programmatic run stream does not itself make this wrapper nonzero');
assert.ok(mixed.failed.length > 0);
assert.ok(mixed.passed.some((event) => event.data?.file?.endsWith('mixed.ts')));
assert.ok(mixed.failed.some((event) => event.data?.file?.endsWith('mixed.ts')));
assert.ok(mixed.passed.some((event) => event.data?.file?.endsWith('tail.ts')));
const late = events('late-exit', ['late.ts', 'tail.ts']);
assert.ok(late.failed.some((event) => event.data?.file?.endsWith('late.ts')));
const cancelled = events('partial-abort', ['partial.ts', 'tail.ts'], 'abort');
assert.ok(cancelled.passed.some((event) => event.data?.name === 'first-completed'));
assert.ok(!cancelled.passed.some((event) => event.data?.file?.endsWith('tail.ts')));

// Independent target setup; no Author proof, old .tmp target or prior result is used.
const root = testTarget();
fs.copyFileSync(path.join(home, 'event-worker.ts'), path.join(root, 'event-worker.ts'));
fs.mkdirSync(path.join(root, 'fixtures'));
fs.copyFileSync(path.join(home, 'fixtures/mixed.ts'), path.join(root, 'fixtures/mixed.ts'));
writePackage(root, (pkg) => {
  (pkg.scripts as Record<string, string>)['test:focused'] = 'node event-worker.ts normal fixtures/mixed.ts';
});
const contradiction = await runTest(testInput(root));
save('production-command-versus-receipt.json', contradiction);
assert.equal(contradiction.outcome, 'passed');
const child = 'record' in contradiction ? contradiction.record : contradiction.observed;
assert.ok(child);
const stdout = fs.readFileSync(path.join(root, child.stdoutRef), 'utf8');
fs.writeFileSync(path.join(output, 'production-command.stdout.log'), stdout);
fs.copyFileSync(path.join(root, child.stderrRef), path.join(output, 'production-command.stderr.log'));
assert.ok(stdout.includes('"type":"test:fail"'));

// Real child completes; inject only the failure to persist its final result, with no live orphan.
writePackage(root, (pkg) => {
  (pkg.scripts as Record<string, string>)['test:focused'] = 'node foreground.ts pass';
});
let terminalObserved = false;
const unknown = await runTest(testInput(root), {
  observe(phase) {
    if (phase === 'before-terminal-commit') {
      terminalObserved = true;
      throw new Error('reviewer injected terminal persistence failure after child close');
    }
  },
});
save('terminal-write-failure.json', unknown);
assert.ok(terminalObserved);
assert.equal(unknown.outcome, 'unknown');
assert.ok('retainedLock' in unknown && unknown.retainedLock);
const entries = fs.readdirSync(path.join(root, '.mendi/delivery-groups/d01/tests'));
const next = await runTest(testInput(root));
save('followup-after-unknown.json', next);
assert.equal(next.ok, false);
assert.deepEqual(fs.readdirSync(path.join(root, '.mendi/delivery-groups/d01/tests')), entries);

// Whole-formal counterexample: unchanged declared collection is not measured assertion coverage.
const formalRoot = verificationTarget();
fs.copyFileSync(path.join(home, 'fixtures/skip.ts'), path.join(formalRoot, 'skip.ts'));
writePackage(formalRoot, (pkg) => {
  (pkg.scripts as Record<string, string>)['test:full'] = 'node --test skip.ts';
});
const declaration = JSON.parse(fs.readFileSync(path.join(formalRoot, 'full-test.json'), 'utf8'));
declaration.collection = ['required-business-assertion'];
fs.writeFileSync(path.join(formalRoot, 'full-test.json'), JSON.stringify(declaration));
const formal = await runFullTest(fullInput(formalRoot));
save('formal-all-skipped.json', formal);
assert.equal(formal.ok, true);
assert.ok('verification' in formal && formal.verification.child);
for (const [label, ref] of [['stdout', formal.verification.child.stdoutRef], ['stderr', formal.verification.child.stderrRef]])
  fs.copyFileSync(path.join(formalRoot, ref), path.join(output, `formal-all-skipped.${label}.log`));
save('conclusions.json', {
  proofAssertionsPassed: true,
  roots: { command: root, formal: formalRoot },
  skippedAndTodoEmitPass: true,
  sameFileCanEmitPassAndFail: true,
  wrapperZeroCanContainMachineFailure: true,
  lateExitProducesFailure: true,
  abortLeavesTailUnexecuted: true,
  unknownPersistenceBlocksNewExecution: true,
  formalPassedIsNotMeasuredCoverage: true,
  limits: 'Current contract and event semantics only; no implementation of future protocol, aggregation or scheduler. Preserved failed persistence fixture lock; no external resource cleanup performed.',
});
