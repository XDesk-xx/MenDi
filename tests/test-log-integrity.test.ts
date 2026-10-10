import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, statusCli, testTarget } from './test-support.ts';

for (const mode of ['short', 'zero', 'throw'] as const) {
  test(`真实日志 ${mode} 写入：完整落盘或 unknown 保留现场`, async (t) => {
    const root = testTarget();
    const original = fs.writeSync;
    const chunks = new Map<number, { bytes: Buffer; calls: number }>();
    t.mock.method(fs, 'writeSync', (...args: unknown[]) => {
      const [fd, buffer, suppliedOffset, suppliedLength] = args;
      if (
        typeof fd !== 'number' ||
        !Buffer.isBuffer(buffer) ||
        (!buffer.includes('foreground:pass\n') && !buffer.includes('actual stderr\n'))
      )
        return Reflect.apply(original, fs, args);
      const offset = typeof suppliedOffset === 'number' ? suppliedOffset : 0;
      const length = typeof suppliedLength === 'number' ? suppliedLength : buffer.length - offset;
      if (offset === 0) chunks.set(fd, { bytes: Buffer.from(buffer), calls: 0 });
      const captured = chunks.get(fd)!;
      captured.calls++;
      if (mode === 'throw') throw new Error('controlled log write failure');
      if (mode === 'zero' && offset > 0) return 0;
      return original(fd, buffer, offset, Math.min(3, length));
    });
    let result: Awaited<ReturnType<typeof execute>>;
    try {
      result = await execute(root);
    } finally {
      t.mock.restoreAll();
    }
    assert.ok(chunks.size > 0, '必须实际触发受控日志写入');
    if (mode === 'short') {
      assert.equal(result.outcome, 'passed', JSON.stringify(result));
      assert.equal(result.ok, true);
      if (!('record' in result)) throw new Error(JSON.stringify(result));
      assert.equal(chunks.size, 2, 'stdout / stderr 均覆盖连续短写');
      const logs = [result.record.stdoutRef, result.record.stderrRef].map((ref) =>
        fs.readFileSync(path.join(root, ref)),
      );
      for (const captured of chunks.values()) {
        assert.ok(captured.calls > 1);
        assert.ok(
          logs.some((log) => log.includes(captured.bytes)),
          '每个原始 chunk 完整保留',
        );
      }
      assert.deepEqual(logs[0], Buffer.from('foreground:pass\n'));
      assert.equal(statusCli(root, '001-focused').outcome, 'passed');
      assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), false);
    } else {
      assert.equal(result.outcome, 'unknown', JSON.stringify(result));
      assert.equal(result.ok, false);
      assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), true);
      assert.equal(statusCli(root, '001-focused', 1).outcome, 'unknown');
      assert.ok(
        [...chunks.values()].every((chunk) => chunk.calls <= 2),
        '零进展不循环等待',
      );
    }
  });
}
