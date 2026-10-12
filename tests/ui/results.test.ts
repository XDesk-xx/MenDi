import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { uiTarget, product, launchPreview, ready, stopPreview, browser } from './support.ts';
import { pnpmEntry } from '../../scripts/test-ui.ts';

test('无 dev server 的有限测试、真实缺陷失败与修复后新测试 / 浏览器结果', async () => {
  const { target, output } = uiTarget('finite-results');
  product(target, output, [
    'delivery',
    'open',
    '--id',
    'ui-results',
    '--title',
    '有限 UI 测试',
    '--scope',
    'delivery-scope.json',
    '--role',
    'author',
    '--actor',
    'ui-test-author',
  ]);
  const entries = product(target, output, ['test', 'list']);
  assert.ok(JSON.stringify(entries).includes('verify:stories'));
  const execute = (exit = 0) =>
    product(
      target,
      output,
      ['test', 'run', '--kind', 'focused', '--actor', 'ui-test-author', '--pnpm-bin', pnpmEntry],
      exit,
    );
  await assert.rejects(() => fetch('http://127.0.0.1:6113/index.json'));
  const baseline = execute();
  assert.equal(baseline.outcome, 'passed');
  const source = path.join(target, 'src/Counter.ts');
  const original = fs.readFileSync(source, 'utf8');
  const recorded = path.join(
    target,
    '.mendi/delivery-groups/ui-results/tests',
    baseline.executionId,
    'result.json',
  );
  const baselineBytes = fs.readFileSync(recorded);
  fs.writeFileSync(source, original.replace('count += 1;', 'count += 2;'));
  const failed = execute(1);
  assert.equal(failed.outcome, 'failed');
  fs.writeFileSync(source, original.replace("'次数：'", "'确认次数：'"));
  const fresh = execute();
  assert.equal(fresh.outcome, 'passed');
  assert.notEqual(fresh.executionId, baseline.executionId);
  const prior = product(target, output, ['test', 'status', '--execution', baseline.executionId]);
  assert.equal(prior.record.executionId, baseline.executionId);
  assert.deepEqual(fs.readFileSync(recorded), baselineBytes);
  const service = launchPreview(target, output);
  try {
    await ready(service);
    browser(target, output, '确认次数：');
  } finally {
    if (service.child.exitCode === null && service.child.signalCode === null)
      await stopPreview(service, output);
  }
  fs.writeFileSync(
    path.join(output, 'results.json'),
    JSON.stringify(
      {
        baseline: baseline.executionId,
        failed: failed.executionId,
        fresh: fresh.executionId,
        baselineRecordUnchanged: true,
        mcp: 'not-enabled-not-certified',
      },
      null,
      2,
    ),
  );
});
