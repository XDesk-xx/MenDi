import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { command, repository, sandbox, isolatedEnv, snapshot } from './helpers.ts';
import { testTarget, execute, statusCli, writePackage } from './test-support.ts';
import { recordTestEvidence } from './evidence-scenes.ts';
import { evidenceSession } from './evidence-support.ts';
import { testStatus } from '../src/application/tests.ts';
import { output, evidenceMode, rows, read } from './evidence-test-support.ts';

test('真实命令 opt-in 开关、同命令不同执行身份与失败定位；摘要复用已有唯一原件', async () => {
  const root = sandbox(),
    destination = output('commands');
  const entry = path.join(repository, 'tests/fixtures/evidence-command.ts');
  await evidenceMode(undefined, () => command(entry, ['passed'], root, isolatedEnv(root)));
  assert.equal(fs.existsSync(destination), false);
  await evidenceMode(destination, () => {
    assert.equal(command(entry, ['passed'], root, isolatedEnv(root)).status, 0);
    assert.equal(command(entry, ['passed'], root, isolatedEnv(root)).status, 0);
    assert.equal(command(entry, ['failed'], root, isolatedEnv(root)).status, 7);
  });
  const saved = rows(destination, 'commands');
  assert.equal(saved.length, 3);
  assert.equal(new Set(saved.map((row) => row.output.ref)).size, 3);
  assert.ok(read(saved[0].output).equals(read(saved[1].output)));
  assert.equal(saved[2].cwd, root);
  assert.equal(saved[2].exitCode, 7);
  assert.deepEqual(saved[2].args, ['failed']);
  const original = JSON.parse(read(saved[0].output).toString());
  const session = evidenceSession(destination);
  const reused = session.value(saved[0].output.source.identity, original);
  assert.equal(reused.ref, saved[0].output.ref);
  session.record('reuse.jsonl', { output: reused });
  assert.equal(fs.readdirSync(path.join(destination, 'originals')).length, 3);
  assert.equal(
    fs
      .readFileSync(path.join(destination, `commands-${process.pid}.jsonl`), 'utf8')
      .includes(original.stdout),
    false,
  );
  console.log(
    JSON.stringify({
      scene: 'same-command-distinct-invocations',
      originalFiles: 3,
      references: 4,
      originalBytes: read(reused).length,
      legacyTwoSummaryBytes: Buffer.byteLength(JSON.stringify(original).repeat(2)),
    }),
  );
});

test('实际 passed / failed / unknown 执行复用唯一 result 和双日志，跨进程 status 不变', async () => {
  const root = await evidenceMode(undefined, () => testTarget()),
    directory = output('execution');
  for (const [kind, outcome] of [
    ['focused', 'passed'],
    ['fast', 'failed'],
    ['full', 'unknown'],
  ] as const) {
    const result = await evidenceMode(directory, () =>
      execute(
        root,
        kind,
        outcome === 'unknown'
          ? {
              observe(phase) {
                if (phase === 'before-test-lock-release')
                  throw new Error('controlled cleanup unknown');
              },
            }
          : {},
      ),
    );
    assert.equal(result.outcome, outcome);
    const actual = 'record' in result ? result.record : result.observed;
    assert.ok(actual);
    const before = snapshot(path.dirname(path.join(root, actual.stdoutRef)));
    const scene = recordTestEvidence(directory, root, result);
    const repeated = recordTestEvidence(directory, root, result);
    assert.deepEqual(scene.files, repeated.files);
    assert.deepEqual(scene.result, repeated.result);
    for (const ref of [actual.stdoutRef, actual.stderrRef])
      assert.ok(read(scene.files[ref]).equals(fs.readFileSync(path.join(root, ref))));
    assert.deepEqual(snapshot(path.dirname(path.join(root, actual.stdoutRef))), before);
    const status = await evidenceMode(undefined, () =>
      statusCli(root, actual.executionId, outcome === 'unknown' ? 1 : 0),
    );
    assert.equal(status.outcome, outcome);
    console.log(
      JSON.stringify({
        scene: 'execute',
        outcome,
        canonicalOriginals: Object.keys(scene.files).length,
        repeatedReferences: Object.keys(repeated.files).length,
        state: scene.state,
      }),
    );
  }
});

test('真实 0B stdout 保留物理文件；删除仍 unknown，恢复原件后 passed，collector 不补日志', async () => {
  const root = await evidenceMode(undefined, () => testTarget()),
    directory = output('quiet');
  fs.copyFileSync(
    path.join(repository, 'tests/fixtures/evidence-command.ts'),
    path.join(root, 'quiet.ts'),
  );
  writePackage(root, (pkg) => {
    (pkg.scripts as Record<string, string>)['test:focused'] = 'node quiet.ts quiet';
  });
  const result = await evidenceMode(directory, () => execute(root));
  assert.equal(result.outcome, 'passed');
  assert.ok('record' in result);
  assert.equal(result.record.formatVersion, 1);
  const stdout = path.join(root, result.record.stdoutRef),
    stderr = path.join(root, result.record.stderrRef);
  assert.equal(fs.statSync(stdout).size, 0);
  assert.ok(fs.statSync(stderr).size > 0);
  const scene = recordTestEvidence(directory, root, result);
  assert.equal(read(scene.files[result.record.stdoutRef]).length, 0);
  const original = fs.readFileSync(stdout);
  fs.unlinkSync(stdout);
  const broken = testStatus({ project: root, execution: result.record.executionId });
  assert.equal(broken.outcome, 'unknown');
  assert.ok('error' in broken && broken.error.code === 'ENOENT');
  const limited = recordTestEvidence(directory, root, result);
  assert.equal(limited.state, 'incomplete');
  assert.ok(limited.missing.includes(result.record.stdoutRef));
  assert.equal(fs.existsSync(stdout), false);
  fs.writeFileSync(stdout, original, { flag: 'wx' });
  assert.equal(
    (await evidenceMode(undefined, () => statusCli(root, result.record.executionId))).outcome,
    'passed',
  );
});
