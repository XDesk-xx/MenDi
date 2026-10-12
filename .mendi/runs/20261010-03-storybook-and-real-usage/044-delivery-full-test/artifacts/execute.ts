import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { executeForeground } from '../../../../../src/adapters/test-process.ts';
import type { TestExecution } from '../../../../../src/core/test-execution.ts';

const root = process.cwd();
const dir = '.mendi/runs/20261010-03-storybook-and-real-usage/044-delivery-full-test';
const artifacts = path.join(root, dir, 'artifacts');
const manifestRef = '.mendi/delivery-groups/20261010-03-storybook-and-real-usage/manifest.json';
const stable = 'D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi/dist/';
const { acquireProjectLock, releaseProjectLock, readWorkspace } = await import(pathToFileURL(stable + 'adapters/workspace.js').href);
const { replaceManagedFile } = await import(pathToFileURL(stable + 'adapters/action-store.js').href);
const yaml = createRequire(path.join(root, 'package.json'))('yaml');
type Outcome = 'passed' | 'failed' | 'not-run' | 'interrupted' | 'unknown';
interface Step {
  id: string;
  stage: 'preparation' | 'collection';
  cwd: string;
  command: { executable: string; args: string[] };
  budgetMs: number;
  environmentOverrides: NodeJS.ProcessEnv;
}
interface CommandResult {
  id: string;
  scope: 'command';
  formalDeliveryTest: false;
  executionId: string;
  stage: string;
  command: { executable: string; args: string[]; cwd: string };
  phase: 'running' | 'finished';
  startedAt: string;
  stdoutRef: string;
  stderrRef: string;
  budgetMs: number;
  wholeGroupRemainingAtStartMs: number;
  pid?: number;
  finishedAt?: string;
  elapsedMs?: number;
  exitCode?: number | null;
  signal?: string | null;
  childAndLogPipesClosed?: boolean;
  stop?: unknown;
  launchError?: string | null;
  failure?: string | null;
  timedOut?: boolean;
  outcome?: Outcome;
}
interface State {
  executionId: string;
  scope: 'delivery';
  formalDeliveryTest: true;
  phase: 'prepared' | 'running' | 'finished';
  outcome: string;
  commands: CommandResult[];
  [key: string]: unknown;
}
const plan = JSON.parse(fs.readFileSync(path.join(artifacts, 'plan.json'), 'utf8'));
const steps: Step[] = JSON.parse(fs.readFileSync(path.join(artifacts, 'commands-declared.json'), 'utf8'));
const state: State = JSON.parse(fs.readFileSync(path.join(artifacts, 'execution.json'), 'utf8'));
assert.equal(state.phase, 'prepared');
assert.equal(plan.repairApproval.reviewHeader.verdict, 'approved');
const initial = fs.readFileSync(path.join(root, dir, 'run.md'), 'utf8');
const match = initial.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)!;
const header = yaml.parse(match[1]);
assert.equal(header.status, 'draft');
function put(ref: string, content: string) {
  const lease = acquireProjectLock(root, 'manual-044-full-test-current');
  replaceManagedFile(root, ref, content, [], 'before-entry-commit');
  readWorkspace(root, true);
  releaseProjectLock(root, lease);
}
function saveState() { put(dir + '/artifacts/execution.json', JSON.stringify(state, null, 2) + '\n'); }
function saveJson(name: string, value: unknown) { put(dir + '/artifacts/' + name, JSON.stringify(value, null, 2) + '\n'); }
function entry(next: Record<string, unknown>, fullTest?: unknown) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestRef), 'utf8'));
  manifest.latestRunRef = dir + '/run.md';
  manifest.stopBoundary = next.action;
  manifest.next = next;
  if (fullTest) manifest.fullTest = fullTest;
  put(manifestRef, JSON.stringify(manifest, null, 2) + '\n');
}
const materialPaths = ['src', 'scripts', 'skills', 'tests', 'openspec/specs', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'tsconfig.scripts.json', 'tsconfig.tests.json', 'biome.json'];
function git(args: string[]) {
  const result = spawnSync('git', ['--no-pager', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
const beforePatch = git(['diff', '--no-ext-diff', '--no-textconv', '--no-color', 'HEAD', '--', ...materialPaths]);
const beforeStatus = git(['status', '--porcelain', '--untracked-files=all', '--', ...materialPaths]);
const repairTestBefore = fs.readFileSync(path.join(root, 'tests/test-store.test.ts'));
const reviewRef = plan.repairApproval.reviewRunRef;
const reviewBefore = fs.readFileSync(path.join(root, reviewRef));
const optimizationReviewRef = plan.optimizationApproval.reviewRunRef;
const optimizationReviewBefore = fs.readFileSync(path.join(root, optimizationReviewRef));
assert.equal(git(['rev-parse', 'HEAD']).trim(), plan.basis.commit);
saveJson('material-before.json', { baselineCommit: plan.basis.commit, actualWorktreeDifferences: beforeStatus, semanticBasis: plan.basis.changes, repairReviewRef: reviewRef });
const start = performance.now();
const deadline = start + plan.budgets.wholeGroupMs;
const env: NodeJS.ProcessEnv = { ...process.env, COREPACK_ENABLE_NETWORK: '0', COREPACK_ENABLE_AUTO_PIN: '0', OPENSPEC_TELEMETRY: '0', CI: '1', PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1', STORYBOOK_DISABLE_TELEMETRY: '1', pnpm_config_verify_deps_before_run: 'warn' };
delete env.NODE_TEST_CONTEXT;
state.startedAt = new Date().toISOString();
state.wrapperPid = process.pid;
state.phase = 'running';
state.outcome = 'unknown';
saveState();
header.phase = 'running';
put(dir + '/run.md', '---\n' + yaml.stringify(header) + '---\n' + match[2].replace('prepared：固定043批准、038有效优化与原集合，尚未取得本次完整结果。', 'running：本轮从准备开始执行同一完整集合，当前命令与输出见artifacts/execution.json，尚未认证完整通过。'));
entry({ action: 'delivery-full-test', status: 'running', role: 'author', runRef: dir + '/run.md', reason: '044基于043批准的新整次原完整集合正在运行，尚无本轮终态。' });
let current: { record: CommandResult; start: number } | null = null;
let outcome: Outcome = 'passed';
let failing: unknown = null;
const heartbeat = setInterval(() => {
  if (!current) return;
  let tail = '';
  try { tail = fs.readFileSync(path.join(root, current.record.stdoutRef), 'utf8').slice(-5000).split(/\r?\n/).filter(line => /^(ok |not ok |# Subtest:|# tests |# pass |# fail |Test Files|Tests )/.test(line.trim())).slice(-2).join(' | '); } catch { /* output may not yet exist */ }
  console.log(JSON.stringify({ current: current.record.id, elapsedGroupMs: Math.round(performance.now() - start), elapsedCommandMs: Math.round(performance.now() - current.start), tail }));
}, 30000);
try {
  for (const step of steps) {
    const remaining = Math.floor(deadline - performance.now());
    if (remaining <= 0) { outcome = 'interrupted'; failing = { id: step.id, reason: '整组剩余预算为0，后项未启动' }; break; }
    const record: CommandResult = { id: step.id, scope: 'command', formalDeliveryTest: false, executionId: plan.executionId + '-' + step.id, stage: step.stage, command: { ...step.command, cwd: step.cwd }, phase: 'running', startedAt: new Date().toISOString(), stdoutRef: dir + '/artifacts/' + step.id + '.stdout.log', stderrRef: dir + '/artifacts/' + step.id + '.stderr.log', budgetMs: Math.min(step.budgetMs, remaining), wholeGroupRemainingAtStartMs: remaining };
    for (const ref of [record.stdoutRef, record.stderrRef]) fs.writeFileSync(path.join(root, ref), '', { flag: 'wx' });
    state.commands.push(record);
    current = { record, start: performance.now() };
    saveState();
    console.log(JSON.stringify({ starting: step.id, budgetMs: record.budgetMs }));
    const control = new AbortController();
    const timer = setTimeout(() => control.abort('deadline'), record.budgetMs);
    // The existing foreground adapter carries actual commands; this auxiliary
    // invocation is not admitted as a product test result.
    const invocation: TestExecution = { formatVersion: 1, executionId: '001-full', kind: 'full', projectRoot: root, cwd: root, deliveryId: plan.deliveryId, changeId: null, actorId: 'author', scope: 'command', formalDeliveryTest: false, command: { ...step.command, dependencyPolicy: 'warn' }, dependencyCheck: { executable: step.command.executable, args: [], dependencyPolicy: 'error', exitCode: 0 }, scriptName: step.id, scriptText: step.command.args.join(' '), startedAt: record.startedAt, finishedAt: null, executionState: 'running', outcome: 'unknown', exitCode: null, signal: null, pid: null, stdoutRef: record.stdoutRef, stderrRef: record.stderrRef };
    let result;
    try { result = await executeForeground(root, invocation, pid => { record.pid = pid; saveState(); }, { signal: control.signal, spawnExecution: (command, args, options) => spawn(command, args, { ...options, cwd: step.cwd, env: { ...env, ...step.environmentOverrides } }) }); }
    finally { clearTimeout(timer); }
    record.phase = 'finished';
    record.finishedAt = new Date().toISOString();
    record.elapsedMs = Math.round(performance.now() - current.start);
    record.exitCode = result.exitCode;
    record.signal = result.signal;
    record.childAndLogPipesClosed = result.closed;
    record.stop = result.stop ?? null;
    record.launchError = result.launchError ? String(result.launchError) : null;
    record.failure = result.failure ? String(result.failure) : null;
    record.timedOut = control.signal.aborted;
    record.outcome = result.failure || !result.closed || (result.stop && !result.stop.confirmed) ? 'unknown' : record.launchError ? 'not-run' : record.timedOut || result.stop?.confirmed ? 'interrupted' : result.exitCode === 0 && !result.signal ? 'passed' : 'failed';
    saveState();
    saveJson(step.id + '.result.json', record);
    console.log(JSON.stringify({ finished: step.id, outcome: record.outcome, exitCode: record.exitCode, elapsedMs: record.elapsedMs }));
    current = null;
    if (record.outcome !== 'passed') { outcome = step.stage === 'preparation' && record.outcome === 'failed' ? 'not-run' : record.outcome; failing = { id: step.id, outcome: record.outcome, stdoutRef: record.stdoutRef, stderrRef: record.stderrRef }; break; }
  }
} catch (error) {
  outcome = 'unknown';
  failing = { id: current?.record.id ?? 'local-recording', error: String(error) };
  console.log(JSON.stringify({ error: String(error) }));
} finally { clearInterval(heartbeat); }
const currentCommit = git(['rev-parse', 'HEAD']).trim();
const applicable = currentCommit === plan.basis.commit && git(['diff', '--no-ext-diff', '--no-textconv', '--no-color', 'HEAD', '--', ...materialPaths]) === beforePatch && git(['status', '--porcelain', '--untracked-files=all', '--', ...materialPaths]) === beforeStatus && fs.readFileSync(path.join(root, 'tests/test-store.test.ts')).equals(repairTestBefore) && fs.readFileSync(path.join(root, reviewRef)).equals(reviewBefore) && fs.readFileSync(path.join(root, optimizationReviewRef)).equals(optimizationReviewBefore);
state.materialApplicability = { requiresSemanticCheck: true, baselineCommit: plan.basis.commit, testedWorktree: plan.basis.changes, currentCommit, reviewedMaterialUnchangedDuringExecution: applicable };
if (outcome === 'passed' && (!applicable || state.commands.length !== steps.length)) { outcome = 'unknown'; failing = { id: 'material-readback', reason: '当前受测材料或完整执行无法确认' }; }
state.phase = 'finished';
state.outcome = outcome;
state.finishedAt = new Date().toISOString();
state.elapsedMs = Math.round(performance.now() - start);
state.failing = failing;
state.unexecutedSteps = steps.filter(step => !state.commands.some(command => command.id === step.id)).map(step => step.id);
saveState();
const counts: Record<string, unknown> = {};
for (const id of ['root-regression', 'ui-product-scenes', 'installation-handoff', 'vue-stories']) {
  const record = state.commands.find(command => command.id === id);
  if (!record) continue;
  const output = fs.readFileSync(path.join(root, record.stdoutRef), 'utf8');
  const last = (pattern: RegExp) => [...output.matchAll(pattern)].at(-1)?.[1];
  counts[id] = { tests: last(/^# tests (\d+)/gm), pass: last(/^# pass (\d+)/gm), fail: last(/^# fail (\d+)/gm), browserTests: last(/Tests\s+(\d+) passed/g), exitCode: record.exitCode };
}
saveJson('summary.json', { scope: 'delivery', formalDeliveryTest: true, executionId: plan.executionId, outcome, commands: state.commands.map(record => ({ id: record.id, outcome: record.outcome, exitCode: record.exitCode, elapsedMs: record.elapsedMs, childAndLogPipesClosed: record.childAndLogPipesClosed })), counts, failing, unexecutedSteps: state.unexecutedSteps, materialApplicability: state.materialApplicability });
const action = outcome === 'passed' ? 'delivery-close' : outcome === 'failed' ? 'delivery-repair' : outcome === 'not-run' ? 'delivery-full-test' : 'owner-resolution';
const next = { action, status: 'awaiting-owner-instruction', role: 'author', runRef: dir + '/run.md', reason: outcome === 'passed' ? '044修复后新整次原完整集合passed，D03仍open；停在Close前，等待单独授权。' : '044新整次原完整集合为' + outcome + '，保留本轮结果与未执行项，停止后续。' };
entry(next, { recordingMode: 'manual-bootstrap', scope: 'delivery', formalDeliveryTest: true, phase: 'finished', outcome, result: outcome, executionId: plan.executionId, runRef: dir + '/run.md', declarationRef: dir + '/artifacts/plan.json', resultRef: dir + '/artifacts/execution.json', testedCommit: plan.basis.commit, testedWorktree: plan.basis.changes, repairReviewRunRef: reviewRef });
saveJson('local-final-readback.json', { manifest: JSON.parse(fs.readFileSync(path.join(root, manifestRef), 'utf8')), lockAbsent: !fs.existsSync(path.join(root, '.mendi/write.lock')), currentCommit });
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const marker = '## 开发交接';
assert.ok(readme.includes(marker));
put('README.md', readme.slice(0, readme.indexOf(marker)) + marker + '\n\n当前状态读取[D03 manifest](.mendi/delivery-groups/20261010-03-storybook-and-real-usage/manifest.json)与[044新整次正式Full Test](' + dir + '/run.md)。043批准的当前修复及038有效优化已纳入当前受测工作树，八类原完整集合本轮结果为' + outcome + '，不拼接旧PASS；031失败与历史Run/verdict保持。A/B/C已归档、累计10、无活动根Change，D03仍open/manual-bootstrap。下一步' + action + '，停在该操作前；未执行Close、Git或清理。\n');
let context = fs.readFileSync(path.join(root, 'openspec/config.yaml'), 'utf8');
const contextLines = context.split(/\r?\n/).map(line => line.startsWith('  根C real-target-delivery-acceptance') ? '  根C real-target-delivery-acceptance已由030实际归档为2026-10-11-010，直接批准为029固定028，保留范围10/10。无活动根Change，044基于043批准的新整次原完整FullTest集合结果为' + outcome + '，下一步' + action + '；唯一Vue目标仍待Archive，取消收口不恢复。' : line.includes('当前必要输入见') || line.includes('当前必要输入见042') ? '  当前必要输入见044正式FullTest与Delivery manifest；044固定043批准和当前修复工作树，031失败及历史Run/verdict保持。目标记录仍只留目标目录，取消项不恢复。' : line);
context = contextLines.join('\n');
put('openspec/config.yaml', context);
const body = match[2].replace(/## 当前进展[\s\S]*$/, '## 实际结果\n\n**outcome：' + outcome + '。** 本次从头执行原声明集合，共' + state.commands.length + '/' + steps.length + '项准备与执行，整组' + (Number(state.elapsedMs) / 1000).toFixed(3) + '秒。直接批准043、原A/B/C有效快照及八类声明见 [plan](artifacts/plan.json)。受测材料是实际Git基准' + plan.basis.commit + '加当前修复及038已批准的空依赖准备优化，不声称仅提交内容。\n\n' + state.commands.map(record => '- ' + record.id + '：' + record.outcome + '，exit ' + record.exitCode + '，' + (Number(record.elapsedMs) / 1000).toFixed(3) + '秒，child及日志管道关闭=' + record.childAndLogPipesClosed + '。').join('\n') + '\n\n统计见 [summary](artifacts/summary.json)，实际父子记录见 [execution](artifacts/execution.json)，每项原始输出只保存一份。未执行项：' + ((state.unexecutedSteps as string[]).join('、') || '无') + '。' + (failing ? '停止原因：' + JSON.stringify(failing) : '全部结果来自本044，不拼接031/042/043的PASS。') + '\n\n## 适用性与交接\n\n执行期间当前受测维护材料/直接修复批准保持一致=' + applicable + '，仍需语义核对适用范围。新安装候选由本轮build/pack产生，UI和安装使用本轮新环境；Vue工程、Storybook和真实浏览器场景沿用目标原入口，不执行目标生命周期。旧批准快照只用于仍适用范围，不把自动化中的角色声明当真实独立批准。\n\n仅当前044、manifest/README/context、生成物和新环境有写入；031/042/043及以前历史、verdict、归档绑定和累计10保留，原失败现场未处置。Windows/Node22.23.2/pnpm11.22.0/OpenSpec1.14.1为本轮验证环境；不认证冷安装、MCP、其他平台或取消范围。真实失败/unknown停止，不自动重试整个执行、修复或清锁。\n\n下一步' + action + ' / Author / awaiting-owner-instruction。D03保持open/manual-bootstrap，无活动根Change；完成后停在此边界，Close、Git、清理、下一Change与子智能体均未执行。\n');
header.status = 'completed';
header.actionStatus = 'completed';
header.phase = 'finished';
header.result = outcome;
header.outcome = outcome;
header.finishedAt = state.finishedAt;
put(dir + '/run.md', '---\n' + yaml.stringify(header) + '---\n' + body);
assert.equal(JSON.parse(fs.readFileSync(path.join(artifacts, 'execution.json'), 'utf8')).outcome, outcome);
console.log(JSON.stringify({ finished: true, outcome, counts, elapsedMs: state.elapsedMs, next }));
