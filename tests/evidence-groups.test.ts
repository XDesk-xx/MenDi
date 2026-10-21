import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { groupTarget, groupRun, attemptResult, recordApplyScene } from './group-support.ts';
import { snapshot } from './helpers.ts';
import { writePackage } from './test-support.ts';
import { output, evidenceMode, rows, read } from './evidence-test-support.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';

test('groups-v1 关闭 opt-in 无额外证据；开启后 groupRun / 两份 Apply 摘要复用失败原件', async () => {
  const off = await evidenceMode(undefined, () => groupTarget()),
    absent = output('disabled');
  assert.equal((await evidenceMode(undefined, () => groupRun(off.root))).ok, true);
  assert.equal(fs.existsSync(absent), false);
  const { root } = await evidenceMode(undefined, () => groupTarget());
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('middle',()=>{throw new Error('real middle failure')});\n",
  );
  const directory = output('groups'),
    apply = output('apply');
  const result = attemptResult(await evidenceMode(directory, () => groupRun(root), apply));
  assert.equal(result.run.attempt!.formalOutcome, 'failed');
  assert.deepEqual(
    result.run.attempt!.progress.map((p) => p.state),
    ['passed', 'failed', 'passed'],
  );
  const before = snapshot(path.join(root, '.mendi')),
    originals = fs.readdirSync(path.join(directory, 'originals'));
  await evidenceMode(
    directory,
    () => {
      recordApplyScene('one', root, result, { sameRun: result.run });
      recordApplyScene('two', root, result, { sameRun: result.run });
    },
    apply,
  );
  assert.deepEqual(fs.readdirSync(path.join(directory, 'originals')), originals);
  assert.deepEqual(snapshot(path.join(root, '.mendi')), before);
  const first = JSON.parse(fs.readFileSync(path.join(apply, `one-${process.pid}.json`), 'utf8'));
  const second = JSON.parse(fs.readFileSync(path.join(apply, `two-${process.pid}.json`), 'utf8'));
  assert.deepEqual(first.files, second.files);
  assert.deepEqual(first.result, second.result);
  assert.equal(first.extra.sameRun.ref, first.files[result.run.ref].ref);
  assert.equal(fs.existsSync(path.join(apply, 'originals')), false);
  const scene = rows(directory, 'group-scenes')[0];
  assert.equal(scene.state, 'captured');
  for (const [ref, reference] of Object.entries(first.files))
    assert.ok(
      read(reference as Parameters<typeof read>[0]).equals(fs.readFileSync(path.join(root, ref))),
    );
  const stdout = result.groupExecution.child!.stdoutRef,
    original = fs.readFileSync(path.join(root, stdout));
  fs.renameSync(path.join(root, stdout), path.join(root, stdout + '.saved'));
  assert.ok(read(first.files[stdout]).equals(original));
  fs.renameSync(path.join(root, stdout + '.saved'), path.join(root, stdout));
  assert.equal(fullTestStatus({ project: root, runRef: result.run.ref }).ok, true);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, result.run.attempt!.request!.reportRef), 'utf8'),
  );
  const legacy = JSON.stringify({
    result: {
      ok: result.ok,
      run: result.run,
      groupExecution: result.groupExecution,
      next: result.next,
    },
    report,
    stdout: original.toString(),
    stderr: fs.readFileSync(path.join(root, result.groupExecution.child!.stderrRef), 'utf8'),
  });
  console.log(
    JSON.stringify({
      scene: 'one-group-source-three-summaries',
      directOriginalFiles: Object.keys(scene.files).length,
      newOriginalFiles: originals.length,
      oldLayoutTwoApplyBytes: Buffer.byteLength(legacy) * 2,
      newTwoApplySummaryBytes:
        fs.statSync(path.join(apply, `one-${process.pid}.json`)).size +
        fs.statSync(path.join(apply, `two-${process.pid}.json`)).size,
      comparison: '同一真实执行的旧摘要布局序列化对照；不是重新运行旧 writer，也不是体积 gate',
    }),
  );
});

test('缺最终报告保存缺失事实，真实 invalid 不变；Apply 只启用时同样保留一次可读原件', async () => {
  const { root } = await evidenceMode(undefined, () => groupTarget()),
    directory = output('missing-report');
  writePackage(root, (pkg) => {
    (pkg.scripts as Record<string, string>)['test:full'] = 'node -e ""';
  });
  const result = attemptResult(await evidenceMode(undefined, () => groupRun(root), directory));
  assert.equal(result.run.attempt!.formalOutcome, 'invalid');
  assert.equal(result.groupExecution.child!.outcome, 'passed');
  await evidenceMode(undefined, () => recordApplyScene('missing', root, result), directory);
  const scene = rows(directory, 'group-scenes')[0];
  assert.equal(scene.state, 'incomplete');
  assert.ok(scene.missing.includes(result.run.attempt!.request!.reportRef));
  const actual = path.join(root, result.run.attempt!.request!.reportRef);
  assert.equal(fs.existsSync(actual), false);
  assert.ok(Object.keys(scene.files).some((ref) => ref.endsWith('stdout.log')));
  const summary = JSON.parse(read(scene.result).toString());
  assert.equal(summary.ok, false);
});

test('cleanup unknown 保留真实 Run、request/report/events、部分结果与锁，不追认为 finished PASS', async () => {
  const { root } = await evidenceMode(undefined, () => groupTarget()),
    directory = output('unknown-group');
  fs.writeFileSync(
    path.join(root, 'group-control.json'),
    JSON.stringify({ unknownCleanup: 'middle' }),
  );
  const result = await evidenceMode(directory, () => groupRun(root));
  assert.ok('outcome' in result && result.outcome === 'unknown');
  const before = snapshot(path.join(root, '.mendi'));
  await evidenceMode(directory, () => recordApplyScene('unknown', root, result), directory);
  assert.deepEqual(snapshot(path.join(root, '.mendi')), before);
  const scene = rows(directory, 'group-scenes')[0];
  assert.ok(scene.files['.mendi/write.lock']);
  assert.ok(Object.keys(scene.files).some((ref) => ref.endsWith('group-events.jsonl')));
  const reportRef = result.run!.attempt!.request!.reportRef;
  assert.equal(JSON.parse(read(scene.files[reportRef]).toString()).cleanup, 'unknown');
  assert.equal(result.run!.status, 'draft');
  console.log(
    JSON.stringify({
      scene: 'unknown-collector',
      state: scene.state,
      productOutcome: result.outcome,
      files: Object.keys(scene.files).length,
      retainedLock: '.mendi/write.lock',
    }),
  );
});
