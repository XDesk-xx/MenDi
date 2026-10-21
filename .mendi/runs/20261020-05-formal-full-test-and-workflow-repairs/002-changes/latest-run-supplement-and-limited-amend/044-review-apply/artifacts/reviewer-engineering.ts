// D05-D 044 Reviewer engineering checks, original outputs, physical-line measurements.
// Run only after the active test suite is terminal so build never races dist CLI tests.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=process.cwd();
const jobs=[
 {id:'check',bin:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm check'],timeout:320000},
 {id:'build',bin:'powershell.exe',args:['-NoProfile','-NonInteractive','-Command','pnpm build'],timeout:180000},
 {id:'openspec',bin:process.execPath,args:['D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js','validate','latest-run-supplement-and-limited-amend','--strict','--json'],timeout:100000},
 {id:'reviewer-ts',bin:process.execPath,args:['node_modules/typescript/bin/tsc','-p',path.relative(repo,path.join(here,'tsconfig.json'))],timeout:100000},
 {id:'diffcheck',bin:'git',args:['diff','--check'],timeout:55000}
];
const results:Array<{name:string,command:string[],exitCode:number|null,signal:string|null,error:string|null,log:string}>=[];
for(const job of jobs){
 const child=spawnSync(job.bin,job.args,{cwd:repo,encoding:'utf8',windowsHide:true,timeout:job.timeout,maxBuffer:15*1024*1024});
 const raw='$ '+job.bin+' '+job.args.join(' ')+'\n# stdout\n'+(child.stdout??'')+'\n# stderr\n'+(child.stderr??'')+'\n';
 const logfile='engineering-'+job.id+'.log';
 fs.writeFileSync(path.join(here,logfile),raw,{flag:'wx'});
 results.push({name:job.id,command:[job.bin,...job.args],exitCode:child.status,signal:child.signal,error:child.error?String(child.error):null,log:logfile});
 if(child.status!==0)break;
}
const success=results.length===jobs.length&&results.every(x=>x.exitCode===0);
fs.writeFileSync(path.join(here,'engineering-results.json'),JSON.stringify({recordedAt:new Date().toISOString(),allPassed:success,checks:results},null,2)+'\n',{flag:'wx'});
const count=(s:string)=>{const a=s.split(/\r?\n/);return a.at(-1)===''?a.length-1:a.length;};
const regions=[];
for(const dir of ['src','tests','scripts']){
 const files:Array<{path:string,lines:number}>=[];
 const walk=(base:string)=>{
  for(const ent of fs.readdirSync(base,{withFileTypes:true})){
   const f=path.join(base,ent.name);
   if(ent.isDirectory()){if(!['node_modules','dist','runtime','.tmp','.pnpm'].includes(ent.name))walk(f);}
   else if(ent.isFile()&&ent.name.endsWith('.ts'))files.push({path:f.split(path.sep).join('/'),lines:count(fs.readFileSync(f,'utf8'))});
  }
 };
 walk(dir);files.sort((a,b)=>b.lines-a.lines);
 const threshold=files[2]?.lines??0;
 regions.push({area:dir,top:files.filter(f=>f.lines>=threshold).slice(0,5),total:files.length});
}
const relevant=['src/core/run-aftercare.ts','src/adapters/aftercare-target.ts','src/adapters/aftercare-reader.ts',
 'src/adapters/aftercare-store.ts','src/application/run-aftercare.ts',
 'src/drivers/arguments.ts','src/application/project-query.ts','src/adapters/workspace.ts',
 'tests/aftercare-recovery.test.ts','tests/aftercare-modes.test.ts'];
const growth=relevant.map(ref=>{
 const now=count(fs.readFileSync(ref,'utf8'));
 const before=spawnSync('git',['show','HEAD:'+ref],{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024});
 return{file:ref,lines:now,head:before.status===0?count(before.stdout):null};
});
fs.writeFileSync(path.join(here,'maintenance-results.json'),JSON.stringify({recordedAt:new Date().toISOString(),
 method:'Current maintained physical TypeScript lines; use Git HEAD only for present baseline, no line-count gate.',regions,growth},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({allPassed:success,checks:results.map(x=>({name:x.name,exit:x.exitCode})),top:regions,growth},null,2));
if(!success)process.exitCode=1;