// D05-B 022 Reviewer engineering + code growth receipts (read-only except derived dist).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=process.cwd(),here=path.dirname(fileURLToPath(import.meta.url));
const checks=[
 {name:'check',exe:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm check'],timeout:240000},
 {name:'build',exe:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm build'],timeout:240000},
 {name:'openspec',exe:process.execPath,args:['D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js','validate','append-planned-changes-to-open-delivery','--strict','--json'],timeout:90000},
 {name:'diff-check',exe:'git',args:['diff','--check'],timeout:35000}
];
const records:Array<{name:string,command:string[],exitCode:number|null,signal:string|null,error:string|null,log:string}>=[];
for(const item of checks){
 const child=spawnSync(item.exe,item.args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,timeout:item.timeout,windowsHide:true});
 const log='engineering-'+item.name+'.log';
 fs.writeFileSync(path.join(here,log),'$ '+[item.exe,...item.args].join(' ')+'\n# stdout\n'+(child.stdout??'')+'\n# stderr\n'+(child.stderr??'')+'\n',{flag:'wx'});
 records.push({name:item.name,command:[item.exe,...item.args],exitCode:child.status,signal:child.signal,error:child.error?String(child.error):null,log});
 if(child.status!==0)break;
}
const report={recordedAt:new Date().toISOString(),fixedAuthor:'021-revise-apply',
 allPassed:records.length===checks.length&&records.every(v=>v.exitCode===0),records,
 limits:['Check and build are engineering checks, not a new formal Delivery Full Test or Review approval','Product change add tests and Review adversarial proof are separate']};
fs.writeFileSync(path.join(here,'engineering-results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
function lineCount(data:string){return data.split('\n').length-(data.endsWith('\n')?1:0);}
const areas=[];
for(const area of ['src','tests','scripts']){
 const counts:Array<{path:string,lines:number}>=[];
 function walk(folder:string){
  for(const item of fs.readdirSync(folder,{withFileTypes:true})){
   const file=path.join(folder,item.name);
   if(item.isDirectory()){
    if(!['node_modules','.pnpm','dist','runtime','.tmp'].includes(item.name))walk(file);
   } else if(item.name.endsWith('.ts'))
    counts.push({path:file.split(path.sep).join('/'),lines:lineCount(fs.readFileSync(file,'utf8'))});
  }
 }
 walk(area);
 counts.sort((a,b)=>b.lines-a.lines);
 const third=counts[2]?.lines??0;
 areas.push({area,top:counts.filter(x=>x.lines>=third).slice(0,5)});
}
const files=[
 'src/application/project.ts','src/adapters/change-add-store.ts',
 'src/adapters/scope-additions.ts','src/core/round-records.ts','src/core/rounds.ts',
 'tests/change-add-review-repair.test.ts','tests/change-add.test.ts','tests/rounds.test.ts'
];
const changes=files.map(file=>{
 const now=lineCount(fs.readFileSync(file,'utf8'));
 const old=spawnSync('git',['show','HEAD:'+file],{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});
 return{path:file,current:now,head:old.status===0?lineCount(old.stdout):null};
});
const maintain={recordedAt:new Date().toISOString(),method:'Reviewer physical maintained .ts lines, trailing newline not an extra line; HEAD only where file exists',areas,changes};
fs.writeFileSync(path.join(here,'maintenance-results.json'),JSON.stringify(maintain,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({allPassed:report.allPassed,commands:records.map(r=>({name:r.name,exit:r.exitCode})),top3:areas,changes},null,2));
if(!report.allPassed)process.exitCode=1;