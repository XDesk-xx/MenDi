// D05-B Reviewer 022 scoped independent tests: split batches to avoid previous
// single combined suite timeout; keep the original TAP output of each batch once.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=process.cwd(),here=path.dirname(fileURLToPath(import.meta.url));
const suites=[
 {name:'fix-and-recovery',files:['tests/change-add-review-repair.test.ts','tests/change-add.test.ts','tests/change-add-recovery.test.ts','tests/rounds.test.ts']},
 {name:'affected-compat',files:['tests/change-add-lifecycle.test.ts','tests/group-history.test.ts','tests/lifecycle-close.test.ts','tests/migration-rounds.test.ts']}
];
const records:Array<{name:string,files:string[],exitCode:number|null,signal:string|null,error:string|null,counts:Record<string,number|null>,stdoutFile:string,stderrFile:string|null}>=[];
const parse=(raw:string,key:string):number|null=>{
 const found=new RegExp('^# '+key+' (\\d+)\\s*$','m').exec(raw);
 return found?Number(found[1]):null;
};
for(const suite of suites){
 const args=['--test','--test-concurrency=2',...suite.files];
 const child=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8',maxBuffer:48*1024*1024,timeout:690000,windowsHide:true,
  env:{...process.env,MENDI_APPLY_EVIDENCE:'',MENDI_TEST_EVIDENCE_DIR:''}});
 const stdout=child.stdout??'',stderr=child.stderr??'';
 const stdoutFile='tests-'+suite.name+'.tap.log',stderrFile=stderr?'tests-'+suite.name+'.stderr.log':null;
 fs.writeFileSync(path.join(here,stdoutFile),stdout,{flag:'wx'});
 if(stderrFile)fs.writeFileSync(path.join(here,stderrFile),stderr,{flag:'wx'});
 const counts={tests:parse(stdout,'tests'),passed:parse(stdout,'pass'),failed:parse(stdout,'fail'),skipped:parse(stdout,'skipped')};
 records.push({name:suite.name,files:suite.files,exitCode:child.status,signal:child.signal,error:child.error?String(child.error):null,
  counts,stdoutFile,stderrFile});
 if(child.status!==0||counts.failed!==0||!counts.tests)break;
}
const summary={recordedAt:new Date().toISOString(),fixedAuthor:'021-revise-apply',suites:records,
 allPassed:records.length===suites.length&&records.every(x=>x.exitCode===0&&x.counts.failed===0&&Number(x.counts.tests)>0),
 note:'Two separate batches avoid Author combined suite time limit; selected impacted tests only, not root D05 Full Test'};
fs.writeFileSync(path.join(here,'independent-tests-result.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({allPassed:summary.allPassed,batches:records.map(x=>({name:x.name,exit:x.exitCode,counts:x.counts}))},null,2));
if(!summary.allPassed)process.exitCode=1;