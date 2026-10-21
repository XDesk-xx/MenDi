// D05-D Reviewer 034, separate delivery-scope Review repair lifecycle proof.
// Runs only on this new isolated product-v2 fixture; legacy test writer is used
// only to establish a real failing historical repair source, not new product Full Test.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verificationTarget,formal,finishRepair,authorActor,reviewActor} from '../../../../../../../tests/delivery-support.ts';
import {startDeliveryRepair,startDeliveryReview} from '../../../../../../../src/application/delivery-repair.ts';
import {readWorkspace} from '../../../../../../../src/adapters/workspace.ts';
import {currentDeliveryRun} from '../../../../../../../src/adapters/delivery-runs.ts';
import {currentRun,scanRunNumbers} from '../../../../../../../src/adapters/runs.ts';
import {saveRun} from '../../../../../../../src/application/actions.ts';
import {query} from '../../../../../../../src/application/project-query.ts';
import {writePackage} from '../../../../../../../tests/test-support.ts';
import {MendiError} from '../../../../../../../src/core/errors.ts';
const repo=fs.realpathSync(process.cwd()),here=path.dirname(fileURLToPath(import.meta.url));
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const root=fs.realpathSync(verificationTarget()),parent=fs.realpathSync(path.dirname(root));
assert.equal(path.basename(root),'project');
assert.equal(path.dirname(parent),tmp);
assert.match(path.basename(parent),/^mendi-apply-/);
const marker=path.join(parent,'.d05d-reviewer-034-delivery-owned.json');
const markerBytes=Buffer.from(JSON.stringify({id:'D05-D/034 delivery-scope',root,nonce:crypto.randomUUID()})+'\n');
fs.writeFileSync(marker,markerBytes,{flag:'wx'});
let complete=false;
const reject=(code:string,run:()=>unknown):string=>{
 let thrown:unknown;try{run();}catch(e:unknown){thrown=e;}
 assert.ok(thrown instanceof MendiError,'Expected MendiError '+code);
 assert.equal(thrown.code,code,thrown.message);
 return thrown.message;
};
try{
 writePackage(root,pkg=>{
  const scripts=pkg.scripts as Record<string,string>;
  scripts['test:full']='node foreground.ts fail';
 });
 const failure=await formal(root);
 assert.equal(failure.run?.fullTest?.outcome,'failed');
 assert.ok(failure.run?.ref);
 const from=failure.run.ref;
 const a=startDeliveryRepair({project:root,from,reason:'reviewer isolated repair',role:'author',actor:authorActor});
 const authorRef=a.run.ref;
 const authorComplete=finishRepair(root,authorRef,'author','complete');
 assert.equal(authorComplete.run.status,'submitted');
 const authorBytes=fs.readFileSync(path.join(root,authorRef));
 const beforeReview=readWorkspace(root)!;
 assert.equal(beforeReview.activeChangeId,null);
 assert.equal(currentDeliveryRun(root,beforeReview)?.ref,authorRef);
 assert.ok(currentRun(root,beforeReview)?.record.archive);
 assert.notEqual(currentRun(root,beforeReview)?.ref,authorRef);
 const reviewerDraft=startDeliveryReview({project:root,authorRunRef:authorRef,role:'reviewer',actor:reviewActor});
 assert.equal(reviewerDraft.run.status,'draft');
 assert.equal(currentDeliveryRun(root,readWorkspace(root)!)?.ref,reviewerDraft.run.ref);
 const reviewed=finishRepair(root,reviewerDraft.run.ref,'reviewer','complete','approved');
 assert.equal(reviewed.run.status,'submitted');
 assert.equal(reviewed.run.verdict,'approved');
 const reviewRef=reviewed.run.ref;
 const reviewBytes=fs.readFileSync(path.join(root,reviewRef));
 const afterReview=readWorkspace(root)!;
 assert.equal(afterReview.manifest.deliveryRunRef,reviewRef);
 assert.equal(currentDeliveryRun(root,afterReview)?.ref,reviewRef);
 assert.ok(currentRun(root,afterReview)?.record.archive);
 assert.notEqual(currentRun(root,afterReview)?.ref,reviewRef);
 assert.equal(afterReview.activeChangeId,null);
 const status=query({project:root});
 assert.ok('run'in status&&status.run);
 assert.equal(status.run.ref,reviewRef);
 assert.equal(status.next.action,'delivery-full-test');
 const oldSubmitBlocked=reject('run-already-submitted',()=>saveRun({
  project:root,runRef:reviewRef,role:'reviewer',actor:reviewActor,bodyFile:'repair-body.md'
 }));
 assert.equal(scanRunNumbers(root,'d01').number,reviewed.run.runNumber+1);
 assert.ok(fs.readFileSync(path.join(root,reviewRef)).equals(reviewBytes));
 assert.ok(fs.readFileSync(path.join(root,authorRef)).equals(authorBytes));
 const proactive=startDeliveryRepair({
  project:root,from,reason:'reviewer isolated proactive next repair',
  revisesRunRef:authorRef,role:'author',actor:authorActor
 });
 const latest=readWorkspace(root)!;
 assert.equal(proactive.run.status,'draft');
 assert.equal(latest.manifest.deliveryRunRef,proactive.run.ref);
 assert.equal(currentDeliveryRun(root,latest)?.ref,proactive.run.ref);
 const oldNotCurrent=reject('run-not-current',()=>saveRun({
  project:root,runRef:reviewRef,role:'reviewer',actor:reviewActor,bodyFile:'repair-body.md'
 }));
 assert.ok(fs.readFileSync(path.join(root,reviewRef)).equals(reviewBytes));
 assert.ok(fs.readFileSync(path.join(root,authorRef)).equals(authorBytes));
 const data={recordedAt:new Date().toISOString(),
  fixedAuthor:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/033-explore/run.md',
  scope:'Actual product-v2 Delivery repair and delivery-scope Reviewer, as a fixture for direct requirement similar to DreMo 035; uses test legacy command to establish failed source, not new formal D05 Full Test',
  failedSource:from,
  author:{ref:authorRef,status:authorComplete.run.status,unchanged:true},
  review:{ref:reviewRef,status:reviewed.run.status,verdict:reviewed.run.verdict,authorRunRef:reviewed.run.authorRunRef,
    activeChange:afterReview.activeChangeId,currentDeliveryRun:afterReview.manifest.deliveryRunRef,
    oldArchivedChangeRun:currentRun(root,afterReview)?.ref,
    next:status.next.action,oldSaveBlocked:oldSubmitBlocked},
  nextDraft:{ref:proactive.run.ref,status:proactive.run.status,prevReviewStale:oldNotCurrent,
    currentDeliveryRun:latest.manifest.deliveryRunRef,number:proactive.run.runNumber},
  sourceRefs:['src/adapters/delivery-runs.ts:37-66','src/application/delivery-repair.ts:160-223','src/application/delivery-repair.ts:43-55','src/adapters/runs.ts:42-48','src/core/associations.ts:22-36','src/application/project-query.ts:54-88'],
  limits:['No real DreMo target touched, Reviewer labels in fixture do not certify real identity',
   'No supplement/amend implemented or exercised',
   'Proactive next repair draft is a controlled product-v2 transition to prove latest-window closure',
   'Delivery-scope and Change-scope pointer eligibility differ: archived Change pointer can remain readable while deliveryRunRef is authoritative; Propose must handle both explicitly']
 };
 fs.writeFileSync(path.join(here,'reviewer-delivery-results.json'),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
 complete=true;
 console.log(JSON.stringify({status:'passed',deliveryReviewerApprovedLatest:true,reviewRef,activeChange:null,
  afterNextDeliveryDraftOldReviewerRejected:true,receipt:'reviewer-delivery-results.json'},null,2));
}finally{
 if(complete&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)&&
  fs.realpathSync(parent)===parent&&path.dirname(parent)===tmp&&!fs.existsSync(path.join(root,'.mendi/write.lock'))){
  fs.rmSync(parent,{recursive:true,force:false});
 }
}
