// Independent D05-B 024 targeted regression. Two separate batches; no root formal Full Test.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),cwd=process.cwd();
const suites=[
 {id:'f3-and-recovery',files:['tests/change-add-review-repair.test.ts','tests/change-add-recovery.test.ts','tests/rounds.test.ts']},
 {id:'append-and-compat',files:['tests/change-add.test.ts','tests/change-add-lifecycle.test.ts','tests/group-history.test.ts','tests/delivery-query.test.ts']}
];
const summary:Array<{id:string,files:string[],command:string[],exitCode:number|null,signal:string|null,error:string|null,counts:Record<string,number|null>,stdout:string,stderr:string|null}>=[];
const num=(data:string,key:string):number|null=>{
 const m=new RegExp('^# '+key+' (\\d+)\\s*$','m').exec(data);
 return m?Number(m[1]):null;
};
for(const suite of suites){
 const args=['--test','--test-concurrency=2',...suite.files];
 const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:35*1024*1024,timeout:720000,
  env:{...process.env,MENDI_APPLY_EVIDENCE:'',MENDI_TEST_EVIDENCE_DIR:''}});
 const stdout=r.stdout??'',stderr=r.stderr??'';
 const out='tests-'+suite.id+'.tap.log',err=stderr?'tests-'+suite.id+'.stderr.log':null;
 fs.writeFileSync(path.join(here,out),stdout,{flag:'wx'});
 if(err)fs.writeFileSync(path.join(here,err),stderr,{flag:'wx'});
 const counts={tests:num(stdout,'tests'),passed:num(stdout,'pass'),failed:num(stdout,'fail'),skipped:num(stdout,'skipped'),cancelled:num(stdout,'cancelled')};
 summary.push({id:suite.id,files:suite.files,command:[process.execPath,...args],exitCode:r.status,signal:r.signal,
   error:r.error?String(r.error):null,counts,stdout:out,stderr:err});
 if(r.status!==0||counts.failed!==0||!counts.tests)break;
}
const totalTests=summary.reduce((n,x)=>n+(x.counts.tests??0),0),totalPassed=summary.reduce((n,x)=>n+(x.counts.passed??0),0);
const data={recordedAt:new Date().toISOString(),
  fixedAuthor:'023-revise-apply',suites:summary,totalTests,totalPassed,
  allPassed:summary.length===suites.length&&summary.every(x=>x.exitCode===0&&x.counts.failed===0&&Number(x.counts.tests)>0),
  limits:['Scoped regression, not root D05 Full Test','Raw TAP output stored once per batch','Other unchanged historical regression from 022 remains valid']};
fs.writeFileSync(path.join(here,'tests-results.json'),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:data.allPassed?'passed':'failed',totalTests,totalPassed,suites:summary.map(x=>({name:x.id,exit:x.exitCode,counts:x.counts}))},null,2));
if(!data.allPassed)process.exitCode=1;