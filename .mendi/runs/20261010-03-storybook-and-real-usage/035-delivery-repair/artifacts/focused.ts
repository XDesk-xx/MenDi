import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { executeForeground } from '../../../../../src/adapters/test-process.ts';
import type { TestExecution } from '../../../../../src/core/test-execution.ts';

const root = process.cwd();
const artifactRef = '.mendi/runs/20261010-03-storybook-and-real-usage/035-delivery-repair/artifacts/verified';
fs.mkdirSync(artifactRef);
const expectedTest = fs.readFileSync('tests/test-store.test.ts');
const { acquireProjectLock, releaseProjectLock } = await import(pathToFileURL('D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi/dist/adapters/workspace.js').href);
const lease = acquireProjectLock(root, 'manual-035-focused-verification');
const started = performance.now();
const observations: unknown[] = [];
async function run(id: string, args: string[]) {
  const remaining = 300000 - (performance.now() - started);
  if (remaining <= 0) throw Error('focused budget exhausted; no further command');
  const control = new AbortController();
  const budgetMs = Math.min(60000, remaining);
  const timer = setTimeout(() => control.abort(), budgetMs);
  const invocation: TestExecution = {
    formatVersion: 1, executionId: '001-focused', kind: 'focused',
    projectRoot: root, cwd: root, deliveryId: '20261010-03-storybook-and-real-usage',
    changeId: null, actorId: 'author', scope: 'command', formalDeliveryTest: false,
    command: { executable: process.execPath, args, dependencyPolicy: 'warn' },
    dependencyCheck: { executable: process.execPath, args: [], dependencyPolicy: 'error', exitCode: 0 },
    scriptName: id, scriptText: args.join(' '), startedAt: new Date().toISOString(), finishedAt: null,
    executionState: 'running', outcome: 'unknown', exitCode: null, signal: null, pid: null,
    stdoutRef: `${artifactRef}/${id}.stdout.log`, stderrRef: `${artifactRef}/${id}.stderr.log`,
  };
  for (const ref of [invocation.stdoutRef, invocation.stderrRef]) fs.writeFileSync(ref, '', { flag: 'wx' });
  const commandStarted = performance.now();
  let result;
  try {
    result = await executeForeground(root, invocation, () => {}, { signal: control.signal });
  } finally { clearTimeout(timer); }
  const observation = { id, executable: process.execPath, args, cwd: root, budgetMs,
    startedAt: invocation.startedAt, elapsedMs: performance.now() - commandStarted,
    formalDeliveryTest: false, timedOut: control.signal.aborted, ...result,
    stdoutRef: invocation.stdoutRef, stderrRef: invocation.stderrRef,
    testedInputUnchanged: fs.readFileSync('tests/test-store.test.ts').equals(expectedTest) };
  observations.push(observation);
  fs.writeFileSync(`${artifactRef}/${id}.result.json`, JSON.stringify(observation, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(observation));
  return observation.testedInputUnchanged && result.closed && result.exitCode === 0 && !result.failure && !result.signal && !control.signal.aborted;
}
try {
let passed = await run('test-store', ['--test', 'tests/test-store.test.ts']);
if (passed) {
  const results = await Promise.all([1, 2].map((n) => run(`windows-repeat-${n}`,
    ['--test', '--test-name-pattern=Windows 删除共享|Windows 持续占用', 'tests/test-store.test.ts'])));
  passed = results.every(Boolean);
}
if (passed) passed = await run('check', ['C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js', 'check']);
fs.writeFileSync(`${artifactRef}/focused-summary.json`, JSON.stringify({ formalDeliveryTest: false,
  groupBudgetMs: 300000, elapsedMs: performance.now() - started, passed, observations }, null, 2) + '\n', { flag: 'wx' });
if (!passed) process.exitCode = 1;
} finally {
  releaseProjectLock(root, lease);
}
