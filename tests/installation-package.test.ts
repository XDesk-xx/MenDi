import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { installationPackage } from '../scripts/installation-package.ts';
import { prepareInstallation } from '../scripts/prepare-installation-tests.ts';
import { sandbox, repository } from './helpers.ts';

function archive(version: string, name = 'mendi') {
  const root = sandbox();
  fs.mkdirSync(path.join(root, 'package'));
  fs.writeFileSync(path.join(root, 'package/package.json'), JSON.stringify({ name, version }));
  const file = path.join(root, 'mendi-0.2.0.tgz');
  const result = spawnSync('tar', ['-czf', file, '-C', root, 'package'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return file;
}
test('真实tgz内部身份优先于文件名；保留明确包身份与指纹', () => {
  const selected = archive('0.2.0');
  const actual = installationPackage(selected, { name: 'mendi', version: '0.2.0' });
  assert.equal(actual.version, '0.2.0');
  assert.equal(actual.sha256.length, 64);
  assert.throws(
    () => installationPackage(archive('0.1.0'), { name: 'mendi', version: '0.2.0' }),
    /包版本/,
  );
  assert.throws(
    () => installationPackage(archive('0.2.0', 'other'), { name: 'mendi', version: '0.2.0' }),
    /包名/,
  );
});
test('显式旧包在安装或证据目录创建之前拒绝，不回退其他包', () => {
  const evidence = path.join(sandbox(), 'not-created');
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'mendi-package-admission-'));
  const installation = path.join(parent, 'not-created');
  const expected = JSON.parse(fs.readFileSync(path.join(repository, 'package.json'), 'utf8'));
  const wrong = archive(expected.version === '0.1.0' ? '0.0.0' : '0.1.0');
  assert.throws(() => prepareInstallation(evidence, installation, wrong), /包版本/);
  assert.equal(fs.existsSync(evidence), false);
  assert.equal(fs.existsSync(installation), false);
});
