import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';

const root=process.cwd();
const art=path.join(root,'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/050-delivery-full-test/artifacts');
const stage=process.argv[2];
const allowed=['F01-check','F02-root','F03-ui','F04-installation','F05-spec-status'];
if(!stage||!allowed.includes(stage))throw Error('Only declared D05 F01-F05 stage');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'.mendi/delivery-groups/20261020-05-formal-full-test-and-workflow-repairs/manifest.json'),'utf8'));
if(manifest.state!=='open'||manifest.recordingMode!=='manual-bootstrap'||manifest.activeChangeId!==null||!manifest.latestRunRef.endsWith('050-delivery-full-test/run.md'))throw Error('D05 formal attempt not current');
const packagePlan=JSON.parse(fs.readFileSync(path.join(art,'plan.json'),'utf8'));
if(packagePlan.candidate.commit!=='7445a9f765e91c5574dd649667bee5349dd6a413')throw Error('candidate mismatch');
const git=(args:string[])=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error(r.stderr);return r.stdout.trimEnd();};
if(git(['rev-parse','HEAD'])!==packagePlan.candidate.commit)throw Error('HEAD changed');
const status=git(['status','--porcelain','--','src','scripts','tests','skills','openspec/specs','README.md','package.json','pnpm-lock.yaml','pnpm-workspace.yaml']);
if(status!==packagePlan.candidate.workingTreeStatus)throw Error('Candidate worktree changed');
if(!fs.readFileSync(path.join(root,'tests/fixtures/storybook-project/vitest.config.ts')).equals(fs.readFileSync(path.join(art,'candidate-vitest-config.ts'))))throw Error('Reviewed fixture changed');
if(fs.existsSync(path.join(art,stage+'.json')))throw Error('Never overwrite existing D05 group receipt');
const pnpm='C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
const openspec='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const uiTargets=path.join(root,'.tmp/d05-full-test-050-ui');
const uiEvidence=path.join(art,'ui');
const installationEvidence=path.join(art,'installation');
const installationRoot='D:/tools/mendi/acceptance/d05-full-test-050';
const steps:{label:string;args:string[];cwd?:string;env?:Record<string,string>;timeoutMs?:number}[]=[];
if(stage==='F01-check')steps.push({label:'check',args:[pnpm,'check'],timeoutMs:300000});
if(stage==='F02-root')steps.push({label:'root',args:[pnpm,'test'],timeoutMs:3450000});
if(stage==='F03-ui'){
 steps.push({label:'ui-prepare',args:[pnpm,'prepare:ui-tests',uiTargets],env:{MENDI_UI_EVIDENCE_DIR:uiEvidence},timeoutMs:600000});
 steps.push({label:'ui',args:[pnpm,'test:ui'],env:{MENDI_UI_TARGETS_DIR:uiTargets,MENDI_UI_EVIDENCE_DIR:uiEvidence},timeoutMs:600000});
}
if(stage==='F04-installation'){
 steps.push({label:'installation-prepare',args:[pnpm,'prepare:installation-tests',installationEvidence,installationRoot],timeoutMs:900000});
 steps.push({label:'installation',args:[pnpm,'test:installation'],env:{MENDI_INSTALLATION_SESSION:path.join(installationEvidence,'session.json')},timeoutMs:900000});
}
if(stage==='F05-spec-status'){
 const specs=fs.readdirSync(path.join(root,'openspec/specs')).filter(n=>fs.existsSync(path.join(root,'openspec/specs',n,'spec.md'))).sort();
 for(const name of specs)steps.push({label:'spec-'+name,args:[openspec,'validate',name,'--type','spec','--strict','--json'],timeoutMs:120000});
 steps.push({label:'source-status',args:['dist/drivers/cli.js','status','--project',root,'--json'],timeoutMs:90000});
 steps.push({label:'source-next',args:['dist/drivers/cli.js','next','--project',root,'--json'],timeoutMs:90000});
}
type Result={label:string,command:string[],cwd:string,startedAt:string,endedAt:string,exitCode:number|null,signal:string|null,error:string|null,timedOut:boolean,logs:{stdout:string,stderr:string},counts?:Record<string,number>};
const parseCounts=(log:string)=>{const result:Record<string,number>={};for(const [,k,v] of log.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo|suites|duration_ms) ([0-9]+(?:\.[0-9]+)?)/gm))result[k]=Number(v);return result;};
async function execute(item:typeof steps[number]):Promise<Result>{
 const prefix=stage+'-'+item.label;
 const stdout=path.join(art,prefix+'.stdout.log'),stderr=path.join(art,prefix+'.stderr.log');
 if(fs.existsSync(stdout)||fs.existsSync(stderr))throw Error('Group step output already exists: '+prefix);
 const out=fs.openSync(stdout,'wx'),err=fs.openSync(stderr,'wx'),start=new Date().toISOString();
 let timeout=false;let problem:string|null=null;let code:number|null=null;let signal:string|null=null;
 const environ={...process.env,...item.env,COREPACK_ENABLE_NETWORK:'0',OPENSPEC_TELEMETRY:'0'};
 try {
   const child=spawn(process.execPath,item.args,{cwd:item.cwd??root,env:environ,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
   child.stdout.on('data',(data:Buffer)=>fs.writeSync(out,data));
   child.stderr.on('data',(data:Buffer)=>fs.writeSync(err,data));
   let timer:ReturnType<typeof setTimeout>|undefined;
   const complete=new Promise<void>(resolve=>{
     child.on('error',(e:Error)=>{problem=e.message;resolve();});
     child.on('close',(status,reason)=>{code=status;signal=reason;resolve();});
   });
   timer=setTimeout(()=>{timeout=true;try{child.kill('SIGINT');}catch{}},item.timeoutMs??120000);
   await complete;
   clearTimeout(timer);
 }finally{fs.closeSync(out);fs.closeSync(err);}
 const actualOut=fs.readFileSync(stdout,'utf8'),actualErr=fs.readFileSync(stderr,'utf8');
 const counts=parseCounts(actualOut);
 const endedAt=new Date().toISOString();
 return {label:item.label,command:[process.execPath,...item.args],cwd:item.cwd??root,startedAt:start,endedAt,exitCode:code,signal,error:problem,timedOut:timeout,logs:{stdout:path.relative(root,stdout),stderr:path.relative(root,stderr)},...(Object.keys(counts).length?{counts}:{})};
}
const started=new Date().toISOString(),result:Result[]=[];
for(let i=0;i<steps.length;i++){
 const x=steps[i];
 console.log(JSON.stringify({stage,step:x.label,status:'starting',time:new Date().toISOString()}));
 const item=await execute(x);result.push(item);
 console.log(JSON.stringify({stage,step:x.label,status:item.exitCode===0&&!item.timedOut?'finished':'failed',exitCode:item.exitCode,counts:item.counts??null,stderr:item.logs.stderr}));
 if(item.exitCode!==0||item.timedOut||item.signal||item.error)break;
}
const end=new Date().toISOString();
const expected=steps.length,all=result.length===expected&&result.every(x=>x.exitCode===0&&!x.signal&&!x.timedOut&&!x.error);
let counts:Record<string,number>|undefined;
for(const res of result)if((stage==='F02-root'||stage==='F03-ui'&&res.label==='ui'||stage==='F04-installation'&&res.label==='installation')&&res.counts)counts=res.counts;
const testCounts=(stage==='F02-root'||stage==='F03-ui'||stage==='F04-installation');
const businessValid=!testCounts||Boolean(counts&&counts.tests>0&&counts.pass===counts.tests&&counts.fail===0&&counts.cancelled===0&&counts.skipped===0&&counts.todo===0);
const official=all&&businessValid;
const receipt={stage,startedAt:started,finishedAt:end,expectedSteps:expected,steps:result,counts:counts??null,allStepsSucceeded:all,businessValid,stageOutcome:official?'passed':result.some(x=>x.timedOut||x.error||x.signal)?'unknown':'failed',sourceBasis:packagePlan.candidate};
fs.writeFileSync(path.join(art,stage+'.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,stageOutcome:receipt.stageOutcome,steps:result.length,expected,counts}));
if(!official)process.exitCode=1;
