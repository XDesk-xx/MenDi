// D05-C independent Reviewer 031 run of evidence collection tests.
// Does not modify product implementation or previously submitted runs.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),cwd=process.cwd();
const name='collector';
const files=['tests/evidence-support.test.ts','tests/evidence-recorder.test.ts','tests/evidence-groups.test.ts','tests/evidence-history.test.ts'];
const args=['--test','--test-concurrency=2',...files];
const result=spawnSync(process.execPath,args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:50*1024*1024,timeout:780000,
 env:{...process.env,MENDI_TEST_EVIDENCE_DIR:'',MENDI_APPLY_EVIDENCE:''}});
const raw=result.stdout??'',err=result.stderr??'';
fs.writeFileSync(path.join(here,'collector-tests.tap.log'),raw,{flag:'wx'});
if(err)fs.writeFileSync(path.join(here,'collector-tests.stderr.log'),err,{flag:'wx'});
const num=(key:string)=>{const m=new RegExp('^# '+key+' (\\d+)\\s*$','m').exec(raw);return m?Number(m[1]):null;};
const receipt={name,files,command:[process.execPath,...args],exitCode:result.status,signal:result.signal,error:result.error?String(result.error):null,
 counts:{tests:num('tests'),pass:num('pass'),fail:num('fail'),skipped:num('skipped'),cancelled:num('cancelled')},stdout:'collector-tests.tap.log',stderr:err?'collector-tests.stderr.log':null};
fs.writeFileSync(path.join(here,'collector-tests-result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt,null,2));
if(receipt.exitCode!==0||receipt.counts.fail!==0||receipt.counts.pass!==16)process.exitCode=1;