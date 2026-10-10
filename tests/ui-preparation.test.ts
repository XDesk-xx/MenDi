import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { sandbox, repository } from './helpers.ts';
import { verifyUITarget, uiFixture, uiCommand } from '../scripts/test-ui.ts';

test('缺 UI 依赖明确未执行，不创建 node_modules 或结果', () => {
  const root = sandbox();
  fs.cpSync(uiFixture, root, {
    recursive: true,
    filter: (source) => !path.relative(uiFixture, source).split(path.sep).includes('node_modules'),
  });
  assert.throws(() => verifyUITarget(root), /UI 必要输入未准备.*不自动安装/);
  assert.equal(fs.existsSync(path.join(root, 'node_modules')), false);
  assert.equal(fs.existsSync(path.join(root, '.mendi')), false);
});

test('根检查隔离 UI 依赖，受控 UI TypeScript 仍参与格式 / lint', () => {
  const root = sandbox();
  for (const file of [
    'package.json',
    'biome.json',
    'tsconfig.json',
    'tsconfig.scripts.json',
    'tsconfig.tests.json',
  ])
    fs.copyFileSync(path.join(repository, file), path.join(root, file));
  for (const directory of ['src', 'scripts', 'tests'])
    fs.cpSync(path.join(repository, directory), path.join(root, directory), {
      recursive: true,
      filter: (source) => !source.split(path.sep).includes('node_modules'),
    });
  fs.symlinkSync(
    path.join(repository, 'node_modules'),
    path.join(root, 'node_modules'),
    'junction',
  );
  assert.equal(
    fs.existsSync(path.join(root, 'tests/fixtures/storybook-project/node_modules')),
    false,
  );
  for (const config of ['tsconfig.json', 'tsconfig.scripts.json', 'tsconfig.tests.json']) {
    const result = uiCommand(root, [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '-p',
      config,
    ]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  const biome = path.join(root, 'node_modules/@biomejs/biome/bin/biome');
  for (const operation of ['format', 'lint']) {
    const result = uiCommand(root, [biome, operation, 'src', 'scripts', 'tests']);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  const maintained = path.join(root, 'tests/fixtures/storybook-project/src/Counter.ts');
  fs.appendFileSync(maintained, '\ndebugger;\n');
  const failure = uiCommand(root, [biome, 'lint', 'tests']);
  assert.notEqual(failure.status, 0);
  assert.match(failure.stdout + failure.stderr, /noDebugger/);
});
