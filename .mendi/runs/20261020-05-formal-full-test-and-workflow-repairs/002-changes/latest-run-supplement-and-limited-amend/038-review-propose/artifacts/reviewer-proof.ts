// Independent D05-D 038 Reviewer planning-proof. No Author/source mutations.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const rr='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/';
const cc='openspec/changes/latest-run-supplement-and-limited-amend/';
const files={
 author:rr+'037-propose/run.md',reauth:rr+'036-review-explore/run.md',
 oldRejected:rr+'035-review-explore/run.md',auth:rr+'036-review-explore/artifacts/authorization-proof.json',
 proposal:cc+'proposal.md',design:cc+'design.md',tasks:cc+'tasks.md',
 spec:cc+'specs/run-post-submission/spec.md',actionSpec:cc+'specs/action-runs/spec.md',
 workspaceSpec:cc+'specs/delivery-workspace/spec.md',
 changeRecord:'src/core/actions.ts',deliveryRecord:'src/core/delivery-runs.ts'
} as const;
type K=keyof typeof files;
const data=Object.fromEntries(Object.entries(files).map(([key,ref])=>[key,fs.readFileSync(ref,'utf8')])) as Record<K,string>;
function cite(key:K,text:string) {
 const lines=data[key].split(/\r?\n/);
 const idx=lines.findIndex(line=>line.includes(text));
 assert.ok(idx>=0,'missing '+text+' in '+files[key]);
 return{path:files[key],line:idx+1,excerpt:lines[idx].trim().slice(0,400)};
}
function recordBlock(source:string,start:string,end:string) {
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a);
 return source.slice(a,b);
}
assert.ok(data.author.includes('status: completed'));
assert.ok(data.author.includes('previousRunRef: '+files.reauth));
assert.ok(data.reauth.includes('verdict: approved'));
assert.ok(data.oldRejected.includes('verdict: rejected'));
const auth=JSON.parse(data.auth) as {ownerAuthorizationOriginal:string,checked:{exact:boolean,scope:boolean}};
assert.equal(auth.ownerAuthorizationOriginal.includes('owner 授权'),true);
assert.equal(auth.checked.exact,true);
assert.equal(auth.checked.scope,true);
const tasks=(data.tasks.match(/^- \[ \] \d+\.\d+ /gm)??[]).length;
assert.equal(tasks,16);
const ch=recordBlock(data.changeRecord,'export interface RunRecord {','export function actionDefinition(');
const de=recordBlock(data.deliveryRecord,'export interface DeliveryRunRecord {','export function parseDeliveryRun(');
assert.equal(/\b(submittedAt|approvedAt|reviewedAt)\b/.test(ch),false);
assert.equal(/\b(submittedAt|approvedAt|reviewedAt)\b/.test(de),false);
const crosswalk=[
 {id:'authorization',refs:[cite('reauth','owner 授权 D05-D'),cite('oldRejected','verdict: rejected')]},
 {id:'current-two-pointers',refs:[cite('design','### D1.'),cite('spec','Delivery reviewer is current without active Change')]},
 {id:'immutable-run',refs:[cite('design','### D3.'),cite('spec','Readable aftercare without rewriting submitted history')]},
 {id:'recovery',refs:[cite('design','### D4.'),cite('tasks','4.2 对 intent')]},
 {id:'semantic-whitelist',refs:[cite('spec','Unsafe typo or hyperlink rewrite'),cite('tasks','3.2 测试拒绝任意自由错字')]},
 {id:'scope',refs:[cite('proposal','不授权触及 DreMo 035'),cite('tasks','5.4 核对 033/034/035/036')]}
];
const issues=[
 {id:'F1',severity:'high',finding:'Unverified collectedAt/provenance vs promised no backdating',refs:[
  cite('design','证据真实采集时间'),cite('spec','来源时间倒填成旧批准前'),
  cite('changeRecord','export interface RunRecord'),cite('deliveryRecord','export interface DeliveryRunRecord')],
  required:'Specify system-generated aftercare recordedAt, treat supplied collectedAt as claimed unless source independently proves it; existing Change and Delivery records lack submittedAt/approvedAt. Refuse impossible verified-before/after claims, add fake backdate/unavailable baseline tests. No global timestamp migration.'},
 {id:'F2',severity:'medium',finding:'Amend CLI/requestId and multiple amendment identity unspecified',refs:[
  cite('design','run amend --project'),cite('design','校验 requestId'),
  cite('design','aftercare/amend'),cite('tasks','1.1 实现两个专用'),
  cite('spec','Repeated confirmed operation')],
  required:'Give run amend an explicit requestId interface, decide reject second distinct amend or append immutable per-request entries, test exact replay, changed payload same ID, second distinct amend.'},
 {id:'F3',severity:'medium',finding:'Post-submission free addendum cannot be mechanically certified non-material as claimed',refs:[
  cite('design','单独的事后附注'),cite('design','附注只能阐明非审核事实'),
  cite('spec','Explicit post-submission addendum'),cite('tasks','3.1 构造保守可机械验证')],
  required:'Constrain note shape mechanically or always treat arbitrary note as untrusted post-decision author commentary, never as certified review/failure correction; test a false approved/failure-overriding note cannot affect certified readback/next.'}
];
const cli='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const argv=[cli,'validate','latest-run-supplement-and-limited-amend','--strict','--json'];
const r=spawnSync(process.execPath,argv,{cwd:process.cwd(),encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:10*1024*1024});
const output={command:[process.execPath,...argv],exitCode:r.status,signal:r.signal,stdout:r.stdout??'',stderr:r.stderr??'',error:r.error?String(r.error):null};
fs.writeFileSync(path.join(here,'openspec-validation.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
assert.equal(output.exitCode,0);
const parsed=JSON.parse(output.stdout) as {summary:{totals:{items:number,passed:number,failed:number}}};
assert.deepEqual(parsed.summary.totals,{items:1,passed:1,failed:0});
const receipt={recordedAt:new Date().toISOString(),fixedAuthor:files.author,reauthorizedBy:files.reauth,
 originalRejectedPreserved:files.oldRejected,scope:'Planning review; not implemented product',
 taskCount:tasks,deltaSpecs:['run-post-submission','action-runs','delivery-workspace'],
 approvedCrosswalk:crosswalk,findings:issues,openspec:{exitCode:0,raw:'openspec-validation.json'},
 limits:['No product supplement/amend writer exists; these are proposal gaps, not proven product exploits',
 'No existing submitted Run/source was modified','Prior technical and authorization reviews remain independently valid as history']};
fs.writeFileSync(path.join(here,'reviewer-results.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verified:true,ownerNewAuthorization:true,taskCount:tasks,contractAreas:crosswalk.length,
 unresolvedFindings:issues.map(x=>x.id),strictValidation:parsed.summary.totals},null,2));