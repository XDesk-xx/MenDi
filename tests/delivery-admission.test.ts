import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { stringify } from 'yaml';
import { declaration } from '../src/core/delivery-verification.ts';
import { parseDeliveryRun } from '../src/core/delivery-runs.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { firstApprovals } from '../src/adapters/delivery-verification.ts';
import { readRun } from '../src/adapters/runs.ts';
import { loadMethods } from '../src/adapters/methods.ts';
import {
  verificationTarget,
  formal,
  fullInput,
  manifest,
  writeManifest,
} from './delivery-support.ts';
import { runFullTest } from '../src/application/delivery-full-test.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { sequentialTarget, associateSecond } from './sequential-support.ts';

test('声明拒绝空集合、重复、缺材料 / 差异及短 commit，忽略未知 Ref', () => {
  for (const data of [
    {},
    { collection: [], basis: {} },
    { collection: ['x', 'x'], basis: { materials: 'x', changes: '' } },
    { collection: ['x'], basis: { materials: '', changes: '' } },
    { collection: ['x'], basis: { materials: 'x' } },
    { collection: ['x'], basis: { materials: 'x', changes: '', commit: 'abc' } },
  ])
    assert.throws(() => declaration(data));
  assert.deepEqual(
    declaration({
      collection: ['x'],
      basis: { materials: 'x', changes: '' },
      unknownRef: '../missing',
    }).collection,
    ['x'],
  );
});
test('首次 admission 只读本轮直接 Archive / Review / Apply，错误身份和缺输入拒绝', () => {
  const root = verificationTarget();
  const workspace = readWorkspace(root)!;
  const first = firstApprovals(root, workspace);
  assert.equal(first.approvals.length, 2);
  const review = readRun(root, first.approvals[0].reviewRunRef, 'd01', 'proof-entry');
  const file = path.join(root, review.ref);
  const original = fs.readFileSync(file);
  for (const header of [
    { ...review.header, verdict: 'rejected' },
    { ...review.header, actorId: first.approvals[0].authorActor },
    { ...review.header, changeId: 'wrong' },
  ]) {
    fs.writeFileSync(file, `---\n${stringify(header)}---\n${review.body}`);
    assert.throws(() => firstApprovals(root, workspace));
  }
  fs.writeFileSync(file, `---\n${stringify(review.header)}---\n`);
  assert.throws(() => firstApprovals(root, workspace));
  fs.writeFileSync(file, original);
  fs.unlinkSync(path.join(root, first.approvals[0].authorRunRef));
  assert.throws(() => firstApprovals(root, workspace));
});
test('越界、漏槽位、活动 Change、错误角色 / 方法均在占号前拒绝', async () => {
  const root = verificationTarget();
  const before = scanRunNumbers(root, 'd01').number;
  for (const input of [
    { ...fullInput(root), inputFile: '../outside.json' },
    { ...fullInput(root), inputFile: 'absent.json' },
    { ...fullInput(root), role: 'reviewer' },
  ]) {
    const result = await runFullTest(input);
    assert.equal(result.ok, false);
    assert.equal(scanRunNumbers(root, 'd01').number, before);
  }
  const data = manifest(root);
  data.plannedChanges.push({ slot: 'C', title: 'missing', dependsOn: [] });
  writeManifest(root, data);
  assert.equal((await formal(root)).ok, false);
  assert.equal(scanRunNumbers(root, 'd01').number, before);
  assert.throws(() => loadMethods('delivery-full-test', [], root));
  const skillHome = path.join(root, 'skills/actions/delivery-full-test');
  fs.mkdirSync(skillHome, { recursive: true });
  fs.writeFileSync(
    path.join(skillHome, 'SKILL.md'),
    '---\nname: mendi-delivery-full-test\nphase: apply\nrole: author\n---\n错误身份方法\n',
  );
  assert.throws(() => loadMethods('delivery-full-test', [], root));
});

test('尚有实际活动 / 未归档 Change 时不分配正式 Run', async () => {
  const { root } = sequentialTarget();
  associateSecond(root);
  const before = scanRunNumbers(root, 'd01').number;
  const result = await runFullTest(fullInput(root));
  assert.equal(result.ok, false);
  assert.ok('error' in result);
  assert.equal(result.error.code, 'delivery-scope-incomplete');
  assert.equal(scanRunNumbers(root, 'd01').number, before);
});
test('头部 scope / role / 方法 / actionId / 指针矛盾拒绝，旧 Change 仍读取', async () => {
  const root = verificationTarget();
  const result = await formal(root);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.ok(result.run);
  const record = result.run;
  for (const changed of [
    { ...record, scope: 'change' },
    { ...record, changeId: 'proof-entry' },
    { ...record, stageSkill: 'apply' },
    { ...record, actionId: 'd01-999-delivery-full-test' },
    { ...record, role: 'reviewer' },
  ])
    assert.throws(() => parseDeliveryRun(changed, record.ref, 'd01'));
  const data = manifest(root);
  data.fullTestRunRef = data.changeBindings[0].latestRunRef;
  writeManifest(root, data);
  assert.throws(() => readWorkspace(root));
});
