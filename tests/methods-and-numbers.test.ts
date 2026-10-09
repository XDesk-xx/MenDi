import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { loadMethods } from '../src/adapters/methods.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { actionTypes } from '../src/core/actions.ts';
import { sandbox, repository } from './helpers.ts';

test('读取真实产品阶段内容与按需指导；错阶段 / 缺方法拒绝', () => {
  for (const type of actionTypes) {
    const methods = loadMethods(type, []);
    assert.ok(methods.stage.content.includes('停止') || methods.stage.content.includes('停在'));
    assert.equal(methods.guidance.length, 0);
  }
  assert.equal(loadMethods('review-explore', ['openspec']).guidance.length, 1);
  const root = sandbox();
  fs.cpSync(path.join(repository, 'skills'), path.join(root, 'skills'), { recursive: true });
  fs.unlinkSync(path.join(root, 'skills/tools/openspec/SKILL.md'));
  assert.equal(loadMethods('explore', [], root).guidance.length, 0);
  assert.throws(() => loadMethods('explore', ['openspec'], root), { code: 'skill-unavailable' });
  fs.copyFileSync(
    path.join(root, 'skills/actions/apply/SKILL.md'),
    path.join(root, 'skills/actions/explore/SKILL.md'),
  );
  assert.throws(() => loadMethods('explore', [], root), { code: 'skill-unavailable' });
  assert.throws(() => loadMethods('apply', ['unknown']), { code: 'skill-unavailable' });
});
test('占号仅扫描约定层级，跨 Change 连续，空目录占号，批次与 artifacts 不占号', () => {
  const root = sandbox();
  const base = '.mendi/runs/d01';
  for (const ref of [
    '001-delivery-open',
    '003-changes/previous/015-archive',
    '003-changes/proof-entry/019-explore',
    '003-changes/proof-entry/019-explore/artifacts/999-explore',
  ])
    fs.mkdirSync(path.join(root, base, ref), { recursive: true });
  assert.equal(scanRunNumbers(root, 'd01').number, 20);
  assert.equal(scanRunNumbers(root, 'd01').incompleteReservations.length, 3);
  fs.mkdirSync(path.join(root, base, '1000-delivery-close'));
  assert.equal(scanRunNumbers(root, 'd01').number, 1001);
  fs.mkdirSync(path.join(root, base, '003-changes/proof-entry/015-apply'));
  assert.throws(() => scanRunNumbers(root, 'd01'), { code: 'run-number-conflict' });
});
test('占号不能沿 junction 到项目外', () => {
  const root = sandbox();
  const outside = sandbox();
  fs.mkdirSync(path.join(root, '.mendi/runs/d01'), { recursive: true });
  fs.symlinkSync(outside, path.join(root, '.mendi/runs/d01/001-explore'), 'junction');
  assert.throws(() => scanRunNumbers(root, 'd01'), { code: 'unsafe-reference' });
});
