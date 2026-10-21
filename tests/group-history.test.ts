import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { groupTarget, groupRun, attemptResult } from './group-support.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { renderRun, scanRunNumbers } from '../src/adapters/runs.ts';
import { parseDeliveryRun } from '../src/core/delivery-runs.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { projectProgress } from '../src/core/rounds.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';
import { verificationStatus } from '../src/application/candidate-verification.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { authorActor, fullInput } from './delivery-support.ts';
import { writeLegacyCommand } from './fixtures/legacy-command.ts';
import { runFullTest } from '../src/application/delivery-full-test.ts';
import { query } from '../src/application/project.ts';

test('旧真实 command passed 保持只读；新 command / 旧选择器和冒用 typed 选择器拒绝且不占号', async () => {
  const { root } = groupTarget();
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  pkg.scripts['test:full'] = 'node --test prefix.test.ts middle.test.ts tail.test.ts';
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg));
  const historical = await writeLegacyCommand(fullInput(root));
  assert.equal(historical.ok, true, JSON.stringify(historical));
  const ref = historical.run!.ref;
  const original = fs.readFileSync(path.join(root, ref));
  const number = scanRunNumbers(root, 'd01').number;
  assert.equal((await runFullTest(fullInput(root))).ok, false);
  for (const selector of [{ fullTestRunRef: ref }, { testAttemptRunRef: ref }]) {
    fs.writeFileSync(
      path.join(root, 'close.json'),
      JSON.stringify({
        ...selector,
        applicability: { conclusion: 'applicable', materials: '历史', changes: '', reason: '负例' },
      }),
    );
    assert.throws(() =>
      deliveryLifecycle('delivery-close', {
        project: root,
        role: 'author',
        actor: authorActor,
        inputFile: 'close.json',
      }),
    );
  }
  assert.equal(scanRunNumbers(root, 'd01').number, number);
  assert.ok(fs.readFileSync(path.join(root, ref)).equals(original));
  assert.equal(fullTestStatus({ project: root, runRef: ref }).ok, true);
});

test('历史 v1 attempt / verification 只读；新 typed Close 可保留旧字段，缺直接日志或协议未知拒绝', async () => {
  const { root } = groupTarget();
  const result = attemptResult(await groupRun(root));
  const document = readDeliveryRun(root, result.run.ref, 'd01');
  const original = fs.readFileSync(path.join(root, document.ref));
  const a = document.record.attempt!;
  const { formalOutcome: _, materialSnapshot: _m, environmentRecovery: _e, ...common } = a;
  const legacy = { ...document.header, attempt: { ...common, version: 1 } };
  fs.writeFileSync(path.join(root, document.ref), renderRun(legacy, document.body));
  assert.equal(parseDeliveryRun(legacy, document.ref, 'd01').attempt!.version, 1);
  assert.equal(fullTestStatus({ project: root, runRef: document.ref }).ok, true);
  fs.writeFileSync(path.join(root, document.ref), original);
  for (const patch of [
    { version: 0 },
    { version: 3 },
    { version: '2' },
    { purpose: 'continue' },
    { selection: ['prefix'] },
    { formalOutcome: 'failed' },
    { executionId: null },
    { request: { ...a.request!, prerequisites: [a.progress[0]] } },
  ])
    assert.throws(() =>
      parseDeliveryRun({ ...document.header, attempt: { ...a, ...patch } }, document.ref, 'd01'),
    );
  const number = scanRunNumbers(root, 'd01').number;
  const ref = `.mendi/runs/d01/${String(number).padStart(3, '0')}-delivery-verification/run.md`;
  const verification = {
    version: 1,
    kind: 'candidate-verification',
    roundId: a.roundId,
    scope: a.scope,
    approvals: a.approvals,
    baselineFacts: a.baselineFacts,
    plan: a.plan,
    candidate: a.candidate,
    progress: a.progress,
    sources: a.progress.map((fact) => ({
      id: fact.id,
      runRef: document.ref,
      candidate: a.candidate,
      fact,
      executionId: a.executionId,
      rawOutcome: 'passed',
      protocolState: 'valid',
      applicability: '历史型快照夹具：来自本用例真实执行',
    })),
    conclusion: 'verified',
    gaps: [],
  };
  const header = {
    ...document.header,
    actionType: 'delivery-verification',
    runNumber: number,
    actionId: `d01-${String(number).padStart(3, '0')}-delivery-verification`,
    attempt: undefined,
    verification,
    result: 'verified',
  };
  fs.mkdirSync(path.dirname(path.join(root, ref)));
  fs.writeFileSync(
    path.join(root, ref),
    renderRun(header, '显式历史类型夹具，不调用新 verification writer。'),
  );
  assert.equal(
    verificationStatus({ project: root, runRef: ref }).candidateVerification.conclusion,
    'verified',
  );
  const workspace = readWorkspace(root)!;
  fs.writeFileSync(
    path.join(root, workspace.manifestRef),
    JSON.stringify(projectProgress(workspace, { ...workspace.manifest, verificationRunRef: ref })),
  );
  const close = { project: root, inputFile: 'close.json', role: 'author', actor: authorActor };
  const applicability = {
    conclusion: 'applicable',
    materials: a.candidate.basis.materials,
    changes: '',
    reason: '完整本次执行',
  };
  fs.writeFileSync(
    path.join(root, 'close.json'),
    JSON.stringify({ verificationRunRef: ref, applicability }),
  );
  assert.throws(() => deliveryLifecycle('delivery-close', close), /唯一|历史/);
  fs.writeFileSync(
    path.join(root, 'close.json'),
    JSON.stringify({ testAttemptRunRef: document.ref, applicability }),
  );
  const stdout = path.join(root, result.groupExecution.child!.stdoutRef);
  const log = fs.readFileSync(stdout);
  fs.unlinkSync(stdout);
  assert.throws(() => deliveryLifecycle('delivery-close', close));
  fs.writeFileSync(stdout, log);
  const reportPath = path.join(root, a.request!.reportRef);
  const report = fs.readFileSync(reportPath);
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ ...JSON.parse(report.toString()), cleanup: 'unknown' }),
  );
  assert.throws(() => deliveryLifecycle('delivery-close', close));
  fs.writeFileSync(reportPath, report);
  const closed = deliveryLifecycle('delivery-close', close);
  assert.equal(closed.local.state, 'closed');
  assert.equal(closed.run.lifecycle!.testAttemptRunRef, document.ref);
  assert.equal(readWorkspace(root)!.manifest.verificationRunRef, ref);
  const closedBytes = fs.readFileSync(path.join(root, closed.run.ref));
  fs.unlinkSync(stdout);
  assert.equal(query({ project: root }).local!.state, 'closed');
  assert.ok(fs.readFileSync(path.join(root, closed.run.ref)).equals(closedBytes));
});
