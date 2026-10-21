// D05-B Reviewer 024 independent F3 proof. Only modifies its own isolated product-v2 fixture.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verificationTarget} from '../../../../../../../tests/delivery-support.ts';
import {write,input} from '../../../../../../../tests/change-add-support.ts';
import {addDeliveryChanges} from '../../../../../../../src/application/delivery-change-add.ts';
import {readWorkspace} from '../../../../../../../src/adapters/workspace.ts';
import {readDeliveryRun} from '../../../../../../../src/adapters/delivery-runs.ts';

const repo=fs.realpathSync(process.cwd()),here=path.dirname(fileURLToPath(import.meta.url));
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const root=fs.realpathSync(verificationTarget()),parent=fs.realpathSync(path.dirname(root));
assert.equal(path.basename(root),'project');
assert.equal(path.dirname(parent),tmp);
assert.match(path.basename(parent),/^mendi-apply-/);
const marker=path.join(parent,'.d05b-r024-owned.json');
const markerBytes=Buffer.from(JSON.stringify({scope:'D05-B/R024-F3',root,nonce:crypto.randomUUID()})+'\n');
fs.writeFileSync(marker,markerBytes,{flag:'wx'});
let finished=false;
let firstPath:string|undefined,secondPath:string|undefined;
let firstOriginal:Buffer|undefined,secondOriginal:Buffer|undefined;
const checks:Array<{id:string;status:'passed';code?:string;message?:string}>=[];
const file=(ref:string)=>path.join(root,ref);
function reject(id:string,action:()=>unknown, expected:string) {
 let err:unknown;
 try{action();}catch(e:unknown){err=e;}
 if(!(err instanceof Error))throw Error(id+': expected refusal, operation succeeded');
 const code='code' in err?String(err.code):err.name;
 assert.equal(code,expected,id+': '+err.message);
 checks.push({id,status:'passed',code,message:err.message});
}
try{
 write(root,{requestId:'r024-1',ownerDecision:'controlled Reviewer fixture, not actual Owner permission',
  reason:'first scope',additions:[{slot:'C',title:'C',dependsOn:['B']}]});
 const first=addDeliveryChanges(input(root));
 assert.equal(first.ok,true);
 write(root,{requestId:'r024-2',ownerDecision:'controlled Reviewer fixture, not actual Owner permission',
  reason:'second scope',additions:[{slot:'D',title:'D',dependsOn:['C']}]});
 const second=addDeliveryChanges(input(root));
 assert.equal(second.ok,true);
 firstPath=file(first.run.ref.replace('run.md','artifacts/intent.json'));
 secondPath=file(second.run.ref.replace('run.md','artifacts/intent.json'));
 firstOriginal=fs.readFileSync(firstPath);
 secondOriginal=fs.readFileSync(secondPath);
 const basis=JSON.parse(secondOriginal.toString()) as {
  project:string;manifest:string;direct:Array<[string,string]>;directDigests?:Array<[string,string]>;
 };
 assert.equal(basis.directDigests?.length,2);
 const firstIntentRef=first.run.ref.replace('run.md','artifacts/intent.json');
 assert.deepEqual(new Set(basis.directDigests!.map(([ref])=>ref)),new Set([first.run.ref,firstIntentRef]));
 const writeBasis=(value:typeof basis)=>fs.writeFileSync(secondPath!,JSON.stringify(value,null,2)+'\n');
 const size=readWorkspace(root)?.scope.plannedChanges.length;
 assert.equal(size,4);
 checks.push({id:'valid-two-add-chain',status:'passed'});
 const missingAll={...basis};delete missingAll.directDigests;
 writeBasis(missingAll);
 reject('F3-remove-complete-digests',()=>readWorkspace(root),'invalid-scope-addition');
 fs.writeFileSync(firstPath,Buffer.concat([firstOriginal,Buffer.from(' ')]));
 reject('F3-remove-list-and-tamper-previous',()=>readWorkspace(root),'invalid-scope-addition');
 fs.writeFileSync(firstPath,firstOriginal);
 reject('F3-resume-missing-digests',()=>addDeliveryChanges({
  ...input(root),inputFile:undefined,resumeRef:second.run.ref
 }),'invalid-scope-addition');
 fs.writeFileSync(secondPath,secondOriginal);
 writeBasis({...basis,directDigests:basis.directDigests!.slice(0,1)});
 reject('F3-remove-one-digest',()=>readWorkspace(root),'invalid-scope-addition');
 writeBasis({...basis,directDigests:[...basis.directDigests!,basis.directDigests![0]]});
 reject('F3-duplicate-digest',()=>readWorkspace(root),'invalid-scope-addition');
 writeBasis({...basis,direct:[...basis.direct,[firstIntentRef,firstOriginal.toString('base64')]]});
 reject('F3-conflicting-direct-and-digest',()=>readWorkspace(root),'invalid-scope-addition');
 writeBasis({...basis,directDigests:[...basis.directDigests!,['.mendi/unrelated/extra','a'.repeat(64)]]});
 reject('F3-extra-historical-digest',()=>readWorkspace(root),'invalid-scope-addition');
 writeBasis({...basis,directDigests:[...basis.directDigests!,['../outside','a'.repeat(64)]]});
 reject('F3-out-of-bounds-digest',()=>readWorkspace(root),'invalid-scope-addition');
 fs.writeFileSync(secondPath,secondOriginal);
 const legacy={
  ...basis,
  direct:[...basis.direct,...basis.directDigests!.map(([ref])=>[ref,fs.readFileSync(file(ref)).toString('base64')] as [string,string])]
 };
 delete legacy.directDigests;
 writeBasis(legacy);
 assert.equal(readWorkspace(root)?.scope.plannedChanges.length,size);
 checks.push({id:'legacy-all-prior-bytes-still-readable',status:'passed'});
 fs.writeFileSync(firstPath,Buffer.concat([firstOriginal,Buffer.from(' ')]));
 reject('legacy-inline-refuses-changed-previous-intent',()=>readWorkspace(root),'delivery-input-changed');
 fs.writeFileSync(firstPath,firstOriginal);
 assert.equal(readWorkspace(root)?.scope.plannedChanges.length,size);
 fs.writeFileSync(secondPath,secondOriginal);
 assert.equal(readDeliveryRun(root,first.run.ref,'d01').record.status,'submitted');
 assert.equal(readDeliveryRun(root,second.run.ref,'d01').record.status,'submitted');
 assert.equal(readWorkspace(root)?.rounds?.at(-1)?.scopeAdditions?.length,2);
 const data={
  recordedAt:new Date().toISOString(),
  fixedAuthor:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/023-revise-apply/run.md',
  methods:'real two-add isolated product-v2 writes; Reviewer mutations only to own two intent files; exact restoration',
  checks,refs:[first.run.ref,second.run.ref],
  sizes:[firstOriginal.length,secondOriginal.length],restored:true,
  limits:['Not a signed tamper-proof file system: consistent malicious rewriting of all references is not in scope',
    'No actual Owner authorization or root D05 Full Test/Close', 'Two-add proof does not replace existing seven-add and interruption regression']
 };
 fs.writeFileSync(path.join(here,'proof-results.json'),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
 finished=true;
 console.log(JSON.stringify({status:'passed',checks:checks.length,positiveLegacy:true,originalF3ReproducedAsRejection:true,sizes:data.sizes},null,2));
}finally{
 if(firstOriginal&&firstPath&&fs.existsSync(firstPath))fs.writeFileSync(firstPath,firstOriginal);
 if(secondOriginal&&secondPath&&fs.existsSync(secondPath))fs.writeFileSync(secondPath,secondOriginal);
 if(finished&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)&&fs.realpathSync(parent)===parent&&
    path.dirname(parent)===tmp&&!fs.existsSync(path.join(root,'.mendi/write.lock')))fs.rmSync(parent,{recursive:true,force:false});
}