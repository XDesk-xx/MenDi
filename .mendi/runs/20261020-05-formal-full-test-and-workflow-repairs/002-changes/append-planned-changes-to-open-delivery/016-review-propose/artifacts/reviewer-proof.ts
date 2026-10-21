// D05-B 016 independent Reviewer Propose proof: current runtime vs proposed contract.
// READ-ONLY product code and pure in-memory scope model. Evidence files only in this Reviewer Run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { readScope } from '../../../../../../../src/core/scope.ts';
import { projectRound, readRounds, type DeliveryRound } from '../../../../../../../src/core/rounds.ts';
import { recordRound } from '../../../../../../../src/core/round-records.ts';
import { deliveryDefinition, deliveryLocation, type DeliveryRunRecord } from '../../../../../../../src/core/delivery-runs.ts';
import type { Workspace } from '../../../../../../../src/core/records.ts';

const root = process.cwd();
const artifact = path.dirname(fileURLToPath(import.meta.url));
const change='append-planned-changes-to-open-delivery';
const changeDir='openspec/changes/'+change;
const names={
 author:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/'+change+'/015-propose/run.md',
 approvedExplore:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/'+change+'/014-review-explore/run.md',
 proposal:changeDir+'/proposal.md',
 design:changeDir+'/design.md',
 tasks:changeDir+'/tasks.md',
 workspace:changeDir+'/specs/delivery-workspace/spec.md',
 actionSpec:changeDir+'/specs/action-runs/spec.md',
 verification:changeDir+'/specs/delivery-verification/spec.md',
 lifecycle:changeDir+'/specs/delivery-lifecycle/spec.md',
 productionFull:'src/application/delivery-full-test.ts',
 productionGroup:'src/application/group-attempt.ts',
 productionRecord:'src/core/delivery-runs.ts',
 roundRecord:'src/core/round-records.ts'
} as const;
type Key=keyof typeof names;
const docs=Object.fromEntries(Object.entries(names).map(([key,ref])=>[key,fs.readFileSync(path.join(root,ref),'utf8')])) as Record<Key,string>;
function line(key:Key, needle:string) {
 const no=docs[key].split(/\r?\n/).findIndex(v=>v.includes(needle));
 assert.ok(no>=0,'missing '+key+': '+needle);
 return no+1;
}
const fixedAuthor=names.author;
assert.match(docs.author,/actionType: propose/);
assert.match(docs.author,/status: completed/);
assert.match(docs.approvedExplore,/verdict: approved/);
const tasks=(docs.tasks.match(/^- \[ \] \d+\.\d+ /gm)??[]).length;
assert.equal(tasks,15);

const caseLine=line('actionSpec','#### Scenario: Full test follows multiple archived changes');
const obsoleteLine=line('actionSpec','本次 Run 为 015-delivery-full-test');
const actualModeLine=line('productionFull',"raw?.mode !== 'groups-v1'");
const actualActionLine=line('productionGroup',"actionType: 'delivery-test-attempt'");
assert.ok(obsoleteLine>caseLine);
assert.ok(actualModeLine>0&&actualActionLine>0);
assert.equal(deliveryDefinition('delivery-full-test').type,'delivery-full-test');
assert.equal(deliveryDefinition('delivery-test-attempt').type,'delivery-test-attempt');
assert.equal(deliveryLocation('.mendi/runs/d01/015-delivery-test-attempt/run.md','d01').type,'delivery-test-attempt');
assert.equal(deliveryLocation('.mendi/runs/d01/015-delivery-full-test/run.md','d01').type,'delivery-full-test');

const promises=[
 {key:'proposal',contains:'旧 Open、正式'},
 {key:'design',contains:'scopeAdditions'},
 {key:'design',contains:'scopeAddRunRef'},
 {key:'design',contains:'roundId'}, 
 {key:'design',contains:'原子'},
 {key:'workspace',contains:'Historical scopes survive same-round plan extension'},
 {key:'actionSpec',contains:'Append receipts do not change current Change'},
 {key:'verification',contains:'Settled failed gains new pending work'},
 {key:'lifecycle',contains:'Old passed result is supplied after appending scope'}
] as const;
const samples=promises.map(({key,contains})=>({key,contains,line:line(key,contains)}));
const entryGuardLine=line('design','locked/unknown');
const retryLine=line('design','requestId');
const noImplicitBindLine=line('proposal','追加不等于关联');

// Independent pure core model: legacy Run scope loses current-round binding after append,
// so approved Design's bounded scopeAdditions are a needed implementation obligation.
const old=readScope({goal:'scope demo',plannedChanges:[
 {slot:'A',title:'one',dependsOn:[]},
 {slot:'B',title:'two',dependsOn:['A']}
]});
const next=readScope({goal:'scope demo',plannedChanges:[
 ...old.plannedChanges,{slot:'C',title:'three',dependsOn:['B']}
]});
const id='d01';
const r:DeliveryRound={
 id:'r001',origin:{kind:'open',runRef:'.mendi/runs/d01/001-delivery-open/run.md'},
 openedOn:'2026-10-20',scope:old,state:'open',currentBatchId:null
};
const original=projectRound({id,openedOn:'2026-10-20',formatVersion:2,recordingMode:'product'},[r],'r001');
const extended=projectRound(original,[{...r,scope:next}],'r001');
assert.equal(readRounds(original,id).length,1);
assert.equal(readRounds(extended,id).length,1);
const mock=(manifest:Record<string,unknown>):Workspace=>
 ({id,rounds:manifest.rounds,manifest,bindings:[],currentRoundId:'r001'} as unknown as Workspace);
const oldRun={runNumber:9,attempt:{scope:old,roundId:'r001'}} as unknown as DeliveryRunRecord;
const oldOpen={runNumber:1,lifecycle:{scope:old,roundId:'r001'}} as unknown as DeliveryRunRecord;
assert.equal(recordRound(mock(original),oldRun)?.id,'r001');
assert.equal(recordRound(mock(original),oldOpen)?.id,'r001');
const blocked:string[]=[];
for(const obj of [oldRun,oldOpen]){
 try{recordRound(mock(extended),obj);throw Error('unexpected success');}
 catch(e:unknown){
  if(!(e instanceof Error)||!e.message.includes('范围不能唯一归属已保存轮次'))throw e;
  blocked.push(e.message);
 }
}
assert.equal(blocked.length,2);

const sys='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
assert.ok(fs.existsSync(sys));
const args=[sys,'validate',change,'--strict','--json'];
const validate=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024,windowsHide:true});
fs.writeFileSync(path.join(artifact,'openspec-validation.json'),JSON.stringify({
 command:[process.execPath,...args],exitCode:validate.status,signal:validate.signal,
 stdout:validate.stdout??'',stderr:validate.stderr??'',error:validate.error?String(validate.error):null
},null,2)+'\n',{flag:'wx'});
assert.equal(validate.status,0,'OpenSpec strict validate should pass');
const parsed=JSON.parse(validate.stdout) as {summary?:{totals?:{failed?:number}}};
assert.equal(parsed.summary?.totals?.failed,0);

const evidence={
 recordedAt:new Date().toISOString(),
 fixedAuthorRun:fixedAuthor,
 projectCommit:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(),
 evidenceKind:'independent static/semantic contract comparison plus executable pure core negative controls',
 strictValidation:{exitCode:validate.status,raw:'openspec-validation.json',note:'Structural checks do not validate current D05-A write contract compatibility'},
 taskCount:tasks,
 findings:[{
  id:'F1',severity:'blocking',
  file:names.actionSpec,
  sourceLines:{scenario:caseLine,incorrectExpectation:obsoleteLine},
  observedExpectedNewFormalRunType:'delivery-test-attempt',
  observedActualImplementation:{newModeFile:names.productionFull,newModeLine:actualModeLine,newRunFile:names.productionGroup,newRunLine:actualActionLine},
  problem:'Modified action-runs scenario promises fresh 015-delivery-full-test, while D05-A now writes only new 015-delivery-test-attempt. Legacy delivery-full-test parser is historical read compatibility, not new execution.',
  required:'Revise this active MODIFIED scenario to name a fresh v2 delivery-test-attempt; preserve historical command as read-only and clarify sequence number is shared, not a frozen name.'
 }],
 positive:{
  legitimateProposeScope:'separate typed append receipt, no bind/activate/reopen/auto-Close, append allowed on settled passed/failed',
  docs: samples,
  authorizationAndIdempotency:{ownerRef:retryLine,oldNextGuard:entryGuardLine,noImplicitBind:noImplicitBindLine},
  oldRunCheck:{roundBefore:'r001',roundAfter:'r001',oldAttemptAfter:blocked[0],oldOpenAfter:blocked[1]},
  requirement:'Author plan specifically addresses this with finite historical scope lineage; no add writer implemented yet'
 },
 limitations:[
  'No delivery change add CLI implemented yet; reviewer has not tested any new writer',
  'No real Full Test or Close executed; pure core negative controls only',
  'The scenario mismatch is a documentation/spec contradiction in a MODIFIED requirement, not evidence product currently creates an unsafe new legacy Run',
  'Propose may fix F1 locally without adding new Change or changing already-approved Owner intent'
 ]
};
fs.writeFileSync(path.join(artifact,'proof-results.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'review-proof-saved',verdictHint:'changes-requested',
 finding:'F1',strictValidate:validate.status,trackedTasks:tasks,
 legacyAfterScope:blocked.length,artifact:path.relative(root,path.join(artifact,'proof-results.json'))},null,2));
