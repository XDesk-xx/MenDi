// Reviewer engineering and maintainability readback. No product writes.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=process.cwd(),here=path.dirname(fileURLToPath(import.meta.url));
const operations=[
 {id:'check',exe:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm check'],timeout:210000},
 {id:'build',exe:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm build'],timeout:180000},
 {id:'openspec',exe:process.execPath,args:['D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js','validate','append-planned-changes-to-open-delivery','--strict','--json'],timeout:90000},
 {id:'diff-check',exe:'git',args:['diff','--check'],timeout:60000}
];
const checks:Array<{id:string;command:string[];exitCode:number|null;signal:string|null;error:string|null;raw:string}>=[];
for(const op of operations){
 const r=spawnSync(op.exe,op.args,{cwd,encoding:'utf8',windowsHide:true,timeout:op.timeout,maxBuffer:16*1024*1024});
 const log='engineering-'+op.id+'.log';
 fs.writeFileSync(path.join(here,log),'$ '+[op.exe,...op.args].join(' ')+'\n# stdout\n'+(r.stdout??'')+'\n# stderr\n'+(r.stderr??'')+'\n',{flag:'wx'});
 checks.push({id:op.id,command:[op.exe,...op.args],exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,raw:log});
 if(r.status!==0)break;
}
const good=checks.length===operations.length&&checks.every(x=>x.exitCode===0);
fs.writeFileSync(path.join(here,'engineering-results.json'),JSON.stringify({recordedAt:new Date().toISOString(),allPassed:good,checks},null,2)+'\n',{flag:'wx'});
const count=(s:string)=>s.split('\n').length-(s.endsWith('\n')?1:0);
const areas=[];
for(const dir of ['src','tests','scripts']){
 const rows:Array<{file:string;lines:number}>=[];
 const walk=(folder:string)=>{
  for(const item of fs.readdirSync(folder,{withFileTypes:true})){
   const f=path.join(folder,item.name);
   if(item.isDirectory()) {if(!['node_modules','.pnpm','dist','.tmp','runtime'].includes(item.name))walk(f);}
   else if(item.name.endsWith('.ts'))rows.push({file:f.split(path.sep).join('/'),lines:count(fs.readFileSync(f,'utf8'))});
  }
 };
 walk(dir);
 rows.sort((a,b)=>b.lines-a.lines);
 const third=rows[2]?.lines??0;
 areas.push({dir,top:rows.filter(x=>x.lines>=third).slice(0,5)});
}
const files=['src/core/scope-addition.ts','src/adapters/scope-additions.ts','src/adapters/change-add-store.ts',
 'src/core/round-records.ts','src/application/project.ts','tests/change-add-review-repair.test.ts'];
const growth=files.map(f=>{
 const now=count(fs.readFileSync(f,'utf8'));
 const r=spawnSync('git',['show','HEAD:'+f],{cwd,encoding:'utf8',windowsHide:true,maxBuffer:3*1024*1024});
 return{file:f,now,base:r.status===0?count(r.stdout):null};
});
fs.writeFileSync(path.join(here,'maintenance-results.json'),
 JSON.stringify({method:'current physical maintained .ts lines incl blank, HEAD only where exists',areas,growth},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({allPassed:good,checks:checks.map(x=>({name:x.id,exit:x.exitCode})),areas,growth},null,2));
if(!good)process.exitCode=1;