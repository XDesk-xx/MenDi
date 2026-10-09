import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';
import {
  cli,
  fixture,
  isolatedEnv,
  repository,
  sandbox,
  scopeFile,
  prepareChange,
} from './helpers.ts';

test('两个真实子进程的 Open / bind 竞争拒绝，不删已有锁', async () => {
  for (const operation of ['open', 'bind']) {
    const parent = sandbox();
    const env = isolatedEnv(parent);
    const root = fixture(parent);
    scopeFile(root);
    prepareChange(root, env);
    if (operation === 'bind')
      assert.equal(
        cli(
          [
            'delivery',
            'open',
            '--project',
            root,
            '--id',
            'd01',
            '--title',
            '测试',
            '--scope',
            'scope.json',
            '--json',
          ],
          parent,
          env,
        ).status,
        0,
      );
    const release = path.join(parent, 'release-writer');
    const writer = fork(
      path.join(repository, 'tests/fixtures/store-writer.ts'),
      [operation, root, release],
      { cwd: parent, env, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] },
    );
    let stderr = '';
    writer.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    const exited = once(writer, 'exit');
    const [ready] = await once(writer, 'message');
    assert.equal(ready.ready, true, ready.error);
    const lock = path.join(root, '.mendi/write.lock');
    const owner = fs.readFileSync(lock);
    const args =
      operation === 'open'
        ? [
            'delivery',
            'open',
            '--project',
            root,
            '--id',
            'd02',
            '--title',
            '第二写者',
            '--scope',
            'scope.json',
          ]
        : ['change', 'bind', '--project', root, '--change', 'proof-entry', '--slot', 'A'];
    try {
      const competitor = cli([...args, '--json'], parent, env);
      assert.equal(competitor.status, 1, competitor.stdout);
      const error = JSON.parse(competitor.stdout).error;
      assert.equal(
        error.code,
        operation === 'open' ? 'existing-mendi-state' : 'write-in-progress-or-interrupted',
      );
      assert.deepEqual(fs.readFileSync(lock), owner);
    } finally {
      fs.writeFileSync(release, 'release');
    }
    const [exit] = await exited;
    assert.equal(exit, 0, stderr);
    assert.ok(!fs.existsSync(lock));
    const result = cli(['status', '--project', root, '--json'], parent, env);
    assert.equal(result.status, 0, result.stdout);
    const value = JSON.parse(result.stdout);
    assert.equal(value.local.deliveryId, 'd01');
    assert.equal(value.local.activeChangeId, operation === 'bind' ? 'proof-entry' : null);
  }
});
