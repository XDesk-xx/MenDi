import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { groupTarget, groupRun, attemptResult, recordApplyScene } from './group-support.ts';
import { repository } from './helpers.ts';
import { groupEventReader } from '../src/adapters/group-events.ts';

test('执行前排除单列并观察，必需通过非空；增量事件只消费新行', async () => {
  const { root, plan } = groupTarget();
  plan.groups[1].exclusions = [{ id: 'optional-old', reason: '执行前声明不属必需业务范围' }];
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('required',()=>{});test('optional-old',{skip:true},()=>{});",
  );
  fs.writeFileSync(path.join(root, 'group-plan.json'), JSON.stringify(plan));
  let observed = 0;
  const result = attemptResult(await groupRun(root, { onGroupProgress: () => observed++ }));
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.ok(observed > 0);
  assert.ok(result.groupExecution.timing.length > 1);
  assert.ok(result.groupExecution.targetTiming.length > 0);
  const reader = groupEventReader(root, result.run.attempt!.request!.eventsRef);
  assert.ok(reader().length > 0);
  assert.equal(reader().length, 0);
  const partial = 'progress-test.jsonl';
  fs.writeFileSync(path.join(root, partial), '{"stage":');
  const read = groupEventReader(root, partial);
  assert.equal(read().length, 0);
  fs.appendFileSync(path.join(root, partial), '1}\n');
  assert.deepEqual(read(), [{ stage: 1 }]);
  assert.equal(read().length, 0);
});
test('非测试真实构建 / 只读同次复用 / 独立并发消费者，输入变化重新构建', async () => {
  const { root, plan } = groupTarget();
  fs.copyFileSync(
    path.join(repository, 'tests/fixtures/group-reuse-target.ts'),
    path.join(root, 'reuse.ts'),
  );
  plan.groups[0] = {
    ...plan.groups[0],
    kind: 'command',
    selection: ['reuse.ts'],
    command: 'node reuse.ts',
    artifacts: ['reuse-result.json'],
    completion: '实际构建、两独立消费者与输入变化检查均通过',
  };
  plan.groups[1].dependsOn = ['prefix'];
  fs.writeFileSync(path.join(root, 'group-plan.json'), JSON.stringify(plan));
  const result = attemptResult(await groupRun(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  const measured = JSON.parse(fs.readFileSync(path.join(root, 'reuse-result.json'), 'utf8'));
  assert.equal(measured.builds, 2);
  assert.equal(measured.results.length, 2);
  assert.equal(measured.sameDistConcurrentWriters, false);
  assert.ok(measured.wallMs >= 0);
});
test('构建失败只阻断依赖，独立后项仍实际执行并收集多个问题', async () => {
  const { root, plan } = groupTarget();
  fs.writeFileSync(path.join(root, 'build.ts'), 'process.exitCode=7;');
  plan.groups[0] = {
    ...plan.groups[0],
    kind: 'command',
    selection: ['build.ts'],
    command: 'node build.ts',
    artifacts: ['missing-build'],
    completion: '构建及产物存在',
  };
  plan.groups[1].dependsOn = ['prefix'];
  fs.writeFileSync(
    path.join(root, 'tail.test.ts'),
    "import test from 'node:test';test('tail failure',()=>{throw Error('second independent failure')});",
  );
  fs.writeFileSync(path.join(root, 'group-plan.json'), JSON.stringify(plan));
  const result = attemptResult(await groupRun(root));
  assert.equal(result.ok, false);
  assert.equal(result.groupExecution.protocolState, 'valid');
  assert.deepEqual(
    result.run.attempt!.progress.map((p) => p.state),
    ['failed', 'blocked', 'failed'],
  );
  recordApplyScene('P01-collection', root, result);
});
