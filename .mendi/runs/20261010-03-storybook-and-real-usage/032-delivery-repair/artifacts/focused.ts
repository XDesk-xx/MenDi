import fs from 'node:fs';
import path from 'node:path';
import { executeForeground } from '../../../../../src/adapters/test-process.ts';
import type { TestExecution } from '../../../../../src/core/test-execution.ts';

const root = process.cwd();
const artifactRef = '.mendi/runs/20261010-03-storybook-and-real-usage/032-delivery-repair/artifacts';
const pnpm = 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
const commands = [
  { id: 'build', args: [pnpm, 'build'], budgetMs: 60000 },
  { id: 'reopen-case', args: ['--test', '--test-name-pattern=reopen 各提交边界', 'tests/lifecycle-writes.test.ts'], budgetMs: 240000 },
  { id: 'execution-regression', args: ['--test', 'tests/test-execution.test.ts'], budgetMs: 180000 },
  { id: 'formal-adapter-scenes', args: ['--test', '--test-name-pattern=正式运行新子执行|真正非零|选定启动失败', 'tests/delivery-full-test.test.ts'], budgetMs: 180000 },
  { id: 'check-final', args: [pnpm, 'check'], budgetMs: 60000 },
];
const groupStarted = performance.now();
const observations: unknown[] = [];
for (const command of commands) {
  const started = performance.now();
  const remaining = 600000 - (started - groupStarted);
  if (remaining <= 0) throw Error('focused group budget exhausted; no subsequent command');
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), Math.min(command.budgetMs, remaining));
  // Only invoke the existing foreground adapter; this is not a product result
  // or a formal Delivery execution. Persist the actual command below.
  const invocation: TestExecution = {
    formatVersion: 1, executionId: '001-focused', kind: 'focused',
    projectRoot: root, cwd: root, deliveryId: '20261010-03-storybook-and-real-usage',
    changeId: null, actorId: 'author', scope: 'command', formalDeliveryTest: false,
    command: { executable: process.execPath, args: command.args, dependencyPolicy: 'warn' },
    dependencyCheck: { executable: process.execPath, args: [], dependencyPolicy: 'error', exitCode: 0 },
    scriptName: command.id, scriptText: command.args.join(' '),
    startedAt: new Date().toISOString(), finishedAt: null,
    executionState: 'running', outcome: 'unknown', exitCode: null, signal: null, pid: null,
    stdoutRef: `${artifactRef}/${command.id}.stdout.log`,
    stderrRef: `${artifactRef}/${command.id}.stderr.log`,
  };
  for (const ref of [invocation.stdoutRef, invocation.stderrRef])
    fs.writeFileSync(path.join(root, ref), '', { flag: 'wx' });
  console.log('starting ' + command.id);
  let result;
  try {
    result = await executeForeground(root, invocation, () => {}, { signal: control.signal });
  } finally {
    clearTimeout(timer);
  }
  const observation = {
    id: command.id, scope: 'command', formalDeliveryTest: false,
    executable: process.execPath, args: command.args, cwd: root,
    startedAt: invocation.startedAt, elapsedMs: performance.now() - started,
    budgetMs: Math.min(command.budgetMs, remaining),
    timedOut: control.signal.aborted, ...result,
    stdoutRef: invocation.stdoutRef, stderrRef: invocation.stderrRef,
  };
  observations.push(observation);
  fs.writeFileSync(path.join(root, artifactRef, command.id + '.result.json'), JSON.stringify(observation, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ id: command.id, exitCode: result.exitCode, closed: result.closed, elapsedMs: observation.elapsedMs }));
  if (!result.closed || result.exitCode !== 0 || result.failure || result.signal || control.signal.aborted) {
    process.exitCode = 1;
    break;
  }
}
fs.writeFileSync(path.join(root, artifactRef, 'focused-summary.json'), JSON.stringify(observations, null, 2) + '\n', { flag: 'wx' });
