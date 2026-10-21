// D05-C Reviewer independent actual regression for log integrity.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=process.cwd(),here=path.dirname(fileURLToPath(import.meta.url));
const args=['--test','--test-concurrency=2','tests/test-log-integrity.test.ts'];
const child=spawnSync(process.execPath,args,{cwd,encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:12*1024*1024,env:{
 ...process.env, MENDI_APPLY_EVIDENCE:'',MENDI_TEST_EVIDENCE_DIR:''
}});
const stdout=child.stdout??'',stderr=child.stderr??'';
fs.writeFileSync(path.join(here,'test-log-integrity.tap.log'),stdout,{flag:'wx'});
if(stderr)fs.writeFileSync(path.join(here,'test-log-integrity.stderr.log'),stderr,{flag:'wx'});
const num=(key:string)=>{
 const m=new RegExp('^# '+key+' (\\d+)\\s*$','m').exec(stdout);
 return m?Number(m[1]):null;
};
const evidence={recordedAt:new Date().toISOString(),
 command:[process.execPath,...args],exitCode:child.status,signal:child.signal,
 error:child.error?String(child.error):null,
 testCounts:{tests:num('tests'),pass:num('pass'),fail:num('fail'),skipped:num('skipped')},
 rawOutput:'test-log-integrity.tap.log',rawStderr:stderr?'test-log-integrity.stderr.log':null,
 limitations:['This regression uses existing isolated fixtures, not a new empty-log protocol','No root Delivery Formal Full Test/Close']};
fs.writeFileSync(path.join(here,'log-test-result.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exit:evidence.exitCode,counts:evidence.testCounts},null,2));
if(child.status!==0||evidence.testCounts.fail!==0||evidence.testCounts.tests!==3)process.exitCode=1;