import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyUITarget, uiCommand, uiEnv } from '../../scripts/test-ui.ts';
import { uiTarget } from './support.ts';

test('目标自身严格 typecheck；真实类型错误和缺浏览器不被运行成功替代', () => {
  const { target, output } = uiTarget('environment');
  verifyUITarget(target, output);
  const source = path.join(target, 'src/Counter.ts');
  fs.appendFileSync(source, '\nconst invalid: string = 42;\n');
  assert.throws(() => verifyUITarget(target, output), /UI 准备检查失败[\s\S]*not assignable/);
  const absentBrowser = uiCommand(target, [path.join(target, 'browser-ready.ts')], output, {
    ...uiEnv,
    PLAYWRIGHT_BROWSERS_PATH: path.join(target, 'unprepared-browsers'),
  });
  assert.notEqual(absentBrowser.status, 0);
  assert.match(absentBrowser.stderr, /Executable doesn't exist/);
  assert.equal(fs.existsSync(path.join(target, 'unprepared-browsers')), false);
});
