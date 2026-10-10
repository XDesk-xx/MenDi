import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { renderRun, scanRunNumbers } from '../src/adapters/runs.ts';
import { MendiError } from '../src/core/errors.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';
import { query } from '../src/application/project.ts';
import { passedTarget, writeJson, queryCli, lifecycleCli } from './lifecycle-support.ts';
import { options } from './action-support.ts';

test('Close 只消费当前事实与直接日志；历史正文、说明与未知 Ref 失效不阻断', async () => {
  const { root, passed, input } = await passedTarget();
  assert.ok('run' in passed && passed.run);
  const full = readDeliveryRun(root, passed.run.ref, 'd01');
  for (const fact of full.record.fullTest!.approvals)
    for (const ref of [fact.archiveRunRef, fact.reviewRunRef, fact.authorRunRef])
      fs.unlinkSync(path.join(root, ref));
  const header = {
    ...full.header,
    oldExplanationRef: 'missing/history.md',
    extensionRef: '../../ignored',
    fullTest: { ...full.record.fullTest!, unknownRef: 'missing' },
  };
  fs.writeFileSync(path.join(root, full.ref), renderRun(header, '历史说明 [失效](missing.md)\n'));
  const result = lifecycleCli(root, 'close', ['--input', input.inputFile]);
  assert.equal(result.local.state, 'closed');
  assert.equal(result.run.lifecycle?.applicability?.conclusion, 'applicable');
  const indexBytes = fs.readFileSync(path.join(root, '.mendi/project.json'));
  const closedBytes = fs.readFileSync(path.join(root, readWorkspace(root)!.manifestRef));
  assert.equal(queryCli(root).upstream, null);
  assert.equal(lifecycleCli(root, 'close', ['--resume', result.run.ref]).alreadyCompleted, true);
  const child = fullTestStatus({ project: root, runRef: full.ref }).verification.child!;
  const logBytes = fs.readFileSync(path.join(root, child.stdoutRef));
  fs.unlinkSync(path.join(root, child.stdoutRef));
  assert.equal(queryCli(root).local.state, 'closed');
  assert.throws(() => fullTestStatus({ project: root, runRef: full.ref }));
  assert.ok(fs.readFileSync(path.join(root, '.mendi/project.json')).equals(indexBytes));
  assert.ok(fs.readFileSync(path.join(root, readWorkspace(root)!.manifestRef)).equals(closedBytes));
  fs.unlinkSync(path.join(root, result.run.ref));
  assert.throws(() => query({ project: root }, options));
  fs.writeFileSync(path.join(root, child.stdoutRef), logBytes);
  assert.equal(fullTestStatus({ project: root, runRef: full.ref }).verification.outcome, 'passed');
});
test('必要适用性输入、当前指针、快照、命令与日志错误都在占号前拒绝', async () => {
  const { root, passed, input } = await passedTarget();
  assert.ok('run' in passed && passed.run);
  const workspace = readWorkspace(root)!;
  const manifestFile = path.join(root, workspace.manifestRef);
  const originalManifest = fs.readFileSync(manifestFile);
  const originalInput = fs.readFileSync(path.join(root, 'close.json'));
  const full = readDeliveryRun(root, passed.run.ref, 'd01');
  const runFile = path.join(root, full.ref);
  const originalRun = fs.readFileSync(runFile);
  const number = scanRunNumbers(root, 'd01').number;
  const reject = () => {
    assert.throws(() => deliveryLifecycle('delivery-close', input), MendiError);
    assert.equal(scanRunNumbers(root, 'd01').number, number);
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  };
  const declaration = JSON.parse(originalInput.toString());
  for (const value of [
    {},
    { ...declaration, applicability: {} },
    { ...declaration, applicability: { ...declaration.applicability, materials: '' } },
    { ...declaration, applicability: { ...declaration.applicability, reason: '' } },
    { ...declaration, applicability: { ...declaration.applicability, changes: undefined } },
    { ...declaration, fullTestRunRef: '../../outside' },
    { ...declaration, fullTestRunRef: workspace.bindings[1].latestRunRef },
  ]) {
    writeJson(root, 'close.json', value);
    reject();
  }
  fs.writeFileSync(path.join(root, 'close.json'), originalInput);
  for (const header of [
    { ...full.header, fullTest: { ...full.record.fullTest!, approvals: [] } },
    {
      ...full.header,
      fullTest: {
        ...full.record.fullTest!,
        approvals: full.record.fullTest!.approvals.map((fact) => ({
          ...fact,
          reviewerActor: fact.authorActor,
        })),
      },
    },
    {
      ...full.header,
      status: 'draft',
      outcome: undefined,
      result: undefined,
      fullTest: { ...full.record.fullTest!, phase: 'running', outcome: 'unknown' },
    },
    ...['failed', 'not-run', 'interrupted', 'unknown'].map((outcome) => ({
      ...full.header,
      result: outcome,
      fullTest: { ...full.record.fullTest!, outcome },
    })),
  ]) {
    fs.writeFileSync(runFile, renderRun(header, full.body));
    reject();
  }
  fs.writeFileSync(runFile, originalRun);
  writeJson(root, workspace.manifestRef, { ...workspace.manifest, deliveryRunRef: undefined });
  reject();
  fs.writeFileSync(manifestFile, originalManifest);
  const pkgFile = path.join(root, 'package.json');
  const pkg = fs.readFileSync(pkgFile);
  const data = JSON.parse(pkg.toString());
  data.scripts['test:full'] = 'node checks/unit.test.ts';
  writeJson(root, 'package.json', data);
  reject();
  fs.writeFileSync(pkgFile, pkg);
  const child = fullTestStatus({ project: root, runRef: full.ref }).verification.child!;
  const log = path.join(root, child.stderrRef);
  const bytes = fs.readFileSync(log);
  fs.unlinkSync(log);
  assert.throws(() => deliveryLifecycle('delivery-close', input));
  assert.equal(scanRunNumbers(root, 'd01').number, number);
  fs.writeFileSync(log, bytes);
  assert.throws(
    () => deliveryLifecycle('delivery-close', { ...input, role: 'reviewer' }),
    MendiError,
  );
  assert.equal(deliveryLifecycle('delivery-close', input).ok, true);
});
test('Close 必要输入 junction 越界拒绝，锁内直接执行变化保留 pending 与锁', async () => {
  const { root, passed, input } = await passedTarget();
  const outside = path.join(path.dirname(root), 'outside');
  fs.mkdirSync(outside);
  fs.copyFileSync(path.join(root, 'close.json'), path.join(outside, 'close.json'));
  fs.symlinkSync(outside, path.join(root, 'linked'), 'junction');
  assert.throws(
    () => deliveryLifecycle('delivery-close', { ...input, inputFile: 'linked/close.json' }),
    MendiError,
  );
  assert.ok('verification' in passed && passed.verification.child);
  const ref = passed.verification.child.stdoutRef;
  assert.throws(
    () =>
      deliveryLifecycle('delivery-close', input, {
        observeWrite(phase) {
          if (phase === 'pending-written') fs.appendFileSync(path.join(root, ref), 'changed');
        },
      }),
    MendiError,
  );
  assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
  const index = JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8'));
  assert.ok(index.pendingDeliveryRunRef);
});
