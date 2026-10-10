import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { OpenSpec, type ProcessRunner } from '../src/adapters/openspec.ts';
import { MendiError } from '../src/core/errors.ts';
import { sandbox, fixture, openspecEntry, snapshot } from './helpers.ts';

function code(expected: string) {
  return (error: unknown) => error instanceof MendiError && error.code === expected;
}
function success(stdout: string) {
  return { status: 0, signal: null, stdout, stderr: '' } as const;
}
function simulated(root: string, overrides: Record<string, string> = {}): ProcessRunner {
  return (_entry, args) =>
    success(
      overrides[args[0]] ??
        (args[0] === '--version'
          ? '1.14.1'
          : JSON.stringify({ root: { path: root, source: 'nearest' }, changes: [] })),
    );
}

test('真实固定 CLI 的 version/list/status/instructions 读取既有 context/rules', () => {
  const parent = sandbox();
  const runner: ProcessRunner = (entry, args, cwd) =>
    spawnSync(process.execPath, [entry, ...args], {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      env: {
        ...process.env,
        XDG_CONFIG_HOME: path.join(parent, 'config'),
        XDG_DATA_HOME: path.join(parent, 'data'),
        OPENSPEC_TELEMETRY: '0',
      },
    });
  for (const [name, prefix] of [
    ['minimal-project', 'MINIMAL'],
    ['existing-openspec-project', 'EXISTING'],
  ]) {
    const root = fixture(parent, name);
    const created = runner(openspecEntry, ['new', 'change', 'proof-entry', '--json'], root);
    assert.equal(created.status, 0, created.stderr);
    const before = snapshot(root);
    const upstream = new OpenSpec(root, openspecEntry, runner);
    assert.ok(upstream.changes.includes('proof-entry'));
    assert.equal(upstream.status('proof-entry').mode, 'repo-local');
    const instructions = upstream.instructions('proof-entry');
    assert.ok(instructions.context?.includes(prefix + '_CONTEXT_SENTINEL'));
    assert.ok(
      instructions.rules?.some((rule) => rule.includes(prefix + '_PROPOSAL_RULE_SENTINEL')),
    );
    assert.deepEqual(snapshot(root), before);
  }
});
test('坏 JSON / 缺字段 / root 来源与路径不符 / 版本不符明确失败', () => {
  const root = fixture(sandbox());
  for (const output of [
    'not-json',
    '[]',
    '{}',
    JSON.stringify({ root: { path: root, source: 'nearest' } }),
  ]) {
    assert.throws(
      () => new OpenSpec(root, openspecEntry, simulated(root, { list: output })),
      code('upstream-protocol-error'),
    );
  }
  assert.throws(
    () => new OpenSpec(root, openspecEntry, simulated(root, { '--version': '1.15.0' })),
    code('openspec-version-mismatch'),
  );
  assert.throws(
    () =>
      new OpenSpec(
        root,
        openspecEntry,
        simulated(root, {
          list: JSON.stringify({ root: { path: root, source: 'default-store' }, changes: [] }),
        }),
      ),
    code('unsupported-root-source'),
  );
  assert.throws(
    () =>
      new OpenSpec(
        root,
        openspecEntry,
        simulated(root, {
          list: JSON.stringify({
            root: { path: path.dirname(root), source: 'nearest' },
            changes: [],
          }),
        }),
      ),
    code('upstream-root-mismatch'),
  );
  assert.throws(
    () => new OpenSpec(root, path.join(root, 'missing.js')),
    code('invalid-tool-entry'),
  );
});
test('启动 / 超时 / 信号 / 非零退出保留实际进程错误', () => {
  const root = fixture(sandbox());
  for (const result of [
    {
      status: null,
      signal: null,
      stdout: '',
      stderr: '',
      error: Object.assign(new Error('spawn failed'), { code: 'ENOENT' }),
    },
    {
      status: null,
      signal: 'SIGTERM' as const,
      stdout: 'partial',
      stderr: '',
      error: Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' }),
    },
    { status: null, signal: 'SIGTERM' as const, stdout: '', stderr: 'terminated' },
    { status: 9, signal: null, stdout: 'error-body', stderr: 'actual-error' },
  ]) {
    assert.throws(
      () => new OpenSpec(root, openspecEntry, () => result),
      (error: unknown) => {
        assert.ok(error instanceof MendiError);
        assert.equal(error.code, 'upstream-execution-failed');
        const details = error.details as Record<string, unknown>;
        assert.equal(details.stdout, result.stdout);
        assert.equal(details.exitCode, result.status);
        return true;
      },
    );
  }
});
test('status 的关联 / schema / 必要字段验证', () => {
  const root = fixture(sandbox());
  const list = JSON.stringify({
    root: { path: root, source: 'nearest' },
    changes: [{ name: 'proof-entry' }],
  });
  const valid = {
    changeName: 'proof-entry',
    root: { path: root, source: 'nearest' },
    schemaName: 'spec-driven',
    actionContext: { mode: 'repo-local' },
    isPlanningComplete: false,
    artifacts: [{ id: 'proposal', status: 'ready' }],
  };
  const upstream = new OpenSpec(
    root,
    openspecEntry,
    simulated(root, { list, status: JSON.stringify(valid) }),
  );
  assert.equal(upstream.status('proof-entry').artifacts[0].status, 'ready');
  assert.throws(() => upstream.status('missing'), code('change-not-found'));
  assert.throws(
    () =>
      new OpenSpec(
        root,
        openspecEntry,
        simulated(root, { list, status: JSON.stringify({ ...valid, schemaName: 'custom' }) }),
      ).status('proof-entry'),
    code('unsupported-change-context'),
  );
  for (const output of [
    { ...valid, schemaName: undefined },
    { ...valid, changeName: 'other' },
    { ...valid, artifacts: [{}] },
  ]) {
    assert.throws(
      () =>
        new OpenSpec(
          root,
          openspecEntry,
          simulated(root, { list, status: JSON.stringify(output) }),
        ).status('proof-entry'),
      code('upstream-protocol-error'),
    );
  }
  assert.throws(
    () =>
      new OpenSpec(
        root,
        openspecEntry,
        simulated(root, { list, status: JSON.stringify({ ...valid, artifacts: null }) }),
      ).status('proof-entry'),
    code('upstream-protocol-error'),
  );
});
