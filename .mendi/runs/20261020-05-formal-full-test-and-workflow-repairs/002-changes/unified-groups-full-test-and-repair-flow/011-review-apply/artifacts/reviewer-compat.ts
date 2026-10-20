// Independent targeted D05-A compatibility/regression follow-up for historical fixture and baseline paths.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=process.cwd(),dir=path.dirname(fileURLToPath(import.meta.url));
const files=['tests/group-completion.test.ts','tests/baseline-integration.test.ts','tests/delivery-repair.test.ts','tests/lifecycle-reopen.test.ts','tests/migration-rounds.test.ts'];
const args=['--test','--test-concurrency=2',...files];
const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:600000,maxBuffer:32*1024*1024,env:{...process.env,MENDI_TEST_EVIDENCE_DIR:''}});
const stdout=result.stdout??'',stderr=result.stderr??'';
fs.writeFileSync(path.join(dir,'compat-tests.tap.log'),stdout,{flag:'wx'});
if(stderr)fs.writeFileSync(path.join(dir,'compat-tests.stderr.log'),stderr,{flag:'wx'});
const val=(key:string):number|null=>{const m=new RegExp('^# '+key+' (\\d+)\\s*$','m').exec(stdout);return m?Number(m[1]):null;};
const record={recordedAt:new Date().toISOString(),files,command:[process.execPath,...args],exitCode:result.status,
 signal:result.signal,error:result.error?String(result.error):null,results:{tests:val('tests'),pass:val('pass'),fail:val('fail'),skipped:val('skipped')},logs:{stdout:'compat-tests.tap.log',stderr:stderr?'compat-tests.stderr.log':null},
 purpose:'independently recheck earlier Author failing legacy/baseline/reuse and close/reopen tests on current worktree'};
fs.writeFileSync(path.join(dir,'compat-tests-result.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exitCode:record.exitCode,results:record.results,log:'compat-tests.tap.log'},null,2));
if(result.status!==0||val('fail')!==0||!val('tests'))process.exitCode=1;
