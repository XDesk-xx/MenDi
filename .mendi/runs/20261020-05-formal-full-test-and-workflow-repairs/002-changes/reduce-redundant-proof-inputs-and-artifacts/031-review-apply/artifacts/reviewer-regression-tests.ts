// D05-C independent Reviewer 031 execute unchanged TestExecution & group safety regression.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),cwd=process.cwd();
const groups=[
 {name:'execution',files:['tests/test-execution.test.ts','tests/test-log-integrity.test.ts']},
 {name:'formal-groups',files:['tests/group-boundaries.test.ts','tests/group-environment.test.ts']}
];
const report:Array<{name:string,files:string[],command:string[],exitCode:number|null,signal:string|null,error:string|null,counts:Record<string,number|null>,stdout:string,stderr:string|null}>=[];
const num=(raw:string,key:string)=>{const m=new RegExp('^# '+key+' (\\d+)\\s*$','m').exec(raw);return m?Number(m[1]):null;};
for(const {name,files} of groups){
 const args=['--test','--test-concurrency=2',...files];
 const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:45*1024*1024,timeout:820000,env:{...process.env,MENDI_TEST_EVIDENCE_DIR:'',MENDI_APPLY_EVIDENCE:''}});
 const raw=r.stdout??'',err=r.stderr??'';
 const stdout=name+'.tap.log',stderr=err?name+'.stderr.log':null;
 fs.writeFileSync(path.join(here,stdout),raw,{flag:'wx'});
 if(stderr)fs.writeFileSync(path.join(here,stderr),err,{flag:'wx'});
 report.push({name,files,command:[process.execPath,...args],exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,
  counts:{tests:num(raw,'tests'),pass:num(raw,'pass'),fail:num(raw,'fail'),skipped:num(raw,'skipped')},stdout,stderr});
 if(r.status!==0)break;
}
const data={review:'D05-C independent 031',recordedAt:new Date().toISOString(),report,
 allPassed:report.length===groups.length&&report.every(x=>x.exitCode===0&&x.counts.fail===0&&x.counts.tests===x.counts.pass),
 note:'The existing product regression, not the root Delivery formal Full Test'};
fs.writeFileSync(path.join(here,'regression-tests-result.json'),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({allPassed:data.allPassed,tests:report.map(x=>({name:x.name,exit:x.exitCode,counts:x.counts}))},null,2));
if(!data.allPassed)process.exitCode=1;