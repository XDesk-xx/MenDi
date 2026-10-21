// D05-B Reviewer 022 integrity check: does historical digest list completeness fail closed?
// Only mutates files inside its OWN short-lived isolated product-v2 fixture, restores all.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verificationTarget} from '../../../../../../../tests/delivery-support.ts';
import {write,input} from '../../../../../../../tests/change-add-support.ts';
import {addDeliveryChanges} from '../../../../../../../src/application/delivery-change-add.ts';
import {readWorkspace} from '../../../../../../../src/adapters/workspace.ts';

const repo=fs.realpathSync(process.cwd()),here=path.dirname(fileURLToPath(import.meta.url));
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const root=fs.realpathSync(verificationTarget()),parent=fs.realpathSync(path.dirname(root));
assert.equal(path.basename(root),'project');
assert.equal(path.dirname(parent),tmp);
assert.match(path.basename(parent),/^mendi-apply-/);
const marker=path.join(parent,'.mendi-reviewer-022-integrity-owned.json');
const markerBytes=Buffer.from(JSON.stringify({kind:'reviewer-022-digest-completeness',root,nonce:crypto.randomUUID()})+'\n');
fs.writeFileSync(marker,markerBytes,{flag:'wx'});
let complete=false;
let originalFirst:Buffer|undefined,originalSecond:Buffer|undefined;
let refFirst='',refSecond='';
try {
 const refs:string[]=[];
 for(const [i,slot] of ['C','D'].entries()){
   write(root,{requestId:'reviewer-integrity-'+(i+1),
    ownerDecision:'controlled fixture not real Owner authorization',
    reason:'digest completeness negative control',
    additions:[{slot,title:slot,dependsOn:[i===0?'B':'C']}]});
   const outcome=addDeliveryChanges(input(root));
   assert.equal(outcome.ok,true);
   refs.push(outcome.run.ref.replace('run.md','artifacts/intent.json'));
 }
 [refFirst,refSecond]=refs;
 originalFirst=fs.readFileSync(path.join(root,refFirst));
 originalSecond=fs.readFileSync(path.join(root,refSecond));
 const second=JSON.parse(originalSecond.toString()) as {directDigests?:unknown[]};
 assert.equal(second.directDigests?.length,2);
 const baselineRead=readWorkspace(root)!.scope.plannedChanges.length;
 delete second.directDigests;
 fs.writeFileSync(path.join(root,refSecond),JSON.stringify(second,null,2)+'\n');
 let removedListRead:unknown;
 try{removedListRead={accepted:true,scopeSize:readWorkspace(root)?.scope.plannedChanges.length};}
 catch(e:unknown){removedListRead={accepted:false,code:e instanceof Error&&'code' in e?String(e.code):'',message:e instanceof Error?e.message:String(e)};}
 fs.writeFileSync(path.join(root,refFirst),Buffer.concat([originalFirst,Buffer.from(' ')]));
 let droppedAndTamperedRead:unknown;
 try{droppedAndTamperedRead={accepted:true,scopeSize:readWorkspace(root)?.scope.plannedChanges.length};}
 catch(e:unknown){droppedAndTamperedRead={accepted:false,code:e instanceof Error&&'code' in e?String(e.code):'',message:e instanceof Error?e.message:String(e)};}
 fs.writeFileSync(path.join(root,refFirst),originalFirst);
 fs.writeFileSync(path.join(root,refSecond),originalSecond);
 assert.equal(readWorkspace(root)?.scope.plannedChanges.length,baselineRead);
 const record={
  recordedAt:new Date().toISOString(),
  operation:'two REAL append writer executions, then removal of the second intent directDigests and modification of earlier intent; all files restored within owned product-v2 fixture',
  baselineScopeSize:baselineRead,
  tamper:{digestListRemoved:removedListRead,priorIntentChangedAfterListRemoved:droppedAndTamperedRead},
  files:{first:refFirst,second:refSecond},
  notes:['This proves parser behavior in a local editable fixture, not external attacker exploit or production write bypass',
   'No scope-change or current eligibility mutation; only historical intent consistency check',
   'The absence of a digest list may be a deliberately supported legacy receipt form; Review must decide whether new-form authenticity can be reliably distinguished'],
  finalStateRestored:true
 };
 fs.writeFileSync(path.join(here,'integrity-results.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 complete=true;
 console.log(JSON.stringify({status:'saved',digestListRemoval:removedListRead,olderIntentMutation:droppedAndTamperedRead,
  evidence:path.relative(repo,path.join(here,'integrity-results.json'))},null,2));
} finally {
 // Restore if error, then cleanup only this exact nonce-owned path when no lock.
 if(originalFirst && refFirst && fs.existsSync(path.join(root,refFirst)))fs.writeFileSync(path.join(root,refFirst),originalFirst);
 if(originalSecond && refSecond && fs.existsSync(path.join(root,refSecond)))fs.writeFileSync(path.join(root,refSecond),originalSecond);
 if(complete&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)&&fs.realpathSync(parent)===parent&&
    path.dirname(parent)===tmp&&!fs.existsSync(path.join(root,'.mendi/write.lock')))
  fs.rmSync(parent,{recursive:true,force:false});
}
