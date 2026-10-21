// D05-C 031 read-only engineering checks and required maintainability measurements.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=process.cwd();
const jobs=[
 {id:'check',exe:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm check'],limit:210000},
 {id:'build',exe:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm build'],limit:180000},
 {id:'openspec',exe:process.execPath,args:['D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js',
  'validate','reduce-redundant-proof-inputs-and-artifacts','--strict','--json'],limit:90000},
 {id:'diff-check',exe:'git',args:['diff','--check'],limit:60000}
];
const results:Array<{id:string,command:string[],exitCode:number|null,signal:string|null,error:string|null,log:string}>=[];
for(const job of jobs){
 const child=spawnSync(job.exe,job.args,{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:15*1024*1024,timeout:job.limit});
 const log='engineering-'+job.id+'.log';
 fs.writeFileSync(path.join(here,log),'$ '+[job.exe,...job.args].join(' ')+'\n# stdout\n'+(child.stdout??'')+'\n# stderr\n'+(child.stderr??'')+'\n',{flag:'wx'});
 results.push({id:job.id,command:[job.exe,...job.args],exitCode:child.status,signal:child.signal,error:child.error?String(child.error):null,log});
 if(child.status!==0)break;
}
const okay=results.length===jobs.length&&results.every(r=>r.exitCode===0);
fs.writeFileSync(path.join(here,'engineering-results.json'),JSON.stringify({recordedAt:new Date().toISOString(),allPassed:okay,checks:results},null,2)+'\n',{flag:'wx'});
const count=(raw:string)=>raw.split('\n').length-(raw.endsWith('\n')?1:0);
const areas=[];
for(const dir of ['src','tests','scripts']){
 const files:Array<{file:string,lines:number}>=[];
 const walk=(base:string)=>{
  for(const ent of fs.readdirSync(base,{withFileTypes:true})){
   const file=path.join(base,ent.name);
   if(ent.isDirectory()){if(!['node_modules','dist','.tmp','.pnpm','runtime'].includes(ent.name))walk(file);}
   else if(ent.name.endsWith('.ts'))files.push({file:file.split(path.sep).join('/'),lines:count(fs.readFileSync(file,'utf8'))});
  }
 };
 walk(dir);
 files.sort((a,b)=>b.lines-a.lines);
 const third=files[2]?.lines??0;
 areas.push({dir,top:files.filter(x=>x.lines>=third).slice(0,5)});
}
const changed=['tests/helpers.ts','tests/test-support.ts','tests/group-support.ts','tests/evidence-support.ts','tests/evidence-scenes.ts'];
const growth=changed.map(file=>{
 const now=count(fs.readFileSync(file,'utf8'));
 const head=spawnSync('git',['show','HEAD:'+file],{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:3000000});
 return{file,now,head:head.status===0?count(head.stdout):null};
});
const srcChanged=spawnSync('git',['diff','--name-only','--','src'],{cwd:repo,encoding:'utf8'}).stdout.trim().split(/\r?\n/).filter(Boolean);
const maint={recordedAt:new Date().toISOString(),method:'current physical maintained .ts lines; Git HEAD baseline where same file existed; not a hard gate',
  areas,growth,srcChanged};
fs.writeFileSync(path.join(here,'maintenance-results.json'),JSON.stringify(maint,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({allPassed:okay,checks:results.map(r=>({name:r.id,exit:r.exitCode})),top:areas,growth,srcChanged},null,2));
if(!okay)process.exitCode=1;