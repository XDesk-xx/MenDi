import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'yaml';
import {parseProject,parseWorkspace} from '../../../../../src/core/records.ts';

const id='20261020-05-formal-full-test-and-workflow-repairs';
const base='.mendi/runs/'+id+'/046-delivery-full-test';
const run=base+'/run.md',art=base+'/artifacts',mf='.mendi/delivery-groups/'+id+'/manifest.json';
const project=JSON.parse(fs.readFileSync('.mendi/project.json','utf8'));
const original=fs.readFileSync(mf,'utf8'),m=JSON.parse(original);
const plan=JSON.parse(fs.readFileSync(art+'/plan.json','utf8'));
const groups=plan.requiredGroups.map((stage:string)=>{
 const r=JSON.parse(fs.readFileSync(art+'/'+stage+'.json','utf8'));
 return {stage,stageOutcome:r.stageOutcome,steps:r.steps.map((x:{label:string,exitCode:number|null,signal:string|null,timedOut:boolean})=>({label:x.label,exitCode:x.exitCode,signal:x.signal,timedOut:x.timedOut})),counts:r.counts};
});
const lock='.mendi/write.lock';
const head= parse(fs.readFileSync(run,'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]);
const checks={basis:plan.candidate.commit==='7445a9f765e91c5574dd649667bee5349dd6a413',
state:m.state==='open'&&m.recordingMode==='manual-bootstrap'&&m.latestRunRef===run&&m.next.action==='delivery-full-test-execute'&&m.activeChangeId===null&&project.archivedChangeCount===17,
head:head.status==='working'&&head.phase==='prepared',groupCount:groups.length===5,
facts:groups.map((x:{stage:string,stageOutcome:string})=>x.stageOutcome).join(',')==='passed,passed,failed,failed,passed',
business:groups[1].counts?.pass===336&&groups[1].counts?.tests===336&&groups[1].counts?.fail===0&&groups[1].counts?.skipped===0&&groups[1].counts?.todo===0,
diagnostics:['diag-ui-online.json','diag-install-online.json','diag-install-offline-recheck.json'].every(f=>fs.existsSync(art+'/'+f)),
unlocked:!fs.existsSync(lock)};
if(Object.values(checks).some(x=>!x))throw Error('046 finalization precondition fail '+JSON.stringify(checks));
const record={runRef:run,executionId:'d05-full-test-046',formalDeliveryTest:true,mode:'owner-authorized-manual-full-test',
outcome:'failed',cause:'F03 and F04 environment preparation failure, no UI or installation business test started',sourceBasis:plan.candidate,
groups,continuation:'Additional diagnostic-only preparations in distinct locations verified offline cache recovery; neither counts as original F03/F04 PASS. Require separate new full F01-F05 attempt.',
diagnostics:['diag-ui-online.json','diag-install-online.json','diag-install-offline-recheck.json'],
completedAt:new Date().toISOString(),nextAction:'delivery-full-test',noCodeModified:true};
const oldBody=fs.readFileSync(run,'utf8').split(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)[1];
const header=[
'---','deliveryId: '+id,'planningSlot: MVP-D05','run: "046"','actionType: delivery-full-test','role: author','actor: codex-author',
'recordingMode: manual-bootstrap','scope: delivery','formalDeliveryTest: true','testMode: owner-authorized-manual-full-test',
'executionId: d05-full-test-046','testedCommit: '+plan.candidate.commit,'status: completed','actionStatus: completed','phase: finished',
'outcome: failed','result: failed','date: 2026-10-21','finishedAt: '+record.completedAt,
'stageSkillRef: skills/actions/delivery-full-test/SKILL.md','previousRunRef: '+head.previousRunRef,'nextAction: delivery-full-test','nextRole: author','---'
].join('\n');
const body=[
'# D05 046 正式 Full Test — failed（环境准备阻断）',
'',
'Owner 原文：owner 授权 进行full test。根仍 manual-bootstrap，按已确认的人工正式 F01–F05 一次完整范围执行，不能冒充产品 groups-v1 原生父记录。受测 Git 7445a9f；D05-A/B/C/D 的 Apply Review approved，Archive 014–017。',
'',
'F01 工程 check：通过。F02 根行为全集真实 336/336，0 fail/skip/todo，exit0。F05 当前八份主规格 strict 及 status/next：全部通过。',
'',
'F03 UI 准备 exit1，离线元数据 @blazediff/core 缺失且 pnpm 原供应链检查未完成；未启动 UI 业务测试。F04 安装准备 exit1，离线镜像缺 yaml@2.9.1 元数据；未启动安装业务测试。原 F03/F04 失败及日志永不覆盖，不能声明完整 passed。',
'',
'后续环境诊断：相同包版本、镜像、锁文件、不关安全策略、禁执行安装脚本的普通依赖准备通过，pnpm 明确报告 supply-chain policy 237 entries PASS。新的离线 UI 五沙箱准备与独立安装 session 准备通过，仅用于确认缓存可恢复，**不计入原 046 F03/F04**。完整原始信息在 artifacts/diag-*.json，所有正式组步骤/退出与原始日志见 artifacts/F01..F05 对应 json/log。',
'',
'本轮结果 **failed，不是产品测试失败的证明，而是两项必需业务集合因环境准备未执行**。在本次 Owner “继续”范围内，若实际环境安全且工作树源码未变，后续另启一轮新的完整 F01–F05 作为正式验收，不拼接本 046 已通过的 F01/F02/F05。无 Close/Push/安装 stable/DreMo。',
].join('\n');
const updated={...m,latestRunRef:run,stopBoundary:'delivery-full-test-retry',next:{action:'delivery-full-test',role:'author',status:'environment-recovered-awaiting-new-full-attempt',runRef:run,reason:'D05 046 F01/F02/F05 通过，F03/F04 离线环境准备失败，046 正式 failed；已在分离诊断环境确认原政策不变的依赖准备恢复。Owner 继续指令仅授权新整次 F01–F05，不复用旧 PASS。'}};
parseWorkspace(parseProject(project),updated);
const lease=JSON.stringify({op:'d05-046-failed-finalize',token:crypto.randomUUID(),pid:process.pid});let held=false,steps=0,ok=false;
try{
 fs.writeFileSync(lock,lease,{flag:'wx'});held=true;if(fs.readFileSync(mf,'utf8')!==original)throw Error('manifest changed');
 fs.writeFileSync(art+'/summary.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});steps++;
 fs.writeFileSync(run,header+'\n'+body+'\n');steps++;
 const tmp=mf+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(updated,null,2)+'\n',{flag:'wx'});fs.renameSync(tmp,mf);steps++;
 const actual=JSON.parse(fs.readFileSync(mf,'utf8'));parseWorkspace(parseProject(project),actual);
 if(actual.latestRunRef!==run||actual.next.status!=='environment-recovered-awaiting-new-full-attempt'||parse(fs.readFileSync(run,'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]).outcome!=='failed'||fs.readFileSync(lock,'utf8')!==lease)throw Error('final readback mismatch');
 ok=true;fs.unlinkSync(lock);held=false;console.log(JSON.stringify({ok:true,runRef:run,outcome:'failed',groups:groups.map((x:{stage:string,stageOutcome:string})=>({id:x.stage,outcome:x.stageOutcome})),next:actual.next,lockReleased:true},null,2));
}finally{if(held&&steps===0&&fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===lease)fs.unlinkSync(lock);if(held&&steps>0&&!ok)console.error('PARTIAL! preserve lock and evidence steps='+steps)}
