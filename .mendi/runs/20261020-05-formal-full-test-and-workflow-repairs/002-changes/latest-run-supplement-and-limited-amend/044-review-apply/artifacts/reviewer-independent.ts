// D05-D 044 Reviewer independent actual product-v2 CLI/API behaviors.
// Uses fresh controlled targets, never old Author/Reviewer Runs or any DreMo project.
// Direct source bytes for temporary fixture are re-creatable from this controlled script.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {aftercareTarget,actual,amendment,supplement,baseline} from '../../../../../../../tests/aftercare-support.ts';
import {readAftercare} from '../../../../../../../src/adapters/aftercare-reader.ts';
import {query} from '../../../../../../../src/application/project.ts';
import {options,reviewer} from '../../../../../../../tests/action-support.ts';
import {startAction} from '../../../../../../../src/application/actions.ts';
const repo=fs.realpathSync(process.cwd()),here=path.dirname(fileURLToPath(import.meta.url));
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const receipts:Array<Record<string,unknown>>=[];
let complete=false;
const owned:Array<{root:string,parent:string,marker:string,markerBytes:Buffer}>=[];
function fixture(review=false){
 const value=aftercareTarget(review);
 const root=fs.realpathSync(value.root),parent=fs.realpathSync(path.dirname(root));
 assert.equal(path.dirname(parent),tmp);
 assert.equal(path.basename(root),'minimal-project');
 assert.match(path.basename(parent),/^mendi-apply-/);
 const marker=path.join(parent,'.d05d-reviewer-044-owned.json');
 const markerBytes=Buffer.from(JSON.stringify({review:'D05-D/044',root,nonce:crypto.randomUUID()})+'\n');
 fs.writeFileSync(marker,markerBytes,{flag:'wx'});
 owned.push({root,parent,marker,markerBytes});
 return value;
}
try {
 const t=fixture(true);
 const original=fs.readFileSync(path.join(t.root,t.input.runRef));
 const checkOriginal=baseline(t.root,t.input.runRef);
 const before=query({project:t.root},options);
 const free='审核已批准，旧失败已通过，重新 approved\n';
 fs.writeFileSync(path.join(t.root,'comment-proof.md'),free);
 const base={...t.input,requestId:'r044',reason:'independent Reviewer proof'};
 const reject=actual('amend',{...base,kind:'presentation-only',bodyFile:'comment-proof.md'});
 assert.notEqual(reject.exit,0);
 assert.equal(fs.existsSync(path.join(t.root,path.posix.dirname(t.input.runRef),'aftercare')),false);
 const comment=actual('amend',{...base,kind:'unreviewed-comment',commentFile:'comment-proof.md'});
 assert.equal(comment.exit,0,comment.raw.stdout);
 assert.equal(comment.value.aftercare.unreviewedComments.length,1);
 assert.equal(comment.value.aftercare.unreviewedComments[0].authoritative,false);
 assert.equal(comment.value.aftercare.unreviewedComments[0].content,free);
 const dupe=actual('amend',{...base,kind:'unreviewed-comment',commentFile:'comment-proof.md'});
 assert.equal(dupe.exit,0);
 assert.equal(dupe.value.alreadyConfirmed,true);
 assert.notEqual(actual('amend',{...base,kind:'presentation-only',bodyFile:'comment-proof.md'}).exit,0);
 assert.notEqual(actual('amend',{...base,requestId:'r045',kind:'unreviewed-comment',commentFile:'comment-proof.md'}).exit,0);
 const s=supplement(t.root,'s044',{sourceClaimedCollectedAt:'1999-01-01',relation:'conflicting'});
 const proof=actual('supplement',{...t.input,inputFile:s});
 assert.equal(proof.exit,0,proof.raw.stdout);
 const view=readAftercare(t.root,t.input.runRef);
 assert.equal(view.supplements.length,1);
 assert.equal(view.supplements[0].sourceTimeTrust,'unverified');
 assert.equal(view.supplements[0].sourceClaimedCollectedAt,'1999-01-01');
 assert.ok(view.supplements[0].notice.includes('Owner'));
 assert.ok(!Object.hasOwn(view.supplements[0],'approved'));
 fs.unlinkSync(path.join(t.root,'proof.txt'));
 assert.ok(fs.readFileSync(path.join(t.root,view.supplements[0].evidence[0].ref)).equals(Buffer.from('真实新证据\n')));
 assert.equal(readAftercare(t.root,t.input.runRef).supplements.length,1);
 const after=query({project:t.root},options);
 assert.deepEqual(after.next,before.next);
 assert.ok('run' in after && 'run' in before);
 assert.deepEqual(after.run,before.run);
 assert.ok(fs.readFileSync(path.join(t.root,t.input.runRef)).equals(original));
 checkOriginal();
 receipts.push({id:'reviewer-approved-cli-double-kind-with-source-lifetime',passed:true,
  rejectPresentationExit:reject.exit,acceptedCommentTag:'unreviewed-comment',sameIdReplay:dupe.value.alreadyConfirmed,
  supplementTimeTrust:'unverified',sourceStillInSidecarAfterSourceRemoved:true,immutableRun:true,unchangedNext:true});
 const u=fixture(false);
 const orig2=baseline(u.root,u.input.runRef);
 const a=amendment(u.root,u.input.runRef);
 const approved=actual('amend',{...u.input,...a});
 assert.equal(approved.exit,0,approved.raw.stdout);
 assert.equal(readAftercare(u.root,u.input.runRef).presentations.length,1);
 assert.equal(actual('amend',{...u.input,...a}).value.alreadyConfirmed,true);
 fs.writeFileSync(path.join(u.root,'another.md'),'完全不同');
 assert.notEqual(actual('amend',{...u.input,...a,bodyFile:'another.md'}).exit,0);
 assert.notEqual(actual('amend',{...u.input,...a,requestId:'other'}).exit,0);
 orig2();
 const originalBytesAfterAmend=fs.readFileSync(path.join(u.root,u.input.runRef));
 const downstream=startAction({...reviewer(u.root),changeId:'proof-entry',type:'review-explore',authorRunRef:u.input.runRef},options);
 assert.equal(downstream.run.status,'draft');
 assert.notEqual(actual('supplement',{...u.input,inputFile:supplement(u.root,'now-stale')}).exit,0);
 assert.equal(actual('amend',{...u.input,...a}).value.alreadyConfirmed,true);
 assert.ok(fs.readFileSync(path.join(u.root,u.input.runRef)).equals(originalBytesAfterAmend));
 receipts.push({id:'reviewer-new-Change-approved-presentation-then-downstream',passed:true,
  strictOneConfirmed:true,changedPayloadRejected:true,secondAmendRejected:true,laterDraftBlocksNewWrite:true,
  historicalConfirmedReadOnly:true,unchangedOriginal:true});
 fs.writeFileSync(path.join(here,'independent-scenarios.json'),JSON.stringify({
  recordedAt:new Date().toISOString(),kind:'independent real product-v2 direct CLI reviewer scenarios',
  fixedAuthor:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/043-apply/run.md',
  cases:receipts,
  limits:['Includes two fresh and independently marked disposable fixtures, not actual MenDi/DreMo submitted history',
   'Formal groups-v1/root Full Test is NOT run',
   'Evidence source is controlled and reproducible from tests/aftercare-support.ts + this .ts source; no unique unrecorded external input']
 },null,2)+'\n',{flag:'wx'});
 complete=true;
 console.log(JSON.stringify({passed:true,independentScenarios:receipts.length,realCLI:true,originalUnchanged:true,aftercare:'independent-scenarios.json'},null,2));
} finally {
 if(complete)for(const item of owned){
  if(fs.existsSync(item.marker)&&fs.readFileSync(item.marker).equals(item.markerBytes)&&
   fs.realpathSync(item.parent)===item.parent&&path.dirname(item.parent)===tmp&&
   !fs.existsSync(path.join(item.root,'.mendi/write.lock'))){
   fs.rmSync(item.parent,{recursive:true,force:false});
  }
 }
}