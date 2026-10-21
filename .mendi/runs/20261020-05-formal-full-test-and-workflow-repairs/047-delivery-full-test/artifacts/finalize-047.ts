import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import {parse} from 'yaml';
import {parseProject,parseWorkspace} from '../../../../../src/core/records.ts';

const id='20261020-05-formal-full-test-and-workflow-repairs';
const base='.mendi/runs/'+id+'/047-delivery-full-test';
const run=base+'/run.md',art=base+'/artifacts',mf='.mendi/delivery-groups/'+id+'/manifest.json',lock='.mendi/write.lock';
const prev='.mendi/runs/'+id+'/046-delivery-full-test/run.md';
const original=fs.readFileSync(mf,'utf8'),m=JSON.parse(original),pr=JSON.parse(fs.readFileSync('.mendi/project.json','utf8'));
const candidate='7445a9f765e91c5574dd649667bee5349dd6a413';
const plan=JSON.parse(fs.readFileSync(art+'/plan.json','utf8'));
const groups=plan.requiredGroups.map((id:string)=>{const d=JSON.parse(fs.readFileSync(art+'/'+id+'.json','utf8'));return{id,stageOutcome:d.stageOutcome,counts:d.counts,steps:d.steps.map((x:{label:string,exitCode:number|null,signal:string|null,timedOut:boolean,error?:string,startedAt:string,endedAt:string,logs:{stdout:string,stderr:string}})=>({label:x.label,exitCode:x.exitCode,signal:x.signal,timedOut:x.timedOut,error:x.error??null,startedAt:x.startedAt,endedAt:x.endedAt,logs:x.logs}))}});
const header=(file:string)=>parse(fs.readFileSync(file,'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]);
const old=header(run),oldPrev=header(prev);
const diagnostic=JSON.parse(fs.readFileSync(art+'/diag-vitest-project-browser-api-port-64115.json','utf8'));
const initialPort=JSON.parse(fs.readFileSync(art+'/ui-port-diagnosis.json','utf8'));
const child=fs.readFileSync(art+'/ui-port-failure-original.log','utf8');
const git=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const drift=cp.execFileSync('git',['diff','--name-only','--','src','tests','scripts','skills','openspec/specs','README.md','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim();
const flags={
current:m.state==='open'&&m.recordingMode==='manual-bootstrap'&&m.activeChangeId===null&&m.latestRunRef===run&&m.next.action==='delivery-full-test-execute'&&m.next.status==='working',
identity:old.actionType==='delivery-full-test'&&old.status==='working'&&old.executionId==='d05-full-test-047'&&old.previousRunRef===prev&&oldPrev.outcome==='failed',
project:pr.activeDeliveryId===id&&pr.archivedChangeCount===17&&m.changeBindings.length===4&&m.changeBindings.every((x:{state:string,archiveOrdinal:number},i:number)=>x.state==='archived'&&x.archiveOrdinal===14+i),
plan:plan.candidate.commit===candidate&&plan.requiredGroups.join(',')==='F01-check,F02-root,F03-ui,F04-installation,F05-spec-status',
groups:groups.map((x:{stageOutcome:string})=>x.stageOutcome).join(',')==='passed,passed,failed,passed,passed',
counts:groups[1].counts?.tests===336&&groups[1].counts?.pass===336&&groups[1].counts?.fail===0&&groups[1].counts?.skipped===0&&groups[2].counts?.tests===5&&groups[2].counts?.pass===4&&groups[2].counts?.fail===1&&groups[3].counts?.tests===4&&groups[3].counts?.pass===4&&groups[3].counts?.fail===0,
allStepsFinished:groups.every((x:{steps:{exitCode:number|null,signal:string|null,timedOut:boolean}[]})=>x.steps.every(z=>z.exitCode!==null&&!z.signal&&!z.timedOut)),
originalError:child.includes('listen EACCES: permission denied ::1:63315')&&initialPort.defaultVitestBrowserApiPort===63315,
proofOnly:diagnostic.exitCode===0&&diagnostic.fixedInProjectBrowserApi===true&&diagnostic.port===64115&&diagnostic.stdout.includes('2 passed'),
unchangedSource:git===candidate&&drift==='',noCollision:!fs.existsSync(art+'/summary.json')&&!fs.existsSync(lock)
};
if(Object.values(flags).some(x=>!x))throw Error('D05 047 finalization admission failed: '+JSON.stringify(flags));
const receipt={deliveryId:id,executionId:'d05-full-test-047',scope:'delivery',recordingMode:'manual-bootstrap',formalDeliveryTest:true,testedCommit:candidate,overallOutcome:'failed',reason:'F03 UI one required assertion failed due excluded Vitest default browser API port 63315',groups,programEvidence:{failedUIOriginalRef:art+'/ui-port-failure-original.log',portDiagnosisRef:art+'/ui-port-diagnosis.json',safePortDiagnosticRef:art+'/diag-vitest-project-browser-api-port-64115.json',safePortDiagnosticIsNotFormalF03:true},history:{priorRun:prev,priorOutcome:'failed',thisAttemptNeverReusesPriorPASS:true},future:'Controlled delivery repair of Storybook fixture browser API port followed by independent reviewer and a fresh complete F01–F05 run',completedAt:new Date().toISOString(),noCodeChange:true};
const next={...m,latestRunRef:run,stopBoundary:'delivery-repair',next:{action:'delivery-repair',status:'awaiting-owner-instruction',role:'author',runRef:run,reason:'D05 047 正式 Full Test failed：F01/F02 336/336/F04 4/4/F05 当次通过，F03 UI 4/5，Windows 保留 Vitest 默认 63315 端口导致 EACCES；隔离副本中仅改 browser.api port=64115 的诊断 2/2 通过。需 Owner 授权受控 Delivery Repair + 独立 Review 后新整次 F01–F05；不得拼接旧 PASS。'}};
parseWorkspace(parseProject(pr),next);
const originalHeader=['---','deliveryId: '+id,'planningSlot: MVP-D05','run: "047"','actionType: delivery-full-test','role: author','actor: codex-author','recordingMode: manual-bootstrap','scope: delivery','formalDeliveryTest: true','testMode: owner-authorized-manual-full-test','executionId: d05-full-test-047','testedCommit: '+candidate,'status: completed','actionStatus: completed','phase: finished','outcome: failed','result: failed','date: 2026-10-21','finishedAt: '+receipt.completedAt,'stageSkillRef: skills/actions/delivery-full-test/SKILL.md','previousRunRef: '+prev,'nextAction: delivery-repair','nextRole: author','---'].join('\n');
const markdown=[
'# D05 047 正式 Full Test：failed',
'',
'本次按 Owner full test + 继续在 manual-bootstrap 根项目上独立执行 F01–F05 完整必需组；未使用产品 v2 groups-v1 原生父 Run。固定受测 Git '+candidate+'。046 历史环境失败保持原样，本 047 不复用或拼接 046 任何 PASS。',
'',
'## 完整执行结果',
'',
'F01 check：passed，exit0。F02 pnpm test：passed 336/336，fail/skip/todo 均 0，exit0。F03 UI：准备成功，正式 UI 测试 4/5，1 failed，exit1。F04 离线隔离安装：准备成功，4/4 passed，exit0。F05 八份主规格 strict 与源码 status/next：10/10 个实际命令 exit0。',
'',
'**本轮总体 outcome=failed**。F03 第五个测试是 Storybook 集成 CLI 的业务断言，但失败发生在被测 Vitest 服务初始化，子进程根本没有枚举故事测试；原错误是 listen EACCES: permission denied ::1:63315。Windows IPv4/IPv6 TCP excluded range 63290–63389 包含默认端口 63315。原子进程日志 artifacts/ui-port-failure-original.log、端口表和判断 artifacts/ui-port-diagnosis.json 均已保留。',
'',
'## 后续独立诊断（不代替本轮 F03）',
'',
'仅在 .tmp/d05-047-vitest-port-diagnostic 复制目录中的 vitest.config.ts 内给嵌套 Storybook 项目 browser.api 明确回环 127.0.0.1:64115 和 strictPort，真实 Chromium stories 2/2 passed、exit0。普通 Vitest CLI 参数并未改变嵌套 project 的默认 63315，失败与成功的各自证据见 artifacts/diag-vitest-*.json。诊断未修改本仓库候选源码、依赖锁、Windows 排除表和原 F03 结果。该诊断是修复方向 Proof，不是正式验收 PASS。',
'',
'## 阶段停止',
'',
'下一步是 Owner 授权的受控 Delivery Repair（仅修复 Storybook fixture 的浏览器 API 绑定设置），独立 Review 后重新完整 F01–F05 正式验收。当前没有 Close 资格；不 Git commit/push、安装或发布稳定版本、不触碰 DreMo。原 046/047 文件、直接命令与证据保留。',
].join('\n');
const lease=JSON.stringify({op:'d05-047-failed-finalize',nonce:crypto.randomUUID(),pid:process.pid});let held=false,steps=0,complete=false;
try{
fs.writeFileSync(lock,lease,{flag:'wx'});held=true;
if(fs.readFileSync(mf,'utf8')!==original||header(run).status!=='working')throw Error('concurrent state drift');
fs.writeFileSync(art+'/summary.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});steps++;
fs.writeFileSync(run,originalHeader+'\n\n'+markdown+'\n');steps++;
const tm=mf+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(tm,JSON.stringify(next,null,2)+'\n',{flag:'wx'});fs.renameSync(tm,mf);steps++;
const final=JSON.parse(fs.readFileSync(mf,'utf8'));parseWorkspace(parseProject(pr),final);
if(final.latestRunRef!==run||final.next.action!=='delivery-repair'||final.next.status!=='awaiting-owner-instruction'||header(run).outcome!=='failed'||fs.readFileSync(lock,'utf8')!==lease)throw Error('final readback mismatch');
complete=true;fs.unlinkSync(lock);held=false;
console.log(JSON.stringify({ok:true,runRef:run,outcome:'failed',groups:groups.map((x:{id:string,stageOutcome:string,counts?:{pass?:number,tests?:number,fail?:number}})=>({id:x.id,result:x.stageOutcome,counts:x.counts})),safePortDiagnostic:'2/2 passed in isolated copy only',candidateUnchanged:true,next:final.next,lockReleased:true},null,2));
}finally{
if(held&&steps===0&&fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===lease)fs.unlinkSync(lock);
if(held&&steps>0&&!complete)console.error('PARTIAL 047: preserve lock and evidence steps='+steps);
}
