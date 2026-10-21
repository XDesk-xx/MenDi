// D05-B Reviewer 022: independent seven-append executable proof for F1 and F2.
// Own isolated product fixture only; no MenDi root/Author source updates.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verificationTarget} from '../../../../../../../tests/delivery-support.ts';
import {write,input} from '../../../../../../../tests/change-add-support.ts';
import {addDeliveryChanges} from '../../../../../../../src/application/delivery-change-add.ts';
import {readWorkspace} from '../../../../../../../src/adapters/workspace.ts';
import {readDeliveryRun} from '../../../../../../../src/adapters/delivery-runs.ts';
import {recordRound} from '../../../../../../../src/core/round-records.ts';
import type {DeliveryRunRecord} from '../../../../../../../src/core/delivery-runs.ts';
const repo=fs.realpathSync(process.cwd()),here=path.dirname(fileURLToPath(import.meta.url));
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const root=fs.realpathSync(verificationTarget()),parent=fs.realpathSync(path.dirname(root));
assert.equal(path.dirname(parent),tmp);
assert.equal(path.basename(root),'project');
assert.match(path.basename(parent),/^mendi-apply-/);
const marker=path.join(parent,'.mendi-reviewer-022-owned.json');
const markerBytes=Buffer.from(JSON.stringify({proof:'D05-B/reviewer-022',root,nonce:crypto.randomUUID()})+'\n');
fs.writeFileSync(marker,markerBytes,{flag:'wx'});
type Basis={direct:Array<[string,string]>;directDigests?:Array<[string,string]>};
const results:Array<{step:number;runRef:string;intentBytes:number;priorDigests:number;embeddedPriorIntents:number;actualDigestMatches:number;scopeCount:number}>=[];
let complete=false;
const refFile=(r:string)=>path.join(root,r);
let initialScope:NonNullable<ReturnType<typeof readWorkspace>>['scope'];
try {
 const before=readWorkspace(root)!;
 initialScope=structuredClone(before.scope);
 const letters=['C','D','E','F','G','H','I'];
 for(const [i,slot] of letters.entries()){
  write(root,{requestId:'reviewer-022-'+(i+1),ownerDecision:'isolated controlled reviewer fixture (not an Owner authorization)',
   reason:'scope append repeated independent validation',
   additions:[{slot,title:'Added '+slot,dependsOn:[i===0?'B':letters[i-1]]}]});
  const result=addDeliveryChanges(input(root));
  assert.equal(result.ok,true);
  const r=result.run.ref;
  const intentRef=r.replace('run.md','artifacts/intent.json');
  const intentBytes=fs.readFileSync(refFile(intentRef));
  const basis=JSON.parse(intentBytes.toString()) as Basis;
  let matched=0;
  for(const [ref,digest] of basis.directDigests??[]){
   const computed=crypto.createHash('sha256').update(fs.readFileSync(refFile(ref))).digest('hex');
   assert.equal(computed,digest);
   matched++;
  }
  const oldIntentEmbedding=basis.direct.filter(([ref])=>ref.endsWith('/artifacts/intent.json')).length;
  assert.equal(oldIntentEmbedding,0,'Must not recursively encode previous intent in next intent');
  assert.equal((basis.directDigests??[]).length,i*2);
  const w=readWorkspace(root)!;
  assert.equal(w.rounds?.length,before.rounds?.length);
  assert.equal(w.currentRoundId,before.currentRoundId);
  assert.equal(w.scope.plannedChanges.length,initialScope.plannedChanges.length+i+1);
  assert.equal(w.rounds?.at(-1)?.scopeAdditions?.length,i+1);
  const run=readDeliveryRun(root,r,w.id);
  assert.equal(run.record.status,'submitted');
  results.push({step:i+1,runRef:r,intentBytes:intentBytes.length,priorDigests:basis.directDigests?.length??0,
   embeddedPriorIntents:oldIntentEmbedding,actualDigestMatches:matched,scopeCount:w.scope.plannedChanges.length});
 }
 const w=readWorkspace(root)!;
 const first=readDeliveryRun(root,results[0].runRef,w.id).record.runNumber;
 const last=readDeliveryRun(root,results.at(-1)!.runRef,w.id).record.runNumber;
 const attempted={runNumber:first-1,attempt:{scope:initialScope,roundId:w.currentRoundId}} as unknown as DeliveryRunRecord;
 assert.equal(recordRound(w,attempted)?.id,w.currentRoundId);
 function rejected(record:DeliveryRunRecord){
  try{recordRound(w,record);return false;}catch(e:unknown){return e instanceof Error&&e.message.includes('范围不能唯一归属已保存轮次');}
 }
 const badPositions=[first,first+1,last,last+1];
 for(const n of badPositions)assert.ok(rejected({...attempted,runNumber:n}),'old scope must reject at/post append number '+n);
 const now={runNumber:last+1,attempt:{scope:w.scope,roundId:w.currentRoundId}} as unknown as DeliveryRunRecord;
 assert.equal(recordRound(w,now)?.id,w.currentRoundId);
 const secondIntent=results[1].runRef.replace('run.md','artifacts/intent.json');
 const oldBytes=fs.readFileSync(refFile(secondIntent));
 fs.writeFileSync(refFile(secondIntent),Buffer.concat([oldBytes,Buffer.from(' ')]));
 let corruptionError='';
 try{readWorkspace(root);}catch(e:unknown){corruptionError=e instanceof Error?e.message:String(e);}
 assert.ok(corruptionError,'Mutation of old intent must fail later read');
 fs.writeFileSync(refFile(secondIntent),oldBytes);
 assert.equal(readWorkspace(root)?.rounds?.at(-1)?.scopeAdditions?.length,7);
 const firstSize=results[0].intentBytes,lastSize=results.at(-1)!.intentBytes;
 const output={
  recordedAt:new Date().toISOString(),
  fixedAuthor:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/021-revise-apply/run.md',
  method:'real addDeliveryChanges of seven distinct requests on a single isolated product-v2 fixture, plus same-round timeline API controls and old intent tamper',
  results,firstSize,lastSize,ratio:Number((lastSize/firstSize).toFixed(2)),
  totalDigestRefs:results.at(-1)!.priorDigests,
  chronology:{firstAppendRunNumber:first,lastAppendRunNumber:last,oldScopeBeforeFirstAccepted:true,
   afterAppendOriginalScopeNumbersRejected:badPositions,currentScopeAfterLastAccepted:true},
  tamperedOldIntentRejected:corruptionError,
  limits:['Seven finite additions are a measured demonstration, not a universal runtime/size bound',
   'The wrong-timeline records are in-memory synthetic Run objects only; no invalid actual Run was persisted',
   'This is a product-v2 isolated fixture; not the MenDi root or a real Owner approval',
   'No direct interruption/recovery cycle in this proof; existing dedicated tests cover controlled fault points']
 };
 fs.writeFileSync(path.join(here,'proof-results.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
 complete=true;
 console.log(JSON.stringify({status:'passed',sizes:results.map(x=>x.intentBytes),ratio:output.ratio,
  lastDigestRefs:output.totalDigestRefs,rejectedNumbers:badPositions,tamperRejected:true,
  evidence:path.relative(repo,path.join(here,'proof-results.json'))},null,2));
}finally{
 // No prefix sweep, no cross-owner cleanup. Leave any failed/locked site intact.
 if(complete&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)&&
    fs.realpathSync(parent)===parent&&path.dirname(parent)===tmp&&
    !fs.existsSync(path.join(root,'.mendi/write.lock'))){
  fs.rmSync(parent,{recursive:true,force:false});
 }
}