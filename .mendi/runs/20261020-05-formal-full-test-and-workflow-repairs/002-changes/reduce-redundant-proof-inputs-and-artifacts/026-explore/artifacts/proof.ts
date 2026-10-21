import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {testTarget, writePackage, execute} from '../../../../../../../tests/test-support.ts';
import {testStatus} from '../../../../../../../src/application/tests.ts';

const repo=fs.realpathSync(process.cwd());
const target=path.join(repo,'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/026-explore/artifacts/proof-results.json');
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const surveyRoot=path.join(repo,'.mendi/runs');
assert.equal(fs.existsSync(target),false);
interface Counts {files:number;bytes:number;zero:number;names:Record<string,number>;zeroNames:Record<string,number>}
const empty=():Counts=>({files:0,bytes:0,zero:0,names:{},zeroNames:{}});
function walk(d:string,counts:Counts):void {
 for(const entry of fs.readdirSync(d,{withFileTypes:true})){
  const f=path.join(d,entry.name);
  if(entry.isDirectory())walk(f,counts);
  else if(entry.isFile()){
   const size=fs.statSync(f).size;
   counts.files++;counts.bytes+=size;
   counts.names[entry.name]=(counts.names[entry.name]??0)+1;
   if(size===0){counts.zero++;counts.zeroNames[entry.name]=(counts.zeroNames[entry.name]??0)+1;}
  }
 }
}
const deliveries:Record<string,Counts>={};
for(const id of fs.readdirSync(surveyRoot)){
 const d=path.join(surveyRoot,id);
 if(!fs.statSync(d).isDirectory())continue;
 const c=empty();walk(d,c);deliveries[id]=c;
}
const full=empty();
for(const c of Object.values(deliveries)){
 full.files+=c.files;full.bytes+=c.bytes;full.zero+=c.zero;
 for(const [n,v] of Object.entries(c.names))full.names[n]=(full.names[n]??0)+v;
 for(const [n,v] of Object.entries(c.zeroNames))full.zeroNames[n]=(full.zeroNames[n]??0)+v;
}
const archivedRun=path.join(surveyRoot,'20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/014-apply');
const archived=empty();walk(archivedRun,archived);
assert.equal(archived.files,1015);assert.equal(archived.zero,77);
assert.equal(archived.names['group-request.json'],114);
assert.equal(archived.names['result.json'],114);
assert.equal(archived.names['stdout.log'],114);
assert.equal(archived.names['stderr.log'],114);

let root:string|undefined,parent:string|undefined,marker:string|undefined,markerBytes:Buffer|undefined;
let finished=false,logHidden:string|undefined,backup:string|undefined;
let observed:unknown=null;
try{
 root=fs.realpathSync(testTarget());
 parent=fs.realpathSync(path.dirname(root));
 assert.equal(path.dirname(parent),tmp);
 assert.match(path.basename(parent),/^mendi-apply-/);
 assert.equal(path.basename(root),'minimal-project');
 marker=path.join(parent,'.d05c-026-owned.json');
 markerBytes=Buffer.from(JSON.stringify({id:'D05-C/026',root,nonce:crypto.randomUUID()})+'\n');
 fs.writeFileSync(marker,markerBytes,{flag:'wx'});
 writePackage(root,(pkg)=>{
  const scripts=pkg.scripts as Record<string,string>;
  scripts['test:focused']='node -e ""';
 });
 const success=await execute(root,'focused');
 assert.equal(success.outcome,'passed',JSON.stringify(success));
 if(!('record' in success))throw Error('No execution record');
 const record=success.record;
 const refs=[record.stdoutRef,record.stderrRef];
 const sizes=refs.map(ref=>fs.statSync(path.join(root!,ref)).size);
 const silentCandidates=refs.filter((_,i)=>sizes[i]===0);
 assert.ok(silentCandidates.length>=1,'Quiet execution did not produce an empty log; update fixture rather than assert hypothetical');
 const before=testStatus({project:root,execution:success.executionId!});
 assert.equal(before.outcome,'passed');
 logHidden=path.join(root,silentCandidates[0]);
 backup=logHidden+'.d05c-proof-hidden';
 assert.equal(fs.existsSync(backup),false);
 fs.renameSync(logHidden,backup);
 let missing:{outcome:string;code?:string;message?:string};
 try{
  const status=testStatus({project:root,execution:success.executionId!});
  missing={outcome:String(status.outcome),code:'error' in status?String((status.error as {code?:string})?.code??''):undefined};
 }catch(err:unknown){missing={outcome:'thrown',code:err instanceof Error&&'code'in err?String(err.code):undefined,message:err instanceof Error?err.message:String(err)};}
 fs.renameSync(backup,logHidden);backup=undefined;
 const restored=testStatus({project:root,execution:success.executionId!});
 assert.equal(restored.outcome,'passed');
 assert.ok(missing.outcome!=='passed');
 const failure=await execute(root,'fast');
 assert.equal(failure.outcome,'failed',JSON.stringify(failure));
 if(!('record' in failure))throw Error('No failure record');
 const failureLogs=[failure.record.stdoutRef,failure.record.stderrRef].map(ref=>({ref,bytes:fs.statSync(path.join(root!,ref)).size}));
 assert.equal(testStatus({project:root,execution:failure.executionId!}).outcome,'failed');
 const result={proof:'D05-C/026',baseline:{deliveries:Object.fromEntries(Object.entries(deliveries).map(([id,c])=>[id,{files:c.files,zero:c.zero,bytes:c.bytes}])),total:{files:full.files,zero:full.zero,bytes:full.bytes},zeroNames:Object.entries(full.zeroNames).sort((a,b)=>b[1]-a[1]).slice(0,15),d04Archive014:{files:archived.files,zero:archived.zero,requestCount:archived.names['group-request.json'],resultCount:archived.names['result.json'],stdoutCount:archived.names['stdout.log'],stderrCount:archived.names['stderr.log'],groupReportCount:archived.names['group-report.json']}},
  isolatedQuietRun:{execution:success.executionId,outcome:success.outcome,logRefs:refs,logBytes:sizes,stableBefore:before.outcome,missingEmptyLog:missing,restoredStatus:restored.outcome},isolatedRealFailure:{execution:failure.executionId,outcome:failure.outcome,logs:failureLogs},limits:['Historical files read only; no deletion or rewrite','Test log omission simulated exclusively by temporary rename of one zero-byte log in owned fixture, not product implementation','Formal groups-v1 report and request not modified','No root Delivery Full Test']};
 fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 observed={ok:true,baseline:result.baseline.total,d04:result.baseline.d04Archive014,quiet:result.isolatedQuietRun,failure:result.isolatedRealFailure,artifact:path.relative(repo,target)};
 finished=true;
 console.log(JSON.stringify(observed,null,2));
}finally{
 if(backup&&logHidden&&fs.existsSync(backup)&&!fs.existsSync(logHidden))fs.renameSync(backup,logHidden);
 if(finished&&parent&&marker&&markerBytes&&fs.existsSync(target)&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)&&fs.realpathSync(parent)===parent&&path.dirname(parent)===tmp&&!fs.existsSync(path.join(root!,'.mendi/write.lock'))){
  fs.rmSync(parent,{recursive:true,force:false,maxRetries:2});
 }
}
