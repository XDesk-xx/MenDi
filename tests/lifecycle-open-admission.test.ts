import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { openDelivery } from '../src/application/project.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { MendiError } from '../src/core/errors.ts';
import { testTarget } from './test-support.ts';
import { prepareChange, isolatedEnv, scopeFile } from './helpers.ts';

function firstInput(recorded: boolean) {
  const root = testTarget(false);
  prepareChange(root, isolatedEnv(root));
  scopeFile(root);
  return {
    project: root,
    id: 'first',
    title: '首次关联准入',
    scopePath: 'scope.json',
    changeId: 'proof-entry',
    slot: 'A',
    ...(recorded ? { role: 'author', actor: 'first-author' } : {}),
  };
}
const code = (expected: string) => (error: unknown) =>
  error instanceof MendiError && error.code === expected;

test('首次 Open 两种入口均拒绝未归档依赖，合法首次关联保持原记录语义', () => {
  for (const recorded of [false, true]) {
    const input = firstInput(recorded);
    assert.throws(
      () => openDelivery({ ...input, slot: 'B' }),
      code('change-dependency-not-archived'),
    );
    assert.equal(fs.existsSync(path.join(input.project, '.mendi')), false);
    openDelivery(input);
    const workspace = readWorkspace(input.project)!;
    assert.equal(workspace.activeChangeId, 'proof-entry');
    assert.equal(workspace.bindings[0].planningSlot, 'A');
    assert.equal(workspace.manifest.deliveryRunRef, undefined);
    assert.equal(
      workspace.manifest.openRunRef,
      recorded ? '.mendi/runs/first/001-delivery-open/run.md' : undefined,
    );
    assert.equal(scanRunNumbers(input.project, 'first').number, recorded ? 2 : 1);
  }
});

test('首次 Open 两种入口均在写前拒绝错误槽位，修正后可直接成功', () => {
  for (const recorded of [false, true]) {
    const input = firstInput(recorded);
    assert.throws(
      () => openDelivery({ ...input, slot: 'missing-slot' }),
      code('planning-slot-not-found'),
    );
    assert.equal(fs.existsSync(path.join(input.project, '.mendi')), false);
    assert.equal(openDelivery(input).local.activeChangeId, 'proof-entry');
    assert.equal(scanRunNumbers(input.project, 'first').number, recorded ? 2 : 1);
  }
});

test('记录化首次 Open 在持锁后复核直接 Change，真实中断保留现场', () => {
  for (const stop of ['lock-acquired', 'intent-written']) {
    const input = firstInput(true);
    const change = path.join(input.project, 'openspec/changes/proof-entry');
    let checked = false;
    assert.throws(
      () =>
        openDelivery(input, {
          observeWrite(phase) {
            if (phase === stop) {
              checked = true;
              fs.renameSync(change, path.join(input.project, 'openspec/changes/moved-entry'));
            }
          },
        }),
      MendiError,
    );
    assert.equal(checked, true);
    assert.equal(fs.existsSync(path.join(input.project, '.mendi')), true);
    assert.equal(
      fs.existsSync(path.join(input.project, '.mendi/write.lock')),
      stop === 'intent-written',
    );
    assert.equal(fs.existsSync(path.join(input.project, '.mendi/project.json')), false);
    assert.equal(scanRunNumbers(input.project, 'first').number, stop === 'intent-written' ? 2 : 1);
    assert.throws(
      () => openDelivery(input),
      code(
        stop === 'intent-written' ? 'write-in-progress-or-interrupted' : 'incomplete-mendi-state',
      ),
    );
  }
});
