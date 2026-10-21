// D05 049 independent root pnpm check (not formal Full Test).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=process.cwd();
const cmd='C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
const args=[cmd,'check'];
const out=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8',windowsHide:true,timeout:210000,maxBuffer:16*1024*1024});
fs.writeFileSync(path.join(here,'check.stdout.log'),out.stdout??'',{flag:'wx'});
if(out.stderr)fs.writeFileSync(path.join(here,'check.stderr.log'),out.stderr,{flag:'wx'});
const evidence={recordedAt:new Date().toISOString(),command:[process.execPath,...args],exitCode:out.status,signal:out.signal,
 error:out.error?String(out.error):null,stdout:'check.stdout.log',stderr:out.stderr?'check.stderr.log':null,
 scope:'Independent pnpm check only; no new D05 Full Test / Git commit / install'};
fs.writeFileSync(path.join(here,'check-result.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exit:out.status,stderrBytes:(out.stderr??'').length,stdoutBytes:(out.stdout??'').length,proof:'check-result.json'},null,2));
if(out.status!==0)process.exitCode=1;