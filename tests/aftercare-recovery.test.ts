import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { aftercareTarget, supplement, actual, baseline, amendment } from './aftercare-support.ts';
import { command, isolatedEnv, repository, snapshot } from './helpers.ts';
import { readAftercare } from '../src/adapters/aftercare-reader.ts';
import { startAction } from '../src/application/actions.ts';
import { reviewer, options } from './action-support.ts';
import { sourceFile } from '../src/adapters/aftercare-target.ts';
import { evidenceSession } from './evidence-support.ts';
import type { AftercareInput } from '../src/application/run-aftercare.ts';

function worker(root: string, mode: string, input: AftercareInput) {
  fs.writeFileSync(path.join(root, 'aftercare-job.json'), JSON.stringify(input));
  const result = command(
    path.join(repository, 'tests/fixtures/aftercare-worker.ts'),
    [root, mode],
    repository,
    isolatedEnv(root),
  );
  if (process.env.MENDI_TEST_EVIDENCE_DIR) {
    const session = evidenceSession(process.env.MENDI_TEST_EVIDENCE_DIR);
    const requestId =
      input.requestId ??
      JSON.parse(fs.readFileSync(path.join(root, input.inputFile!), 'utf8')).requestId;
    const directory = `${path.posix.dirname(input.runRef)}/aftercare/${input.kind ? 'amend' : `supplements/${requestId}`}`;
    const refs = [
      input.runRef,
      '.mendi/write.lock',
      'aftercare-job.json',
      ...[
        'intent.json',
        'baseline.md',
        'input.md',
        'diff.json',
        'evidence-0.bin',
        'confirmed.json',
      ].map((f) => `${directory}/${f}`),
    ];
    const saved = refs
      .filter((ref) => fs.existsSync(path.join(root, ref)))
      .map((ref) => session.file({ root, ref, lifetime: 'temporary' }));
    session.record(`aftercare-scenes-${process.pid}.jsonl`, {
      root,
      mode,
      exitCode: result.status,
      saved,
    });
  }
  return result;
}
/** Only a stopped test-owned writer's exact lock is disposed, representing explicit Owner action. */
function disposeTestLock(root: string) {
  const file = path.join(root, '.mendi/write.lock'),
    raw = fs.readFileSync(file, 'utf8');
  const owner = JSON.parse(raw);
  assert.match(owner.operation, /^run-(amend|supplement)$/);
  assert.throws(() => process.kill(owner.pid, 0));
  assert.equal(fs.readFileSync(file, 'utf8'), raw);
  fs.unlinkSync(file);
}
for (const phase of [
  'intent-written',
  'original-written',
  'before-confirm',
  'confirmed-written',
  'before-readback',
  'before-lock-release',
]) {
  test(`真实子进程断点 ${phase}：保留现场、显式同请求恢复且不重复`, () => {
    const { root, input } = aftercareTarget(),
      unchanged = baseline(root, input.runRef);
    const inputFile = supplement(root),
      request = { ...input, inputFile };
    const stopped = worker(root, phase, request);
    assert.equal(stopped.status, 2, stopped.stdout);
    const lock = path.join(root, '.mendi/write.lock');
    assert.equal(fs.existsSync(lock), true);
    const scene = snapshot(path.join(root, '.mendi'));
    assert.notEqual(actual('supplement', request).exit, 0);
    assert.notEqual(actual('supplement', { ...request, resume: 'finish' }).exit, 0);
    assert.deepEqual(snapshot(path.join(root, '.mendi')), scene);
    disposeTestLock(root);
    const confirmed = ['confirmed-written', 'before-readback', 'before-lock-release'].includes(
      phase,
    );
    if (!confirmed) {
      assert.throws(() => readAftercare(root, input.runRef));
      assert.throws(() =>
        startAction(
          {
            ...reviewer(root),
            changeId: 'proof-entry',
            type: 'review-explore',
            authorRunRef: input.runRef,
          },
          options,
        ),
      );
      const before = snapshot(path.join(root, '.mendi'));
      assert.notEqual(
        actual('supplement', { ...input, inputFile: supplement(root, 'other'), resume: 'finish' })
          .exit,
        0,
      );
      assert.deepEqual(snapshot(path.join(root, '.mendi')), before);
    }
    const resumed = actual('supplement', { ...request, resume: 'finish' });
    assert.equal(resumed.exit, 0, resumed.raw.stdout);
    assert.equal(readAftercare(root, input.runRef).supplements.length, 1);
    assert.equal(actual('supplement', request).value.alreadyConfirmed, true);
    unchanged();
  });
}

test('真实并发请求由 write.lock 排斥；源在锁前/复制中漂移均 fail closed', () => {
  const t = aftercareTarget(),
    inputFile = supplement(t.root);
  assert.equal(worker(t.root, 'race', { ...t.input, inputFile }).status, 0);
  const second = JSON.parse(fs.readFileSync(path.join(t.root, 'second-writer.json'), 'utf8'));
  assert.notEqual(second.exit, 0);
  assert.equal(readAftercare(t.root, t.input.runRef).supplements.length, 1);
  for (const mode of ['source-drift-before', 'source-drift']) {
    const { root, input } = aftercareTarget(),
      request = { ...input, inputFile: supplement(root) },
      unchanged = baseline(root, input.runRef);
    assert.equal(worker(root, mode, request).status, 2);
    const lock = path.join(root, '.mendi/write.lock');
    if (mode === 'source-drift') {
      assert.equal(fs.existsSync(lock), true);
      disposeTestLock(root);
      assert.notEqual(actual('supplement', { ...request, resume: 'finish' }).exit, 0);
      // Failed same-request recovery retains its new test-owned lock. No automatic disposal.
      assert.equal(fs.existsSync(lock), true);
    } else assert.equal(fs.existsSync(lock), false);
    unchanged();
  }
});

test('部分复制和坏/缺 confirmed 不冒充成功；唯一 amend 的 pending 不准换模式/ID', () => {
  const { root, input } = aftercareTarget(),
    request = { ...input, inputFile: supplement(root) },
    unchanged = baseline(root, input.runRef);
  assert.equal(worker(root, 'partial', request).status, 2);
  disposeTestLock(root);
  assert.notEqual(actual('supplement', { ...request, resume: 'finish' }).exit, 0);
  assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), true);
  unchanged();
  const t = aftercareTarget(),
    amend = { ...t.input, ...amendment(t.root, t.input.runRef) };
  assert.equal(worker(t.root, 'intent-written', amend).status, 2);
  disposeTestLock(t.root);
  fs.writeFileSync(path.join(t.root, 'comment.md'), '旧失败已通过');
  const before = snapshot(path.join(t.root, '.mendi'));
  assert.notEqual(
    actual('amend', {
      ...t.input,
      requestId: 'a1',
      kind: 'unreviewed-comment',
      commentFile: 'comment.md',
      reason: amend.reason,
      resume: 'finish',
    }).exit,
    0,
  );
  // A mismatching pending request never confirms; its lock/scene remains diagnostic.
  assert.throws(() => readAftercare(t.root, t.input.runRef));
  assert.equal(
    Object.keys(snapshot(path.join(t.root, '.mendi'))).length >= Object.keys(before).length,
    true,
  );
});

test('查询验证必要原件字节、0B 是真实文件；内部 junction 不得转存到其他目录', () => {
  const { root, input } = aftercareTarget();
  fs.writeFileSync(path.join(root, 'empty.log'), '');
  const request = { ...input, inputFile: supplement(root, 's1', { evidence: ['empty.log'] }) };
  const result = actual('supplement', request);
  assert.equal(result.exit, 0, result.raw.stdout);
  const saved = readAftercare(root, input.runRef).supplements[0].evidence[0].ref;
  assert.equal(fs.statSync(path.join(root, saved)).size, 0);
  fs.unlinkSync(path.join(root, saved));
  assert.throws(() => readAftercare(root, input.runRef));
  fs.writeFileSync(path.join(root, saved), 'changed');
  assert.throws(() => readAftercare(root, input.runRef));
  fs.writeFileSync(path.join(root, saved), '');
  const confirmed = path.join(root, result.value.receiptRef);
  const original = fs.readFileSync(confirmed);
  fs.writeFileSync(confirmed, '{}');
  assert.throws(() => readAftercare(root, input.runRef));
  fs.writeFileSync(confirmed, original);
  assert.equal(readAftercare(root, input.runRef).supplements.length, 1);
  const t = aftercareTarget();
  const target = path.join(t.root, 'elsewhere');
  fs.mkdirSync(target);
  fs.symlinkSync(
    target,
    path.join(t.root, path.posix.dirname(t.input.runRef), 'aftercare'),
    'junction',
  );
  assert.notEqual(actual('supplement', { ...t.input, inputFile: supplement(t.root) }).exit, 0);
  assert.deepEqual(fs.readdirSync(target), []);
});

test('直接来源读取中真实字节变化被检测', () => {
  const { root } = aftercareTarget();
  fs.writeFileSync(path.join(root, 'changing.txt'), 'before');
  const read = fs.readFileSync;
  let injected = false;
  const hook = test.mock.method(
    fs,
    'readFileSync',
    (...args: Parameters<typeof fs.readFileSync>) => {
      const bytes = Reflect.apply(read, fs, args);
      if (!injected && String(args[0]).endsWith('changing.txt')) {
        injected = true;
        fs.writeFileSync(path.join(root, 'changing.txt'), 'after');
      }
      return bytes;
    },
  );
  try {
    assert.throws(() => sourceFile(root, 'changing.txt'), /变化/);
  } finally {
    hook.mock.restore();
  }
});
