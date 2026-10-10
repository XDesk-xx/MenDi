import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { testTarget } from '../../../../../../../tests/test-support.ts';
import { prepareChange, isolatedEnv, scopeFile } from '../../../../../../../tests/helpers.ts';
import { openDelivery } from '../../../../../../../src/application/project.ts';
import { readWorkspace } from '../../../../../../../src/adapters/workspace.ts';
import { errorInfo } from '../../../../../../../src/core/errors.ts';
import { passedTarget } from '../../../../../../../tests/lifecycle-support.ts';
import { deliveryLifecycle } from '../../../../../../../src/application/delivery-lifecycle.ts';
import { diagnoseWorkspace } from '../../../../../../../src/application/diagnosis.ts';

const observations: unknown[] = [];
for (const recorded of [false, true]) {
  for (const slot of ['B', 'missing-slot']) {
    const root = testTarget(false);
    prepareChange(root, isolatedEnv(root), 'proof-entry');
    scopeFile(root);
    let result: unknown;
    try {
      const value = openDelivery({ project: root, id: 'first', title: 'review probe',
        scopePath: 'scope.json', changeId: 'proof-entry', slot,
        ...(recorded ? { role: 'author', actor: 'independent-reviewer-fixture' } : {}) });
      result = { ok: value.ok, activeChangeId: value.local.activeChangeId,
        bindings: readWorkspace(root)!.bindings };
    } catch (error) { result = { error: errorInfo(error) }; }
    const directory = path.join(root, '.mendi');
    const stateExists = fs.existsSync(directory);
    let correctedRetry: unknown;
    if (recorded && slot === 'missing-slot') {
      try { correctedRetry = openDelivery({ project: root, id: 'first', title: 'corrected',
        scopePath: 'scope.json', changeId: 'proof-entry', slot: 'A', role: 'author',
        actor: 'independent-reviewer-fixture' }); }
      catch (error) { correctedRetry = errorInfo(error); }
    }
    observations.push({ scenario: 'initial-binding', root, recorded, slot, result,
      stateExists, entries: stateExists ? fs.readdirSync(directory) : [], correctedRetry });
    if (recorded && slot === 'B') assert.equal(readWorkspace(root)!.bindings[0].planningSlot, 'B');
    if (recorded && slot === 'missing-slot') assert.equal(stateExists, true);
    if (!recorded) assert.equal(stateExists, false);
  }
}
const { root, input } = await passedTarget();
try {
  deliveryLifecycle('delivery-close', input, { observeWrite(phase) {
    if (phase === 'pending-written') throw new Error('Reviewer controlled interruption');
  } });
  assert.fail('must interrupt');
} catch (error) {
  assert.match(String(error), /写入|interruption|失败/);
}
const project = JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8'));
const diagnosis = diagnoseWorkspace({ project: root, runRef: project.pendingDeliveryRunRef });
observations.push({ scenario: 'pending-diagnosis', root, pending: project.pendingDeliveryRunRef,
  current: diagnosis.current, reservation: diagnosis.reservation, ok: diagnosis.ok,
  errors: diagnosis.errors, lock: diagnosis.lock });
assert.equal(diagnosis.current?.ref, project.pendingDeliveryRunRef);
console.log(JSON.stringify({ observations, limit: 'Isolated fixtures only; retained locks are deliberate failure evidence, not repository locks.' }, null, 2));
