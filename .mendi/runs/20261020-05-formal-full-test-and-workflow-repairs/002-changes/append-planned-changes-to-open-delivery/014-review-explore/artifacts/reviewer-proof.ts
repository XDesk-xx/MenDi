// D05-B / Reviewer 014 independent read-only proof.
// Only pure core functions and the fixed Author evidence are read; no product/fixture mutations.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { readScope } from '../../../../../../../src/core/scope.ts';
import { projectRound, readRounds, type DeliveryRound } from '../../../../../../../src/core/rounds.ts';
import { recordRound } from '../../../../../../../src/core/round-records.ts';
import type { Workspace } from '../../../../../../../src/core/records.ts';
import type { DeliveryRunRecord } from '../../../../../../../src/core/delivery-runs.ts';

const repo=process.cwd();
const here=path.dirname(fileURLToPath(import.meta.url));
const base='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/013-explore';
const runRef=base+'/run.md';
const authorResultsPath=base+'/artifacts/proof-results.json';
const failedResultsPath=base+'/artifacts/proof-failed-results.json';
const authorResults:unknown=JSON.parse(fs.readFileSync(path.join(repo,authorResultsPath),'utf8'));
const failedResults:unknown=JSON.parse(fs.readFileSync(path.join(repo,failedResultsPath),'utf8'));
const a=authorResults as {status:string;cases:Array<{id:string;[key:string]:unknown}>};
const f=failedResults as {status:string;case:string;originalFormalOutcome:string;withoutPointerInvalidation:{code:string};afterPointerInvalidation:{oldAttemptHistoryRead:{code:string}};originalFailureRunByteUnchanged:boolean};
assert.equal(a.status,'passed');
assert.deepEqual(a.cases.map(c=>c.id),['P01','P02','P03','P04','P05','P06']);
assert.equal(f.status,'passed');
assert.equal(f.case,'P07');
assert.equal(f.originalFormalOutcome,'failed');
assert.equal(f.withoutPointerInvalidation.code,'invalid-round-record');
assert.equal(f.afterPointerInvalidation.oldAttemptHistoryRead.code,'invalid-round-record');
assert.equal(f.originalFailureRunByteUnchanged,true);

const initial=readScope({goal:'D05-B isolated pure model',plannedChanges:[
 {slot:'A',title:'First',dependsOn:[]},
 {slot:'B',title:'Second',dependsOn:['A']}
]});
const extra=readScope({goal:initial.goal,plannedChanges:[
 ...initial.plannedChanges,
 {slot:'C',title:'New planned change',dependsOn:['B']}
]});
const current:DeliveryRound={
 id:'r001', origin:{kind:'open',runRef:'.mendi/runs/d01/001-delivery-open/run.md'},
 openedOn:'2026-10-20', scope:initial, state:'open',currentBatchId:null
};
const oldManifest=projectRound({id:'d01',openedOn:'2026-10-20',formatVersion:2,recordingMode:'product'},[current],'r001');
const newManifest=projectRound(oldManifest,[{...current,scope:extra}],'r001');
assert.equal(readRounds(oldManifest,'d01').length,1);
assert.equal(readRounds(newManifest,'d01').length,1);
assert.equal(newManifest.currentRoundId,'r001');
assert.deepEqual((newManifest.plannedChanges as Array<{slot:string}>).map(v=>v.slot),['A','B','C']);

function mockWorkspace(manifest:Record<string,unknown>):Workspace {
 return {id:'d01',rounds:manifest.rounds,manifest,bindings:[],currentRoundId:'r001'} as unknown as Workspace;
}
const testRun={runNumber:9,attempt:{scope:initial,roundId:'r001'}} as unknown as DeliveryRunRecord;
const originalOpen={runNumber:1,lifecycle:{scope:initial,roundId:'r001'}} as unknown as DeliveryRunRecord;
assert.equal(recordRound(mockWorkspace(oldManifest),testRun)?.id,'r001');
assert.equal(recordRound(mockWorkspace(oldManifest),originalOpen)?.id,'r001');
function rejected(operation:()=>unknown):{name:string;code:string;message:string}{
 try{operation();}catch(e:unknown){
  if(!(e instanceof Error))throw e;
  return{name:e.name,code:'code' in e?String(e.code):'unknown',message:e.message};
 }
 throw Error('Expected rejection');
}
const attemptAfter=rejected(()=>recordRound(mockWorkspace(newManifest),testRun));
const openAfter=rejected(()=>recordRound(mockWorkspace(newManifest),originalOpen));
assert.equal(attemptAfter.code,'invalid-round-record');
assert.equal(openAfter.code,'invalid-round-record');

const duplicate=rejected(()=>readScope({goal:'x',plannedChanges:[...initial.plannedChanges,{slot:'A',title:'again',dependsOn:[]}]}));
const unknownDep=rejected(()=>readScope({goal:'x',plannedChanges:[...initial.plannedChanges,{slot:'C',title:'new',dependsOn:['Z']}]}));
const cycle=rejected(()=>readScope({goal:'x',plannedChanges:[...initial.plannedChanges,{slot:'C',title:'third',dependsOn:['D']},{slot:'D',title:'fourth',dependsOn:['C']}]}));
for(const x of [duplicate,unknownDep,cycle])assert.equal(x.code,'invalid-scope');

const codePath='src/core/round-records.ts';
const code=fs.readFileSync(path.join(repo,codePath),'utf8');
assert.match(code,/isDeepStrictEqual\(comparableScope\(r\.scope\), comparableScope\(readScope\(summary\.scope\)\)\)/);
const codeSha256=crypto.createHash('sha256').update(code).digest('hex');
const scripts=[
 '014-review-explore/artifacts/reviewer-proof.ts',
 '013-explore/artifacts/proof.ts',
 '013-explore/artifacts/proof-failed.ts'
];
const groupRoot=path.posix.dirname(base);
const common=['node_modules/typescript/bin/tsc','--noEmit','--strict','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','--skipLibCheck','--allowImportingTsExtensions'];
const typechecks:Array<{path:string;args:string[];exitCode:number|null;stdout:string;stderr:string}>=[];
for(const rel of scripts){
 const target=groupRoot+'/'+rel;
 const args=[...common,target];
 const result=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024,windowsHide:true});
 typechecks.push({path:target,args:[process.execPath,...args],exitCode:result.status,stdout:result.stdout??'',stderr:result.stderr??''});
}
fs.writeFileSync(path.join(here,'typecheck-results.json'),JSON.stringify(typechecks,null,2)+'\n',{flag:'wx'});
assert.equal(typechecks.length,3);
for(const result of typechecks)assert.equal(result.exitCode,0,'Strict tsc failed: '+result.path);

const payload={
 recordedAt:new Date().toISOString(),fixedAuthorRun:runRef,
 input:{authorSuccessful:authorResultsPath,authorFailed:failedResultsPath},
 source:{ref:codePath,sha256:codeSha256},
 independentChecks:[
  {id:'R01-same-round-append-schema',status:'passed',before:['A','B'],after:['A','B','C'],rounds:1},
  {id:'R02-historical-full-record-unreadable-after-scope-append',status:'passed',before:'r001',after:attemptAfter},
  {id:'R03-historical-open-record-also-unreadable',status:'passed',before:'r001',after:openAfter},
  {id:'R04-invalid-scope-guard',status:'passed',duplicate,unknownDep,cycle},
  {id:'R05-author-P01-to-P07-fixed-proof-results-checked',status:'passed',
    authorCases:a.cases.map(c=>c.id),failedCase:f.case,failedRunUnchanged:f.originalFailureRunByteUnchanged}
 ],
 strictTypecheck:{status:'passed',paths:typechecks.map(t=>t.path),raw:'typecheck-results.json'},
 limits:[
  'Pure in-memory core model proof; no real Change-add CLI exists, no actual scope writer was exercised',
  'No repeat of Author actual passed/failed groups-v1 child execution; relies on submitted direct 013 outputs for those scenarios',
  'The old recordRound failure is a proven implementation constraint, not proof no safe future model can preserve history',
  'No full execution-in-progress/locked/closed/pending case replayed: implementation tests remain for Propose/Apply'
 ]
};
fs.writeFileSync(path.join(here,'proof-results.json'),JSON.stringify(payload,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'review-proof-passed',checks:payload.independentChecks.map(x=>x.id),
 typescript:typechecks.map(t=>({target:t.path,exit:t.exitCode})),result:path.relative(repo,path.join(here,'proof-results.json'))},null,2));
