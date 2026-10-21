import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {parse, stringify} from 'yaml';
import {parseProject, parseWorkspace} from '../../../../../src/core/records.ts';
import {scanRunNumbers} from '../../../../../src/adapters/runs.ts';
import {managedPath} from '../../../../../src/adapters/paths.ts';

const root=fs.realpathSync(process.cwd());
const id='20261020-05-formal-full-test-and-workflow-repairs';
const base=`.mendi/runs/${id}/051-delivery-close`, art=`${base}/artifacts`, ref=`${base}/run.md`;
const fullRef=`.mendi/runs/${id}/050-delivery-full-test/run.md`, fullArt=path.posix.dirname(fullRef)+'/artifacts';
const mf=`.mendi/delivery-groups/${id}/manifest.json`, lock='.mendi/write.lock';
const read=(file:string)=>JSON.parse(fs.readFileSync(managedPath(root,file),'utf8'));
const json=(value:unknown)=>JSON.stringify(value,null,2)+'\n';
const git=(args:string[])=>{const r=spawnSync('git',args,{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trimEnd();};
const current=fs.readFileSync(mf,'utf8'), m=JSON.parse(current), p=read('.mendi/project.json');
const originalProject=fs.readFileSync('.mendi/project.json');
const fullBytes=fs.readFileSync(fullRef);
const fullSource=fullBytes.toString('utf8');
const fullHeader=parse(fullSource.match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]);
const plan=read(`${fullArt}/plan.json`), summary=read(`${fullArt}/summary.json`);
const candidate=summary.candidate;
function basis() {
  assert.equal(fs.readFileSync(mf,'utf8'),current);
  assert.ok(fs.readFileSync('.mendi/project.json').equals(originalProject));
  assert.ok(fs.readFileSync(fullRef).equals(fullBytes));
  assert.equal(git(['rev-parse','HEAD']),candidate.commit);
  assert.equal(git(['status','--porcelain','--','src','scripts','tests','skills','openspec/specs','README.md','package.json','pnpm-lock.yaml','pnpm-workspace.yaml']),candidate.workingTreeStatus);
  assert.ok(fs.readFileSync('tests/fixtures/storybook-project/vitest.config.ts').equals(fs.readFileSync(`${fullArt}/candidate-vitest-config.ts`)));
  const reservations=scanRunNumbers(root,id);
  assert.equal(reservations.number,52);
  assert.ok(reservations.reservations.filter(r=>r.number>=51).every(r=>r.ref===ref));
}
assert.equal(m.recordingMode,'manual-bootstrap'); assert.equal(p.recordingMode,'manual-bootstrap');
assert.equal(p.activeDeliveryId,id); assert.equal(m.state,'open'); assert.equal(m.activeChangeId,null);
assert.equal(m.latestRunRef,fullRef); assert.equal(m.next.action,'delivery-close');
assert.equal(p.archivedChangeCount,17); assert.equal(m.plannedChanges.length,4); assert.equal(m.changeBindings.length,4);
const completed=m.changeBindings.map((b:{planningSlot:string;changeId:string;changeRef:string;state:string;archiveOrdinal:number},i:number)=>{
  assert.equal(b.state,'archived');assert.equal(b.archiveOrdinal,14+i);
  assert.equal(b.changeId,plan.runRefs[i].change);assert.equal(b.changeRef,plan.runRefs[i].archive);
  return {slot:b.planningSlot,changeId:b.changeId,archiveRef:b.changeRef,archiveOrdinal:b.archiveOrdinal};
});
const committed=JSON.parse(git(['show',`${candidate.commit}:${mf}`]));
assert.equal(m.goal,committed.goal);assert.deepEqual(m.plannedChanges,committed.plannedChanges);
assert.equal(fullHeader.status,'completed');assert.equal(fullHeader.outcome,'passed');
assert.equal(fullHeader.executionId,summary.executionId);assert.equal(fullHeader.formalDeliveryTest,true);
assert.equal(fullHeader.testMode,'owner-authorized-manual-full-test');
assert.equal(summary.outcome,'passed'); assert.equal(summary.priorPassReused,false);
assert.equal(summary.recordingMode,'manual-bootstrap');assert.deepEqual(candidate,plan.candidate);
assert.equal(summary.groups.length,5);
let commands=0;
for(const [i,group] of summary.groups.entries()) {
  assert.equal(group.stage,plan.requiredGroups[i]);assert.equal(group.stageOutcome,'passed');
  assert.deepEqual(group,read(`${fullArt}/${group.stage}.json`));
  assert.equal(group.steps.length,group.expectedSteps);
  for(const step of group.steps) {
    commands++;assert.equal(step.exitCode,0);assert.equal(step.signal,null);assert.equal(step.error,null);assert.equal(step.timedOut,false);
    assert.equal(step.cwd,root);
    assert.deepEqual(step.command[0],process.execPath);
    for(const file of Object.values(step.logs) as string[]) assert.ok(fs.statSync(managedPath(root,file)).isFile());
  }
  if(group.counts) {
    assert.ok(group.counts.tests>0);assert.equal(group.counts.pass,group.counts.tests);
    for(const key of ['fail','cancelled','skipped','todo'])assert.equal(group.counts[key],0);
    const last=group.steps[group.steps.length-1];
    const stdout=fs.readFileSync(managedPath(root,last.logs.stdout),'utf8');
    for(const key of ['tests','pass','fail','cancelled','skipped','todo']) {
      const hits=[...stdout.matchAll(new RegExp('^# '+key+' (\\d+)\\s*$','gm'))];
      assert.ok(hits.length>0);assert.equal(Number(hits.at(-1)![1]),group.counts[key]);
    }
  }
}
const stopped=read(`${fullArt}/ui/preview/preview-stop.json`);
assert.equal(stopped.confirmed,true);assert.equal(stopped.childAndPipesClosed,true);assert.equal(stopped.listenerUnavailable,true);
const session=read(`${fullArt}/installation/session.json`);
assert.equal(createHash('sha256').update(fs.readFileSync(session.packagePath)).digest('hex'),session.packageSha256);
assert.equal(session.packageVersion,'0.2.0');
basis();assert.ok(!fs.existsSync(lock));assert.ok(!fs.existsSync(ref));
const now=new Date().toISOString();
const applicability={conclusion:'applicable',materials:candidate.materials,
  changes:'相较050，受测实现、测试、依赖、方法、主规格、README及已批准Storybook配置均未变；只新增051收口、manifest和当前context/路线图状态说明。',
  reason:'050 本次完整F01–F05 passed；五组和全部直接命令、双日志、业务计数与当前四项归档范围一致；固定HEAD及受审一行配置保持，说明性收尾不改变材料适用性。'};
const declaration={deliveryId:id,scope:'delivery',recordingMode:'manual-bootstrap',action:'delivery-close',role:'author',
  ownerAuthorization:'delivery close',fullTestRunRef:fullRef,applicability,completedScope:completed,candidate,
  package:{path:session.packagePath,version:session.packageVersion,sha256:session.packageSha256},
  limitations:['根人工正式执行及人工Close，不伪造product-v2/groups-v1 typed acceptance。','仅本机已准备Windows/Node22/pnpm11.22.0；不认证冷安装/其他平台。','不执行Git、版本发布、稳定安装、清理或DreMo写入。']};
const next={...m,state:'closed',closedOn:'2026-10-21',closedAt:now,latestRunRef:ref,closeRunRef:ref,
  fullTest:{recordingMode:'manual-bootstrap',scope:'delivery',formalDeliveryTest:true,phase:'finished',outcome:'passed',
    result:'passed',executionId:summary.executionId,runRef:fullRef,resultRef:`${fullArt}/summary.json`,declarationRef:`${fullArt}/plan.json`,testedCommit:candidate.commit,testedWorktree:candidate.workingTreePatch},
  close:{recordingMode:'manual-bootstrap',scope:'delivery',status:'completed',result:'closed',runRef:ref,fullTestRunRef:fullRef,
    declarationRef:`${art}/declaration.json`,applicability,closedAt:now},
  stopBoundary:'owner-decision',next:{action:'owner-decision',status:'awaiting-owner-instruction',role:'author',runRef:ref,
    reason:'D05 051已Close，050完整正式验收passed，四项归档014–017保留；等待Owner下一指令，Git/发布/稳定安装与其他目标操作分别授权。'}};
parseWorkspace(parseProject(p),next);
const header={deliveryId:id,planningSlot:'MVP-D05',actionId:'mvp-d05-delivery-close-01',actionType:'delivery-close',role:'author',actor:'codex-author',
  run:'051',status:'completed',actionStatus:'completed',outcome:'complete',result:'closed',recordingMode:'manual-bootstrap',scope:'delivery',
  date:'2026-10-21',closedAt:now,stageSkillRef:'skills/actions/delivery-close/SKILL.md',previousRunRef:fullRef,fullTestRunRef:fullRef,nextAction:'owner-decision',nextRole:'author'};
const body=`# D05 Delivery Close\n\nOwner 原始指令：delivery close。本会话保持Author；本次沿用根既有manual-bootstrap人工Close，不调用仅适用product-v2的生命周期写入、不迁移根历史、不伪造typed groups-v1 acceptance。\n\n## 收口依据与材料适用性\n\n直接消费050当次完整F01–F05正式passed：工程check，根336/336，UI 5/5，隔离安装4/4，八份主规格及status/next十命令；${commands}条实际命令全部finished/exit0、signal/error为空、无timeout，所有必需计数failed/cancelled/skipped/todo为0，双物理日志可读。逐组收据与summary相同，UI preview清理confirmed。本轮四项归档014/015/016/017与050已保存范围一致，无活动Change，累计17；不重新展开旧Review/Archive正文或失败链，不拼接旧PASS，不重跑测试。\n\n当前HEAD ${candidate.commit}及受测工作树状态与050一致；唯一已批准的Storybook browser.api一行修改与050直接副本逐字节相同。当前0.2.0测试包SHA256=${session.packageSha256}，与050安装session相符；不重新打包或切换稳定安装。原日志、正式Run和结果仍唯一保存在050，051仅保存收口声明及必要检查结果，不复制历史证据树。\n\n声明见artifacts/declaration.json，直接检查及必要输入见artifacts/preflight.json。${applicability.changes} ${applicability.reason}\n\n## 实际收口与边界\n\n本次独占项目锁内再次复核原manifest/project、050原文、候选和共享Run占号，保存051，原子更新closed manifest并读回。四项归档绑定、项目登记身份、累计数及旧Run/verdict保持；只同步根唯一长期路线图和OpenSpec context的当前阶段事实，README受测发行原文保留。\n\nD05交付：A统一未来groups-v1完整正式执行和修复后整次重跑；B未Close追加计划；C有限opt-in单源采集及失败原件保护；D最新Run补证和有限amend（原文不可变、评论非权威）。根050人工验收不同于隔离product-v2中的原生协议测试；不扩展至DreMo、任意UI语义或其他平台。\n\n当前D05已closed。下一步owner-decision / author / awaiting-owner-instruction；不自动Git checkpoint/push、发布、稳定安装、Open/Reopen、新Change或其他项目操作。实际写入/自有锁释放见artifacts/commit.json，公开CLI status/next读回见相应stdout及readback.json。\n`;
const configRef='openspec/config.yaml',roadmapRef='mendi-foundation-and-delivery-roadmap.md';
const config=fs.readFileSync(configRef,'utf8'), roadmap=fs.readFileSync(roadmapRef,'utf8');
const configLines=config.split(/\r?\n/).map(line=>{
  if(line.startsWith('  当前为 MVP-D05，'))return '  当前MVP-D05四项已独立审核并归档014–017；050人工完整正式Full Test passed，051 Author Close已完成，Delivery closed、无活动Change；等待Owner下一指令，实际状态见manifest/最近Run。';
  if(line.startsWith('  外部 Full Test 的旧 WIP'))return '  D05受测基准HEAD 7445a9f765e91c5574dd649667bee5349dd6a413，加048/049批准的一行Storybook端口配置；050完整验收后051收口。本次未Git写入、发布或切换稳定安装，旧失败与verdict保留。';
  return line;
});
const roadmapLines=roadmap.split(/\r?\n/).map(line=>line.startsWith('当前交付与待办：')
  ?'当前交付与待办：**D04 与 D05 均已 Close。** D05 四项 Change 已独立审核、原生归档014/015/016/017，累计归档17；050完整人工正式 Full Test passed（根336/336、UI 5/5、安装4/4），051 Author Close完成。后续Git、版本发布与稳定安装切换分别等待Owner授权；当前候选和验收边界见manifest/最近Run。':line);
const lease=json({operation:'d05-051-manual-close',pid:process.pid,token:randomUUID()});
let effects=false;
fs.writeFileSync(lock,lease,{flag:'wx'});
try {
  basis();assert.equal(fs.readFileSync(configRef,'utf8'),config);assert.equal(fs.readFileSync(roadmapRef,'utf8'),roadmap);
  fs.writeFileSync(`${art}/manifest-before.json`,current,{flag:'wx'});effects=true;
  fs.writeFileSync(`${art}/declaration.json`,json(declaration),{flag:'wx'});
  fs.writeFileSync(`${art}/preflight.json`,json({recordedAt:now,commands,groups:summary.groups.map((g:{stage:string;counts:unknown})=>({id:g.stage,counts:g.counts})),
    sourceBasisUnchanged:true,packageIntact:true,logsReadable:true,completed,originalApprovalSnapshotReused:true,fullTestRunRef:fullRef}),{flag:'wx'});
  fs.writeFileSync(ref,`---\n${stringify(header)}---\n\n${body}`,{flag:'wx'});
  const tmp=`${mf}.${randomUUID()}.tmp`;
  fs.writeFileSync(tmp,json(next),{flag:'wx'});fs.renameSync(tmp,mf);
  fs.writeFileSync(configRef,configLines.join('\n'));fs.writeFileSync(roadmapRef,roadmapLines.join('\n'));
  const final=read(mf);parseWorkspace(parseProject(p),final);
  assert.equal(final.state,'closed');assert.equal(final.latestRunRef,ref);assert.equal(final.close.fullTestRunRef,fullRef);
  assert.deepEqual(final.changeBindings,m.changeBindings);assert.ok(fs.readFileSync('.mendi/project.json').equals(originalProject));
  assert.ok(fs.readFileSync(fullRef).equals(fullBytes));assert.equal(fs.readFileSync(lock,'utf8'),lease);
  fs.unlinkSync(lock);
  fs.writeFileSync(`${art}/commit.json`,json({ok:true,runRef:ref,result:'closed',closedAt:now,fullTestRunRef:fullRef,lockReleased:true,
    historyUnchanged:true,projectIdentityUnchanged:true,next:final.next}),{flag:'wx'});
  console.log(json({result:'closed',runRef:ref,fullTestRunRef:fullRef,commands,next:final.next}));
} catch(error) {
  if(!effects&&fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===lease)fs.unlinkSync(lock);
  throw error;
}
