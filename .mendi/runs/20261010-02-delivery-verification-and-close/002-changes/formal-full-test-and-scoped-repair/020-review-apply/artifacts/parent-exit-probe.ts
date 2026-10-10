import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync, type ChildProcess } from 'node:child_process';
import { immediateCancellation } from '../../../../../../../tests/cancellation-support.ts';
import { execute, testTarget, writePackage } from '../../../../../../../tests/test-support.ts';
import { probeProcess } from '../../../../../../../src/application/diagnosis.ts';

// Controlled partial-stop interleaving: real entry exits, real descendants retain pipes.
// The stop callback is fault injection, not evidence that production taskkill /T succeeded.
const root = testTarget();
writePackage(root, (p) => { (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts wait'; });
let entry: ChildProcess | undefined;
let poll: ReturnType<typeof setInterval> | undefined;
let rootStop: ReturnType<typeof spawnSync> | undefined;
let descendant: number | undefined;
try {
  const result = await immediateCancellation(root, async (options) => {
    const result = await execute(root, 'full', options);
    assert.equal(rootStop?.status, 0);
    assert.equal(probeProcess(entry!.pid!), 'not-found');
    assert.equal(probeProcess(descendant!), 'alive');
    assert.equal(result.outcome, 'unknown');
    assert.ok(fs.existsSync(path.join(root, '.mendi/write.lock')));
    console.log(JSON.stringify({ phase: 'before-test-cleanup', root, entryPid: entry!.pid, entry: 'not-found', descendantPid: descendant, descendant: 'alive', result, rootStop: { status: rootStop?.status, stdout: rootStop?.stdout, stderr: rootStop?.stderr } }));
    return result;
  }, (child) => {
    entry = child;
    poll = setInterval(() => {
      let witness: { pid: number };
      try { witness = JSON.parse(fs.readFileSync(path.join(root, 'descendant.json'), 'utf8')); }
      catch { return; }
      clearInterval(poll);
      descendant = witness.pid;
      assert.ok(child.pid && child.exitCode === null && child.signalCode === null);
      rootStop = spawnSync(path.join(process.env.SystemRoot!, 'System32/taskkill.exe'), ['/PID', String(child.pid), '/F'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
    }, 25);
    return { confirmed: true, exitCode: 0, stdout: 'controlled partial stop: kill only freshly held entry after descendant starts', stderr: '' };
  });
  assert.equal(result.outcome, 'unknown');
  assert.equal(probeProcess(descendant!), 'not-found');
  console.log(JSON.stringify({ phase: 'after-test-cleanup', descendantPid: descendant, descendant: 'not-found', lockRetained: fs.existsSync(path.join(root, '.mendi/write.lock')) }));
} finally { clearInterval(poll); }
