import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

export interface InstallationSession {
  installation: string;
  installedRoot: string;
  installedCLI: string;
  targets: string[];
  openspecEntry: string;
  evidence: string;
}
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function within(root: string, candidate: string) {
  const relative = path.relative(root, candidate);
  return !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep);
}

export function prepareInstallation(evidence: string, installation: string) {
  assert.ok(
    path.isAbsolute(evidence) && path.isAbsolute(installation),
    '需要证据与新安装的绝对目录',
  );
  evidence = path.resolve(evidence);
  installation = path.resolve(installation);
  assert.ok(!fs.existsSync(evidence) && !fs.existsSync(installation), '不覆盖已占用目录');
  assert.ok(
    !within(repository, installation) && !within(installation, repository),
    '安装须在开发仓库外',
  );
  // 最近存在的父目录也须在仓库外，避免新路径经过 junction 返回开发仓库。
  let parent = path.dirname(installation);
  while (!fs.existsSync(parent)) parent = path.dirname(parent);
  assert.ok(
    !within(fs.realpathSync(repository), fs.realpathSync(parent)),
    '安装父目录不能回到开发仓库',
  );
  const pnpm =
    process.env.MENDI_UI_PNPM_BIN ?? 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
  const openspecEntry =
    'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
  fs.mkdirSync(evidence, { recursive: true });
  const env = {
    ...process.env,
    OPENSPEC_TELEMETRY: '0',
    COREPACK_ENABLE_NETWORK: '0',
  };
  function run(entry: string, args: string[], cwd: string) {
    const result = spawnSync(process.execPath, [entry, ...args], {
      cwd,
      env:
        entry === pnpm
          ? env
          : {
              ...env,
              XDG_CONFIG_HOME: path.join(evidence, 'global-config'),
              XDG_DATA_HOME: path.join(evidence, 'global-data'),
            },
      encoding: 'utf8',
      windowsHide: true,
      shell: false,
      timeout: 180_000,
      maxBuffer: 16 * 1024 * 1024,
    });
    fs.appendFileSync(
      path.join(evidence, 'prepare-commands.jsonl'),
      JSON.stringify({
        executable: process.execPath,
        entry,
        args,
        cwd,
        exitCode: result.status,
        signal: result.signal,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error?.message,
      }) + '\n',
    );
    assert.equal(result.status, 0, result.error?.message ?? result.stdout + result.stderr);
    assert.equal(result.signal, null);
    return result.stdout;
  }
  assert.equal(run(pnpm, ['--version'], repository).trim(), '11.22.0');
  // 正常根工程环境，不继承 UI helper 的目标 verifyDepsBeforeRun=error 策略。
  run(pnpm, ['run', 'build'], repository);
  run(pnpm, ['pack', '--pack-destination', evidence], repository);
  fs.mkdirSync(installation, { recursive: true });
  fs.writeFileSync(
    path.join(installation, 'package.json'),
    JSON.stringify({ name: 'mendi-installation-acceptance', private: true, type: 'module' }),
  );
  run(
    pnpm,
    ['add', '--offline', '--ignore-scripts', path.join(evidence, 'mendi-0.1.0.tgz')],
    installation,
  );
  const installedRoot = fs.realpathSync(path.join(installation, 'node_modules/mendi'));
  assert.ok(!within(fs.realpathSync(repository), installedRoot));
  const installedCLI = path.join(installedRoot, 'dist/drivers/cli.js');
  fs.mkdirSync(path.join(repository, '.tmp'), { recursive: true });
  const sandbox = fs.mkdtempSync(path.join(repository, '.tmp/mendi-installation-'));
  const targets = ['alpha', 'beta'].map((name) => path.join(sandbox, name));
  for (const [index, target] of targets.entries()) {
    fs.cpSync(path.join(repository, 'tests/fixtures/d03-b-project'), target, { recursive: true });
    fs.renameSync(path.join(target, 'package-input.json'), path.join(target, 'package.json'));
    run(openspecEntry, ['init', '--tools', 'codex', '--profile', 'core', '--no-animation'], target);
    run(openspecEntry, ['new', 'change', 'local-note-work'], target);
    fs.writeFileSync(
      path.join(target, 'scope.json'),
      JSON.stringify({
        goal: '稳定安装与真实目标方法接入验收',
        plannedChanges: [{ slot: 'A', title: '离线笔记', dependsOn: [] }],
      }),
    );
    run(
      installedCLI,
      [
        'delivery',
        'open',
        '--project',
        target,
        '--id',
        `installed-${index}`,
        '--title',
        '受控安装验收',
        '--scope',
        'scope.json',
        '--role',
        'author',
        '--actor',
        'installation-author',
        '--json',
      ],
      installation,
    );
    run(
      installedCLI,
      [
        'change',
        'bind',
        '--project',
        target,
        '--change',
        'local-note-work',
        '--slot',
        'A',
        '--json',
      ],
      installation,
    );
  }
  const session: InstallationSession = {
    installation,
    installedRoot,
    installedCLI,
    targets,
    openspecEntry,
    evidence,
  };
  fs.writeFileSync(path.join(evidence, 'session.json'), JSON.stringify(session, null, 2) + '\n', {
    flag: 'wx',
  });
  console.log(JSON.stringify(session, null, 2));
  return session;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [evidence, installation] = process.argv.slice(2);
  assert.ok(
    evidence && installation,
    '用法：node scripts/prepare-installation-tests.ts <新证据绝对目录> <仓库外新安装绝对目录>',
  );
  prepareInstallation(evidence, installation);
}
