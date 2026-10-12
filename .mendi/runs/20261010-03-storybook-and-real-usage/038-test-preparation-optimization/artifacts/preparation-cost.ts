import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { testTarget, pnpmEntry } from '../../../../../tests/test-support.ts';
import { command, isolatedEnv } from '../../../../../tests/helpers.ts';

const started = performance.now();
const targets = [];
for (let index = 0; index < 4; index++) {
  const before = performance.now();
  const root = testTarget();
  targets.push({ root, prepareMs: performance.now() - before });
}
const preparedAt = performance.now();
for (const { root } of targets) {
  const state = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/.pnpm-workspace-state-v1.json'), 'utf8'));
  assert.deepEqual(Object.keys(state.projects), [root]);
  const check = command(pnpmEntry, ['run'], root, { ...isolatedEnv(root), pnpm_config_verify_deps_before_run: 'error', COREPACK_ENABLE_NETWORK: '0' });
  assert.equal(check.status, 0, check.stdout + check.stderr);
}
assert.equal(new Set(targets.map(({ root }) => root)).size, 4);
const first = targets[0].root, second = targets[1].root;
const manifest = '.mendi/delivery-groups/d01/manifest.json';
const bytes = fs.readFileSync(path.join(second, manifest));
fs.writeFileSync(path.join(first, manifest), '{}\n');
assert.deepEqual(fs.readFileSync(path.join(second, manifest)), bytes);
const secondState = fs.readFileSync(path.join(second, 'node_modules/.pnpm-workspace-state-v1.json'));
fs.writeFileSync(path.join(first, 'node_modules/.pnpm-workspace-state-v1.json'), '{}\n');
assert.deepEqual(fs.readFileSync(path.join(second, 'node_modules/.pnpm-workspace-state-v1.json')), secondState);
console.log(JSON.stringify({ targets, prepareTotalMs: preparedAt - started, totalMs: performance.now() - started, realPnpmDependencyChecks: 4, independentState: true }, null, 2));
