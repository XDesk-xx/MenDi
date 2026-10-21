// D05-B P07 supplemental real failed groups-v1 case on an isolated product-v2 fixture.
// Does not implement or invoke a production scope-add writer.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { groupTarget, groupRun, attemptResult } from '../../../../../../../tests/group-support.ts';
import { readWorkspace } from '../../../../../../../src/adapters/workspace.ts';
import { projectRound } from '../../../../../../../src/core/rounds.ts';
import { inspectAttempt } from '../../../../../../../src/adapters/group-store.ts';
import { readDeliveryRun } from '../../../../../../../src/adapters/delivery-runs.ts';
import { MendiError } from '../../../../../../../src/core/errors.ts';

const repo=fs.realpathSync(process.cwd());
const base=path.join(repo,'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/013-explore/artifacts');
const output=path.join(base,'proof-failed-results.json');
assert.equal(fs.existsSync(output),false);
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
let ownedParent:string|undefined,marker:string|undefined,bytes:Buffer|undefined;
let done=false;

function rejected(action:()=>unknown):{code:string;message:string}{
  try{action()}catch(err:unknown){
    if(err instanceof MendiError)return{code:err.code,message:err.message};
    if(err instanceof Error)return{code:err.name,message:err.message};
    throw err;
  }
  throw Error('Expected rejection');
}
try{
  const fixture=groupTarget();
  const root=fs.realpathSync(fixture.root),parent=fs.realpathSync(path.dirname(root));
  assert.equal(path.dirname(parent),tmp);
  assert.equal(path.basename(root),'project');
  ownedParent=parent;marker=path.join(parent,'.d05-b-013-failed-owned.json');
  bytes=Buffer.from(JSON.stringify({run:'D05-B/013/P07',root,nonce:crypto.randomUUID()})+'\n');
  fs.writeFileSync(marker,bytes,{flag:'wx'});
  fs.writeFileSync(path.join(root,'middle.test.ts'),"import test from 'node:test';test('real failed middle',()=>{throw Error('D05-B P07 genuine failure')});\n");
  const original=attemptResult(await groupRun(root));
  assert.equal(original.ok,false);
  assert.equal(original.run.attempt?.formalOutcome,'failed');
  const ref=original.run.ref,oldBytes=fs.readFileSync(path.join(root,ref));
  const work=readWorkspace(root);
  assert.ok(work?.rounds&&work.currentRoundId);
  const appended={goal:work.scope.goal,plannedChanges:[...work.scope.plannedChanges,{slot:'C',title:'new after failed',dependsOn:['B']}]};
  const replaceRound=(removeCurrent:boolean)=>work.rounds!.map(x=>x.id===work.currentRoundId
    ? {...x,scope:appended,...(removeCurrent?{deliveryRunRef:undefined}:{})}
    : x);
  const fullPath=path.join(root,'.mendi/delivery-groups/d01/manifest.json');
  const raw=projectRound(work.manifest,replaceRound(false),work.currentRoundId);
  fs.writeFileSync(fullPath,JSON.stringify(raw,null,2)+'\n');
  const naive=rejected(()=>readWorkspace(root));
  assert.equal(naive.code,'invalid-round-record');
  const currentCleared=projectRound(work.manifest,replaceRound(true),work.currentRoundId);
  fs.writeFileSync(fullPath,JSON.stringify(currentCleared,null,2)+'\n');
  const expanded=readWorkspace(root);
  assert.ok(expanded&&expanded.currentRoundId===work.currentRoundId);
  assert.equal(expanded.manifest.deliveryRunRef,undefined);
  const priorRead=rejected(()=>inspectAttempt(root,expanded,readDeliveryRun(root,ref,expanded.id)));
  assert.equal(priorRead.code,'invalid-round-record');
  assert.ok(fs.readFileSync(path.join(root,ref)).equals(oldBytes));
  const result={status:'passed',case:'P07',originalFormalOutcome:'failed',
    actualRequiredGroupStates:original.run.attempt?.progress.map(g=>({id:g.id,state:g.state})),
    sameRound:work.currentRoundId===expanded.currentRoundId,originalScopeSize:work.scope.plannedChanges.length,
    enlargedScopeSize:expanded.scope.plannedChanges.length,withoutPointerInvalidation:naive,
    afterPointerInvalidation:{workspaceReadable:true,currentDeliveryRef:null,oldAttemptHistoryRead:priorRead},
    originalFailureRunByteUnchanged:true,limitations:['Only isolated product fixture','Scope add performed by fixture mutation because no CLI writer exists','Does not claim D05 Delivery Full Test or actual Owner Review']};
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  done=true;
  console.log(JSON.stringify({status:result.status,case:result.case,originalOutcome:result.originalFormalOutcome,states:result.actualRequiredGroupStates,naive:naive.code,oldHistory:priorRead.code,artifact:path.relative(repo,output)},null,2));
}finally{
  if(done&&fs.existsSync(output)&&ownedParent&&marker&&bytes&&fs.existsSync(marker)&&
    fs.readFileSync(marker).equals(bytes)&&fs.realpathSync(ownedParent)===ownedParent&&
    path.dirname(ownedParent)===tmp&&!fs.existsSync(path.join(ownedParent,'project/.mendi/write.lock')))
    fs.rmSync(ownedParent,{recursive:true,force:false,maxRetries:2});
}
