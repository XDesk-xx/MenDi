import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { loadChangeMethods, readTargetMethod, targetMethodName } from '../src/adapters/methods.ts';
import { actionTypes } from '../src/core/actions.ts';
import { sandbox } from './helpers.ts';
import { prepareTargetMethods } from './target-method-support.ts';

test('目标方法来源、version 与 generatedBy 区分、全部映射及 Storybook 并用', () => {
  const root = sandbox();
  prepareTargetMethods(root);
  const expected: Record<string, string | undefined> = {
    explore: 'openspec-explore',
    'revise-explore': 'openspec-explore',
    propose: 'openspec-propose',
    'revise-propose': 'openspec-update-change',
    apply: 'openspec-apply-change',
    'revise-apply': 'openspec-apply-change',
    archive: 'openspec-archive-change',
  };
  for (const type of actionTypes) {
    assert.equal(targetMethodName(type), expected[type]);
    const methods = loadChangeMethods(type, ['storybook'], root);
    assert.equal(methods.upstream.length, expected[type] ? 1 : 0);
    assert.equal(methods.guidance.length, 1);
    if (methods.upstream[0]) {
      const method = methods.upstream[0];
      assert.equal(method.projectRoot, fs.realpathSync(root));
      assert.equal(method.generatedBy, '1.14.1');
      assert.equal(method.content, fs.readFileSync(method.file, 'utf8'));
      assert.ok(method.file.startsWith(fs.realpathSync(root) + path.sep));
    }
  }
});

test('缺失、非普通文件、错误身份 / 基线 / 头部、空正文均明确拒绝，不用开发仓库兜底', () => {
  const root = sandbox();
  prepareTargetMethods(root);
  const file = path.join(root, '.agents/skills/openspec-explore/SKILL.md');
  const valid = fs.readFileSync(file, 'utf8');
  for (const value of [
    valid.replace('name: openspec-explore', 'name: wrong'),
    valid.replace('generatedBy: "1.14.1"', 'generatedBy: "1.0"'),
    valid.replace('  generatedBy: "1.14.1"\n', ''),
    '---\nname: openspec-explore\nmetadata: null\n---\nbody',
    '---\nname: openspec-explore\n---\n \n',
    'body without frontmatter',
  ]) {
    fs.writeFileSync(file, value);
    assert.throws(() => readTargetMethod(root, 'openspec-explore'), { code: 'skill-unavailable' });
  }
  fs.unlinkSync(file);
  assert.throws(() => readTargetMethod(root, 'openspec-explore'), { code: 'skill-unavailable' });
  fs.mkdirSync(file);
  assert.throws(() => readTargetMethod(root, 'openspec-explore'), { code: 'skill-unavailable' });
  assert.equal(loadChangeMethods('review-explore', [], root).upstream.length, 0);
});

test('父目录 junction 和同名前缀越界拒绝，未知路径名不能逃逸', () => {
  const root = sandbox();
  const outside = fs.mkdtempSync(root + '-outside-');
  prepareTargetMethods(outside);
  fs.symlinkSync(path.join(outside, '.agents'), path.join(root, '.agents'), 'junction');
  assert.throws(() => readTargetMethod(root, 'openspec-explore'), { code: 'unsafe-reference' });
  assert.throws(() => readTargetMethod(root, '../../../outside'), { code: 'unsafe-reference' });
});
