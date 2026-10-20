// D05-A Reviewer reproducible check/build/OpenSpec receipts. No root Formal Full Test.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=process.cwd(), folder=path.dirname(fileURLToPath(import.meta.url));
const checks=[
 {id:'check',bin:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm check'],timeout:180000},
 {id:'build',bin:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm build'],timeout:150000},
 {id:'openspec',bin:process.execPath,args:['D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js','validate','unified-groups-full-test-and-repair-flow','--strict','--json'],timeout:90000},
 {id:'diff-check',bin:'git',args:['diff','--check'],timeout:30000}
];
const result:Array<{id:string,command:string[],exitCode:number|null,error:string|null,log:string}>=[];
for(const c of checks){
 const r=spawnSync(c.bin,c.args,{cwd:root,encoding:'utf8',timeout:c.timeout,maxBuffer:16*1024*1024,windowsHide:true});
 const name=c.id+'.log';
 fs.writeFileSync(path.join(folder,name),'$ '+[c.bin,...c.args].join(' ')+'\n# stdout\n'+(r.stdout??'')+'\n# stderr\n'+(r.stderr??'')+'\n',{flag:'wx'});
 result.push({id:c.id,command:[c.bin,...c.args],exitCode:r.status,error:r.error?String(r.error):null,log:name});
 if(r.status!==0)break;
}
const summary={recordedAt:new Date().toISOString(),checks:result,allPassed:result.length===checks.length&&result.every(r=>r.exitCode===0),
 limits:['Engineering and OpenSpec only; independent product semantic review is separate','No root Delivery Full Test/Close, Git commit, or stable install']};
fs.writeFileSync(path.join(folder,'engineering-results.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({allPassed:summary.allPassed,checks:result},null,2));
if(!summary.allPassed)process.exitCode=1;
