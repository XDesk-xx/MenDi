import fs from 'node:fs';
import assert from 'node:assert/strict';
import { executeForeground } from '../../../../../src/adapters/test-process.ts';
import type { TestExecution } from '../../../../../src/core/test-execution.ts';

const root = process.cwd();
const artifacts = '.mendi/runs/20261010-03-storybook-and-real-usage/042-revise-delivery-repair/artifacts';
const source = 'tests/test-store.test.ts';
const candidate = fs.readFileSync('.mendi/runs/20261010-03-storybook-and-real-usage/037-revise-delivery-repair/artifacts/test-store.candidate.ts');
const unchangedFiles = ['src/adapters/test-store.ts', 'tests/test-support.ts', 'tests/sequential-support.ts', 'tests/lifecycle-support.ts', 'tests/delivery-support.ts', 'tests/test-preparation.test.ts'];
const unchangedBytes = unchangedFiles.map(file => fs.readFileSync(file));
process.env.MENDI_TEST_EVIDENCE_DIR = `${root}/${artifacts}/focused-commands`;
const commands = [
  { id: 'verify-typecheck', args: ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--allowImportingTsExtensions', '--erasableSyntaxOnly', '--types', 'node', `${artifacts}/verify.ts`] },
  { id: 'storage-focused', args: ['--test', 'tests/test-store.test.ts'] },
  { id: 'check', args: ['C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js', 'check'] },
];
const started = performance.now();
const groupBudgetMs = 180000;
const results = [];
for (const command of commands) {
  const remaining = groupBudgetMs - (performance.now() - started);
  assert.ok(remaining > 0, 'group budget exhausted; do not start another command');
  assert.ok(fs.readFileSync(source).equals(candidate), 'actual source changed before command');
  const budgetMs = Math.min(60000, remaining);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
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
  const commandStart = performance.now();
  let result;
  try {
    result = await executeForeground(root, record, () => {}, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  const candidatePresent = fs.readFileSync(source).equals(candidate);
  const unchanged = unchangedFiles.every((file, index) => fs.readFileSync(file).equals(unchangedBytes[index]));
  const observation = {
    id: command.id, executable: process.execPath, args: command.args, startedAt: record.startedAt,
    finishedAt: new Date().toISOString(), budgetMs, elapsedMs: performance.now() - commandStart,
    ...result, timedOut: controller.signal.aborted, candidatePresent, unchanged,
    stdoutRef: record.stdoutRef, stderrRef: record.stderrRef,
  };
  results.push(observation);
  fs.writeFileSync(`${artifacts}/verification.json`, JSON.stringify({ groupBudgetMs, elapsedMs: performance.now() - started, formalDeliveryTest: false, unchangedFiles, results }, null, 2) + '\n');
  console.log(JSON.stringify(observation));
  if (!result.closed || result.exitCode !== 0 || result.signal || result.failure || result.launchError || controller.signal.aborted || !candidatePresent || !unchanged) {
    process.exitCode = 1;
    break;
  }
}
