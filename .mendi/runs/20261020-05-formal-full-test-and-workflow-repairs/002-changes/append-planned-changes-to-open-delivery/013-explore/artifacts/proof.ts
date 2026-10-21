// D05-B isolated Proof Explore: actual current admission + one real groups-v1 full run.
// This is NOT an implementation of delivery change add, nor Owner approval for fixture actors.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { groupTarget, groupRun, attemptResult } from '../../../../../../../tests/group-support.ts';
import { bindChange, query } from '../../../../../../../src/application/project.ts';
import { readWorkspace } from '../../../../../../../src/adapters/workspace.ts';
import { projectRound } from '../../../../../../../src/core/rounds.ts';
import { parseProject, parseWorkspace, type Scope } from '../../../../../../../src/core/records.ts';
import { readScope } from '../../../../../../../src/core/scope.ts';
import { inspectAttempt } from '../../../../../../../src/adapters/group-store.ts';
import { readDeliveryRun } from '../../../../../../../src/adapters/delivery-runs.ts';
import { deliveryLifecycle } from '../../../../../../../src/application/delivery-lifecycle.ts';
import { MendiError } from '../../../../../../../src/core/errors.ts';

const repo = fs.realpathSync(process.cwd());
const artifacts = path.join(repo,'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/013-explore/artifacts');
const resultFile = path.join(artifacts,'proof-results.json');
assert.ok(fs.existsSync(artifacts)&&!fs.existsSync(resultFile));
const tmp = fs.realpathSync(path.join(repo,'.tmp'));
const results: Record<string,unknown>[] = [];
let fixturePath: string | undefined;
let ownerMarkerPath: string | undefined;
let ownerBytes: Buffer | undefined;
let complete = false;

function rejection(run: ()=>unknown): {code:string;message:string} {
  try { run(); } catch(e:unknown) {
    if(e instanceof MendiError) return {code:e.code,message:e.message};
    if(e instanceof Error) return {code:e.name,message:e.message};
    throw e;
  }
  throw new Error('Expected refusal but operation unexpectedly succeeded');
}
function readManifest(root:string): Record<string,unknown> {
  return JSON.parse(fs.readFileSync(path.join(root,'.mendi/delivery-groups/d01/manifest.json'),'utf8')) as Record<string,unknown>;
}
function writeManifest(root:string, value:unknown): void {
  fs.writeFileSync(path.join(root,'.mendi/delivery-groups/d01/manifest.json'),JSON.stringify(value,null,2)+'\n');
}
function extra(scope:Scope, slot:string, dependsOn:string[]):Scope {
  return {goal:scope.goal,plannedChanges:[...scope.plannedChanges,{slot,title:'Proof additional work',dependsOn}]};
}
function same(left:unknown,right:unknown):boolean {return JSON.stringify(left)===JSON.stringify(right);}

try {
  const fixture = groupTarget();
  const root = fs.realpathSync(fixture.root);
  const parent = fs.realpathSync(path.dirname(root));
  assert.equal(path.dirname(parent),tmp,'fixture must be under repository .tmp');
  assert.equal(path.basename(root),'project');
  assert.match(path.basename(parent),/^mendi-apply-/);
  fixturePath=parent;
  ownerMarkerPath=path.join(parent,'.d05-b-013-owned.json');
  ownerBytes=Buffer.from(JSON.stringify({run:'D05-B/013',root,nonce:crypto.randomUUID()})+'\n');
  fs.writeFileSync(ownerMarkerPath,ownerBytes,{flag:'wx'});
  const before=readWorkspace(root);
  assert.ok(before?.rounds);
  assert.equal(before.state,'open');
  assert.equal(before.bindings.length,2);
  assert.ok(before.bindings.every(b=>b.state==='archived'));
  assert.equal(before.rounds.length,1);

  // P01: The real bind entry refuses a newly requested slot absent from plannedChanges.
  const beforeBytes=fs.readFileSync(path.join(root,'.mendi/delivery-groups/d01/manifest.json'));
  const rejected=rejection(()=>bindChange({project:root,slot:'C',changeId:'not-created-change'}));
  assert.equal(rejected.code,'planning-slot-not-found');
  assert.ok(fs.readFileSync(path.join(root,'.mendi/delivery-groups/d01/manifest.json')).equals(beforeBytes));
  results.push({id:'P01',description:'current bind refuses unplanned slot without altering manifest',rejected,manifestByteUnchanged:true});

  // P02: Core existing round projection can represent a strictly appended same-round scope,
  // but there is currently no authorized product writer/CLI to perform that transition.
  const current=before.rounds.at(-1)!;
  const updatedScope=extra(current.scope,'C',['B']);
  const projected=projectRound(before.manifest,before.rounds.map(r=>r.id===current.id?{...r,scope:updatedScope}:r),before.currentRoundId!);
  const parsed=parseWorkspace(parseProject(before.project),projected);
  assert.equal(parsed.currentRoundId,before.currentRoundId);
  assert.equal(parsed.rounds?.length,1);
  assert.equal(parsed.bindings.length,2);
  assert.ok(same(parsed.bindings,before.bindings));
  assert.equal(parsed.scope.plannedChanges.length,before.scope.plannedChanges.length+1);
  assert.equal(parsed.activeChangeId,null);
  results.push({id:'P02',description:'round projection parses an append without reopening/binding',roundId:parsed.currentRoundId,rounds:parsed.rounds?.length,bindingsPreserved:true,plannedBefore:before.scope.plannedChanges.map(v=>v.slot),plannedAfter:parsed.scope.plannedChanges.map(v=>v.slot),noAutoBind:true});

  // P03: Existing schema enforces uniqueness and dependency integrity; existing round
  // binding and current round remain separate from newly planned slots.
  const duplicates=rejection(()=>readScope({goal:'same',plannedChanges:[...before.scope.plannedChanges,{slot:'A',title:'duplicate',dependsOn:[]}]}));
  const missing=rejection(()=>readScope({goal:'same',plannedChanges:[...before.scope.plannedChanges,{slot:'C',title:'missing',dependsOn:['Z']}]}));
  const cycle=rejection(()=>readScope({goal:'same',plannedChanges:[...before.scope.plannedChanges,{slot:'C',title:'cycle one',dependsOn:['D']},{slot:'D',title:'cycle two',dependsOn:['C']}]}));
  assert.equal(duplicates.code,'invalid-scope');
  assert.equal(missing.code,'invalid-scope');
  assert.equal(cycle.code,'invalid-scope');
  results.push({id:'P03',description:'existing scope parser rejects duplicate slot / dangling dependency / cycle',duplicates,missing,cycle});

  // P04: Real complete Full Test is valid for original scope. Changing the scope only
  // inside this isolated product fixture preserves the old run and makes it inapplicable.
  const test=attemptResult(await groupRun(root));
  assert.equal(test.ok,true,JSON.stringify({next:test.next,run:test.run}));
  assert.equal(test.run.attempt?.formalOutcome,'passed');
  const oldRunRef=test.run.ref;
  const oldRunBytes=fs.readFileSync(path.join(root,oldRunRef));
  const currentWorkspace=readWorkspace(root);
  assert.ok(currentWorkspace?.rounds);
  const newCurrentScope=extra(currentWorkspace.scope,'C',['B']);
  const newProjected=projectRound(currentWorkspace.manifest,currentWorkspace.rounds.map(r=>r.id===currentWorkspace.currentRoundId?{...r,scope:newCurrentScope}:r),currentWorkspace.currentRoundId!);
  // P04: Raw same-round scope change without invalidating the current attempt
  // FAILS full workspace readback; this is an observed production guard.
  const originalObserved=inspectAttempt(root,currentWorkspace,readDeliveryRun(root,oldRunRef,currentWorkspace.id));
  assert.equal(originalObserved.scopeMatch,'match');
  writeManifest(root,newProjected);
  const conflict=rejection(()=>readWorkspace(root));
  assert.equal(conflict.code,'invalid-round-record');
  assert.ok(fs.readFileSync(path.join(root,oldRunRef)).equals(oldRunBytes));
  results.push({id:'P04',description:'real v2 formal PASS cannot remain selected after in-place scope append',originalOutcome:test.run.attempt.formalOutcome,priorScopeMatched:true,scopeOnlyAppendReadback:conflict,runUnchanged:true});

  // P05: A counterfactual same-round projection drops the CURRENT deliveryRunRef
  // while preserving old testAttemptRunRef. It is not a product writer contract.
  const invalidated=projectRound(currentWorkspace.manifest,currentWorkspace.rounds.map(r=>
    r.id===currentWorkspace.currentRoundId?{...r,scope:newCurrentScope,deliveryRunRef:undefined}:r
  ),currentWorkspace.currentRoundId!);
  writeManifest(root,invalidated);
  const expanded=readWorkspace(root);
  assert.ok(expanded);
  assert.equal(expanded.currentRoundId,currentWorkspace.currentRoundId);
  assert.equal(expanded.scope.plannedChanges.length,currentWorkspace.scope.plannedChanges.length+1);
  assert.equal(expanded.bindings.length,currentWorkspace.bindings.length);
  assert.equal(expanded.manifest.deliveryRunRef,undefined);
  assert.equal(expanded.manifest.testAttemptRunRef,oldRunRef);
  const displayed=query({project:root});
  const nextAction=displayed.next.action;
  const oldStatus=rejection(()=>inspectAttempt(root,expanded,readDeliveryRun(root,oldRunRef,expanded.id)));
  assert.equal(oldStatus.code,'invalid-round-record');
  results.push({id:'P05',description:'clearing current result permits scope projection but old attempt explicit read is incompatible',roundUnchanged:true,bindingsUnchanged:true,priorFormalPointerKept:true,currentDeliveryPointerCleared:true,currentNextAction:nextAction,oldAttemptExplicitRead:oldStatus});

  // P06: Close rejects stale PASS after scope expansion. No Close Run created.
  fs.writeFileSync(path.join(root,'new-close.json'),JSON.stringify({testAttemptRunRef:oldRunRef,applicability:{conclusion:'applicable',materials:'fixture old scope',changes:'none',reason:'probe invalid close'}}));
  const refusedClose=rejection(()=>deliveryLifecycle('delivery-close',{project:root,inputFile:'new-close.json',role:'author',actor:'fixture-owner'}));
  const afterClose=readManifest(root);
  assert.equal(afterClose.state,'open');
  assert.equal(afterClose.closeRunRef,undefined);
  assert.ok(fs.readFileSync(path.join(root,oldRunRef)).equals(oldRunBytes));
  results.push({id:'P06',description:'expanded scope refuses Close using previous passed attempt',closeRejected:refusedClose,runUnchanged:true,deliveryOpen:true});

  assert.equal(results.length,6);
  complete=true;
  const response={status:'passed',proof:'D05-B 013 Author Explore',date:new Date().toISOString(),baseline:'current source commit; no MenDi source or real Delivery mutation',methods:'Actual product bind and real groups-v1 Full Test on isolated product v2 fixture; model/parser checks; counterfactual fixture-only scope append',cases:results,limits:['No real change-add CLI implemented','The v2 append write in P04 is simulated on a product fixture, not evidence of an existing command','The successful prior Full Test is an isolated fixture fact, not D05 Delivery acceptance','No real Reviewer verdict is produced','A separate legacy/closed/in-flight recovery matrix remains for Propose/Apply']};
  fs.writeFileSync(resultFile,JSON.stringify(response,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:response.status,caseIds:results.map(v=>v.id),important:{P01:rejected.code,P04:results[3]},result:path.relative(repo,resultFile)},null,2));
} finally {
  // Only remove the explicitly returned fixture parent with exact marker and no active lock.
  // Keep unknown/failed sites for diagnosis and never enumerate other .tmp/mendi-apply-* dirs.
  if(complete && fs.existsSync(resultFile) && fixturePath && ownerMarkerPath && ownerBytes &&
     fs.existsSync(ownerMarkerPath) && fs.readFileSync(ownerMarkerPath).equals(ownerBytes) &&
     fs.realpathSync(fixturePath)===fixturePath && path.dirname(fixturePath)===tmp &&
     !fs.existsSync(path.join(fixturePath,'project/.mendi/write.lock'))) {
    fs.rmSync(fixturePath,{recursive:true,force:false,maxRetries:2});
  }
}
