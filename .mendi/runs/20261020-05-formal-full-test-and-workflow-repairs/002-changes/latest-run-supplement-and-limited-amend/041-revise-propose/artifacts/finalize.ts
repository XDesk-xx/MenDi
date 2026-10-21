import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {parse} from 'yaml';
import {parseProject,parseWorkspace} from '../../../../../../../src/core/records.ts';

const id='20261020-05-formal-full-test-and-workflow-repairs';
const c='latest-run-supplement-and-limited-amend';
const prefix='.mendi/runs/'+id+'/002-changes/'+c+'/';
const prior=prefix+'039-revise-propose/run.md';
const review=prefix+'040-review-propose/run.md';
const latest=prefix+'041-revise-propose/run.md';
const manifestRef='.mendi/delivery-groups/'+id+'/manifest.json';
const original=fs.readFileSync(manifestRef,'utf8'),m=JSON.parse(original);
const project=JSON.parse(fs.readFileSync('.mendi/project.json','utf8'));
const w=parseWorkspace(parseProject(project),m);
const read=(f:string)=>parse(fs.readFileSync(f,'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]);
const priorHead=read(prior),reviewHead=read(review);
const lock='.mendi/write.lock';
if(w.state!=='open'||w.activeChangeId!==c||project.archivedChangeCount!==16||w.bindings.length!==4||
!w.bindings.slice(0,3).every((x,i)=>x.state==='archived'&&x.archiveOrdinal===14+i)||
reviewHead.actionType!=='review-propose'||reviewHead.role!=='reviewer'||reviewHead.verdict!=='changes-requested'||
reviewHead.authorRunRef!==prior||reviewHead.status!=='completed'||reviewHead.outcome!=='complete'||
priorHead.actionType!=='revise-propose'||priorHead.status!=='completed'||
m.latestRunRef!==review||m.changeBindings[3].latestRunRef!==review||
m.next.action!=='revise-propose'||m.next.role!=='author'||m.next.status!=='changes-requested'||
fs.existsSync(latest)||fs.existsSync(lock))
 throw Error('041 revise-propose preflight rejected');
const d='openspec/changes/'+c+'/';
const files=['proposal.md','design.md','specs/run-post-submission/spec.md','tasks.md'];
const [proposal,design,spec,tasks]=files.map(n=>fs.readFileSync(d+n,'utf8'));
const findings={
 F4CLI:['--kind','--body','--comment','presentation-only','unreviewed-comment'].every(x=>proposal.includes(x)&&design.includes(x)&&tasks.includes(x)),
 F4Spec:['kind','body','comment','presentation-only','unreviewed-comment'].every(x=>spec.includes(x))&&spec.includes('Same text has different explicit amendment modes')&&spec.includes('Missing or conflicting mode input'),
 F4Id:design.includes('同 ID 换 kind')&&spec.includes('原 ID 换 kind')&&tasks.includes('同 ID 换 kind'),
 F4Negative:spec.includes('审核未批准')&&spec.includes('审核已批准')&&tasks.includes('审核未批准'),
 F1:['recordedAt','sourceClaimedCollectedAt','unverified'].every(x=>proposal.includes(x)&&spec.includes(x)),
 F2:spec.includes('至多一次')&&tasks.includes('requestId'),
 F3:[proposal,design,spec,tasks].every(x=>x.includes('authoritative=false')),
};
const count=(tasks.match(/^- \[ \]/gm)||[]).length;
if(Object.values(findings).some(x=>!x)||count!==16||(/^- \[x\]/im).test(tasks))
 throw Error('F4 or retained findings mismatch: '+JSON.stringify(findings));
const bin='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const cmd=['validate',c,'--strict','--json'];
const r=spawnSync(process.execPath,[bin,...cmd],{encoding:'utf8',windowsHide:true,timeout:35000});
const validation=JSON.parse(r.stdout??'{}');
if(r.error||r.status!==0||validation.items?.[0]?.valid!==true||validation.summary?.totals?.failed!==0)
 throw Error('OpenSpec strict invalid');
const sr=spawnSync(process.execPath,[bin,'status','--change',c,'--json'],{encoding:'utf8',windowsHide:true,timeout:35000});
const st=JSON.parse(sr.stdout??'{}');
if(sr.error||sr.status!==0||!st.isPlanningComplete||st.artifacts.some((x:{status:string})=>x.status!=='done'))
 throw Error('OpenSpec planning incomplete');
const evidence={operation:'revise-propose',changeId:c,priorAuthorRunRef:prior,reviewRunRef:review,reviewVerdict:'changes-requested',
 finding:'F4 explicit amend kind and mutually exclusive input contract',
 checks:findings,decision:'--kind presentation-only with --body OR --kind unreviewed-comment with --comment; neither omission nor mixed inputs allowed; same requestId changing kind/input rejected',
 outcomes:{presentationUnsafe:'rejected',commentSameText:'stored-unreviewed-authoritative-false'},
 unchangedPreviousFindings:['F1','F2','F3'],validation:{cmd:'node '+bin+' '+cmd.join(' '),exitCode:r.status,summary:validation.summary,issues:validation.items[0].issues},tasks:{total:count,done:0},artifacts:st.artifacts.map((x:{id:string,status:string})=>({id:x.id,status:x.status})),productCodeChanged:false};
const h=['---','deliveryId: '+id,'changeId: '+c,'planningSlot: MVP-D05-D','batchId: 002-changes',
'actionId: '+c+'-revise-propose-02','actionType: revise-propose','role: author','actor: codex-author',
'run: "041"','status: completed','actionStatus: completed','outcome: complete','result: reviewer-f4-amend-kind-discriminator-resolved',
'revisesRunRef: '+prior,'previousRunRef: '+review,'nextAction: review-propose','nextRole: reviewer',
'recordingMode: manual-bootstrap','date: 2026-10-21','stageSkillRef: skills/actions/propose/SKILL.md',
'upstreamSkillRef: .agents/skills/openspec-update-change/SKILL.md','---'];
const body=[
'# D05-D Author Revise Propose 041',
'',
'038 的 F1/F2/F3 已经由 039 修订并由 040 Reviewer 核验成立。本次仅修订 040-review-propose 提出的 F4：相同正文无法自动区别排版更正与自由事后评论。039/040 和其它先前 submitted Run/verdict 保留。',
'',
'## F4 — 显式双模式、互斥输入',
'',
'新 amend 请求必须明确 --kind presentation-only|unreviewed-comment 和 requestId。前者只允许 --body 的完整候选正文并作可机械验证的空白差异；后者只允许 --comment 保存非权威、未审核自由文本。缺模式、未知模式、缺匹配内容和两份输入混用在写入前拒绝，不能根据文本、差异或 AI 推测用户意图。',
'',
'同一组字句“审核已批准”替换原“审核未批准”，在 presentation-only 必须拒绝；在 unreviewed-comment 则只准隔离为 authoritative=false 的自由评论，原 Run 字节、verdict、正式摘要与 next 不变。相同 requestId 只有 kind 和原输入内容均相同才算幂等；更换 kind/内容或另一个 ID 仍拒绝。修改已落实 Proposal、Design、run-post-submission delta spec 和 Tasks；不扩展 Owner 授权范围。',
'',
'## 实际校验与交接',
'',
'F4 定向合同、F1–F3 既有承诺、16 个未开始 Tasks 交叉检查通过；OpenSpec 1.14.1 strict validate 1/1 valid、0 issues，四类规划产物 done。证据见 artifacts/revision-validation.json，收口脚本为 artifacts/finalize.ts，严格 TypeScript 类型检查亦通过。',
'',
'本 041 Author Revise Propose 交独立 review-propose，不自签批准、不 Apply、Archive、Git、D05 Full Test/Close、安装或修改 DreMo。'
];
const doc=h.join('\n')+'\n\n'+body.join('\n')+'\n';
const next={...m,changeBindings:m.changeBindings.map((x:{changeId:string})=>x.changeId===c?{...x,state:'propose',latestRunRef:latest}:x),
latestRunRef:latest,stopBoundary:'review-propose',next:{action:'review-propose',status:'awaiting-review',role:'reviewer',changeId:c,runRef:latest,
reason:'D05-D 041 Author revise-propose 已针对 040 F4 固定 --kind presentation-only/--body 与 unreviewed-comment/--comment 互斥模式及幂等负例，保持 F1–F3；OpenSpec strict 通过，待独立 review-propose。'}};
parseWorkspace(parseProject(project),next);
const lease=JSON.stringify({operation:'d05d-041-revise-propose',nonce:crypto.randomUUID(),pid:process.pid});
let held=false,steps=0,complete=false;
try{
 fs.writeFileSync(lock,lease,{flag:'wx'});held=true;
 if(fs.readFileSync(manifestRef,'utf8')!==original||fs.existsSync(latest))throw Error('concurrent change');
 fs.writeFileSync(path.dirname(latest)+'/artifacts/revision-validation.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});steps++;
 fs.writeFileSync(latest,doc,{flag:'wx'});steps++;
 const temporary=manifestRef+'.'+crypto.randomUUID()+'.tmp';
 fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n',{flag:'wx'});steps++;fs.renameSync(temporary,manifestRef);steps++;
 const current=JSON.parse(fs.readFileSync(manifestRef,'utf8'));const run=read(latest);
 parseWorkspace(parseProject(project),current);
 if(current.latestRunRef!==latest||current.changeBindings[3].latestRunRef!==latest||current.next.action!=='review-propose'||
 current.next.role!=='reviewer'||run.actionType!=='revise-propose'||run.revisesRunRef!==prior||
 run.status!=='completed'||run.outcome!=='complete'||fs.readFileSync(lock,'utf8')!==lease)throw Error('041 readback mismatch');
 complete=true;fs.unlinkSync(lock);held=false;
 console.log(JSON.stringify({ok:true,runRef:latest,revisesRunRef:prior,reviewRef:review,checks:findings,taskCount:count,next:current.next,lockReleased:true},null,2));
}finally{
 if(held&&steps===0&&fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===lease)fs.unlinkSync(lock);
 if(held&&steps>0&&!complete)console.error('PARTIAL 041: preserve lock and actual evidence, steps='+steps);
}