import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

export const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const openspecEntry =
  'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
export function isolatedEnv(parent: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    XDG_CONFIG_HOME: path.join(parent, 'global-config'),
    XDG_DATA_HOME: path.join(parent, 'global-data'),
    OPENSPEC_TELEMETRY: '0',
  };
}
export function command(entry: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd,
    env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30_000,
  });
  assert.equal(result.error, undefined, result.error?.message);
  const record = {
    executable: process.execPath,
    entry,
    args,
    cwd,
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  };
  if (process.env.MENDI_TEST_EVIDENCE_DIR) {
    fs.mkdirSync(process.env.MENDI_TEST_EVIDENCE_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(process.env.MENDI_TEST_EVIDENCE_DIR, `commands-${process.pid}.jsonl`),
      JSON.stringify(record) + '\n',
    );
  }
  return result;
}
export function cli(args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  return command(path.join(repository, 'dist/drivers/cli.js'), args, cwd, env);
}
export function prepareChange(root: string, env: NodeJS.ProcessEnv, id = 'proof-entry'): void {
  const result = command(openspecEntry, ['new', 'change', id, '--json'], root, env);
  assert.equal(result.status, 0, result.stderr);
}
export function scopeFile(root: string): string {
  const destination = path.join(root, 'scope.json');
  fs.copyFileSync(path.join(repository, 'tests/fixtures/delivery-scope.json'), destination);
  return destination;
}
export function sandbox(): string {
  fs.mkdirSync(path.join(repository, '.tmp'), { recursive: true });
  return fs.mkdtempSync(path.join(repository, '.tmp/mendi-apply-'));
}
export function fixture(parent: string, name = 'minimal-project', folder = name): string {
  const target = path.join(parent, folder);
  fs.cpSync(path.join(repository, 'tests/fixtures', name), target, { recursive: true });
  return fs.realpathSync(target);
}
export function snapshot(target: string): Record<string, string> {
  const result: Record<string, string> = {};
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink())
        result[path.relative(target, file)] = 'link:' + fs.readlinkSync(file);
      else if (entry.isDirectory()) walk(file);
      else
        result[path.relative(target, file)] = createHash('sha256')
          .update(fs.readFileSync(file))
          .digest('hex');
    }
  }
  walk(target);
  return result;
}
