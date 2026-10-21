// D05-C independent Reviewer 029 Propose checks:
// fixed Author and prior Review, source/sp e c/task semantic cross-check,
// current real opt-in collection seams, and independent OpenSpec 1.14.1 validate.
// This script reads product and submitted history only. It writes only own artifacts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=process.cwd(),here=path.dirname(fileURLToPath(import.meta.url));
const change='reduce-redundant-proof-inputs-and-artifacts';
const changeDir='openspec/changes/'+change;
const runRoot='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/'+change;
const files={
 author:runRoot+'/028-propose/run.md',
 prior:runRoot+'/027-review-explore/run.md',
 proposal:changeDir+'/proposal.md',
 design:changeDir+'/design.md',
 tasks:changeDir+'/tasks.md',
 actionSpec:changeDir+'/specs/action-runs/spec.md',
 testSpec:changeDir+'/specs/test-execution/spec.md',
 currentExecution:'src/application/test-execution.ts',
 currentStore:'src/adapters/test-store.ts',
 currentGroup:'src/adapters/group-store.ts',
 fixtureHelpers:'tests/helpers.ts',
 fixtureTest:'tests/test-support.ts',
 fixtureGroup:'tests/group-support.ts',
 roadmap:'mendi-foundation-and-delivery-roadmap.md',
 prevQuiet:runRoot+'/027-review-explore/artifacts/quiet-log-proof.json',
 prevHistory:runRoot+'/027-review-explore/artifacts/historical-audit.json',
 prevTests:runRoot+'/027-review-explore/artifacts/log-test-result.json'
} as const;
type Key=keyof typeof files;
const content=Object.fromEntries(Object.entries(files).map(([key,file])=>[key,fs.readFileSync(path.join(repo,file),'utf8')])) as Record<Key,string>;
function hit(key:Key,fragment:string):{file:string,line:number,text:string}{
 const lines=content[key].split(/\r?\n/);
 const index=lines.findIndex(t=>t.includes(fragment));
 assert.ok(index>=0,'missing '+fragment+' in '+files[key]);
 return {file:files[key],line:index+1,text:lines[index].trim()};
}
assert.match(content.author,/actionType: propose/);
assert.match(content.author,/status: completed/);
assert.match(content.author,/previousRunRef: .*\/027-review-explore\/run\.md/);
assert.match(content.prior,/verdict: approved/);
const tasks=(content.tasks.match(/^- \[ \] \d+\.\d+ /gm)??[]).length;
assert.equal(tasks,14);
const quiet=JSON.parse(content.prevQuiet) as {quiet:{sizes:number[],afterZeroLogRemoval:{outcome:string,code:string},restoredStatus:string}};
const history=JSON.parse(content.prevHistory) as {counts:{requests:number,reports:number,missingReportResults:Record<string,number>}};
const prevTests=JSON.parse(content.prevTests) as {exitCode:number,testCounts:{tests:number,pass:number,fail:number}};
assert.equal(quiet.quiet.afterZeroLogRemoval.outcome,'unknown');
assert.equal(quiet.quiet.afterZeroLogRemoval.code,'ENOENT');
assert.equal(quiet.quiet.restoredStatus,'passed');
assert.ok(quiet.quiet.sizes.includes(0));
assert.equal(history.counts.requests,114);
assert.equal(history.counts.reports,107);
assert.deepEqual(history.counts.missingReportResults,{'not-run':3,'interrupted':2,'unknown':2});
assert.deepEqual([prevTests.exitCode,prevTests.testCounts.tests,prevTests.testCounts.pass,prevTests.testCounts.fail],[0,3,3,0]);

const coverage=[
 {id:'C01-first-version-physical-double-logs',links:[
  hit('proposal','保留物理 stdout/stderr 日志，包括 0B'),
  hit('design','首版保留两个物理日志，零字节也不省'),
  hit('testSpec','真实 stdout.log 和 stderr.log 文件'),
  hit('currentExecution','for (const ref of [record.stdoutRef, record.stderrRef])'),
  hit('currentStore','const logRefs = [record.stdoutRef, record.stderrRef]'),
  hit('tasks','3.1 保持现有 TestExecution formatVersion=1')]},
 {id:'C02-opt-in-collectors-are-real-not-invented',links:[
  hit('proposal','tests/helpers.ts'),
  hit('design','### D3. 对现有调用者定向适配'),
  hit('fixtureHelpers','if (process.env.MENDI_TEST_EVIDENCE_DIR)'),
  hit('fixtureTest','if (process.env.MENDI_TEST_EVIDENCE_DIR)'),
  hit('fixtureGroup','const evidence = process.env.MENDI_APPLY_EVIDENCE'),
  hit('fixtureGroup','const dir = process.env.MENDI_TEST_EVIDENCE_DIR'),
  hit('tasks','2.3 在 tests/group-support.ts')]},
 {id:'C03-source-stability-before-ephemeral-cleanup',links:[
  hit('actionSpec','Only source is disposable temporary target'),
  hit('design','必须**在目标被清理前**'),
  hit('tasks','1.3 验证来源不可持久读取时')]},
 {id:'C04-distinct-real-executions-not-text-deduplicated',links:[
  hit('design','不同真实执行即使 stdout 文本相同'),
  hit('tasks','不同执行即使输出一致也分别保留'),
  hit('actionSpec','Real failure and unknown observations require source')]},
 {id:'C05-formal-groups-and-history-retained',links:[
  hit('proposal','保留全部正式 groups-v1 必需证据'),
  hit('testSpec','Formal group evidence is exempt from deduplication loss'),
  hit('currentGroup','for (const ref of [child.stdoutRef, child.stderrRef])'),
  hit('tasks','3.3 验证 groups-v1 必需组'),
  hit('actionSpec','Submitted evidence remains immutable across optimization')]},
 {id:'C06-owner-scope-version-no-global-size-gate',links:[
  hit('roadmap','不增加文件数量/容量限制'),
  hit('proposal','无全局文件数量/字节门槛'),
  hit('design','不建泛化证据数据库'),
  hit('tasks','4.1 以明确可复现 fixture 对比')]},
 {id:'C07-legacy-quiet-and-unknown-fail-closed',links:[
  hit('testSpec','Empty required log is unexpectedly missing'),
  hit('testSpec','Log output is partial or lifecycle is uncertain'),
  hit('tasks','3.2 运行并根据实际影响补充 test-log-integrity')]},
 {id:'C08-independent-handoff-separates-approval',links:[
  hit('tasks','Workflow follow-up'),
  hit('proposal','D05-D amend/supplement'),
  hit('design','交独立 Review Apply 后再按 Owner 分别授权 Archive')]}
];
const bin='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
assert.ok(fs.existsSync(bin));
const args=[bin,'validate',change,'--strict','--json'];
const result=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8',windowsHide:true,timeout:95000,maxBuffer:8*1024*1024});
const validData={command:[process.execPath,...args],exitCode:result.status,signal:result.signal,error:result.error?String(result.error):null,stdout:result.stdout??'',stderr:result.stderr??''};
fs.writeFileSync(path.join(here,'openspec-validation.json'),JSON.stringify(validData,null,2)+'\n',{flag:'wx'});
assert.equal(result.status,0,'Strict OpenSpec must be valid for approval');
const parsed=JSON.parse(result.stdout) as {summary?:{totals?:{items:number,passed:number,failed:number}}};
assert.equal(parsed.summary?.totals?.failed,0);
assert.equal(parsed.summary?.totals?.passed,1);
const output={
 recordedAt:new Date().toISOString(),
 fixedAuthorRun:files.author,
 priorIndependentReview:files.prior,
 purpose:'Propose-only independent static source/contract crosswalk plus current strict OpenSpec and preceding independent runtime proof readback',
 decisionEvidence:'First version keeps actual empty stdout/stderr physical files and changes only future opt-in test/proof evidence collectors',
 coverage:coverage.map(item=>({id:item.id,passed:true,links:item.links})),
 taskCount:tasks,deltaCapabilities:['action-runs','test-execution'],
 previousProof:{quietAfterMissing:'unknown/ENOENT',quietRestored:'passed',D04HistoricalRequests:114,D04HistoricalReports:107,logIntegrityTests:3},
 strictOpenSpec:{exitCode:validData.exitCode,raw:'openspec-validation.json'},
 implementationStarted:false,
 boundedOpenPoints:[
  'Design is normative for stages, but executable automation is confined to selected opt-in collector seams plus method guidance; do not present it as a universal runtime-enforced mandatory evidence layer',
  'Proof preservation must not rely only on a disposable target; exact late cleanup and interrupted write behavior require actual Apply scenario validation',
  'Do not assert new compaction savings or seven-append product impact before implementation; this is a proposal review'
 ]
};
fs.writeFileSync(path.join(here,'proof-results.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'reviewer-propose-proof-passed',coverage:coverage.length,taskCount:tasks,openSpecExit:result.status,artifact:'proof-results.json'},null,2));