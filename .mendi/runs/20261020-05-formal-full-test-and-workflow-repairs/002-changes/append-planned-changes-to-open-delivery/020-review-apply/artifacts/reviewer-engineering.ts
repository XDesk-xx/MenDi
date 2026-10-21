// D05-B independent reviewer read-only engineering validation receipts.
// pnpm build writes ordinary ignored dist/ derived output; no source edits.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url)),root=process.cwd();
const tasks=[
 {id:'check',bin:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm check'],timeout:210000},
 {id:'build',bin:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm build'],timeout:210000},
 {id:'openspec',bin:process.execPath,args:['D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js','validate','append-planned-changes-to-open-delivery','--strict','--json'],timeout:90000},
 {id:'diff',bin:'git',args:['diff','--check'],timeout:30000}
];
const results:Array<{id:string,command:string[],exitCode:number|null,signal:string|null,error:string|null,log:string}>=[];
for(const t of tasks){
 const child=spawnSync(t.bin,t.args,{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:12*1024*1024,timeout:t.timeout});
 const logName='engineering-'+t.id+'.log';
 fs.writeFileSync(path.join(here,logName),
  '$ '+[t.bin,...t.args].join(' ')+'\n# stdout\n'+(child.stdout??'')+'\n# stderr\n'+(child.stderr??'')+'\n',{flag:'wx'});
 results.push({id:t.id,command:[t.bin,...t.args],exitCode:child.status,signal:child.signal,error:child.error?String(child.error):null,log:logName});
 if(child.status!==0)break;
}
const report={recordedAt:new Date().toISOString(),fixedAuthor:'019-apply',results,
 allPassed:results.length===tasks.length&&results.every(x=>x.exitCode===0),
 limits:['Engineering checks are not proof the 7-append growth hazard is solved','No root MenDi Full Test/Close/Archive, Git commit, stable installation or DreMo write']};
fs.writeFileSync(path.join(here,'engineering-results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({allPassed:report.allPassed,checks:results.map(({id,exitCode,log})=>({id,exitCode,log}))},null,2));
if(!report.allPassed)process.exitCode=1;
