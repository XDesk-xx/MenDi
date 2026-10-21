// Bounded proof only: current product-v2 behavior, NOT an implementation of supplement/amend.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  actionTarget,
  startAuthor,
  finish,
  author,
  reviewer,
  options,
} from '../../../../../../../tests/action-support.ts';
import { saveRun, submitRun, startAction } from '../../../../../../../src/application/actions.ts';
import { query } from '../../../../../../../src/application/project-query.ts';
import { readWorkspace, acquireProjectLock, releaseProjectLock } from '../../../../../../../src/adapters/workspace.ts';
import { currentRun, readRun, scanRunNumbers } from '../../../../../../../src/adapters/runs.ts';
import { managedPath } from '../../../../../../../src/adapters/paths.ts';
import { MendiError } from '../../../../../../../src/core/errors.ts';

const repository=fs.realpathSync(process.cwd());
const temp=fs.realpathSync(path.join(repository,'.tmp'));
const artifact=path.join(repository,'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/033-explore/artifacts/proof-results.json');
assert.ok(fs.existsSync(path.dirname(artifact))&&!fs.existsSync(artifact));
const findings:Record<string,unknown>[]=[];
function expectError(action:()=>unknown,code:string):string{
  try{action()}catch(error){
    if(!(error instanceof MendiError))throw error;
    assert.equal(error.code,code,error.message);
    return error.message;
  }
  throw new Error('Expected '+code+' but operation unexpectedly succeeded');
}
let parent:string|undefined;
let ownedRoot:string|undefined;
let marker:string|undefined;
let owned:Buffer|undefined;
let completed=false;
try{
  const root=fs.realpathSync(actionTarget());
  ownedRoot=root;
  parent=fs.realpathSync(path.dirname(root));
  assert.equal(path.dirname(parent),temp);
  assert.match(path.basename(parent),/^mendi-apply-/);
  assert.equal(path.basename(root),'minimal-project');
  marker=path.join(parent,'.d05d-033-owned.json');
  owned=Buffer.from(JSON.stringify({proof:'D05-D/033',root,nonce:crypto.randomUUID()})+'\n');
  fs.writeFileSync(marker,owned,{flag:'wx'});

  // P01: current submitted remains selected until another real Run is created.
  const created=startAuthor(root);
  const ref=created.run.ref;
  assert.equal(created.run.status,'draft');
  const completedAuthor=finish(root,ref,'author','complete');
  assert.equal(completedAuthor.run.status,'submitted');
  assert.equal(completedAuthor.run.outcome,'complete');
  const original=fs.readFileSync(managedPath(root,ref));
  const observed=readWorkspace(root)!;
  assert.equal(observed.activeChangeId,'proof-entry');
  assert.equal(currentRun(root,observed)?.ref,ref);
  assert.equal(observed.state,'open');
  const status=query({project:root},options);
  assert.ok('run' in status && status.run);
  assert.equal(status.run.ref,ref);
  findings.push({id:'P01',name:'submitted latest Run remains selected',runRef:ref,runNumber:completedAuthor.run.runNumber,currentBeforeDownstream:true,bodyBytes:original.length,next:completedAuthor.next});

  // P02: ordinary save/submit stays draft-only even when submitted is LATEST.
  const oldSave=expectError(()=>saveRun({...author(root),runRef:ref,bodyFile:'body.md'},options),'run-already-submitted');
  const oldSubmit=expectError(()=>submitRun({...author(root),runRef:ref,outcome:'complete',result:'false replacement'},options),'run-already-submitted');
  assert.ok(fs.readFileSync(managedPath(root,ref)).equals(original));
  findings.push({id:'P02',name:'ordinary save/submit reject current submitted Run',saveCode:'run-already-submitted',submitCode:'run-already-submitted',runByteUnchanged:true,savedMessage:oldSave,submittedMessage:oldSubmit});

  // P03: managed target restrictions apply regardless of proof time.
  const unsafe=expectError(()=>managedPath(root,'../../outside.md'),'unsafe-reference');
  findings.push({id:'P03',name:'unsafe evidence path rejected',code:'unsafe-reference',message:unsafe});

  // P04: the next Reviewer draft is a real downstream reservation, even before submission.
  const reviewStarted=startAction({...reviewer(root),changeId:'proof-entry',type:'review-explore',authorRunRef:ref},options);
  const reviewRef=reviewStarted.run.ref;
  assert.equal(reviewStarted.run.status,'draft');
  const after=readWorkspace(root)!;
  assert.equal(currentRun(root,after)?.ref,reviewRef);
  assert.notEqual(reviewRef,ref);
  assert.ok(fs.readFileSync(managedPath(root,ref)).equals(original));
  const rejectedPrior=expectError(()=>saveRun({...author(root),runRef:ref,bodyFile:'body.md'},options),'run-not-current');
  const reservations=scanRunNumbers(root,after.id);
  assert.equal(reservations.number,3);
  findings.push({id:'P04',name:'downstream draft immediately replaces current Run',newDraftRef:reviewRef,priorRunRef:ref,rejectedCode:'run-not-current',nextAvailableRunNumber:reservations.number,message:rejectedPrior});

  // P05: original Actor/Role and lock safety on actual current draft.
  const wrongActor=expectError(()=>saveRun({...reviewer(root),actor:'not-reviewer-one',runRef:reviewRef,bodyFile:'body.md'},options),'action-role-mismatch');
  const lease=acquireProjectLock(root,'d05d-controlled-conflict');
  let lockedMessage:string;
  try {
    lockedMessage=expectError(()=>saveRun({...reviewer(root),runRef:reviewRef,bodyFile:'body.md'},options),'write-in-progress-or-interrupted');
  }finally{releaseProjectLock(root,lease);}
  assert.equal(fs.existsSync(path.join(root,'.mendi/write.lock')),false);
  findings.push({id:'P05',name:'role identity and true lock collisions reject writes',actorCode:'action-role-mismatch',lockCode:'write-in-progress-or-interrupted',actorMessage:wrongActor,lockMessage:lockedMessage,lockReleased:true});

  // P06: Review verdict remains authoritative; old run stays byte-identical.
  const reviewed=finish(root,reviewRef,'reviewer','complete','approved');
  assert.equal(reviewed.run.verdict,'approved');
  const fixed=readRun(root,ref,after.id,'proof-entry');
  const reviewDoc=readRun(root,reviewRef,after.id,'proof-entry');
  assert.equal(fixed.record.status,'submitted');
  assert.equal(reviewDoc.record.verdict,'approved');
  assert.equal(reviewDoc.record.authorRunRef,ref);
  assert.ok(fs.readFileSync(managedPath(root,ref)).equals(original));
  const reviewBytes=fs.readFileSync(managedPath(root,reviewRef));
  const rejectedReview=expectError(()=>saveRun({...reviewer(root),runRef:reviewRef,bodyFile:'body.md'},options),'run-already-submitted');
  assert.ok(fs.readFileSync(managedPath(root,reviewRef)).equals(reviewBytes));
  findings.push({id:'P06',name:'approved Review is immutable and fixed to original Author',reviewRef,verdict:reviewDoc.record.verdict,authorRef:ref,reviewResaveCode:'run-already-submitted',authorBytesUnchanged:true,reviewBytesUnchanged:true,next:reviewed.next});

  const data={
    name:'D05-D/033 Author bounded proof',
    status:'passed',
    method:'Actual present-tense product v2 Action APIs and isolated target; mocked OpenSpec readiness only for fixture, no real independent Reviewer/Owner',
    date:'2026-10-21',
    cases:findings,
    limits:[
      'No run supplement or run amend product CLI exists yet; this proof checks baseline rejects and eligibility edges, not success of a new capability',
      'The Reviewer verdict here is an isolated test fixture, not an approval for MenDi/DreMo history',
      'A future supplement needs an independently specified append-only receipt after submitted Run, without mutating original verdict/body',
      'A future limited amend needs an actual Markdown semantic boundary, before-body snapshot, attribution and downstream eligibility; none is implemented here',
      'The test did not touch real Delivery Full Test/Close, previous submitted Runs or Git'
    ],
  };
  fs.writeFileSync(artifact,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
  completed=true;
  console.log(JSON.stringify({ok:true,caseIds:findings.map(x=>x.id),caseCount:findings.length,authorRun:ref,reviewRun:reviewRef,artifact:path.relative(repository,artifact)},null,2));
}finally{
  // Only clean an exact fixture THIS script created and only after success.
  if(completed&&parent&&ownedRoot&&marker&&owned&&fs.existsSync(artifact)&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(owned)&&fs.realpathSync(parent)===parent&&path.dirname(parent)===temp&&!fs.existsSync(path.join(ownedRoot,'.mendi/write.lock'))){
    fs.rmSync(parent,{recursive:true,force:false,maxRetries:2});
  }
}
