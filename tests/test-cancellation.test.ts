import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { immediateCancellation } from './cancellation-support.ts';
import { execute, testTarget, writePackage } from './test-support.ts';
import { formal, verificationTarget } from './delivery-support.ts';

test('RA-B-003：停止命令声称成功但实际 close 未到，普通 / 正式执行有界 unknown', async () => {
  for (const kind of ['ordinary', 'formal']) {
    const root = kind === 'formal' ? verificationTarget() : testTarget();
    writePackage(root, (p) => {
      (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts wait';
    });
    const result = await immediateCancellation(
      root,
      async (options) =>
        kind === 'formal' ? await formal(root, options) : await execute(root, 'full', options),
      () => ({
        confirmed: true,
        exitCode: 0,
        stdout: 'controlled stop command success; child still alive',
        stderr: '',
      }),
    );
    assert.equal(result.ok, false);
    const child = JSON.parse(
      fs.readFileSync(
        path.join(root, '.mendi/delivery-groups/d01/tests/001-full/result.json'),
        'utf8',
      ),
    );
    assert.equal(child.outcome, 'unknown');
    assert.equal(child.stop.confirmed, false);
    assert.match(child.stop.stderr, /close/);
    assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
    if (kind === 'formal') {
      assert.ok('run' in result && result.run);
      assert.equal(result.run.status, 'draft');
      assert.equal(result.run.fullTest!.outcome, 'unknown');
    }
  }
});
