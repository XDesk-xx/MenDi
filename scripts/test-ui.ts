import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { testEnvironment, validatePnpm } from '../src/adapters/test-entries.ts';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const uiFixture = path.join(repository, 'tests/fixtures/storybook-project');
export const pnpmEntry =
  process.env.MENDI_UI_PNPM_BIN ?? 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
export const uiEnv = {
  ...testEnvironment('error'),
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
  STORYBOOK_DISABLE_TELEMETRY: '1',
};

export function uiCommand(
  cwd: string,
  args: string[],
  output?: string,
  env: NodeJS.ProcessEnv = uiEnv,
) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
    timeout: 180_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (output) {
    fs.mkdirSync(output, { recursive: true });
    fs.appendFileSync(
      path.join(output, `commands-${process.pid}.jsonl`),
      JSON.stringify({
        executable: process.execPath,
        cwd,
        args,
        exitCode: result.status,
        signal: result.signal,
        error: result.error?.message,
        stdout: result.stdout,
        stderr: result.stderr,
      }) + '\n',
    );
  }
  if (result.error) throw result.error;
  return result;
}

export function verifyUITarget(target: string, output?: string) {
  const required = [
    'package.json',
    'pnpm-lock.yaml',
    '.storybook/main.ts',
    'tsconfig.json',
    'node_modules/.modules.yaml',
    'node_modules/storybook/dist/bin/dispatcher.js',
    'node_modules/typescript/bin/tsc',
    'node_modules/playwright/package.json',
  ];
  for (const input of required)
    if (!fs.existsSync(path.join(target, input)))
      throw new Error(
        `UI 必要输入未准备：${path.join(target, input)}；请显式准备目标依赖，不自动安装。`,
      );
  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  validatePnpm(target, pnpmEntry, pkg.packageManager);
  for (const args of [
    [path.join(target, 'node_modules/typescript/bin/tsc'), '--noEmit'],
    [path.join(target, 'browser-ready.ts')],
  ]) {
    const result = uiCommand(target, args, output);
    if (result.status !== 0)
      throw new Error(
        `UI 准备检查失败，未执行场景；类型 / 浏览器须显式修正。\n${result.stdout}${result.stderr}`,
      );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(path.join(repository, '.tmp'), { recursive: true });
  const output =
    process.env.MENDI_UI_EVIDENCE_DIR ?? fs.mkdtempSync(path.join(repository, '.tmp/mendi-ui-'));
  try {
    verifyUITarget(uiFixture, output);
    if (!process.env.MENDI_UI_TARGETS_DIR)
      throw new Error(
        'UI 沙箱未准备：先显式运行 prepare:ui-tests 并设置 MENDI_UI_TARGETS_DIR；不自动安装。',
      );
    const build = uiCommand(
      repository,
      [path.join(repository, 'node_modules/typescript/bin/tsc')],
      output,
    );
    if (build.status !== 0) throw new Error(build.stdout + build.stderr);
    const tests = fs
      .readdirSync(path.join(repository, 'tests/ui'))
      .filter((file) => file.endsWith('.test.ts'))
      .map((file) => path.join(repository, 'tests/ui', file));
    const result = uiCommand(repository, ['--test', '--test-concurrency=1', ...tests], undefined, {
      ...uiEnv,
      MENDI_UI_EVIDENCE_DIR: output,
    });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
