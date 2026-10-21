// Independent D05-D Reviewer 042: Propose-only contract and current source crosswalk.
// No edit to fixed Author, product code, earlier Runs or already-approved history.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parse} from 'yaml';
const here=path.dirname(fileURLToPath(import.meta.url));
const parent='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/';
const delta='openspec/changes/latest-run-supplement-and-limited-amend/';
const references={
 author:parent+'041-revise-propose/run.md',
 previousReview:parent+'040-review-propose/run.md',
 previousAuthor:parent+'039-revise-propose/run.md',
 earlierReview:parent+'038-review-propose/run.md',
 ownerReview:parent+'036-review-explore/run.md',
 oldRejected:parent+'035-review-explore/run.md',
 ownerReceipt:parent+'036-review-explore/artifacts/authorization-proof.json',
 proposal:delta+'proposal.md',
 design:delta+'design.md',
 spec:delta+'specs/run-post-submission/spec.md',
 action:delta+'specs/action-runs/spec.md',
 workspace:delta+'specs/delivery-workspace/spec.md',
 tasks:delta+'tasks.md',
 sourceChange:'src/core/actions.ts',
 sourceDelivery:'src/core/delivery-runs.ts',
 sourceArguments:'src/drivers/arguments.ts',
 policy:'AGENTS.md'
} as const;
type Source=keyof typeof references;
const documents=Object.fromEntries(Object.entries(references).map(([key,file])=>[key,fs.readFileSync(file,'utf8')])) as Record<Source,string>;
function location(which:Source,part:string) {
 const lines=documents[which].split(/\r?\n/);
 const i=lines.findIndex(x=>x.includes(part));
 assert.ok(i>=0,'Missing '+part+' in '+references[which]);
 return {path:references[which],line:i+1,excerpt:lines[i].trim().slice(0,550)};
}
const header=(key:Source)=> {
 const match=/^---\r?\n([\s\S]*?)\r?\n---/.exec(documents[key]);
 assert.ok(match,'No YAML header: '+references[key]);
 return parse(match[1]) as Record<string,unknown>;
};
const submitted=header('author'), prior=header('previousReview'), earlier=header('earlierReview'),
 owner=header('ownerReview'), rejected=header('oldRejected');
assert.equal(submitted.actionType,'revise-propose');
assert.equal(submitted.role,'author');
assert.equal(submitted.run,'041');
assert.equal(submitted.status,'completed');
assert.equal(submitted.actionStatus,'completed');
assert.equal(submitted.outcome,'complete');
assert.equal(submitted.revisesRunRef,references.previousAuthor);
assert.equal(submitted.previousRunRef,references.previousReview);
assert.equal(prior.verdict,'changes-requested');
assert.equal(earlier.verdict,'changes-requested');
assert.equal(owner.verdict,'approved');
assert.equal(rejected.verdict,'rejected');
const authorization=JSON.parse(documents.ownerReceipt) as {
 ownerAuthorizationOriginal:string,checked:{exact:boolean,scope:boolean},scope:string
};
assert.equal(authorization.checked.exact,true);
assert.equal(authorization.checked.scope,true);
assert.ok(authorization.ownerAuthorizationOriginal.includes('owner 授权'));
assert.ok(authorization.scope.includes('MenDi'));
assert.ok(documents.policy.includes('连续字样'));
const taskCount=(documents.tasks.match(/^- \[ \] \d+\.\d+ /gm)??[]).length;
assert.equal(taskCount,16);
assert.equal((documents.tasks.match(/^- \[x\]/gmi)??[]).length,0);
const checks=[
 {id:'F4-mode-caller-explicit',refs:[
  location('proposal','--kind presentation-only --body'),
  location('proposal','--kind unreviewed-comment --comment'),
  location('design','--kind presentation-only|unreviewed-comment'),
  location('spec','kind=presentation-only|unreviewed-comment'),
  location('tasks','--kind presentation-only|unreviewed-comment')
 ]},
 {id:'F4-mutually-exclusive-input',refs:[
  location('design','缺 kind、未知 kind、缺匹配输入、同时提供 body/comment'),
  location('spec','Missing or conflicting mode input'),
  location('tasks','缺/未知 kind'),
  location('tasks','body/comment 同时提供')
 ]},
 {id:'F4-same-text-different-mode',refs:[
  location('spec','Same text has different explicit amendment modes'),
  location('spec','因实质正文替换被拒'),
  location('design','同文本走 presentation-only 且变更事实就拒绝'),
  location('tasks','使用同一“审核已批准”文本')
 ]},
 {id:'F4-idempotency-includes-kind',refs:[
  location('design','同 ID、同 kind、同输入才可幂等读回'),
  location('spec','One amend per Run with explicit request identity'),
  location('spec','同 ID 改模式/输入及第二不同 ID 都拒绝'),
  location('tasks','同 ID 换 kind/内容'),
  location('tasks','第二不同 ID')
 ]},
 {id:'F1-time-provenance-maintained',refs:[
  location('proposal','sourceClaimedCollectedAt'),
  location('design','sourceTimeTrust=unverified'),
  location('spec','MUST 标为'),
  location('tasks','虚假过去日期的 verified 声明被拒')
 ]},
 {id:'F2-one-confirmed-amend',refs:[
  location('design','至多一次 confirmed amend'),
  location('spec','首版每 Run 至多一次已确认 amend'),
  location('tasks','单 Run 只有一个 confirmed amend')
 ]},
 {id:'F3-nonauthoritative-comment',refs:[
  location('design','authoritative=false'),
  location('spec','Unreviewed comment asserts a new approval'),
  location('workspace','Free aftercare comment contains a false approval claim'),
  location('tasks','unreviewed-comment 永远不进入正式摘要')
 ]},
 {id:'eligibility-Change-Delivery-and-failure',refs:[
  location('design','manifest.deliveryRunRef'),
  location('spec','Delivery reviewer is current without active Change'),
  location('action','Current delivery run is not the archived change run'),
  location('workspace','Current Run shows confirmed post-submission'),
  location('design','intent.json'),
  location('spec','Interrupted between evidence and receipt'),
  location('tasks','对 intent、复制、提交、读回、锁释放')
 ]},
 {id:'no-external-write-old-Run-immutability',refs:[
  location('proposal','不授权触及 DreMo'),
  location('design','run.md'),
  location('spec','原 Run 字节'),
  location('tasks','不得触碰真实 DreMo'),
  location('tasks','核对 033/034/035/036 原始历史')
 ]}
];
const contract=[
 {input:'kind=presentation-only; body contains changed审核 result',expected:'reject before confirmed; never fall back to comment',source:'run-post-submission/spec.md:54-56'},
 {input:'kind=unreviewed-comment; comment contains same words',expected:'accept only as authoritative=false; original result/next unchanged',source:'run-post-submission/spec.md:54-56'},
 {input:'no kind or kind=unknown',expected:'reject before writes',source:'run-post-submission/spec.md:58-60'},
 {input:'presentation-only with comment or both inputs',expected:'reject before writes',source:'run-post-submission/spec.md:58-60'},
 {input:'unreviewed-comment with body or both inputs',expected:'reject before writes',source:'run-post-submission/spec.md:58-60'},
 {input:'same request ID, same kind and bytes',expected:'only return confirmed receipt; no duplicate',source:'run-post-submission/spec.md:66-68'},
 {input:'same request ID, different kind/bytes',expected:'reject without overwriting confirmed slot',source:'run-post-submission/spec.md:66-68'},
 {input:'second request ID on already confirmed Run',expected:'reject; one confirmed amend per Run',source:'run-post-submission/spec.md:66-68'},
 {input:'body with safe single-space normalization',expected:'presentation-only may save display derivative but run.md unchanged',source:'run-post-submission/spec.md:46-48'}
];
for(const c of checks)assert.ok(c.refs.length>=3);
const openspec='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const args=[openspec,'validate','latest-run-supplement-and-limited-amend','--strict','--json'];
const result=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:10*1024*1024});
const evidence={recordedAt:new Date().toISOString(),command:[process.execPath,...args],
 exitCode:result.status,signal:result.signal,stdout:result.stdout??'',stderr:result.stderr??'',error:result.error?String(result.error):null};
fs.writeFileSync(path.join(here,'openspec-validation.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
assert.equal(evidence.exitCode,0);
const validation=JSON.parse(evidence.stdout) as {summary:{totals:{items:number,passed:number,failed:number}}};
assert.equal(validation.summary.totals.items,1);
assert.equal(validation.summary.totals.passed,1);
assert.equal(validation.summary.totals.failed,0);
const report={
 reviewedAt:new Date().toISOString(),
 fixedAuthor:references.author,
 previousReviewer:references.previousReview,
 preservedEarlierReview:references.earlierReview,
 ownerReview:references.ownerReview,
 scope:'D05-D Propose contract review only, no supplement/amend product executed',
 approvalBasis:'All 040 F4 mode routing and F1-F3 safeguards concretized in actual Proposal, Design, three delta Specs, and 16 Tasks; no remaining planning blocker found',
 taskCount,allTasksPending:true,
 crosswalk:checks,
 explicitContractMatrix:contract,
 validation:{exitCode:0,totals:validation.summary.totals,raw:'openspec-validation.json'},
 limitations:[
  'Contract matrix is planning verification, NOT a runtime execution test of unimplemented CLI',
  'Independent future Apply must actually exercise Change + Delivery cases, CLI negative routing, lock and resume/partial readbacks',
  'Old submitted Runs, Owner decisions and earlier Reviewer verdicts are read-only; no global history/timestamp hash chain'
 ]
};
fs.writeFileSync(path.join(here,'reviewer-results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:'planning-contract-verified',fixedAuthor:references.author,
  checks:checks.length,contractCases:contract.length,pendingTasks:taskCount,
  openspec:validation.summary.totals},null,2));