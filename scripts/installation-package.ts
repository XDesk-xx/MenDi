import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

/** Inspect only the explicitly selected local distribution, before installation. */
export function installationPackage(file: string, expected: { name: string; version: string }) {
  assert.ok(path.isAbsolute(file), '候选包须为明确的本地绝对路径');
  file = fs.realpathSync(file);
  assert.ok(fs.statSync(file).isFile() && file.endsWith('.tgz'), '候选包不是tgz普通文件');
  const read = spawnSync('tar', ['-xOf', file, 'package/package.json'], {
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(read.status, 0, read.error?.message ?? read.stderr);
  const actual = JSON.parse(read.stdout) as { name: string; version: string };
  assert.equal(actual.name, expected.name, '包名与当前候选声明不符');
  assert.equal(actual.version, expected.version, '包版本与当前候选声明不符');
  return {
    file,
    name: actual.name,
    version: actual.version,
    sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  };
}
