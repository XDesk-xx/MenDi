import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { groupTarget, groupRun, attemptResult } from './group-support.ts';
import { inspectAttempt } from '../src/adapters/group-store.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { parseDeliveryRun } from '../src/core/delivery-runs.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { errorInfo } from '../src/core/errors.ts';

test('v2 直接读回中报告变化不能覆盖首次快照或发布 passed', async (t) => {
  const { root, declaration } = groupTarget();
  const attempt = attemptResult(await groupRun(root));
  fs.writeFileSync(
    path.join(root, 'verify.json'),
    JSON.stringify({
      fromRunRef: attempt.run.ref,
      planRef: 'group-plan.json',
      candidate: declaration.candidate,
      sources: ['prefix', 'middle', 'tail'].map((id) => ({
        id,
        runRef: attempt.run.ref,
        applicability: '同候选直接通过',
      })),
    }),
  );
  const report = path.join(root, attempt.run.attempt!.request!.reportRef);
  const original = fs.readFileSync(report);
  const number = scanRunNumbers(root, 'd01').number;
  const read = fs.readFileSync;
  let reads = 0;
  let injected = false;
  let outcome: unknown;
  let error: unknown;
  // 当前进展读 / 复核一对，首个显式来源读 / 复核一对。首来源复核返回后模拟另一写者修改报告。
  t.mock.method(fs, 'readFileSync', ((...args: Parameters<typeof fs.readFileSync>) => {
    const value = read(...args);
    if (path.normalize(String(args[0])) === report && ++reads === 1) {
      const changed = JSON.parse(value.toString());
      changed.groups[0].counts.total++;
      changed.groups[0].counts.passed++;
      fs.writeFileSync(report, JSON.stringify(changed));
      injected = true;
    }
    return value;
  }) as typeof fs.readFileSync);
  try {
    outcome = inspectAttempt(
      root,
      readWorkspace(root)!,
      readDeliveryRun(root, attempt.run.ref, 'd01'),
    );
  } catch (e) {
    error = e;
  } finally {
    t.mock.restoreAll();
    fs.writeFileSync(report, original);
  }
  if (process.env.MENDI_TEST_EVIDENCE_DIR)
    fs.writeFileSync(
      path.join(process.env.MENDI_TEST_EVIDENCE_DIR, `same-source-${process.pid}.json`),
      JSON.stringify(
        { root, reads, injected, outcome, error: error ? errorInfo(error) : null },
        null,
        2,
      ),
    );
  assert.equal(injected, true);
  assert.ok(error, '不得把首份输入覆盖后发布 verified');
  assert.match(String(error), /变化|changed|快照/);
  assert.equal(scanRunNumbers(root, 'd01').number, number);
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
});

test('真实 typed Author 记录拒绝自签 verdict 与不支持的 Owner / archive 字段', async () => {
  const { root } = groupTarget();
  const attempt = attemptResult(await groupRun(root));
  for (const extra of [
    { verdict: 'approved' },
    { ownerDecision: { resolution: 'accept' } },
    { archive: { phase: 'confirmed' } },
  ])
    assert.throws(
      () => parseDeliveryRun({ ...attempt.run, ...extra }, attempt.run.ref, 'd01'),
      /Author|verdict|不支持|不能|字段/,
    );
});
