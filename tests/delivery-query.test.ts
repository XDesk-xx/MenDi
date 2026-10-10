import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formal,
  verificationTarget,
  manifest,
  writeManifest,
  authorActor,
  reviewActor,
  finishRepair,
} from './delivery-support.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import { query, bindChange } from '../src/application/project.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';
import { diagnoseWorkspace } from '../src/application/diagnosis.ts';
import { loadMethods } from '../src/adapters/methods.ts';
import { writePackage } from './test-support.ts';
import { cli, isolatedEnv, prepareChange } from './helpers.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { renderRun } from '../src/adapters/runs.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';

test('当前 Delivery 查询不读取旧 Archive / Review / Author、原声明或未知 Ref，重复沿用快照', async () => {
  const root = verificationTarget();
  const result = await formal(root);
  assert.equal(result.ok, true, JSON.stringify(result));
  const ref = result.run!.ref;
  for (const approval of result.run!.fullTest!.approvals)
    for (const old of [approval.archiveRunRef, approval.reviewRunRef, approval.authorRunRef])
      fs.unlinkSync(path.join(root, old));
  fs.unlinkSync(path.join(root, 'full-test.json'));
  const run = readDeliveryRun(root, ref, 'd01');
  fs.writeFileSync(
    path.join(root, ref),
    renderRun(
      {
        ...run.header,
        unknownRef: '../dead',
        explainRef: 'missing.md',
        fullTest: {
          ...run.record.fullTest!,
          scope: { ...run.record.fullTest!.scope, unknownRef: '../dead-scope' },
          basis: { ...run.record.fullTest!.basis, notesRef: '../dead-basis' },
        },
      },
      run.body + '\n[旧说明](missing.md)\n',
    ),
  );
  const data = manifest(root);
  data.notesRef = '../missing';
  writeManifest(root, data);
  const env = isolatedEnv(path.dirname(root));
  for (const command of ['status', 'next']) {
    const readback = cli([command, '--project', root, '--json'], path.dirname(root), env);
    assert.equal(readback.status, 0, readback.stdout);
    const parsed = JSON.parse(readback.stdout);
    assert.equal(parsed.run.ref, ref);
    assert.equal(parsed.upstream, null);
    assert.equal(parsed.verification.materialApplicability, 'requires-semantic-check');
    assert.equal(parsed.verification.scopeMatch, 'match');
    assert.equal(Object.hasOwn(parsed.verification, 'applicable'), false);
  }
  fs.writeFileSync(
    path.join(root, 'full-test.json'),
    JSON.stringify({
      collection: run.record.fullTest!.collection,
      basis: run.record.fullTest!.basis,
    }),
  );
  const fresh = await formal(root);
  assert.equal(fresh.ok, true, JSON.stringify(fresh));
  assert.notEqual(fresh.run!.ref, ref);
});
test('结果与材料 / 当前配置匹配分开，缺当前 package 仍可解释历史事实', async () => {
  const root = verificationTarget();
  const result = await formal(root);
  assert.equal(result.ok, true);
  const ref = result.run!.ref;
  writePackage(root, (p) => {
    p.description = '说明整理';
  });
  assert.equal(fullTestStatus({ project: root, runRef: ref }).verification.commandMatch, 'match');
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts fail';
  });
  const changed = fullTestStatus({ project: root, runRef: ref });
  assert.equal(changed.verification.commandMatch, 'changed');
  assert.equal(changed.verification.outcome, 'passed');
  assert.equal((await formal(root)).ok, false);
  fs.unlinkSync(path.join(root, 'package.json'));
  const unavailable = fullTestStatus({ project: root, runRef: ref });
  assert.equal(unavailable.ok, true);
  assert.equal(unavailable.verification.commandMatch, 'unavailable');
});
test('当前必要日志 / 子结果 / 父 Run 缺失、错身份与路径越界明确拒绝', async () => {
  const root = verificationTarget();
  const result = await formal(root);
  assert.equal(result.ok, true);
  assert.ok('verification' in result);
  const ref = result.run!.ref;
  const full = result.run!.fullTest!;
  const child = result.verification.child!;
  for (const required of [
    child.stdoutRef,
    `.mendi/delivery-groups/d01/tests/${full.executionId}/result.json`,
    ref,
  ]) {
    const file = path.join(root, required);
    const bytes = fs.readFileSync(file);
    fs.unlinkSync(file);
    assert.throws(() => fullTestStatus({ project: root, runRef: ref }));
    fs.writeFileSync(file, bytes);
  }
  const data = manifest(root);
  writeManifest(root, { ...data, deliveryRunRef: '../bad' });
  assert.throws(() => query({ project: root }));
  writeManifest(root, data);
  const run = readDeliveryRun(root, ref, 'd01');
  fs.writeFileSync(
    path.join(root, ref),
    renderRun({ ...run.header, deliveryId: 'wrong' }, run.body),
  );
  assert.throws(() => query({ project: root }));
});
test('diagnose 前后观察变化如实报告，方法缺失仅阻止实际开始；坏当前不回退', async () => {
  const root = verificationTarget();
  const result = await formal(root);
  assert.equal(result.ok, true);
  const file = path.join(root, result.run!.ref);
  const original = fs.readFileSync(file);
  const diagnosis = diagnoseWorkspace(
    { project: root },
    { observeRead: () => fs.appendFileSync(file, '\nchanged') },
  );
  assert.equal(diagnosis.ok, false);
  assert.equal(diagnosis.observation, 'changed-during-read');
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  fs.writeFileSync(file, original);
  assert.throws(() => loadMethods('delivery-repair', [], root));
  assert.equal(query({ project: root }).ok, true);
  fs.writeFileSync(file, 'bad');
  const bad = diagnoseWorkspace({ project: root });
  assert.equal(bad.ok, false);
  assert.equal(bad.current, null);
  assert.ok(bad.errors.length);
});
test('明确合法后续关联退出当前选择，保留正式历史；活动项与指针并存拒绝', async () => {
  const root = verificationTarget();
  const result = await formal(root);
  assert.equal(result.ok, true);
  const bytes = fs.readFileSync(path.join(root, result.run!.ref));
  const data = manifest(root);
  data.plannedChanges.push({ slot: 'C', title: '明确新增范围', dependsOn: ['B'] });
  writeManifest(root, data);
  prepareChange(root, isolatedEnv(path.dirname(root)), 'third-entry');
  const bound = bindChange({ project: root, changeId: 'third-entry', slot: 'C' });
  assert.equal(bound.local.activeChangeId, 'third-entry');
  assert.equal(manifest(root).deliveryRunRef, undefined);
  assert.equal(manifest(root).fullTestRunRef, result.run!.ref);
  const historical = fullTestStatus({ project: root, runRef: result.run!.ref });
  assert.equal(historical.verification.scopeMatch, 'unavailable');
  assert.equal(historical.verification.outcome, 'passed');
  assert.deepEqual(fs.readFileSync(path.join(root, result.run!.ref)), bytes);
  const conflict = manifest(root);
  conflict.deliveryRunRef = result.run!.ref;
  writeManifest(root, conflict);
  assert.throws(() => readWorkspace(root));
});

test('可关联目标不能绕过 failed、未完成修复、未批准 / rejected 或 unknown 交接', async () => {
  for (const phase of [
    'failed',
    'draft',
    'continuing',
    'review',
    'changes-requested',
    'rejected',
    'unknown',
  ]) {
    const root = verificationTarget();
    writePackage(root, (p) => {
      (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts fail';
    });
    const result = await formal(
      root,
      phase === 'unknown'
        ? {
            observe: (current) => {
              if (current === 'before-terminal-commit') throw new Error('controlled');
            },
          }
        : {},
    );
    assert.equal(result.ok, false);
    if (!['failed', 'unknown'].includes(phase)) {
      const a = startDeliveryRepair({
        project: root,
        from: result.run!.ref,
        reason: '原范围内',
        role: 'author',
        actor: authorActor,
      });
      if (phase === 'continuing') finishRepair(root, a.run.ref, 'author', 'continuing');
      else if (phase !== 'draft') {
        finishRepair(root, a.run.ref);
        const r = startDeliveryReview({
          project: root,
          authorRunRef: a.run.ref,
          role: 'reviewer',
          actor: reviewActor,
        });
        if (phase !== 'review') finishRepair(root, r.run.ref, 'reviewer', 'complete', phase);
      }
    }
    prepareChange(root, isolatedEnv(path.dirname(root)), 'third-entry');
    const data = manifest(root);
    data.plannedChanges.push({ slot: 'C', title: '合法新目标', dependsOn: ['B'] });
    writeManifest(root, data);
    const bytes = fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'));
    assert.throws(
      () => bindChange({ project: root, changeId: 'third-entry', slot: 'C' }),
      /交接|锁/,
    );
    assert.deepEqual(
      fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json')),
      bytes,
    );
  }
});
