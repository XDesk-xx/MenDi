import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { groupTarget, groupRun, attemptResult, writeGroupInput } from './group-support.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';

test('真实 pnpm 接收本次请求，完整组通过直接正式 passed，Close 仍等 Owner 授权', async () => {
  const { root } = groupTarget();
  const result = attemptResult(await groupRun(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.groupExecution.protocolState, 'valid');
  assert.deepEqual(
    result.run.attempt!.progress.map((p) => p.state),
    ['passed', 'passed', 'passed'],
  );
  assert.equal(result.groupExecution.child!.scope, 'command');
  assert.equal(result.next.action, 'delivery-close');
  assert.equal(result.run.attempt!.version, 2);
  assert.equal(result.run.attempt!.formalOutcome, 'passed');
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
  const fresh = fullTestStatus({ project: root, runRef: result.run.ref });
  assert.ok('groupExecution' in fresh);
  assert.equal(fresh.groupExecution.protocolState, 'valid');
});
test('真实失败保留，禁止 continue 和无审核 initial 绕行', async () => {
  const { root, declaration } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';import assert from 'node:assert/strict';test('pass',()=>assert.ok(true));test('fail',()=>assert.equal(1,2));",
  );
  fs.writeFileSync(path.join(root, 'group-control.json'), JSON.stringify({ stopAfter: 'middle' }));
  const first = attemptResult(await groupRun(root));
  assert.equal(first.groupExecution.protocolState, 'valid', JSON.stringify(first));
  assert.deepEqual(
    first.run.attempt!.progress.map((p) => p.state),
    ['passed', 'failed', 'not-run'],
  );
  const bytes = fs.readFileSync(path.join(root, first.run.ref));
  for (const patch of [
    { candidate: { ...declaration.candidate, id: 'drift' } },
    { selection: ['prefix'] },
  ]) {
    writeGroupInput(root, {
      ...declaration,
      purpose: 'continue',
      selection: ['tail'],
      fromRunRef: first.run.ref,
      ...patch,
    });
    const rejected = await groupRun(root);
    assert.equal(rejected.ok, false);
    assert.equal('run' in rejected, false);
  }
  fs.writeFileSync(path.join(root, 'group-control.json'), '{}');
  writeGroupInput(root, {
    ...declaration,
    purpose: 'continue',
    selection: ['tail'],
    fromRunRef: first.run.ref,
  });
  const second = await groupRun(root);
  assert.equal(second.ok, false);
  assert.equal('run' in second, false);
  assert.ok(fs.readFileSync(path.join(root, first.run.ref)).equals(bytes));
  writeGroupInput(root, { ...declaration, fromRunRef: first.run.ref });
  const rejected = await groupRun(root);
  assert.equal(rejected.ok, false);
  assert.equal('run' in rejected, false);
});
test('真实全 skip / TODO、零业务执行与晚退出不可被 exit0 或 pass 事件覆盖', async () => {
  for (const body of [
    "test('skip',{skip:true},()=>{});test('todo',{todo:true},()=>{});",
    '',
    "test('passed',()=>{});process.on('beforeExit',()=>{process.exitCode=7;});",
  ]) {
    const { root } = groupTarget();
    fs.writeFileSync(path.join(root, 'middle.test.ts'), `import test from 'node:test';${body}`);
    const result = attemptResult(await groupRun(root));
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.equal(result.run.attempt!.progress[1].state, 'failed');
  }
});
test('真实回执失败但包装器 exit0 为 invalid，安全完成释放自己的锁', async () => {
  const { root } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('oops',()=>{throw Error('business failure')});",
  );
  fs.writeFileSync(path.join(root, 'group-control.json'), JSON.stringify({ wrapperZero: true }));
  const result = attemptResult(await groupRun(root));
  assert.equal(result.groupExecution.child!.outcome, 'passed');
  assert.equal(result.groupExecution.protocolState, 'invalid');
  assert.equal(result.ok, false);
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
});
