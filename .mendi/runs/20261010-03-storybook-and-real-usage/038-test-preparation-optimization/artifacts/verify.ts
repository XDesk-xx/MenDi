import fs from 'node:fs';
import assert from 'node:assert/strict';
import { executeForeground } from '../../../../../src/adapters/test-process.ts';
import type { TestExecution } from '../../../../../src/core/test-execution.ts';

const root = process.cwd(), artifacts = '.mendi/runs/20261010-03-storybook-and-real-usage/038-test-preparation-optimization/artifacts';
process.env.MENDI_TEST_EVIDENCE_DIR = root + '/' + artifacts + '/focused-commands';
const repair = fs.readFileSync('.mendi/runs/20261010-03-storybook-and-real-usage/037-revise-delivery-repair/artifacts/test-store.candidate.ts');
const files = ['tests/test-support.ts', 'tests/sequential-support.ts', 'tests/lifecycle-support.ts', 'tests/delivery-support.ts', 'tests/test-preparation.test.ts'];
const inputs = files.map(file => fs.readFileSync(file));
const finalOnly = process.argv[2] === 'check-final';
const elapsedBefore = finalOnly ? JSON.parse(fs.readFileSync(artifacts + '/verification.json', 'utf8')).elapsedMs as number : 0;
const started = performance.now(), results = [];
const commands = [
  { id: 'dependency-and-execution', args: ['--test', '--test-concurrency=2', 'tests/test-preparation.test.ts', 'tests/test-entries.test.ts', 'tests/test-execution.test.ts', 'tests/test-store.test.ts'], budget: 180000 },
  { id: 'lifecycle-write-boundaries', args: ['--test', '--test-name-pattern=各提交边界中断', 'tests/lifecycle-writes.test.ts'], budget: 420000 },
  { id: 'second-archive-boundaries', args: ['--test', '--test-name-pattern=第二 Archive 计数', 'tests/sequential-changes.test.ts'], budget: 180000 },
  { id: 'formal-adapter-dependencies', args: ['--test', '--test-name-pattern=正式运行新子执行|声明固定后工具', 'tests/delivery-full-test.test.ts'], budget: 180000 },
  { id: 'check', args: ['C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js', 'check'], budget: 60000 },
];
for (const command of finalOnly ? [{ ...commands.at(-1)!, id: 'check-final' }] : commands) {
  const remaining = 900000 - elapsedBefore - (performance.now() - started);
  assert.ok(remaining > 0, 'group exhausted; no subsequent command');
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), Math.min(command.budget, remaining));
  const record: TestExecution = {
    formatVersion: 1, executionId: '001-focused', kind: 'focused', projectRoot: root, cwd: root,
    deliveryId: '20261010-03-storybook-and-real-usage', changeId: null, actorId: 'author',
    scope: 'command', formalDeliveryTest: false,
    command: { executable: process.execPath, args: command.args, dependencyPolicy: 'warn' },
    dependencyCheck: { executable: process.execPath, args: [], dependencyPolicy: 'error', exitCode: 0 },
    scriptName: command.id, scriptText: command.args.join(' '), startedAt: new Date().toISOString(), finishedAt: null,
    executionState: 'running', outcome: 'unknown', exitCode: null, signal: null, pid: null,
    stdoutRef: `${artifacts}/${command.id}.stdout.log`, stderrRef: `${artifacts}/${command.id}.stderr.log`,
  };
  for (const ref of [record.stdoutRef, record.stderrRef]) fs.writeFileSync(ref, '', { flag: 'wx' });
  const before = performance.now();
  let result;
  console.log('starting ' + command.id);
  try { result = await executeForeground(root, record, () => {}, { signal: control.signal }); }
  finally { clearTimeout(timer); }
  const inputsUnchanged = files.every((file, index) => fs.readFileSync(file).equals(inputs[index]));
  const repairPresent = fs.readFileSync('tests/test-store.test.ts').equals(repair);
  const observation = { id: command.id, args: command.args, startedAt: record.startedAt,
    budgetMs: Math.min(command.budget, remaining), elapsedMs: performance.now() - before,
    formalDeliveryTest: false, ...result, timedOut: control.signal.aborted, inputsUnchanged, repairPresent,
    stdoutRef: record.stdoutRef, stderrRef: record.stderrRef };
  results.push(observation);
  fs.writeFileSync(artifacts + (finalOnly ? '/verification-final.json' : '/verification.json'), JSON.stringify({ groupBudgetMs: 900000, elapsedBeforeMs: elapsedBefore, elapsedMs: elapsedBefore + performance.now() - started, formalDeliveryTest: false, results }, null, 2) + '\n');
  console.log(JSON.stringify(observation));
  if (!result.closed || result.exitCode !== 0 || result.signal || result.failure || control.signal.aborted || !inputsUnchanged || !repairPresent) {
    process.exitCode = 1;
    break;
  }
}
