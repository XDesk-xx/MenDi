import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  closedTarget,
  openInput,
  lifecycleCli,
  queryCli,
  reopenInput,
  writeJson,
  prepareLifecycleChange,
  closeInput,
  archiveNew,
} from './lifecycle-support.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { bindChange } from '../src/application/project.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { deliveredBaselines } from '../src/adapters/baselines.ts';
import { formal, fullInput } from './delivery-support.ts';
import { runFullTest } from '../src/application/delivery-full-test.ts';
import { readRunSource, renderRun, scanRunNumbers } from '../src/adapters/runs.ts';

test('真实跨 Delivery 基线经新轮归档 / Full Test / Close；来源后续 Reopen、旧格式及缺说明仍可核对', async () => {
  const { root, close, passed } = await closedTarget();
  assert.ok('verification' in passed && passed.verification.child);
  const source = readWorkspace(root)!;
  const declared = {
    deliveryId: 'd01',
    planningSlot: source.scope.plannedChanges[0].slot,
    closeRunRef: close.run.ref,
  };
  openInput(root);
  const scope = JSON.parse(fs.readFileSync(path.join(root, 'new-scope.json'), 'utf8'));
  scope.plannedChanges[0].baselineDependencies = [declared];
  writeJson(root, 'new-scope.json', scope);
  const opened = lifecycleCli(root, 'open', [
    '--id',
    'd02',
    '--title',
    '基线消费',
    '--scope',
    'new-scope.json',
  ]);
  assert.equal(opened.local.currentRoundId, 'r001');
  const entryRef = path.join(root, '.mendi/project.json');
  const entry = JSON.parse(fs.readFileSync(entryRef, 'utf8'));
  // Explicit selection fixture constructs a registered source that subsequently reopens.
  writeJson(root, '.mendi/project.json', { ...entry, activeDeliveryId: 'd01' });
  deliveryLifecycle('delivery-reopen', reopenInput(root));
  prepareLifecycleChange(root, 'source-later-work');
  bindChange({ project: root, changeId: 'source-later-work', slot: 'C' });
  writeJson(root, '.mendi/project.json', { ...entry, activeDeliveryId: 'd02' });
  // Old explanatory history and source active status are outside the direct baseline contract.
  const sourceActive = path.join(root, 'openspec/changes/source-later-work');
  fs.renameSync(sourceActive, sourceActive + '-unavailable');
  for (const approval of close.run.lifecycle!.acceptance!.approvals) {
    fs.unlinkSync(path.join(root, approval.authorRunRef));
    fs.unlinkSync(path.join(root, approval.reviewRunRef));
  }
  fs.unlinkSync(path.join(root, passed.verification.child.stdoutRef));
  let target = readWorkspace(root)!;
  const beforeSource = fs.readFileSync(path.join(root, source.manifestRef));
  const beforeSelection = fs.readFileSync(entryRef);
  const facts = deliveredBaselines(root, target, target.scope);
  assert.equal(facts.facts[0].archiveOrdinal, 1);
  assert.equal(target.project.archivedChangeCount, 2);
  assert.ok(fs.readFileSync(path.join(root, source.manifestRef)).equals(beforeSource));
  assert.ok(fs.readFileSync(entryRef).equals(beforeSelection));
  assert.equal(queryCli(root).local.deliveryId, 'd02');
  // A selected v2 index also accepts an unmodified v1 source without migration.
  const old = JSON.parse(beforeSource.toString());
  old.formatVersion = 1;
  delete old.rounds;
  delete old.currentRoundId;
  writeJson(root, source.manifestRef, old);
  assert.deepEqual(deliveredBaselines(root, target, target.scope).facts, facts.facts);
  fs.writeFileSync(path.join(root, source.manifestRef), beforeSource);
  const closeBytes = fs.readFileSync(path.join(root, close.run.ref));
  const closeDocument = readRunSource(root, close.run.ref);
  const malformed = structuredClone(closeDocument.header);
  (
    malformed.lifecycle as { acceptance: { scope: { completed: { archiveOrdinal: number }[] } } }
  ).acceptance.scope.completed[0].archiveOrdinal = 99;
  fs.writeFileSync(path.join(root, close.run.ref), renderRun(malformed, closeDocument.body));
  assert.throws(() => deliveredBaselines(root, target, target.scope));
  fs.writeFileSync(path.join(root, close.run.ref), closeBytes);
  const manual = JSON.parse(beforeSource.toString());
  delete manual.formatVersion;
  manual.recordingMode = 'manual-bootstrap';
  manual.next = { action: 'owner-decision', status: 'stopped' };
  writeJson(root, source.manifestRef, manual);
  assert.throws(() => deliveredBaselines(root, target, target.scope));
  fs.writeFileSync(path.join(root, source.manifestRef), beforeSource);
  const unregistered = structuredClone(target.scope);
  unregistered.plannedChanges[0].baselineDependencies![0] = {
    ...declared,
    deliveryId: 'missing',
    closeRunRef: '.mendi/runs/missing/010-delivery-close/run.md',
  };
  assert.throws(() => deliveredBaselines(root, target, unregistered));
  const changed = JSON.parse(beforeSource.toString());
  changed.note = '读取后来源变化';
  writeJson(root, source.manifestRef, changed);
  assert.throws(() => facts.confirm(), { code: 'baseline-input-changed' });
  fs.writeFileSync(path.join(root, source.manifestRef), beforeSource);
  prepareLifecycleChange(root, 'baseline-recheck-probe');
  const number = scanRunNumbers(root, 'd02').number;
  assert.throws(
    () =>
      bindChange(
        { project: root, changeId: 'baseline-recheck-probe', slot: 'N' },
        {
          observeWrite: (phase) => {
            if (phase === 'lock-acquired') writeJson(root, source.manifestRef, changed);
          },
        },
      ),
    { code: 'baseline-input-changed' },
  );
  assert.equal(scanRunNumbers(root, 'd02').number, number);
  fs.writeFileSync(path.join(root, source.manifestRef), beforeSource);
  archiveNew(root, 'baseline-consumer', 'N');
  target = readWorkspace(root)!;
  const formalNumber = scanRunNumbers(root, 'd02').number;
  const stale = await runFullTest(fullInput(root), {
    observeWrite: (phase) => {
      if (phase === 'lock-acquired') writeJson(root, source.manifestRef, changed);
    },
  });
  assert.equal(stale.ok, false);
  assert.ok('error' in stale);
  assert.equal(stale.error.code, 'delivery-input-changed');
  assert.equal(scanRunNumbers(root, 'd02').number, formalNumber);
  fs.writeFileSync(path.join(root, source.manifestRef), beforeSource);
  const result = await formal(root);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.ok('run' in result && result.run?.fullTest);
  assert.deepEqual(result.run.fullTest.baselineFacts, facts.facts);
  assert.deepEqual(
    result.run.fullTest.scope.completed.map((c) => c.slot),
    ['N'],
  );
  fs.unlinkSync(path.join(root, close.run.ref));
  assert.equal(queryCli(root).local.deliveryId, 'd02');
  assert.equal(deliveryLifecycle('delivery-close', closeInput(root)).local.state, 'closed');
  assert.ok(fs.readFileSync(entryRef).toString().includes('d02'));
});
