import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { EvidenceSession, EvidenceIncomplete } from './evidence-support.ts';
import { sandbox, repository } from './helpers.ts';
import { spawn } from 'node:child_process';

function target() {
  const base = sandbox(),
    root = path.join(base, 'source'),
    out = path.join(base, 'evidence');
  fs.mkdirSync(root);
  fs.copyFileSync(
    path.join(repository, 'tests/fixtures/evidence-original.txt'),
    path.join(root, 'stdout.log'),
  );
  return { root, out, source: { root, ref: 'stdout.log', lifetime: 'temporary' as const } };
}
test('两个真实进程采集同一受管文件，独占发布同一原件且不覆盖', async () => {
  const { root, out } = target();
  const worker = () =>
    new Promise<string>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [path.join(repository, 'tests/fixtures/evidence-worker.ts'), root, out],
        { windowsHide: true },
      );
      let stdout = '',
        stderr = '';
      child.stdout.on('data', (b) => (stdout += String(b)));
      child.stderr.on('data', (b) => (stderr += String(b)));
      child.on('error', reject);
      child.on('close', (code) => (code === 0 ? resolve(stdout) : reject(new Error(stderr))));
    });
  const [a, b] = (await Promise.all([worker(), worker()])).map((v) => JSON.parse(v));
  assert.equal(a.ref, b.ref);
  assert.equal(fs.readdirSync(path.join(out, 'originals')).length, 1);
  assert.equal(fs.readFileSync(path.join(a.root, a.ref), 'utf8'), '真实原件\n');
});
test('同一临时原件仅存一份，源清理后两个摘要仍可读取；相同文本的不同执行各保留', () => {
  const { root, out, source } = target(),
    session = new EvidenceSession(out);
  const first = session.file(source),
    second = session.file(source);
  assert.deepEqual(second, first);
  session.record('scenes.jsonl', { scene: 'one', original: first });
  session.record('scenes.jsonl', { scene: 'two', original: second });
  const other = path.join(root, 'second.log');
  fs.writeFileSync(other, '真实原件\n');
  const third = session.file({ ...source, ref: 'second.log' });
  assert.notEqual(first.ref, third.ref);
  fs.unlinkSync(path.join(root, 'stdout.log'));
  assert.equal(fs.readFileSync(path.join(first.root, first.ref), 'utf8'), '真实原件\n');
  assert.equal(fs.readdirSync(path.join(out, 'originals')).length, 2);
  assert.equal(fs.readFileSync(path.join(out, 'scenes.jsonl'), 'utf8').includes('真实原件'), false);
});
test('受控可复建输入直接引用并记入口，不复制临时工程；临时源不能冒充持久输入', () => {
  const { out, source } = target(),
    session = new EvidenceSession(out);
  const reference = session.file({
    root: repository,
    ref: 'tests/fixtures/test-foreground.ts',
    lifetime: 'reconstructible',
    reproduce: { entry: 'tests/test-execution.test.ts', args: ['node', '--test'] },
  });
  assert.equal(reference.state, 'referenced');
  assert.equal(fs.existsSync(path.join(out, 'originals')), false);
  assert.throws(() => session.file({ ...source, lifetime: 'durable' }), EvidenceIncomplete);
});
test('越界、缺失及已提交 Run 目标拒绝，不修改来源或旧 Run', () => {
  const { root, out, source } = target(),
    session = new EvidenceSession(out);
  for (const ref of ['../outside', 'C:/outside', 'absent.log'])
    assert.throws(() => session.file({ ...source, ref }), EvidenceIncomplete);
  const old = path.join(root, 'old');
  fs.mkdirSync(old);
  const run = '---\nstatus: completed\n---\n历史\n';
  fs.writeFileSync(path.join(old, 'run.md'), run);
  assert.throws(() => new EvidenceSession(path.join(old, 'artifacts')), EvidenceIncomplete);
  assert.equal(fs.readFileSync(path.join(old, 'run.md'), 'utf8'), run);
  fs.symlinkSync(old, path.join(root, 'old-link'), 'junction');
  assert.throws(
    () => new EvidenceSession(path.join(root, 'old-link', 'artifacts')),
    EvidenceIncomplete,
  );
  assert.equal(fs.existsSync(path.join(old, 'artifacts')), false);
  const outside = path.join(root, '..', 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'private.log'), 'outside');
  fs.symlinkSync(outside, path.join(root, 'external'), 'junction');
  assert.throws(() => session.file({ ...source, ref: 'external/private.log' }), EvidenceIncomplete);
});
for (const mode of ['short', 'zero', 'throw'] as const)
  test(`采集写入 ${mode}：完成全部字节或保留 incomplete，不循环零进展`, (t) => {
    const { out, source } = target(),
      session = new EvidenceSession(out),
      original = fs.writeSync;
    let calls = 0;
    t.mock.method(fs, 'writeSync', (...args: unknown[]) => {
      const [fd, bytes, offset, length] = args;
      if (
        !Buffer.isBuffer(bytes) ||
        typeof fd !== 'number' ||
        typeof offset !== 'number' ||
        typeof length !== 'number'
      )
        return Reflect.apply(original, fs, args);
      calls++;
      if (mode === 'zero') return 0;
      if (mode === 'throw') throw new Error('controlled write failure');
      return original(fd, bytes, offset, Math.min(2, length));
    });
    try {
      if (mode === 'short') {
        const ref = session.file(source);
        assert.equal(fs.readFileSync(path.join(ref.root, ref.ref), 'utf8'), '真实原件\n');
        assert.ok(calls > 1);
      } else {
        assert.throws(() => session.file(source), EvidenceIncomplete);
        assert.equal(calls, 1);
      }
    } finally {
      t.mock.restoreAll();
    }
  });
test('读中变化、无权限和发布中断均 incomplete，保留源与已写临时现场', (t) => {
  const changed = target();
  const changing = new EvidenceSession(changed.out, (phase) => {
    if (phase === 'source-read') fs.appendFileSync(path.join(changed.root, 'stdout.log'), '变化');
  });
  assert.throws(() => changing.file(changed.source), EvidenceIncomplete);
  const denied = target(),
    session = new EvidenceSession(denied.out),
    original = fs.openSync;
  t.mock.method(fs, 'openSync', ((...args: Parameters<typeof fs.openSync>) => {
    if (String(args[0]).startsWith(denied.out))
      throw Object.assign(new Error('controlled EACCES'), { code: 'EACCES' });
    return original(...args);
  }) as typeof fs.openSync);
  try {
    assert.throws(() => session.file(denied.source), EvidenceIncomplete);
  } finally {
    t.mock.restoreAll();
  }
  const interrupted = target(),
    stopped = new EvidenceSession(interrupted.out, (phase) => {
      if (phase === 'before-publish') throw new Error('controlled interruption');
    });
  assert.throws(() => stopped.file(interrupted.source), EvidenceIncomplete);
  assert.ok(
    fs.readdirSync(path.join(interrupted.out, 'originals')).some((p) => p.endsWith('.tmp')),
  );
  assert.ok(fs.existsSync(path.join(interrupted.root, 'stdout.log')));
});
