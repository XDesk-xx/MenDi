import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { saveExecution } from '../src/adapters/test-store.ts';
import type { TestExecution } from '../src/core/test-execution.ts';
import { sandbox } from './helpers.ts';
import { execute, testTarget } from './test-support.ts';

function prepared() {
  const root = sandbox();
  const ref = '.mendi/delivery-groups/d01/tests/001-focused';
  fs.mkdirSync(path.join(root, ref), { recursive: true });
  const record: TestExecution = {
    formatVersion: 1,
    executionId: '001-focused',
    kind: 'focused',
    projectRoot: root,
    cwd: root,
    deliveryId: 'd01',
    changeId: null,
    actorId: 'test-author',
    scope: 'command',
    formalDeliveryTest: false,
    command: {
      executable: process.execPath,
      args: ['pnpm.js', 'run', 'test:focused'],
      dependencyPolicy: 'warn',
    },
    dependencyCheck: {
      executable: process.execPath,
      args: ['pnpm.js', 'run'],
      dependencyPolicy: 'error',
      exitCode: 0,
    },
    scriptName: 'test:focused',
    scriptText: 'node check.ts',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    executionState: 'prepared',
    outcome: 'not-run',
    exitCode: null,
    signal: null,
    pid: null,
    stdoutRef: `${ref}/stdout.log`,
    stderrRef: `${ref}/stderr.log`,
  };
  saveExecution(root, record, 'prepared', undefined, true);
  const file = path.join(root, ref, 'result.json');
  const bytes = fs.readFileSync(file);
  const running: TestExecution = { ...record, executionState: 'running', outcome: 'unknown' };
  return { root, file, bytes, record, running };
}

async function hold(file: string, duration?: number) {
  const child = spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      '$ErrorActionPreference="Stop"; $f=[IO.File]::Open($env:MENDI_HOLD_FILE,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read); try { [Console]::WriteLine("ready"); if ($env:MENDI_HOLD_MS) { Start-Sleep -Milliseconds ([int]$env:MENDI_HOLD_MS) } else { [Console]::ReadLine() | Out-Null } } finally { $f.Dispose() }',
    ],
    {
      env: { ...process.env, MENDI_HOLD_FILE: file, MENDI_HOLD_MS: duration?.toString() ?? '' },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );
  const closed = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('holder readiness timeout: ' + stderr)), 5000);
      child.stdout.on('data', (chunk) => {
        if (String(chunk).includes('ready')) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  } catch (error) {
    child.stdin.end('\n');
    await closed;
    throw error;
  }
  return { child, closed };
}

test('Windows 短时删除共享拒绝后替换同一 staged 结果', {
  skip: process.platform !== 'win32',
}, async (t) => {
  const target = prepared();
  const holder = await hold(target.file, 150);
  const rename = fs.renameSync;
  const failures: string[] = [];
  t.mock.method(fs, 'renameSync', (source: fs.PathLike, destination: fs.PathLike) => {
    try {
      return rename(source, destination);
    } catch (error) {
      failures.push((error as NodeJS.ErrnoException).code ?? 'unknown');
      throw error;
    }
  });
  try {
    saveExecution(target.root, target.running, 'before-intent-commit');
    assert.ok(failures.includes('EPERM'), JSON.stringify(failures));
    assert.deepEqual(JSON.parse(fs.readFileSync(target.file, 'utf8')), target.running);
    assert.deepEqual(fs.readdirSync(path.dirname(target.file)), ['result.json']);
  } finally {
    assert.equal(await holder.closed, 0);
  }
});

test('Windows 持续占用有界失败，保留原结果和唯一 staged 文件', {
  skip: process.platform !== 'win32',
}, async () => {
  const target = prepared();
  const holder = await hold(target.file);
  try {
    const started = performance.now();
    assert.throws(() => saveExecution(target.root, target.running, 'before-intent-commit'), {
      code: 'EPERM',
    });
    const elapsed = performance.now() - started;
    assert.ok(elapsed >= 450 && elapsed < 2000, `bounded replacement: ${elapsed}ms`);
    assert.deepEqual(fs.readFileSync(target.file), target.bytes);
    const staged = fs
      .readdirSync(path.dirname(target.file))
      .filter((name) => name.endsWith('.tmp'));
    assert.equal(staged.length, 1);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(path.dirname(target.file), staged[0]), 'utf8')),
      target.running,
    );
  } finally {
    holder.child.stdin.end('\n');
    assert.equal(await holder.closed, 0);
  }
});

test('其他 rename 错误立即传播，不删除原结果', (t) => {
  const target = prepared();
  let attempts = 0;
  t.mock.method(fs, 'renameSync', () => {
    attempts++;
    throw Object.assign(Error('controlled IO failure'), { code: 'EIO' });
  });
  assert.throws(() => saveExecution(target.root, target.running, 'before-intent-commit'), {
    code: 'EIO',
  });
  assert.equal(attempts, 1);
  assert.deepEqual(fs.readFileSync(target.file), target.bytes);
});

for (const changed of ['original', 'staged']) {
  test(`Windows 重试拒绝已改变的 ${changed}，不覆盖现场`, {
    skip: process.platform !== 'win32',
  }, (t) => {
    const target = prepared();
    let attempts = 0;
    t.mock.method(fs, 'renameSync', (source: fs.PathLike) => {
      attempts++;
      fs.writeFileSync(changed === 'original' ? target.file : source, 'changed\n');
      throw Object.assign(Error('controlled sharing refusal'), { code: 'EPERM' });
    });
    assert.throws(() => saveExecution(target.root, target.running, 'before-intent-commit'), {
      code: 'test-write-conflict',
    });
    assert.equal(attempts, 1);
    assert.equal(
      fs.readFileSync(target.file, 'utf8'),
      changed === 'original' ? 'changed\n' : target.bytes.toString(),
    );
  });
}

test('Windows result 替换瞬时拒绝不重启业务子进程；持续拒绝不启动子进程并保留锁', {
  skip: process.platform !== 'win32',
}, async (t) => {
  for (const persistent of [false, true]) {
    const root = testTarget();
    const rename = fs.renameSync;
    let refusals = 0;
    let launches = 0;
    const stagedPaths = new Set<string>();
    const mocked = t.mock.method(
      fs,
      'renameSync',
      (source: fs.PathLike, destination: fs.PathLike) => {
        if (String(destination).endsWith('result.json') && (persistent || refusals < 2)) {
          stagedPaths.add(String(source));
          refusals++;
          throw Object.assign(Error('controlled EPERM'), { code: 'EPERM' });
        }
        return rename(source, destination);
      },
    );
    let result;
    try {
      result = await execute(root, 'focused', {
        spawnExecution: (exe, args, options) => {
          launches++;
          return spawn(exe, args, options);
        },
      });
    } finally {
      mocked.mock.restore();
    }
    assert.equal(result.outcome, persistent ? 'unknown' : 'passed', JSON.stringify(result));
    assert.equal(result.ok, !persistent);
    assert.equal(launches, persistent ? 0 : 1);
    assert.equal(stagedPaths.size, 1);
    assert.equal(fs.existsSync(path.join(root, '.mendi/write.lock')), persistent);
    if (persistent) {
      assert.equal(fs.existsSync(path.join(root, 'started.json')), false);
      const original = JSON.parse(
        fs.readFileSync(
          path.join(root, '.mendi/delivery-groups/d01/tests/001-focused/result.json'),
          'utf8',
        ),
      );
      assert.equal(original.executionState, 'prepared');
      assert.equal(original.pid, null);
    }
  }
});

test('终态与错误身份在暂存写入前拒绝', () => {
  const target = prepared();
  const finished: TestExecution = {
    ...target.record,
    executionState: 'finished',
    finishedAt: new Date().toISOString(),
  };
  saveExecution(target.root, finished, 'before-terminal-commit');
  const bytes = fs.readFileSync(target.file);
  assert.throws(() => saveExecution(target.root, target.running, 'before-intent-commit'), {
    code: 'test-result-immutable',
  });
  assert.throws(
    () =>
      saveExecution(
        target.root,
        { ...target.running, projectRoot: 'other' },
        'before-intent-commit',
      ),
    { code: 'invalid-test-execution' },
  );
  assert.deepEqual(fs.readFileSync(target.file), bytes);
  assert.deepEqual(fs.readdirSync(path.dirname(target.file)), ['result.json']);
});
