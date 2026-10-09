import fs from 'node:fs';
import path from 'node:path';
import { fixture, sandbox } from './helpers.ts';
import { createWorkspace } from '../src/adapters/workspace.ts';
import type { ProcessRunner } from '../src/adapters/openspec.ts';
import { saveRun, startAction, submitRun } from '../src/application/actions.ts';

// Application tests isolate filesystem rules; real OpenSpec / CLI proof is separate.
export const runner: ProcessRunner = (_entry, args, cwd) => ({
  status: 0,
  signal: null,
  stderr: '',
  stdout:
    args[0] === '--version'
      ? '1.14.1'
      : JSON.stringify({
          root: { path: cwd, source: 'nearest' },
          changes: [{ name: 'proof-entry' }],
          changeName: 'proof-entry',
          schemaName: 'spec-driven',
          actionContext: { mode: 'repo-local' },
          isPlanningComplete: false,
          artifacts: [],
        }),
});
export const options = { runner };
export function actionTarget() {
  const root = fixture(sandbox());
  fs.mkdirSync(path.join(root, 'openspec/changes/proof-entry'), { recursive: true });
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
      title: '受控目标',
      state: 'open',
      openedOn: '2026-10-10',
      goal: '记录规则',
      plannedChanges: [{ slot: 'A', title: '入口', dependsOn: [] }],
      activeChangeId: 'proof-entry',
      changeBindings: [
        {
          planningSlot: 'A',
          changeId: 'proof-entry',
          changeRef: 'openspec/changes/proof-entry',
          state: 'explore',
        },
      ],
      changeBatches: [],
    },
  );
  return root;
}
export function author(root: string) {
  return { project: root, role: 'author', actor: 'author-one' };
}
export function reviewer(root: string) {
  return { project: root, role: 'reviewer', actor: 'reviewer-one' };
}
export function startAuthor(root: string) {
  return startAction(
    { ...author(root), changeId: 'proof-entry', type: 'explore', tool: 'openspec' },
    options,
  );
}
export function finish(
  root: string,
  ref: string,
  role: 'author' | 'reviewer' = 'author',
  outcome = 'complete',
  verdict?: string,
) {
  const input = role === 'author' ? author(root) : reviewer(root);
  const bodyFile = path.join(root, 'body.md');
  fs.writeFileSync(bodyFile, '真实受控工作正文\n');
  saveRun({ ...input, runRef: ref, bodyFile }, options);
  return submitRun({ ...input, runRef: ref, outcome, result: '完成受控工作', verdict }, options);
}
