// D05-B Reviewer: adversarial repeated scope-add and old-scope chronological check.
// Uses only self-owned isolated product-v2 fixture; original MenDi/Author data untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verificationTarget} from '../../../../../../../tests/delivery-support.ts';
import {write,input} from '../../../../../../../tests/change-add-support.ts';
import {addDeliveryChanges} from '../../../../../../../src/application/delivery-change-add.ts';
import {readWorkspace} from '../../../../../../../src/adapters/workspace.ts';
import {recordRound} from '../../../../../../../src/core/round-records.ts';
import type {DeliveryRunRecord} from '../../../../../../../src/core/delivery-runs.ts';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=fs.realpathSync(process.cwd());
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const root=fs.realpathSync(verificationTarget());
const parent=fs.realpathSync(path.dirname(root));
assert.equal(path.basename(root),'project');
assert.equal(path.dirname(parent),tmp);
assert.match(path.basename(parent),/^mendi-apply-/);
const marker=path.join(parent,'.d05-b-reviewer-020-owned.json');
const markerBytes=Buffer.from(JSON.stringify({scope:'D05-B/reviewer-020',root,nonce:crypto.randomUUID()})+'\n');
fs.writeFileSync(marker,markerBytes,{flag:'wx'});
const first=readWorkspace(root)!;
const original=structuredClone(first.scope);
const series:Array<{i:number;ref:string;intentBytes:number;embeddedPreviousIntents:number;directItems:number;directTotalBase64Chars:number;requestId:string}>=[];
let completed=false;
try{
 const names=['C','D','E','F','G','H','I'];
 for(let i=0;i<names.length;i++){
  const slot=names[i],dep=i===0?'B':names[i-1];
  const requestId='review-append-'+(i+1);
  write(root,{requestId,ownerDecision:'isolated reviewer fixture, not real Owner authorization',reason:'bounded growth negative-control',
    additions:[{slot,title:'append '+slot,dependsOn:[dep]}]});
  const added=addDeliveryChanges(input(root));
  assert.equal(added.ok,true);
  const intent=added.run.ref.replace(/run\.md$/,'artifacts/intent.json');
  const data=fs.readFileSync(path.join(root,intent));
  const json=JSON.parse(data.toString()) as {direct:Array<[string,string]>};
  const embedded=json.direct.filter(([ref])=>ref.endsWith('/artifacts/intent.json')).length;
  series.push({i:i+1,ref:added.run.ref,intentBytes:data.length,embeddedPreviousIntents:embedded,
   directItems:json.direct.length,directTotalBase64Chars:json.direct.reduce((n,[,v])=>n+v.length,0),requestId});
  assert.equal(embedded,i);
  const w=readWorkspace(root)!;
  assert.equal(w.scope.plannedChanges.length,original.plannedChanges.length+i+1);
  assert.equal(w.rounds?.length,first.rounds?.length);
 }
 const last=readWorkspace(root)!;
 const appended=last.rounds!.at(-1)!.scopeAdditions!;
 assert.equal(appended.length,names.length);
 const firstAddNo=Number(/\/(\d{3,})-delivery-change-add\//.exec(series[0].ref)![1]);
 const fakeLater={runNumber:firstAddNo+1,attempt:{roundId:last.currentRoundId!,scope:original}} as unknown as DeliveryRunRecord;
 const oldScopeAttributed=recordRound(last,fakeLater)?.id===last.currentRoundId;
 const sizes=series.map(x=>x.intentBytes);
 const result={
  recordedAt:new Date().toISOString(),fixedAuthor:'019-apply',
  operation:'actual addDeliveryChanges repeated seven times on single isolated product-v2 fixture',
  counts:series,firstToLastRatio:Number((sizes.at(-1)!/sizes[0]).toFixed(2)),
  laterRunWithPreAddScopeAccepted:oldScopeAttributed,
  chronologicalNegativeControl:{claimedRunNumber:firstAddNo+1,firstAppendRunNumber:firstAddNo,
    oldScope:original.plannedChanges.map(c=>c.slot),currentScope:last.scope.plannedChanges.map(c=>c.slot),
    observedRecordRound:oldScopeAttributed?'accepted original scope despite later number':'rejected'},
  sourceRefs:['src/adapters/scope-additions.ts:10-60','src/application/delivery-change-add.ts:57-61',
    'src/adapters/change-add-store.ts:144-149','src/core/round-records.ts:30-48'],
  limits:[
    'Isolated fixture repeat writes, not root Delivery scope or a user-approved product append',
    'Physical bytes of nested append intents are measured for a bounded seven-run workload, not extrapolated performance claims',
    'The historical old-scope chronology case is fabricated in memory; tests whether recordRound itself enforces temporal scope attribution, not proof any current writer emits such Run'
  ]
 };
 fs.writeFileSync(path.join(here,'adversarial-results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 completed=true;
 console.log(JSON.stringify({status:'proof-saved',sizeBytes:sizes,ratio:result.firstToLastRatio,
  embeddedPriorIntentCount:series.at(-1)!.embeddedPreviousIntents,
  laterRunOldScopeAccepted:oldScopeAttributed,
  result:path.relative(repo,path.join(here,'adversarial-results.json'))},null,2));
}finally{
 if(completed && fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)&&
   fs.realpathSync(parent)===parent&&path.dirname(parent)===tmp&&!fs.existsSync(path.join(root,'.mendi/write.lock'))){
  fs.rmSync(parent,{recursive:true,force:false});
 }
}
