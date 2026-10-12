import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { executeForeground } from '../../../../../src/adapters/test-process.ts';
import type { TestExecution } from '../../../../../src/core/test-execution.ts';

const root = process.cwd(), artifacts = '.mendi/runs/20261010-03-storybook-and-real-usage/037-revise-delivery-repair/artifacts';
const candidate = fs.readFileSync(artifacts + '/test-store.candidate.ts');
assert.ok(fs.readFileSync('tests/test-store.test.ts').equals(candidate));
const { acquireProjectLock, releaseProjectLock } = await import(pathToFileURL('D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi/dist/adapters/workspace.js').href);
const lease = acquireProjectLock(root, 'manual-037-focused');
const started = performance.now(), results = [];
try {
  for (const [id, args] of [
    ['test-store', ['--test', 'tests/test-store.test.ts']],
    ['check', ['C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js', 'check']],
  ] as const) {
    const remaining = 180000 - (performance.now() - started);
    assert.ok(remaining > 0, 'no further command after budget exhaustion');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(60000, remaining));
    const record: TestExecution = {
      formatVersion: 1, executionId: '001-focused', kind: 'focused', projectRoot: root, cwd: root,
      deliveryId: '20261010-03-storybook-and-real-usage', changeId: null, actorId: 'author',
      scope: 'command', formalDeliveryTest: false,
      command: { executable: process.execPath, args: [...args], dependencyPolicy: 'warn' },
      dependencyCheck: { executable: process.execPath, args: [], dependencyPolicy: 'error', exitCode: 0 },
      scriptName: id, scriptText: args.join(' '), startedAt: new Date().toISOString(), finishedAt: null,
      executionState: 'running', outcome: 'unknown', exitCode: null, signal: null, pid: null,
      stdoutRef: `${artifacts}/${id}.stdout.log`, stderrRef: `${artifacts}/${id}.stderr.log`,
    };
    for (const ref of [record.stdoutRef, record.stderrRef]) fs.writeFileSync(ref, '', { flag: 'wx' });
    let result;
    try { result = await executeForeground(root, record, () => {}, { signal: controller.signal }); }
    finally { clearTimeout(timer); }
    const inputUnchanged = fs.readFileSync('tests/test-store.test.ts').equals(candidate);
    results.push({ id, args, cwd: root, ...result, timedOut: controller.signal.aborted, inputUnchanged, stdoutRef: record.stdoutRef, stderrRef: record.stderrRef });
    fs.writeFileSync(artifacts + '/verification.json', JSON.stringify({ formalDeliveryTest: false, elapsedMs: performance.now() - started, results }, null, 2) + '\n');
    assert.ok(result.closed && result.exitCode === 0 && !result.signal && !result.failure && !controller.signal.aborted && inputUnchanged, JSON.stringify(results.at(-1)));
    if (id === 'test-store') {
      const output = fs.readFileSync(record.stdoutRef, 'utf8');
      assert.ok(output.includes('Windows 删除共享拒绝，确认句柄释放后可替换同一 staged 文件'));
      assert.match(output, /# pass 7\b/);
    }
  }
} finally { releaseProjectLock(root, lease); }
console.log(JSON.stringify({ passed: true, tests: 7, candidatePresent: fs.readFileSync('tests/test-store.test.ts').equals(candidate), rootLockAbsent: !fs.existsSync('.mendi/write.lock') }));
