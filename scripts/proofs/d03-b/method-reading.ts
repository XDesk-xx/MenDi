import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'yaml';

// Explore 实验，只验证目标方法读取候选，不接入产品 Action。
export function readTargetMethod(target: string, name: string) {
  const root = fs.realpathSync(target);
  const file = path.join(root, '.agents/skills', name, 'SKILL.md');
  assert.ok(fs.realpathSync(file).startsWith(root + path.sep), '方法越出当前目标');
  const content = fs.readFileSync(file, 'utf8');
  const matched = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(content);
  assert.ok(matched && matched[2].trim(), '方法缺头部 / 正文');
  const header = parse(matched[1]) as {
    name?: string;
    metadata?: { generatedBy?: string; version?: string };
  };
  assert.equal(header.name, name, '方法身份不符');
  assert.equal(header.metadata?.generatedBy, '1.14.1', '生成基线不符');
  return { target: root, file, content, metadata: header.metadata };
}
