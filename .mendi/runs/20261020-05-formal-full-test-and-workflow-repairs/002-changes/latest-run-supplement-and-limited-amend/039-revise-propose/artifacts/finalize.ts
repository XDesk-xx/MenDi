import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {parse} from 'yaml';
import {parseProject,parseWorkspace} from '../../../../../../../src/core/records.ts';

const id='20261020-05-formal-full-test-and-workflow-repairs';
const c='latest-run-supplement-and-limited-amend';
const base='.mendi/runs/'+id+'/002-changes/'+c+'/';
const author=base+'037-propose/run.md',review=base+'038-review-propose/run.md',run=base+'039-revise-propose/run.md';
const mf='.mendi/delivery-groups/'+id+'/manifest.json',lock='.mendi/write.lock';
const original=fs.readFileSync(mf,'utf8'),m=JSON.parse(original),project=JSON.parse(fs.readFileSync('.mendi/project.json','utf8'));
const w=parseWorkspace(parseProject(project),m);
const read=(f:string)=>parse(fs.readFileSync(f,'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]);
const a=read(author),r=read(review);
const admitted=w.state==='open'&&w.activeChangeId===c&&project.archivedChangeCount===16&&w.bindings.length===4&&
w.bindings.slice(0,3).every((x,i)=>x.state==='archived'&&x.archiveOrdinal===14+i)&&
r.actionType==='review-propose'&&r.role==='reviewer'&&r.verdict==='changes-requested'&&r.status==='completed'&&
r.outcome==='complete'&&r.authorRunRef===author&&a.actionType==='propose'&&a.status==='completed'&&
m.latestRunRef===review&&m.changeBindings[3].latestRunRef===review&&m.next.action==='revise-propose'&&
m.next.role==='author'&&m.next.status==='changes-requested'&&!fs.existsSync(run)&&!fs.existsSync(lock);
if(!admitted)throw Error('039 admission mismatch');
const change='openspec/changes/'+c+'/';
const files=['proposal.md','design.md','tasks.md','specs/run-post-submission/spec.md','specs/delivery-workspace/spec.md'];
const [proposal,design,tasks,spec,workspace]=files.map(f=>fs.readFileSync(change+f,'utf8'));
const f1=['recordedAt','sourceClaimedCollectedAt','unverified'].every(v=>[proposal,design,spec,tasks].every(x=>x.includes(v)));
const f2=/最多一次|至多一次/.test(proposal)&&/最多一次|至多一次/.test(spec)&&
['requestId','第二个不同'].every(x=>design.includes(x))&&tasks.includes('第二不同 ID');
const f3=['unreviewed-comment','authoritative=false'].every(v=>[proposal,design,spec,tasks,workspace].every(x=>x.includes(v)));
const count=(tasks.match(/^- \[ \]/gm)||[]).length;
if(!f1||!f2||!f3||count!==16||/^- \[x\]/im.test(tasks))throw Error('F1-3 crosswalk or tasks incomplete');
const bin='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const args=['validate',c,'--strict','--json'];
const v=spawnSync(process.execPath,[bin,...args],{encoding:'utf8',windowsHide:true,timeout:35000});
const parsed=JSON.parse(v.stdout??'{}');
if(v.error||v.status!==0||parsed.items?.[0]?.valid!==true||parsed.summary?.totals?.failed!==0)throw Error('strict validation failed');
const status=spawnSync(process.execPath,[bin,'status','--change',c,'--json'],{encoding:'utf8',windowsHide:true,timeout:35000});
const st=JSON.parse(status.stdout??'{}');
if(status.error||status.status!==0||!st.isPlanningComplete||st.artifacts.some((x:{status:string})=>x.status!=='done'))throw Error('OpenSpec incomplete');
const evidence={action:'revise-propose',runRef:run,revises:author,reviewInput:review,reviewVerdict:r.verdict,
findings:{F1:{fixed:f1,result:'recordedAt != unverified sourceClaimedCollectedAt; missing approval timestamp cannot be invented'},
F2:{fixed:f2,result:'explicit amend requestId, one confirmed per Run, same ID idempotent, other ID rejected'},
F3:{fixed:f3,result:'unreviewed-comment authoritative=false; false approved/failed text never affects official result'}},
command:'node '+bin+' '+args.join(' '),exitCode:v.status,validation:parsed.summary,
artifacts:st.artifacts.map((x:{id:string,status:string})=>({id:x.id,status:x.status})),taskCount:count,implementation:false};
const lines=[
'---','deliveryId: '+id,'changeId: '+c,'planningSlot: MVP-D05-D','batchId: 002-changes',
'actionId: '+c+'-revise-propose-01','actionType: revise-propose','role: author','actor: codex-author','run: "039"',
'status: completed','actionStatus: completed','outcome: complete','result: reviewer-findings-f1-f2-f3-revised',
'revisesRunRef: '+author,'previousRunRef: '+review,'nextAction: review-propose','nextRole: reviewer',
'recordingMode: manual-bootstrap','date: 2026-10-21','stageSkillRef: skills/actions/propose/SKILL.md',
'upstreamSkillRef: .agents/skills/openspec-update-change/SKILL.md','---','',
'# D05-D Author Revise Propose — 039','','根据 038 独立 Reviewer changes-requested 定向修订 037 的 OpenSpec 规划。旧 037/038 与此前 033–036 的 Run/verdict 均不改写。',
'',
'## F1 · 时间真实性','系统记录本次后处理 recordedAt；来源自述 sourceClaimedCollectedAt 可空且固定 unverified。旧批准时间无可信锚点，不依据自述或 mtime 声称早/晚于旧批准；要求 verified 的无依据时间声明拒绝。',
'',
'## F2 · amend 身份','amend 命令需 requestId；每个 Run 首版仅一次确认。相同 ID 同输入幂等，同 ID 改输入、第二不同 ID 均拒绝，pending 由同请求显式恢复。',
'',
'## F3 · 自由评论隔离','自由文字只作 unreviewed-comment/authoritative=false；即使文本声称重新 approved 或旧失败已通过，也不进入审核正文、证明、正式摘要、PASS、verdict 或 next，不靠 AI/关键词证明语义安全。',
'',
'## 验证与交接','OpenSpec 1.14.1 strict validate 真实 exit0、1/1 valid、0 issues，四类规划产物 done，16 Tasks 尚未启动。真实 crosswalk 和校验摘要在 artifacts/revision-validation.json。',
'',
'039 Author revise-propose 完成，交独立 review-propose。不进入 Apply、Archive、Git、D05 Full Test/Close，也不修改 DreMo。'
];
const doc=lines.join('\n')+'\n';
const next={...m,changeBindings:m.changeBindings.map((x:{changeId:string})=>x.changeId===c?{...x,state:'propose',latestRunRef:run}:x),
latestRunRef:run,stopBoundary:'review-propose',next:{action:'review-propose',status:'awaiting-review',role:'reviewer',changeId:c,runRef:run,
reason:'D05-D 039 revise-propose 已回应 038 的 F1 时间可信来源、F2 amend ID 与单次上限、F3 未审核自由评论隔离；strict 校验通过，等待独立 review-propose。'}};
parseWorkspace(parseProject(project),next);
const lease=JSON.stringify({operation:'d05d-039-revise-propose',pid:process.pid,nonce:crypto.randomUUID()});
let held=false,steps=0,complete=false;
try{
fs.writeFileSync(lock,lease,{flag:'wx'});held=true;
if(fs.readFileSync(mf,'utf8')!==original||fs.existsSync(run))throw Error('concurrent writer');
fs.writeFileSync(path.dirname(run)+'/artifacts/revision-validation.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});steps++;
fs.writeFileSync(run,doc,{flag:'wx'});steps++;
const temporary=mf+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n',{flag:'wx'});steps++;fs.renameSync(temporary,mf);steps++;
const actual=JSON.parse(fs.readFileSync(mf,'utf8'));parseWorkspace(parseProject(project),actual);
const newH=read(run);
if(actual.latestRunRef!==run||actual.next.action!=='review-propose'||actual.next.role!=='reviewer'||
actual.changeBindings[3].latestRunRef!==run||newH.actionType!=='revise-propose'||
newH.revisesRunRef!==author||newH.status!=='completed'||newH.outcome!=='complete'||fs.readFileSync(lock,'utf8')!==lease)
throw Error('039 readback incomplete');
complete=true;fs.unlinkSync(lock);held=false;
console.log(JSON.stringify({ok:true,runRef:run,revisesRunRef:author,reviewSource:review,findings:{f1,f2,f3},tasks:count,next:actual.next,lockReleased:true},null,2));
}finally{
if(held&&steps===0&&fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===lease)fs.unlinkSync(lock);
if(held&&steps>0&&!complete)console.error('PARTIAL 039; preserve lock, evidence, manifest steps='+steps);
}
