import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const repository = 'D:/Projects/MenDi';
const target = path.join(repository, 'tests/fixtures/d03-c-vue-project');
const evidence = path.join(repository, '.mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/023-apply/artifacts');
const pnpm = 'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
const openspec = 'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const stable = 'D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi';
if (!fs.existsSync(target)) throw new Error('只能接续当前已创建的目标。');
const started = performance.now();
const first = JSON.parse(fs.readFileSync(path.join(evidence, 'pnpm-version.json'), 'utf8'));
const firstLog = fs.statSync(path.join(evidence, 'pnpm-version.json'));
const remainingAtResume = 600_000 - (Date.now() - firstLog.mtimeMs + first.durationMs + 1000);
if (remainingAtResume <= 0) throw new Error('原准备预算已耗尽，不继续。');
const deadline = started + remainingAtResume;
save('resume-budget-lock-update.json', {remainingAtResumeMs: remainingAtResume, basis: '原首命令日志时间、耗时及额外 1000ms 保守扣减；保留诊断间隔，不重新获得 10 分钟'});
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
      env: cwd === repository ? { ...process.env, pnpm_config_verify_deps_before_run: 'error' }
        : { ...process.env, CI: '1', STORYBOOK_DISABLE_TELEMETRY: '1', pnpm_config_verify_deps_before_run: 'error' },
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


const pkgFile=path.join(target,'package.json');
const pkg=JSON.parse(fs.readFileSync(pkgFile,'utf8'));
delete pkg.devDependencies.oxlint;
delete pkg.devDependencies['eslint-plugin-oxlint'];
fs.writeFileSync(pkgFile,JSON.stringify(pkg,null,2)+'\n');
const eslintFile=path.join(target,'eslint.config.ts');
let eslint=fs.readFileSync(eslintFile,'utf8');
eslint=eslint.replace("import pluginOxlint from 'eslint-plugin-oxlint'\n",'');
eslint=eslint.replace("  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),\n\n",'');
fs.writeFileSync(eslintFile,eslint);
await run('install-eslint-only-lock-updated', [pnpm,'install','--no-frozen-lockfile'], target);
await run('format-eslint-only', [pnpm,'exec','prettier','--write','package.json','eslint.config.ts','pnpm-lock.yaml'], target);
await run('target-check-eslint-only', [pnpm,'run','check'], target);
await run('root-check-normal', [pnpm,'run','check'], repository);
save('preparation-summary.json', {
 target, node:process.version, platform:process.platform, commands,
 budgetMs:600000, remainingAtResumeMs:remainingAtResume, fixDurationMs:performance.now()-started,
 environmentPrepared:true, businessImplemented:false,
 limits:['官方空壳，无计数器或 stories；只含最小 Storybook 框架配置',
 '没有目标 Delivery / Change 或实际阶段',
 '完整 stories / browser 尚未执行；没有正式 Full Test 或 MCP',
 '保留 tools help 缺配置及根环境误用的失败输出与修正',
 '官方 --eslint 模板的 Oxlint 直接依赖曾被装入；未执行该工具，现移除直接依赖和 lint 插件，仅用 ESLint',
 '准备续程按原日志保守扣减剩余预算，跨进程不声称继承了原单调时钟',
 '预算 / 取消负例未完成，1.2 保持待做',
 '使用既有 store / 浏览器缓存，不认证冷安装'],
});
console.log('PREPARATION_COMPLETE');
