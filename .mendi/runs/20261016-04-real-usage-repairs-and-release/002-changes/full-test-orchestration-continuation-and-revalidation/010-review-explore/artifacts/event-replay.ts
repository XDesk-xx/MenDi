import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { run } from 'node:test';
import type { TestEvent } from 'node:test/reporters';
import { performance } from 'node:perf_hooks';

// B Explore: observe Node's actual machine events, not a MenDi protocol implementation.
const repository = fs.realpathSync('.');
const artifacts = path.join(
  repository,
  '.mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes',
  'full-test-orchestration-continuation-and-revalidation/010-review-explore/artifacts',
);
const setup = JSON.parse(fs.readFileSync(path.join(artifacts, 'proof-02/setup.json'), 'utf8'));
const root = fs.realpathSync(String(setup.root));
assert.ok(root.startsWith(path.join(repository, '.tmp') + path.sep));
const output = path.join(artifacts, 'structured-events');
assert.ok(!fs.existsSync(output));
fs.mkdirSync(output);
const files = ['unit.test.ts', 'integration.test.ts', 'tail.test.ts'].map((file) =>
  path.join(root, 'checks', file),
);
const passed = new Set<string>();
const failed = new Set<string>();
const began = performance.now();
process.chdir(root);
try {
  for await (const item of run({ files, concurrency: 1 })) {
    const event = item as TestEvent;
    fs.appendFileSync(
      path.join(output, 'events.jsonl'),
      JSON.stringify(
        { utc: new Date().toISOString(), elapsedMs: performance.now() - began, event },
        (_key, value: unknown) =>
          value instanceof Error ? { name: value.name, message: value.message } : value,
      ) + '\n',
    );
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    const file = event.data.file ? path.resolve(event.data.file) : null;
    assert.ok(file && files.includes(file), 'only explicit selected input files');
    if (event.type === 'test:pass') passed.add(path.basename(file));
    else failed.add(path.basename(file));
  }
} finally {
  process.chdir(repository);
}
assert.deepEqual([...passed].sort(), ['tail.test.ts', 'unit.test.ts']);
assert.deepEqual([...failed], ['integration.test.ts']);
const result = {
  proofAssertionsPassed: true,
  mechanism: 'Node 22 node:test run() TestsStream / typed test:pass and test:fail',
  selectedFiles: files,
  passed: [...passed],
  failed: [...failed],
  observedCollectionOutcome: 'failed',
  wallMs: performance.now() - began,
  stdoutWasParsedForOutcomes: false,
  limitation:
    'Node event feasibility only; no MenDi schema, resource scheduler, cross-attempt aggregation or Close admission implemented.',
};
fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
