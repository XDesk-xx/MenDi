import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import {
  archiveTarget,
  prepare,
  worker,
  disposeStoppedFixtureLock,
  archiveCli,
  archiveRun,
} from './archive-support.ts';
import { isolatedEnv } from './helpers.ts';

function startWorker(root: string, ref: string, mode: string, fault: string) {
  const child = spawn(
    process.execPath,
    ['tests/fixtures/archive-worker.ts', root, ref, mode, fault, ''],
    { cwd: process.cwd(), env: isolatedEnv(path.dirname(root)), windowsHide: true },
  );
  let output = '';
  child.stdout.on('data', (data) => {
    output += String(data);
  });
  child.stderr.on('data', (data) => {
    output += String(data);
  });
  const done = new Promise<{ status: number | null; output: string }>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (status) => resolve({ status, output }));
  });
  return { done };
}
test('两个真实执行进程 / finish 进程竞争同一锁，原生和累计计数只执行一次', async () => {
  for (const mode of ['execute', 'finish']) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    if (mode === 'finish') {
      assert.equal(
        worker(target.root, draft.run.ref, 'execute', 'before-archive-numbering').status,
        88,
      );
      disposeStoppedFixtureLock(target.root);
    }
    const first = startWorker(target.root, draft.run.ref, mode, `hold-${mode}`);
    try {
      const ready = path.join(target.root, 'worker-ready');
      const until = Date.now() + 12_000;
      while (!fs.existsSync(ready) && Date.now() < until)
        await new Promise((resolve) => setTimeout(resolve, 30));
      assert.equal(fs.existsSync(ready), true);
      const second = await startWorker(target.root, draft.run.ref, mode, '').done;
      assert.equal(second.status, 1, second.output);
      assert.equal(fs.existsSync(path.join(target.root, '.mendi/write.lock')), true);
      fs.writeFileSync(path.join(target.root, 'worker-release'), 'explicit test release');
      const success = await first.done;
      assert.equal(success.status, 0, success.output);
      assert.equal(
        fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'),
        'archive\n',
      );
      assert.equal(
        JSON.parse(fs.readFileSync(path.join(target.root, '.mendi/project.json'), 'utf8'))
          .archivedChangeCount,
        1,
      );
      assert.equal(archiveCli(target.root, draft.run.ref).result, 'already-completed');
    } finally {
      // 只释放本夹具持有的闸门并等待其退出；失败也不留下等待写者。
      fs.writeFileSync(path.join(target.root, 'worker-release'), 'fixture cleanup release');
      await first.done;
    }
  }
});
test('finish 本身也可再次在真实 Run 提交点中断，后续收口不改已提交 Run', () => {
  const target = archiveTarget('approved');
  const draft = prepare(target);
  assert.equal(worker(target.root, draft.run.ref, 'execute', 'after-count-commit').status, 88);
  disposeStoppedFixtureLock(target.root);
  assert.equal(worker(target.root, draft.run.ref, 'finish', 'after-archive-run-commit').status, 88);
  const bytes = fs.readFileSync(path.join(target.root, draft.run.ref));
  assert.equal(archiveRun(target.root, true).record.status, 'submitted');
  disposeStoppedFixtureLock(target.root);
  assert.equal(archiveCli(target.root, draft.run.ref).result, 'archived');
  assert.deepEqual(fs.readFileSync(path.join(target.root, draft.run.ref)), bytes);
  assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
});
