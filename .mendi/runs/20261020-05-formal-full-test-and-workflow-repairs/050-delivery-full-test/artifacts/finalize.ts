import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { parse, stringify } from 'yaml';
import { parseProject, parseWorkspace } from '../../../../../src/core/records.ts';

const root = process.cwd();
const id = '20261020-05-formal-full-test-and-workflow-repairs';
const ref = `.mendi/runs/${id}/050-delivery-full-test/run.md`;
const art = path.join(path.dirname(ref), 'artifacts');
const manifestRef = `.mendi/delivery-groups/${id}/manifest.json`;
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
const git = (args: string[]) => execFileSync('git', args, {encoding:'utf8',windowsHide:true}).trimEnd();
const plan = read(`${art}/plan.json`);
const originalManifest = fs.readFileSync(manifestRef, 'utf8');
const manifest = JSON.parse(originalManifest);
const project = read('.mendi/project.json');
const originalRun = fs.readFileSync(ref, 'utf8');
const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(originalRun)!;
const header = parse(match[1]);
const required = ['F01-check','F02-root','F03-ui','F04-installation','F05-spec-status'];
assert.deepEqual(plan.requiredGroups, required);
assert.equal(manifest.latestRunRef, ref);
assert.equal(manifest.activeChangeId, null);
assert.equal(manifest.state, 'open');
assert.equal(manifest.recordingMode, 'manual-bootstrap');
assert.equal(header.status, 'working');
assert.equal(header.executionId, 'd05-full-test-050');
assert.equal(project.activeDeliveryId, id);
assert.equal(project.archivedChangeCount, 17);
assert.equal(manifest.changeBindings.length, 4);
for (const [index, binding] of manifest.changeBindings.entries()) {
  assert.equal(binding.state, 'archived');
  assert.equal(binding.archiveOrdinal, 14 + index);
  assert.equal(binding.changeId, plan.runRefs[index].change);
  assert.equal(binding.changeRef, plan.runRefs[index].archive);
}
const committedScope = JSON.parse(git(['show',`${plan.candidate.commit}:${manifestRef}`]));
assert.deepEqual(manifest.plannedChanges, committedScope.plannedChanges);
assert.equal(manifest.goal, committedScope.goal);
assert.equal(git(['rev-parse','HEAD']), plan.candidate.commit);
assert.equal(git(['status','--porcelain','--','src','scripts','tests','skills','openspec/specs','README.md','package.json','pnpm-lock.yaml','pnpm-workspace.yaml']), plan.candidate.workingTreeStatus);
assert.ok(fs.readFileSync('tests/fixtures/storybook-project/vitest.config.ts').equals(fs.readFileSync(`${art}/candidate-vitest-config.ts`)));
assert.ok(!fs.existsSync('.mendi/write.lock'));
assert.ok(!fs.existsSync(`${art}/summary.json`));
type Step = {label:string;exitCode:number|null;signal:string|null;error:string|null;timedOut:boolean;logs:{stdout:string;stderr:string}};
type Group = {stage:string;stageOutcome:string;expectedSteps:number;steps:Step[];counts:Record<string,number>|null;startedAt:string;finishedAt:string};
const groups = required.map((name):Group => read(`${art}/${name}.json`));
for (const [index, group] of groups.entries()) {
  assert.equal(group.stage, required[index]);
  assert.equal(group.stageOutcome, 'passed');
  assert.equal(group.steps.length, group.expectedSteps);
  for (const step of group.steps) {
    assert.equal(step.exitCode, 0);
    assert.equal(step.signal, null);
    assert.equal(step.error, null);
    assert.equal(step.timedOut, false);
    for (const log of Object.values(step.logs)) assert.ok(fs.statSync(log).isFile());
  }
  if (['F02-root','F03-ui','F04-installation'].includes(group.stage)) {
    assert.ok(group.counts && group.counts.tests > 0);
    assert.equal(group.counts.pass, group.counts.tests);
    for (const key of ['fail','cancelled','skipped','todo']) assert.equal(group.counts[key], 0);
  }
}
const stopped = read(`${art}/ui/preview/preview-stop.json`);
const postflight = read(`${art}/postflight.json`);
assert.equal(postflight.listeners.length, 0);
assert.equal(postflight.rootWriteLockExists, false);
assert.equal(stopped.confirmed, true);
assert.equal(stopped.childAndPipesClosed, true);
assert.equal(stopped.listenerUnavailable, true);
const browser = read(`${art}/ui/preview/browser/browser.json`);
assert.equal(browser.disabled, true);
assert.deepEqual(browser.pageErrors, []);
const installation = read(`${art}/installation/session.json`);
assert.equal(installation.packageVersion, '0.2.0');
assert.ok(installation.installation.replaceAll('\\','/').endsWith('/acceptance/d05-full-test-050'));
const now = new Date().toISOString();
const summary = {deliveryId:id,executionId:header.executionId,recordingMode:'manual-bootstrap',
  mode:'owner-authorized-manual-full-test',formalDeliveryTest:true,protocolClaim:'NOT product-v2 groups-v1',
  outcome:'passed',candidate:plan.candidate,repairReviewRef:plan.repairReviewRef,groups,
  actualCleanup:{previewStopRef:`${art}/ui/preview/preview-stop.json`,portsObservedAfterRef:`${art}/postflight.json`},
  previousFailuresRetained:['046','047'],priorPassReused:false,finishedAt:now,
  limitation:'本次为已授权 manual-bootstrap F01–F05；不执行 Close/Git/稳定安装/DreMo。'};
const next = {...manifest, latestRunRef:ref, stopBoundary:'delivery-close',next:{
  action:'delivery-close',status:'awaiting-owner-instruction',role:'author',runRef:ref,
  reason:`050 本次 F01–F05 全部通过，根 ${groups[1].counts!.pass}/${groups[1].counts!.tests}、UI ${groups[2].counts!.pass}/${groups[2].counts!.tests}、隔离安装 ${groups[3].counts!.pass}/${groups[3].counts!.tests}；仍为 Owner 人工正式执行。等待 Close 独立授权，不自动 Git 或发布。`,
}};
parseWorkspace(parseProject(project), next);
const finalHeader = {...header,status:'completed',actionStatus:'completed',phase:'finished',outcome:'passed',
  result:'passed',finishedAt:now,nextAction:'delivery-close',nextRole:'author'};
const body = `# D05 050 正式 Full Test：passed\n\nOwner 本次原始授权为 owner 授权 full test。根为 manual-bootstrap，本轮采用 Owner 已登记的人工正式 F01–F05 方式，没有虚构 product-v2 groups-v1 父子 Run 或迁移。候选为 HEAD ${plan.candidate.commit} 加 048/049 approved 的一行 Storybook browser.api 配置；直接副本 candidate-vitest-config.ts 与当前来源一致。046/047 原 failed 保留，本轮五组全部重新执行，不拼接旧 PASS。\n\n## 本次实际结果\n\n${groups.map(g=>`- ${g.stage}：passed；${g.steps.length}/${g.expectedSteps} 命令 exit0${g.counts?`；${g.counts.pass}/${g.counts.tests}，fail/cancelled/skipped/todo 均 0`:''}。`).join('\n')}\n\n实际起止、命令、计数、原始双物理日志见 artifacts/summary.json 与各组收据；计划及工具/端口准备见 plan.json、preflight.json 和端口排除表。UI 本次五个新沙箱、真实浏览器交互及 preview 关闭确认，正式安装测试使用新 D:/tools/mendi/acceptance/d05-full-test-050；没有覆盖稳定 current。测试顺序 F01、F03、F04、F05、F02，根测试保持 pnpm test 并发度 2，未放宽或缩减业务集合。当前必要候选在各组启动与收口读回一致，预览服务确认关闭；临时工程保留可诊断，仅本 Run 保存必要原始输出一份。\n\n本次 passed 是已授权 manual-bootstrap 正式执行事实，不认证任意未声明材料，也不是产品原生 groups-v1 写入。未执行 Close、Git commit/push、稳定安装切换、发布或 DreMo 写入；下一步等待 Owner 单独授权 delivery-close。\n`;
const lease = JSON.stringify({operation:'d05-050-full-test-finalize',pid:process.pid,token:randomUUID()});
const lock = '.mendi/write.lock';
let effects = false;
fs.writeFileSync(lock, lease, {flag:'wx'});
try {
  assert.equal(fs.readFileSync(manifestRef,'utf8'),originalManifest);
  assert.equal(fs.readFileSync(ref,'utf8'),originalRun);
  fs.writeFileSync(`${art}/summary.json`,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
  effects = true;
  fs.writeFileSync(ref,`---\n${stringify(finalHeader)}---\n\n${body}`);
  const temporary = `${manifestRef}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
  fs.renameSync(temporary,manifestRef);
  parseWorkspace(parseProject(project),read(manifestRef));
  assert.equal(read(manifestRef).next.action,'delivery-close');
  assert.equal(parse(fs.readFileSync(ref,'utf8').match(/^---\n([\s\S]*?)\n---/)![1]).outcome,'passed');
  assert.equal(fs.readFileSync(lock,'utf8'),lease);
  fs.unlinkSync(lock);
  console.log(JSON.stringify({outcome:'passed',groups:groups.map(g=>({id:g.stage,counts:g.counts})),next:next.next}));
} catch(error) {
  if(!effects && fs.readFileSync(lock,'utf8')===lease) fs.unlinkSync(lock);
  throw error;
}
