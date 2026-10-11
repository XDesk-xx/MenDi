import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const repository = 'D:/Projects/MenDi';
const target = path.join(repository, 'tests/fixtures/d03-c-vue-project');
const evidence = path.join(repository, '.mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/023-apply/artifacts');
const pnpm = 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
const openspec = 'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const stable = 'D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi';
if (fs.existsSync(target)) throw new Error('目标必须尚不存在，不能覆盖。');
const started = performance.now();
const deadline = started + 600_000;
let stoppedReason: string | undefined;
let active: AbortController | undefined;
const commands: { name: string; exitCode: number | null; durationMs: number }[] = [];
process.on('SIGINT', () => { stoppedReason ??= 'cancelled'; active?.abort('cancelled'); });
function save(name: string, value: unknown) {
  fs.writeFileSync(path.join(evidence, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}
async function run(name: string, args: string[], cwd: string, expected = 0): Promise<string> {
  if (stoppedReason) throw new Error(stoppedReason + '：不继续后续步骤。');
  const remaining = deadline - performance.now();
  if (remaining <= 0) { stoppedReason = 'group-timeout'; throw new Error(stoppedReason); }
  const began = performance.now();
  const allowance = Math.min(300_000, remaining);
  const stepDeadline = began + allowance;
  const control = new AbortController();
  active = control;
  console.log(name + ': start, remaining=' + Math.floor(remaining) + 'ms');
  return new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: '1', STORYBOOK_DISABLE_TELEMETRY: '1',
        pnpm_config_verify_deps_before_run: 'error' },
    });
    let stdout = '', stderr = '', closed = false, settled = false;
    let launchError: string | undefined;
    let stop: { status: number | null; stdout: string; stderr: string } | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => control.abort(remaining <= 300_000 ? 'group-timeout' : 'step-timeout'), allowance);
    const finish = (code: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true; clearTimeout(timer); clearTimeout(closeTimer); active = undefined;
      control.signal.removeEventListener('abort', cancel);
      if (!stoppedReason && performance.now() >= stepDeadline) stoppedReason = 'late-timeout';
      const durationMs = performance.now() - began;
      save(name + '.json', { executable: process.execPath, args, cwd, pid: child.pid,
        remainingMs: remaining, allowanceMs: allowance, durationMs, stdout, stderr,
        exitCode: code, signal, closed, stop, stoppedReason, launchError,
        stopConfirmed: stop ? stop.status === 0 && closed : closed });
      commands.push({ name, exitCode: code, durationMs });
      console.log(name + ': exit=' + code + ', closed=' + closed + ', ' + Math.round(durationMs) + 'ms');
      if (stoppedReason || launchError || !closed || code !== expected) {
        reject(new Error(name + ': ' + (stoppedReason ?? launchError ?? 'unexpected exit ' + code)));
      } else resolve(stdout);
    };
    function cancel() {
      stoppedReason ??= String(control.signal.reason ?? 'cancelled');
      if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
      const result = spawnSync(path.join(process.env.SystemRoot ?? 'C:/Windows', 'System32/taskkill.exe'),
        ['/PID', String(child.pid), '/T', '/F'], {
          encoding: 'utf8', windowsHide: true, shell: false, timeout: 5000,
        });
      stop = { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
      closeTimer = setTimeout(() => {
        child.stdout.destroy(); child.stderr.destroy(); child.unref(); finish(null, null);
      }, 5000);
    }
    control.signal.addEventListener('abort', cancel, { once: true });
    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
    child.once('error', (error) => { launchError = error.message; });
    child.once('close', (code, signal) => { closed = true; finish(code, signal); });
  });
}
await run('pnpm-version', [pnpm, '--version'], repository);
await run('create-vue', [pnpm, 'dlx', 'create-vue@3.24.0', '--ts', '--bare', '--eslint', '--prettier', 'd03-c-vue-project'], path.dirname(target));
const packagePath = path.join(target, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
save('scaffold-package.json', pkg);
pkg.packageManager = 'pnpm@11.22.0';
pkg.dependencies = { ...pkg.dependencies, vue: '3.5.43', 'naive-ui': '2.45.3' };
delete pkg.devDependencies['vite-plugin-vue-devtools'];
Object.assign(pkg.devDependencies, {
  '@storybook/vue3-vite': '10.6.1', '@storybook/addon-vitest': '10.6.1',
  storybook: '10.6.1', vite: '8.3.0', '@vitejs/plugin-vue': '6.0.7',
  'vue-tsc': '3.3.13', typescript: '5.9.3', '@types/node': '22.20.5',
  vitest: '4.1.11', '@vitest/browser-playwright': '4.1.11',
  playwright: '1.60.0', jiti: '2.6.1',
});
pkg.scripts = {
  dev: 'vite', build: 'vite build', preview: 'vite preview',
  'typecheck': 'vue-tsc --noEmit',
  'format:check': 'prettier --check .',
  lint: 'eslint . --no-fix',
  check: 'pnpm format:check && pnpm lint && pnpm typecheck',
};
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync(path.join(target, 'pnpm-workspace.yaml'),
  "packages:\n  - '.'\nallowBuilds:\n  esbuild: true\nminimumReleaseAgeExclude:\n  - '@vue/language-core@3.3.13'\n  - 'vue-tsc@3.3.13'\n");
fs.writeFileSync(path.join(target, 'vite.config.ts'),
  "import { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\nexport default defineConfig({ plugins: [vue()] });\n");
fs.writeFileSync(path.join(target, 'tsconfig.json'), JSON.stringify({
  extends: '@vue/tsconfig/tsconfig.dom.json',
  compilerOptions: {
    target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler',
    strict: true, skipLibCheck: true, noEmit: true,
    types: ['node', 'vite/client'], erasableSyntaxOnly: true,
    verbatimModuleSyntax: true, allowImportingTsExtensions: true,
  },
  include: ['env.d.ts', 'src/**/*.ts', 'src/**/*.vue', '*.ts',
    '.storybook/**/*.ts', 'scripts/**/*.ts', 'tests/**/*.ts'],
  exclude: ['node_modules', 'dist', 'storybook-static', '.tmp', '.mendi', 'openspec', '.agents'],
}, null, 2) + '\n');
const eslintName = fs.readdirSync(target).find((name) => /^eslint\.config\.(ts|js|mjs)$/.test(name));
if (!eslintName) throw new Error('缺少官方 ESLint 配置。');
const originalEslint = fs.readFileSync(path.join(target, eslintName), 'utf8');
save('scaffold-eslint.json', { filename: eslintName, body: originalEslint });
const eslintBody = originalEslint.replace(/globalIgnores\(\[[\s\S]*?\]\)/,
  "globalIgnores(['**/dist/**', '**/coverage/**', 'storybook-static/**', '.tmp/**', '.mendi/**', 'openspec/**', '.agents/**'])");
if (eslintBody === originalEslint) throw new Error('需要核对官方 ESLint 排除配置，不盲改。');
fs.writeFileSync(path.join(target, eslintName), eslintBody);
if (eslintName !== 'eslint.config.ts') fs.renameSync(path.join(target, eslintName), path.join(target, 'eslint.config.ts'));
fs.writeFileSync(path.join(target, '.prettierignore'),
  'node_modules/\ndist/\ncoverage/\nstorybook-static/\n.tmp/\n.mendi/\nopenspec/\n.agents/\n');
const rootConfigFile = path.join(repository, 'tsconfig.tests.json');
const rootConfig = JSON.parse(fs.readFileSync(rootConfigFile, 'utf8'));
rootConfig.exclude.push('tests/fixtures/d03-c-vue-project');
fs.writeFileSync(rootConfigFile, JSON.stringify(rootConfig, null, 2) + '\n');
await run('install', [pnpm, 'install'], target);
await run('chromium-prepare', [pnpm, 'exec', 'playwright', 'install', 'chromium'], target);
await run('openspec-init', [openspec, 'init', '--tools', 'codex', '--profile', 'core', '--no-animation'], target);
fs.writeFileSync(path.join(target, 'AGENTS.md'), `# Vue 目标协作约定

- 该目标从官方空工程创建，当前只准备环境；计数器业务须在目标方案独立批准后实施。
- 使用 Vue 3、Composition API、TypeScript 和 script setup；App 仅作挂载面，组件与 Storybook 共用实现。
- OpenSpec、Storybook 与测试资产属于本目标。稳定工具、当前入口和实际进度见 README；不借父工程或旧 .tmp 的依赖、实现和证据。
- Author 不切 Reviewer 自签；新 Change 激活须由 Owner 原始消息包含 owner 授权 并明确目标。阶段审核和会话启动按明确交接，不自动派 Agent。
- 目标 Open / Archive / 正式 Full Test / Close、Git 与生产操作各守授权；当前仅授权准备，不预造阶段结果。
- 检查只覆盖维护文件；历史 Run / artifacts / verdict 保留，不格式化、不补证。未知或停止未确认保留现场，不清锁、不自动重跑。
- 初始 Author 必须保留确实未执行的完整 stories / browser 验收，供合法 continuing 后的新 Author 恢复。
`);
fs.writeFileSync(path.join(target, 'openspec/config.yaml'), `schema: spec-driven
context: |
  Language: Chinese
  本目标是唯一从官方空壳创建的 Vue + Naive UI 计数器工程，当前环境准备尚未进入业务阶段。
  使用 Composition API / script setup / TypeScript；App 挂载真实组件，Storybook 使用同一组件。
  稳定入口和实际检查见目标 README，角色与授权遵循目标 AGENTS。
  业务须先在本目标形成 proposal / specs / design / tasks 并经实际独立 Reviewer 批准，不能根据父工程批准代写 verdict。
rules:
  proposal:
    - 只规划一个真实计数器，禁止重复创建已绑定 Change。
  design:
    - 说明默认初值、已有数值、加一、重置到零和禁用的行为与真实验证方式。
    - 工具和服务属于目标，有限脚本只承担该目标固定集合，不能接管阶段或审核。
  tasks:
    - 每项写明实际完成依据；完整 stories 与首次完整 browser 留待真实新 Author。
operations:
  apply:
    guidance:
      - 按当前真实任务实施，仅做必要开发子集；不提前执行留待的完整业务验收。
      - 到期或取消停止后项，以实际进程关闭和日志确认收尾。
`);
fs.writeFileSync(path.join(target, 'README.md'), `# D03-C Vue 目标

从不存在的目录运行官方 create-vue@3.24.0 --ts --bare --eslint --prettier 创建。
当前保留官方空壳；尚无 CounterPanel、stories、目标 Change 或 Delivery。
Naive UI / Storybook / Vitest / Playwright 只准备依赖，尚未认证实际交互。

## 稳定入口

- MenDi：D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi/dist/drivers/cli.js
- OpenSpec：D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js
- pnpm：C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js
- 目标：D:/Projects/MenDi/tests/fixtures/d03-c-vue-project

均以 node 调用；OpenSpec cwd 为本目标，MenDi 显式传 --project 本目标绝对路径。
环境为 Windows / Node 22.23.2 / pnpm 11.22.0 / OpenSpec 1.14.1。
安装和运行保持 CI=1、pnpm_config_verify_deps_before_run=error。
先按本目标锁文件显式 install，再显式 exec playwright install chromium；不在测试中自动下载。

## 当前工程入口

- check：只读格式、基础 ESLint 与 vue-tsc 真正类型检查。
- typecheck：包含 src 的 TS / Vue、根 TS 配置，以及后续 .storybook / scripts / tests 中的 TS。
- build：Vite 应用构建。
- dev / preview：持续服务，需由启动者显式管理，仅自己持有的活跃进程可停止。

本目录拥有独立 pnpm workspace、锁文件和目标检查。
历史 .mendi / OpenSpec 材料、生成方法、依赖、生成物不参与批量格式化。
Storybook 配置、stories、verify:stories / browser / full 和有限预算脚本后续按受审目标方案落地，
不能因依赖已装就声明业务或正式 Full Test 已通过。MCP 未启用。

## 下一步

根 D03-C 当前 Apply 记录位于：
.mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/023-apply/run.md
（相对 MenDi 根目录，包含本次准备日志）。

目标 Delivery Open、唯一 implement-naive-counter / VUE-COUNTER 激活、真实独立审核和新 Author
会话均待明确授权 / 交接；当前没有执行。预算、取消与有限停止的短时工程验证待后续落实，
不会提前消耗完整 stories / browser 留待任务。
`);
await run('format-target', [pnpm, 'exec', 'prettier', '--write', '.'], target);
await run('target-check', [pnpm, 'run', 'check'], target);
const appFile = path.join(target, 'src/App.vue');
const app = fs.readFileSync(appFile);
try {
  fs.writeFileSync(appFile, app.toString().replace('<script setup lang="ts">', '<script setup lang="ts">\nconst d03EnvironmentTypeProbe: string = 1;'));
  const output = await run('sfc-typecheck-negative', [pnpm, 'run', 'typecheck'], target, 2);
  if (!output.includes('App.vue') || !output.includes('TS2322')) throw new Error('没有检出 SFC 类型错误。');
} finally { fs.writeFileSync(appFile, app); }
await run('sfc-typecheck-restored', [pnpm, 'run', 'typecheck'], target);
await run('empty-app-build', [pnpm, 'run', 'build'], target);
await run('storybook-version', [pnpm, 'exec', 'storybook', '--version'], target);
await run('storybook-tools-help', [pnpm, 'exec', 'storybook', 'tools', '--help'], target);
await run('openspec-list', [openspec, 'list', '--json'], target);
await run('stable-mendi-status', [path.join(stable, 'dist/drivers/cli.js'), 'status', '--project', target, '--json'], stable);
await run('stable-mendi-next', [path.join(stable, 'dist/drivers/cli.js'), 'next', '--project', target, '--json'], stable);
await run('root-check', [pnpm, 'run', 'check'], repository);
save('preparation-summary.json', {
  target, node: process.version, platform: process.platform, durationMs: performance.now() - started,
  budgetMs: 600_000, stoppedReason, commands, prepared: true,
  limits: ['只有官方空壳，无计数器和 stories', '没有目标 Delivery / Change 或真实阶段',
    '没有运行交互 / 浏览器业务集合或正式 Full Test', '未认证 MCP / 新会话',
    '预算取消负例待后续，当前仅正常准备路径', '使用既有 store / 浏览器缓存，不认证冷安装'],
});
console.log('PREPARATION_COMPLETE');
