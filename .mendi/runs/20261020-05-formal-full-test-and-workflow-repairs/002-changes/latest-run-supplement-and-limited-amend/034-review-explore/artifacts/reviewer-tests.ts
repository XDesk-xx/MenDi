// Independent existing Action baseline tests. Raw TAP stored in this Reviewer Run only.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const args=['--test','--test-concurrency=2','tests/actions.test.ts','tests/action-write.test.ts'];
const r=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8',windowsHide:true,maxBuffer:22*1024*1024,timeout:240000});
const raw=r.stdout??'',err=r.stderr??'';
fs.writeFileSync(path.join(here,'action-regression.tap.log'),raw,{flag:'wx'});
if(err)fs.writeFileSync(path.join(here,'action-regression.stderr.log'),err,{flag:'wx'});
const number=(key:string)=>{const m=new RegExp('^# '+key+' (\\d+)\\s*$','m').exec(raw);return m?Number(m[1]):null;};
const counts={tests:number('tests'),pass:number('pass'),fail:number('fail'),skipped:number('skipped'),cancelled:number('cancelled')};
const receipt={recordedAt:new Date().toISOString(),command:[process.execPath,...args],exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,counts,raw:'action-regression.tap.log',stderr:err?'action-regression.stderr.log':null};
fs.writeFileSync(path.join(here,'action-regression-result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exitCode:r.status,counts},null,2));
if(r.status!==0||counts.tests!==23||counts.pass!==23||counts.fail!==0)process.exitCode=1;