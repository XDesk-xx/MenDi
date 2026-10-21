// D05-D 044 independent Reviewer two-batch actual affected tests, single raw TAP each.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),cwd=process.cwd();
const batches=[
 {name:'aftercare',files:['tests/aftercare-modes.test.ts','tests/aftercare-eligibility.test.ts','tests/aftercare-delivery.test.ts','tests/aftercare-recovery.test.ts'],expected:20},
 {name:'baseline',files:['tests/action-write.test.ts','tests/query.test.ts','tests/delivery-query.test.ts','tests/workspace.test.ts'],expected:36}
];
const results:Array<{name:string,files:string[],expected:number,command:string[],exitCode:number|null,signal:string|null,error:string|null,counts:Record<string,number|null>,stdout:string,stderr:string|null}>=[];
for(const batch of batches){
 const args=['--test','--test-concurrency=2',...batch.files];
 const child=spawnSync(process.execPath,args,{cwd,encoding:'utf8',windowsHide:true,timeout:930000,maxBuffer:48*1024*1024,
  env:{...process.env,MENDI_TEST_EVIDENCE_DIR:'',MENDI_APPLY_EVIDENCE:''}});
 const stdout=child.stdout??'',stderr=child.stderr??'';
 const out=batch.name+'.tap.log',err=stderr?batch.name+'.stderr.log':null;
 fs.writeFileSync(path.join(here,out),stdout,{flag:'wx'});
 if(err)fs.writeFileSync(path.join(here,err),stderr,{flag:'wx'});
 const count=(name:string)=>{const m=new RegExp('^# '+name+' (\\d+)\\s*$','m').exec(stdout);return m?Number(m[1]):null;};
 const receipt={name:batch.name,files:batch.files,expected:batch.expected,
  command:[process.execPath,...args],exitCode:child.status,signal:child.signal,error:child.error?String(child.error):null,
  counts:{tests:count('tests'),pass:count('pass'),fail:count('fail'),skipped:count('skipped'),cancelled:count('cancelled')},
  stdout:out,stderr:err};
 results.push(receipt);
 if(child.status!==0||receipt.counts.tests!==batch.expected||receipt.counts.pass!==batch.expected||receipt.counts.fail!==0)break;
}
const passed=results.length===batches.length&&results.every(r=>r.exitCode===0&&r.counts.tests===r.expected&&r.counts.pass===r.expected&&r.counts.fail===0);
fs.writeFileSync(path.join(here,'independent-tests.json'),JSON.stringify({recordedAt:new Date().toISOString(),batches:results,allPassed:passed,limit:'Affected regression, not D05 root formal Full Test; every test uses isolated product-v2 fixtures'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed,total:results.reduce((s,x)=>s+(x.counts.pass??0),0),batches:results.map(x=>({name:x.name,exit:x.exitCode,counts:x.counts}))},null,2));
if(!passed)process.exitCode=1;