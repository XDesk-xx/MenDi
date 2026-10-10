import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { tool, checked, uiTarget } from './support.ts';

test('目标官方 CLI 本地发现 / Skill 真实执行；缺配置与工具明确失败', () => {
  const { target, output } = uiTarget('official-cli');
  const configuration = path.join(target, '.storybook');
  const configArgs = ['--config-dir', configuration];
  const help = tool(target, output, ['tools', '--help', ...configArgs]);
  assert.match(help.stdout, /stories preview.*requires running Storybook/);
  assert.match(help.stdout, /stories find-by-component/);
  const found = tool(target, output, [
    'tools',
    'stories',
    'find-by-component',
    '--no-attach',
    ...configArgs,
    '--input',
    JSON.stringify({ componentPaths: [path.join(target, 'src/Counter.stories.ts')] }),
    '--json',
  ]);
  const stories = JSON.parse(found.stdout).results[0].matches;
  assert.deepEqual(stories.map((story: { storyId: string }) => story.storyId).sort(), [
    'proof-counter--basic',
    'proof-counter--disabled',
  ]);
  assert.match(tool(target, output, ['skills', '--help', ...configArgs]).stdout, /stories/);
  assert.ok(tool(target, output, ['skills', 'stories', ...configArgs]).stdout.length > 100);
  const invalid = tool(
    target,
    output,
    ['tools', '--help', '--config-dir', path.join(target, 'missing-config')],
    1,
  );
  assert.match(invalid.stdout + invalid.stderr, /configuration|configDir|main/i);
  checked(target, output, [path.join(target, 'absent-storybook.js'), 'tools', '--help'], 1);
  assert.equal(fs.existsSync(path.join(target, 'absent-storybook.js')), false);
  assert.match(fs.readFileSync(path.join(target, '.storybook/main.ts'), 'utf8'), /addons: \[\]/);
  assert.equal(fs.existsSync(path.join(target, 'node_modules/@storybook/addon-mcp')), false);
  // 此真实 CLI 路径未启用 MCP，不将帮助或 Vitest plugin 当作 MCP 认证。
});
