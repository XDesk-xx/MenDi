// D05-D Reviewer 034. Independent product-v2 Explore baseline proof.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {actionTarget,startAuthor,finish,author,reviewer,options} from '../../../../../../../tests/action-support.ts';
import {startAction,saveRun,submitRun} from '../../../../../../../src/application/actions.ts';
import {currentRun,scanRunNumbers} from '../../../../../../../src/adapters/runs.ts';
import {readWorkspace,acquireProjectLock,releaseProjectLock} from '../../../../../../../src/adapters/workspace.ts';
import {managedPath} from '../../../../../../../src/adapters/paths.ts';
import {query} from '../../../../../../../src/application/project-query.ts';
import {MendiError} from '../../../../../../../src/core/errors.ts';
const repo=fs.realpathSync(process.cwd());
const here=path.dirname(fileURLToPath(import.meta.url));
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const root=fs.realpathSync(actionTarget()), parent=fs.realpathSync(path.dirname(root));
assert.equal(path.basename(root),'minimal-project');
assert.equal(path.dirname(parent),tmp);
assert.match(path.basename(parent),/^mendi-apply-/);
const marker=path.join(parent,'.d05d-r034-reviewer-owned.json');
const markerBytes=Buffer.from(JSON.stringify({proof:'D05-D/034',root,nonce:crypto.randomUUID()})+'\n');
fs.writeFileSync(marker,markerBytes,{flag:'wx'});
let complete=false;
const results:Array<{id:string,observed:unknown,source:string[]}>=[];
function expect(code:string,operation:()=>unknown){
 let error:unknown;
 try{operation();}catch(e:unknown){error=e;}
 assert.ok(error instanceof MendiError,'Expected '+code+' but call succeeded or unexpected error');
 assert.equal(error.code,code,error.message);
 return {code:error.code,message:error.message};
}
try{
 const a=startAuthor(root);
 assert.equal(a.run.status,'draft');
 assert.equal(a.run.runNumber,1);
 const completed=finish(root,a.run.ref,'author','complete');
 const authorBytes=fs.readFileSync(managedPath(root,a.run.ref));
 const ws=readWorkspace(root)!;
 assert.equal(ws.currentRoundId,'r001');
 assert.equal(currentRun(root,ws)?.ref,a.run.ref);
 assert.equal(completed.run.status,'submitted');
 assert.equal(scanRunNumbers(root,ws.id).number,2);
 const response=query({project:root},options);
 assert.ok('run'in response&&response.run);
 assert.equal(response.run.ref,a.run.ref);
 assert.equal(response.next.action,'review-explore');
 results.push({id:'current-submitted-author-before-downstream',observed:{author:a.run.ref,latest:true,status:'submitted',next:response.next.action,runNumber:1},source:['src/adapters/runs.ts:42-48','src/application/project-query.ts:88-114']});
 const oldSave=expect('run-already-submitted',()=>saveRun({...author(root),runRef:a.run.ref,bodyFile:'body.md'},options));
 const oldSubmit=expect('run-already-submitted',()=>submitRun({...author(root),runRef:a.run.ref,outcome:'complete',result:'unsafe retry'},options));
 assert.ok(fs.readFileSync(managedPath(root,a.run.ref)).equals(authorBytes));
 results.push({id:'ordinary-save-submit-remain-immutable',observed:{oldSave,oldSubmit,runBytesUnchanged:true},source:['src/application/action-context.ts:65-74']});
 const unsafe=expect('unsafe-reference',()=>managedPath(root,'../somewhere'));
 results.push({id:'managed-path-rejection',observed:unsafe,source:['src/adapters/paths.ts:23-56']});
 const r=startAction({...reviewer(root),changeId:'proof-entry',type:'review-explore',authorRunRef:a.run.ref},options);
 assert.equal(r.run.runNumber,2);
 assert.equal(r.run.status,'draft');
 assert.equal(currentRun(root,readWorkspace(root)!)?.ref,r.run.ref);
 const oldCurrent=expect('run-not-current',()=>saveRun({...author(root),runRef:a.run.ref,bodyFile:'body.md'},options));
 assert.equal(scanRunNumbers(root,'d01').number,3);
 assert.ok(fs.readFileSync(managedPath(root,a.run.ref)).equals(authorBytes));
 results.push({id:'downstream-draft-immediately-displaces-author',observed:{draft:r.run.ref,nextNumber:3,priorOldCurrent:oldCurrent.code},source:['src/adapters/action-store.ts:64-104','src/adapters/runs.ts:42-48']});
 const other=expect('action-role-mismatch',()=>saveRun({...reviewer(root),actor:'other-reviewer',runRef:r.run.ref,bodyFile:'body.md'},options));
 const lock=acquireProjectLock(root,'reviewer-034-contended');
 let locked:{code:string,message:string};
 try{locked=expect('write-in-progress-or-interrupted',()=>saveRun({...reviewer(root),runRef:r.run.ref,bodyFile:'body.md'},options));}
 finally{releaseProjectLock(root,lock);}
 assert.equal(fs.existsSync(path.join(root,'.mendi/write.lock')),false);
 results.push({id:'real-lock-and-wrong-actor',observed:{wrongActor:other.code,lock:locked.code,lockLeft:false},source:['src/application/action-context.ts:38-41','src/adapters/workspace.ts:181-211']});
 const rev=finish(root,r.run.ref,'reviewer','complete','approved');
 assert.equal(rev.run.verdict,'approved');
 const reviewBytes=fs.readFileSync(managedPath(root,r.run.ref));
 assert.ok(fs.readFileSync(managedPath(root,a.run.ref)).equals(authorBytes));
 const snapshot=readWorkspace(root)!;
 assert.equal(currentRun(root,snapshot)?.ref,r.run.ref);
 assert.equal(currentRun(root,snapshot)?.record.verdict,'approved');
 const approvedNext=query({project:root},options);
 assert.equal(approvedNext.next.action,'propose');
 const resave=expect('run-already-submitted',()=>saveRun({...reviewer(root),runRef:r.run.ref,bodyFile:'body.md'},options));
 assert.ok(fs.readFileSync(managedPath(root,r.run.ref)).equals(reviewBytes));
 results.push({id:'approved-review-is-current-but-verdict-immutable',observed:{reviewRef:r.run.ref,authorRef:rev.run.authorRunRef,verdict:rev.run.verdict,next:approvedNext.next.action,resave:resave.code,bytesUnchanged:true},source:['src/core/actions.ts:202-279','src/application/actions.ts:174-231']});
 const proposal=startAction({...author(root),changeId:'proof-entry',type:'propose',tool:'openspec'},options);
 assert.equal(proposal.run.runNumber,3);
 assert.equal(proposal.run.status,'draft');
 assert.equal(currentRun(root,readWorkspace(root)!)?.ref,proposal.run.ref);
 const nowStale=expect('run-not-current',()=>saveRun({...reviewer(root),runRef:r.run.ref,bodyFile:'body.md'},options));
 assert.ok(fs.readFileSync(managedPath(root,r.run.ref)).equals(reviewBytes));
 assert.ok(fs.readFileSync(managedPath(root,a.run.ref)).equals(authorBytes));
 results.push({id:'approved-review-displaced-by-next-propose-draft',observed:{newDraftRef:proposal.run.ref,priorReviewStale:nowStale.code,nextNumber:scanRunNumbers(root,'d01').number,priorReviewBytesUnchanged:true},source:['src/core/actions.ts:281-322','src/adapters/action-store.ts:64-104']});
 const evidence={recordedAt:new Date().toISOString(),fixedAuthor:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/033-explore/run.md',
  method:'actual product-v2 actionTarget, current Action APIs and real product Run save/submit behavior; readiness stub only for OpenSpec fixture',
  cases:results,caseCount:results.length,
  assessment:[
   'Baseline facts do not show supplement/amend implemented, and do not authorize changing submitted Run',
   'Current Change binding currentRun and shared delivery-wide reservation numbering are separate; Propose must check actual global next occupancy, round and current authority',
   'A current approved Reviewer is latest before a new draft, but post-review evidence is later and cannot retroactively affect approved verdict',
   'A Markdown edit to a submitted body with semantic effect must not be accepted as cosmetic simply because frontmatter remains unchanged'
  ],
  limits:['No actual supplement/amend product write or old submitted modification',
   'No D05 formal Full Test/Close/Archive/Git/stable installation or DreMo changes',
   'One controlled product fixture, not generalized across arbitrary Delivery operation Run types']
 };
 fs.writeFileSync(path.join(here,'reviewer-proof-results.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
 complete=true;
 console.log(JSON.stringify({ok:true,realCases:results.length,latestApprovedReviewerObserved:true,downstreamDraftBlocks:true,originalRunBytesUnchanged:true,proof:'reviewer-proof-results.json'},null,2));
}finally{
 if(complete&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)&&fs.realpathSync(parent)===parent&&path.dirname(parent)===tmp&&!fs.existsSync(path.join(root,'.mendi/write.lock')))fs.rmSync(parent,{recursive:true,force:false});
}