import fs from 'node:fs';
import path from 'node:path';
import { fixture, sandbox, repository, cli, isolatedEnv, command } from './helpers.ts';
import { createWorkspace } from '../src/adapters/workspace.ts';
import { runTest } from '../src/application/tests.ts';
import type { ExecutionProcessOptions } from '../src/adapters/test-process.ts';
import assert from 'node:assert/strict';

export const pnpmEntry = 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
export function testTarget(open = true, ready = true) {
  const root = fixture(sandbox());
  fs.copyFileSync(
    path.join(repository, 'tests/fixtures/test-foreground.ts'),
    path.join(root, 'foreground.ts'),
  );
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'execution-fixture',
      private: true,
      type: 'module',
      packageManager: 'pnpm@11.22.0',
      scripts: {
        'test:focused': 'node foreground.ts pass',
        'test:fast': 'node foreground.ts fail',
        'test:full': 'node foreground.ts pass',
      },
    }),
  );
  // 隔离祖先 pnpm workspace；就绪用例明确准备空依赖状态，拒绝用例不准备。
  fs.writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    "packages: []\nverifyDepsBeforeRun: install\nstoreDir: './store'\n",
  );
  fs.writeFileSync(path.join(root, '.npmrc'), 'offline=true\n');
  if (open && ready) {
    const setup = command(pnpmEntry, ['install', '--offline', '--ignore-scripts'], root, {
      ...isolatedEnv(root),
      COREPACK_ENABLE_NETWORK: '0',
    });
    assert.equal(setup.status, 0, setup.stdout + setup.stderr);
  }
  if (open)
    createWorkspace(
      root,
      {
        formatVersion: 1,
        recordingMode: 'product',
        name: 'test',
        deliveryGroupsDir: '.mendi/delivery-groups',
        activeDeliveryId: 'd01',
        deliveries: [{ id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' }],
      },
      {
        formatVersion: 1,
        recordingMode: 'product',
        id: 'd01',
        title: '测试',
        state: 'open',
        openedOn: '2026-10-10',
        goal: '验证',
        plannedChanges: [{ slot: 'A', title: 'A', dependsOn: [] }],
        activeChangeId: null,
        changeBindings: [],
        changeBatches: [],
      },
    );
  return root;
}
export function testInput(root: string, kind = 'focused') {
  return { project: root, kind, actor: 'test-author', pnpmBin: pnpmEntry };
}
export function writePackage(root: string, edit: (pkg: Record<string, unknown>) => void) {
  const file = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  edit(pkg);
  fs.writeFileSync(file, JSON.stringify(pkg));
}
export async function execute(
  root: string,
  kind = 'focused',
  options: ExecutionProcessOptions = {},
) {
  const result = await runTest(testInput(root, kind), options);
  if (process.env.MENDI_TEST_EVIDENCE_DIR) {
    const record = 'record' in result ? result.record : result.observed;
    const logs: Record<string, string> = {};
    if (record)
      for (const ref of [record.stdoutRef, record.stderrRef])
        if (fs.existsSync(path.join(root, ref)))
          logs[ref] = fs.readFileSync(path.join(root, ref), 'utf8');
    fs.mkdirSync(process.env.MENDI_TEST_EVIDENCE_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(process.env.MENDI_TEST_EVIDENCE_DIR, `test-scenes-${process.pid}.jsonl`),
      JSON.stringify({ result, logs }) + '\n',
    );
  }
  return result;
}
export function statusCli(root: string, id: string, exit = 0) {
  const result = cli(
    ['test', 'status', '--project', root, '--execution', id, '--json'],
    path.dirname(root),
    isolatedEnv(path.dirname(root)),
  );
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
export async function waitFor(check: () => boolean, milliseconds = 10000) {
  const end = Date.now() + milliseconds;
  while (!check()) {
    if (Date.now() >= end) throw new Error('fixture wait timed out');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}
