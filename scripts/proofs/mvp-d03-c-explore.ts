import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repository = process.cwd();
const evidence = process.argv[2];
if (!evidence || !path.isAbsolute(evidence) || fs.existsSync(evidence))
  throw new Error('需要一个尚不存在的绝对 artifacts 子目录。');
const expected = path.join(
  repository,
  '.mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/016-explore/artifacts',
);
if (!path.resolve(evidence).startsWith(expected + path.sep)) throw new Error('证据路径越界。');
fs.mkdirSync(evidence, { recursive: true });
fs.mkdirSync(path.join(repository, '.tmp'), { recursive: true });
const sandbox = fs.mkdtempSync(path.join(repository, '.tmp/d03-c-016-empty-'));
const target = path.join(sandbox, 'vue-environment-probe');
const pnpm = 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
const openspec = 'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const mendi = 'D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi';
const commands: { name: string; status: number | null; durationMs: number }[] = [];
function run(name: string, args: string[], cwd: string, expectedStatus = 0) {
  const started = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...process.env,
      CI: '1',
      STORYBOOK_DISABLE_TELEMETRY: '1',
      pnpm_config_verify_deps_before_run: 'error',
    },
  });
  const durationMs = Date.now() - started;
  fs.writeFileSync(
    path.join(evidence, `${name}.json`),
    JSON.stringify(
      {
        command: [process.execPath, ...args],
        cwd,
        status: result.status,
        durationMs,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error?.message,
        signal: result.signal,
      },
      null,
      2,
    ),
  );
  commands.push({ name, status: result.status, durationMs });
  console.log(`${name}: exit=${result.status}, ${durationMs}ms`);
  if (result.status !== expectedStatus) throw new Error(`${name} 失败，见保存的原始输出。`);
  return result.stdout;
}

run(
  'create-vue',
  [pnpm, 'dlx', 'create-vue@3.24.0', '--ts', '--bare', 'vue-environment-probe'],
  sandbox,
);
run(
  'openspec-init',
  [openspec, 'init', '--tools', 'codex', '--profile', 'core', '--no-animation'],
  target,
);
run('openspec-list', [openspec, 'list', '--json'], target);
const methodFile = path.join(target, '.agents/skills/openspec-explore/SKILL.md');
const method = fs.readFileSync(methodFile, 'utf8');
if (!method.includes('generatedBy: "1.14.1"')) throw new Error('上游生成基线不符。');
fs.writeFileSync(path.join(evidence, 'target-explore-method.md'), method);
const generatedPackage = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
fs.writeFileSync(
  path.join(evidence, 'scaffold-package.json'),
  JSON.stringify(generatedPackage, null, 2),
);
const pkg = {
  name: 'd03-c-environment-probe',
  private: true,
  type: 'module',
  packageManager: 'pnpm@11.22.0',
  scripts: {
    typecheck: 'vue-tsc --noEmit',
    'build-storybook': 'storybook build --disable-telemetry',
  },
  dependencies: { vue: '3.5.43', 'naive-ui': '2.45.3' },
  devDependencies: {
    '@storybook/vue3-vite': '10.6.1',
    storybook: '10.6.1',
    vite: '8.3.0',
    '@vitejs/plugin-vue': '6.0.7',
    'vue-tsc': '3.3.13',
    typescript: '5.9.3',
    '@types/node': '22.20.5',
  },
};
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify(pkg, null, 2));
fs.writeFileSync(
  path.join(target, 'vite.config.ts'),
  "import { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\nexport default defineConfig({ plugins: [vue()] });\n",
);
fs.writeFileSync(
  path.join(target, 'pnpm-workspace.yaml'),
  "packages:\n  - '.'\nallowBuilds:\n  esbuild: true\nminimumReleaseAgeExclude:\n  - '@vue/language-core@3.3.13'\n  - 'vue-tsc@3.3.13'\n",
);
fs.writeFileSync(
  path.join(target, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        skipLibCheck: true,
        types: ['node'],
      },
      include: ['src/**/*.ts', 'src/**/*.vue', '.storybook/**/*.ts'],
    },
    null,
    2,
  ),
);
fs.mkdirSync(path.join(target, '.storybook'));
fs.writeFileSync(
  path.join(target, '.storybook/main.ts'),
  "import type { StorybookConfig } from '@storybook/vue3-vite';\nconst config: StorybookConfig = { framework: '@storybook/vue3-vite', stories: ['../src/**/*.stories.ts'], addons: [] };\nexport default config;\n",
);
const probe =
  '<script setup lang="ts">\nimport { NButton } from "naive-ui";\n</script>\n<template><NButton disabled>环境检查</NButton></template>\n';
fs.writeFileSync(path.join(target, 'src/DependencyProbe.vue'), probe);
fs.writeFileSync(
  path.join(target, 'src/DependencyProbe.stories.ts'),
  "import type { Meta, StoryObj } from '@storybook/vue3-vite';\nimport DependencyProbe from './DependencyProbe.vue';\nexport default { title: 'Environment/NaiveButton', component: DependencyProbe } satisfies Meta<typeof DependencyProbe>;\nexport const Static: StoryObj<typeof DependencyProbe> = {};\n",
);
const inputs = path.join(evidence, 'inputs');
const copyInputs = () =>
  fs.cpSync(target, inputs, {
    recursive: true,
    filter: (file) =>
      !path
        .relative(target, file)
        .split(path.sep)
        .some((part) =>
          ['node_modules', 'storybook-static', '.git', '.agents', '.claude'].includes(part),
        ),
  });
copyInputs();
run('install', [pnpm, 'install'], target);
copyInputs();
run('vue-typecheck', [pnpm, 'run', 'typecheck'], target);
fs.writeFileSync(
  path.join(target, 'src/DependencyProbe.vue'),
  probe.replace('</script>', 'const environmentTypeProbe: string = 1;\n</script>'),
);
try {
  const output = run('vue-typecheck-negative', [pnpm, 'run', 'typecheck'], target, 2);
  if (!output.includes('DependencyProbe.vue') || !output.includes('TS2322'))
    throw new Error('未检查 .vue 类型错误。');
} finally {
  fs.writeFileSync(path.join(target, 'src/DependencyProbe.vue'), probe);
}
run('vue-typecheck-restored', [pnpm, 'run', 'typecheck'], target);
run('storybook-build', [pnpm, 'run', 'build-storybook'], target);
run('storybook-version', [pnpm, 'exec', 'storybook', '--version'], target);
run('storybook-tools-help', [pnpm, 'exec', 'storybook', 'tools', '--help'], target);
run('stable-mendi-help', [path.join(mendi, 'dist/drivers/cli.js'), '--help'], sandbox);
copyInputs();
fs.writeFileSync(
  path.join(evidence, 'summary.json'),
  JSON.stringify(
    {
      purpose: '空工程与无业务 Vue / Naive UI / Storybook 构建可行性，不是计数器实施或产品验收',
      target,
      stableMendi: mendi,
      openspec,
      platform: os.platform(),
      node: process.version,
      commands,
      outcome: 'supported-with-limits',
      limits: [
        '未实现计数器',
        '未执行浏览器渲染、有限交互测试或正式 Full Test',
        '未开启目标 Delivery 或 Change',
        '未验证 MCP、新会话或独立审核',
        '显式联网安装，不认证冷安装或其他平台',
      ],
    },
    null,
    2,
  ),
);
console.log(`受控输入与原始输出：${evidence}`);
