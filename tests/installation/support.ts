import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import type { InstallationSession } from '../../scripts/prepare-installation-tests.ts';
import { isolatedEnv } from '../helpers.ts';

export function installedSession() {
  const input = process.env.MENDI_INSTALLATION_SESSION;
  assert.ok(input && path.isAbsolute(input), '先显式准备本轮安装session');
  const session = JSON.parse(fs.readFileSync(input, 'utf8')) as InstallationSession;
  assert.ok(session.packagePath && session.packageVersion && session.packageSha256);
  const actual = JSON.parse(
    fs.readFileSync(path.join(session.installedRoot, 'package.json'), 'utf8'),
  );
  assert.equal(actual.name, 'mendi');
  assert.equal(actual.version, session.packageVersion);
  return session;
}

export function installedCommand(session: InstallationSession, label: string) {
  const evidence = path.join(session.evidence, label);
  assert.ok(!fs.existsSync(evidence), '新结果不得覆盖历史');
  fs.mkdirSync(evidence);
  return (root: string, args: string[], exit = 0) => {
    const r = spawnSync(
      process.execPath,
      [session.installedCLI, ...args, '--project', root, '--json'],
      {
        cwd: session.installation,
        env: isolatedEnv(root),
        encoding: 'utf8',
        windowsHide: true,
        timeout: 180_000,
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    fs.appendFileSync(
      path.join(evidence, 'commands.jsonl'),
      JSON.stringify({
        executable: process.execPath,
        entry: session.installedCLI,
        args,
        root,
        cwd: session.installation,
        exitCode: r.status,
        signal: r.signal,
        stdout: r.stdout,
        stderr: r.stderr,
        error: r.error?.message,
      }) + '\n',
    );
    assert.equal(r.status, exit, r.stdout + r.stderr);
    const value = JSON.parse(r.stdout);
    const id = value.run?.attempt?.executionId;
    if (id) {
      const output = path.join(evidence, id);
      if (!fs.existsSync(output)) {
        fs.mkdirSync(output);
        fs.copyFileSync(path.join(root, value.run.ref), path.join(output, 'run.md'));
        const base = path.join(root, `.mendi/delivery-groups/d01/tests/${id}`);
        for (const file of [
          'result.json',
          'stdout.log',
          'stderr.log',
          'group-request.json',
          'group-report.json',
          'group-events.jsonl',
        ])
          if (fs.existsSync(path.join(base, file)))
            fs.copyFileSync(path.join(base, file), path.join(output, file));
      }
    }
    return value;
  };
}
