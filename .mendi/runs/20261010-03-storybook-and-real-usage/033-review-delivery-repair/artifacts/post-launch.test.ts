import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { execute, testTarget } from '../../../../../tests/test-support.ts';

// 本次 Reviewer 的两个定向故障探针，不加入产品测试入口或正式集合。
for (const phase of ['pid', 'terminal'] as const) {
  test(`持续 EBUSY 在 ${phase} 写入：不重启业务、不接纳 PASS、保留锁`, async (t) => {
    const root = testTarget();
    const rename = fs.renameSync;
    let launches = 0;
    let refusals = 0;
    const stages = new Set<string>();
    t.mock.method(fs, 'renameSync', (source: fs.PathLike, destination: fs.PathLike) => {
      if (String(destination).endsWith('result.json')) {
        const candidate = JSON.parse(fs.readFileSync(source, 'utf8'));
        if (phase === 'pid'
          ? candidate.executionState === 'running' && candidate.pid !== null
          : candidate.executionState === 'finished') {
          refusals++;
          stages.add(String(source));
          throw Object.assign(Error(`controlled ${phase} refusal`), { code: 'EBUSY' });
        }
      }
      return rename(source, destination);
    });
    const result = await execute(root, 'focused', {
      spawnExecution: (exe, args, options) => {
        launches++;
        return spawn(exe, args, options);
      },
    });
    assert.equal(launches, 1);
    assert.ok(refusals > 1);
    assert.equal(stages.size, 1);
    assert.equal(result.ok, false);
    assert.equal(result.outcome, 'unknown');
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), true);
    const file = path.join(root, '.mendi/delivery-groups/d01/tests/001-focused/result.json');
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (phase === 'terminal') {
      assert.equal(saved.executionState, 'running');
      assert.equal(saved.outcome, 'unknown');
    } else {
      assert.equal(saved.executionState, 'finished');
      assert.equal(saved.outcome, 'unknown');
    }
    assert.equal(fs.existsSync([...stages][0]), true);
    console.log(JSON.stringify({ phase, root, launches, refusals, outcome: result.outcome }));
  });
}
