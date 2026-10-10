import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { managedPath } from './paths.ts';
import { MendiError, errorInfo, object } from '../core/errors.ts';
import { testKinds, type TestKind } from '../core/test-execution.ts';

export function readTestEntries(root: string) {
  let pkg: Record<string, unknown>;
  try {
    pkg = object(
      JSON.parse(fs.readFileSync(managedPath(root, 'package.json'), 'utf8')),
      'package.json',
    );
  } catch (error) {
    throw new MendiError(
      'test-package-unavailable',
      '无法读取目标 package.json，未运行。',
      errorInfo(error),
    );
  }
  const scripts = pkg.scripts === undefined ? {} : object(pkg.scripts, 'scripts');
  const mendi = pkg.mendi === undefined ? {} : object(pkg.mendi, 'mendi');
  const mapping = mendi.tests === undefined ? {} : object(mendi.tests, 'mendi.tests');
  const entries = testKinds.map((kind) => {
    const name = Object.hasOwn(mapping, kind) ? mapping[kind] : `test:${kind}`;
    const valid = typeof name === 'string' && /^[A-Za-z0-9][A-Za-z0-9:_-]*$/.test(name);
    const script = valid ? scripts[name] : undefined;
    const available = valid && typeof script === 'string' && script.trim().length > 0;
    return {
      kind,
      scriptName: name,
      scriptText: script,
      available,
      reason: available
        ? null
        : valid
          ? 'script 缺失、为空或不是文本。'
          : '映射必须是直接 script 名。',
    };
  });
  return { packageManager: pkg.packageManager, entries };
}
export function selectedTest(root: string, kind: TestKind) {
  const { packageManager, entries } = readTestEntries(root);
  const entry = entries.find((item) => item.kind === kind)!;
  if (!entry.available) throw new MendiError('test-entry-unavailable', '选定入口未运行。', entry);
  return {
    scriptName: entry.scriptName as string,
    scriptText: entry.scriptText as string,
    packageManager,
  };
}
export function testEnvironment(policy: 'error' | 'warn', source = process.env): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(source))
    if (
      ![
        'corepack_enable_network',
        'corepack_enable_auto_pin',
        'pnpm_config_verify_deps_before_run',
      ].includes(key.toLowerCase())
    )
      env[key] = value;
  env.COREPACK_ENABLE_NETWORK = '0';
  env.COREPACK_ENABLE_AUTO_PIN = '0';
  env.pnpm_config_verify_deps_before_run = policy;
  return env;
}
export function capturePnpm(root: string, entry: string, args: string[], policy: 'error' | 'warn') {
  const command = {
    executable: process.execPath,
    args: [entry, ...args],
    dependencyPolicy: policy,
  };
  const result = spawnSync(command.executable, command.args, {
    cwd: root,
    env: testEnvironment(policy),
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  return {
    ...command,
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error ? errorInfo(result.error) : null,
  };
}
export function validatePnpm(root: string, supplied: string, packageManager: unknown): string {
  if (process.platform !== 'win32' || !process.versions.node.startsWith('22.'))
    throw new MendiError('test-environment-unsupported', '首版仅支持 Windows / Node 22，未运行。');
  if (
    packageManager !== undefined &&
    (typeof packageManager !== 'string' ||
      !/^pnpm@11\.22\.0(?:\+[A-Za-z0-9._-]+)?$/.test(packageManager))
  )
    throw new MendiError(
      'test-package-manager-conflict',
      'packageManager 必须兼容 pnpm 11.22.0，未运行。',
    );
  if (
    !path.isAbsolute(supplied) ||
    !/\.(?:js|cjs|mjs)$/.test(supplied) ||
    !fs.statSync(supplied).isFile()
  )
    throw new MendiError('test-tool-unavailable', '要求既有绝对 pnpm JavaScript 入口，未运行。');
  const entry = fs.realpathSync(supplied);
  const version = capturePnpm(root, entry, ['--version'], 'error');
  if (version.exitCode !== 0 || version.signal || version.stdout.trim() !== '11.22.0')
    throw new MendiError('test-tool-version', 'pnpm 真实版本预检失败，未运行。', version);
  return entry;
}
