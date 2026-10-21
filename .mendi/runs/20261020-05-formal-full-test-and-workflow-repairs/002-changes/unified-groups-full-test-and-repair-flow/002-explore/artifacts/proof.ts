// D05-A isolated Explore proof. Fixture actor/verdict is not a real MenDi Change approval.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import net from 'node:net';
import {pathToFileURL} from 'node:url';
const repo=process.cwd();
const artifact=path.join(repo,'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/002-explore/artifacts');
const modules=async(rel)=>import(pathToFileURL(path.join(repo,rel)).href);
const g=await modules('tests/group-support.ts');
const d=await modules('tests/delivery-support.ts');
const support=await modules('tests/test-support.ts');
const repair=await modules('src/application/delivery-repair.ts');
const verify=await modules('src/application/candidate-verification.ts');
const groupAdmission=(await modules('src/application/group-admission.ts')).groupAdmission;
const report=[];
const roots=[];
const startingTemp=new Set(fs.readdirSync(path.join(repo,'.tmp')).filter(x=>x.startsWith('mendi-apply-')));
const snapshot=(x)=>{
 const run=x.run??null, attempt=run?.attempt??null;
 const raw=attempt?.executionId?path.join(x.root,'.mendi/delivery-groups/d01/tests',attempt.executionId,'group-report.json'):null;
 const detail=raw&&fs.existsSync(raw)?JSON.parse(fs.readFileSync(raw,'utf8')):null;
 return {ok:x.ok,runRef:run?.ref,actionType:run?.actionType,rawOutcome:x.groupExecution?.child?.outcome??null,protocolState:x.groupExecution?.protocolState??null,
  nextAction:x.next?.action??null,states:attempt?.progress?.map(z=>({id:z.id,state:z.state,sourceRunRef:z.sourceRunRef}))??[],
  executed:detail?.groups?.map(v=>({id:v.id,state:v.state,exitCode:v.exitCode,counts:v.counts??null}))??[]};
};
const make=()=>{const t=g.groupTarget();roots.push(t.root);return t;};
try {
 // P01: Actual group runner continues independent tests after an ordinary middle failure.
 {
  const t=make();
  fs.writeFileSync(path.join(t.root,'middle.test.ts'),
   "import test from 'node:test';test('middle fails',()=>{throw Error('proof P01 middle')});");
  fs.writeFileSync(path.join(t.root,'tail.test.ts'),
   "import test from 'node:test';test('tail fails separately',()=>{throw Error('proof P01 independent tail')});");
  const result=g.attemptResult(await g.groupRun(t.root));
  const data=snapshot({...result,root:t.root});
  assert.deepEqual(data.states.map(v=>v.state),['passed','failed','failed']);
  assert.equal(data.nextAction,'delivery-repair');
  assert.equal(data.protocolState,'valid');
  report.push({case:'P01: actual independent failure collection',expected:'passed/failed/failed',observed:data});
 }
 // P02: Actual owned service port conflict => blocked, no Repair/Review, new full initial after cleanup.
 {
  const t=make();
  const server=net.createServer();
  await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  const address=server.address();
  assert.ok(address&&typeof address==='object');
  fs.writeFileSync(path.join(t.root,'group-control.json'),JSON.stringify({ports:{middle:address.port}}));
  let first;
  try{
    first=g.attemptResult(await g.groupRun(t.root));
  }finally{
    await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
  }
  const before=snapshot({...first,root:t.root});
  assert.equal(before.states[1].state,'blocked');
  assert.equal(before.states[2].state,'passed');
  fs.writeFileSync(path.join(t.root,'group-control.json'),'{}');
  g.writeGroupInput(t.root,{...t.declaration,fromRunRef:first.run.ref});
  const retry=g.attemptResult(await g.groupRun(t.root));
  const after=snapshot({...retry,root:t.root});
  assert.equal(after.ok,true,JSON.stringify(after));
  assert.deepEqual(after.states.map(v=>v.state),['passed','passed','passed']);
  const filenames=fs.readdirSync(path.join(t.root,'.mendi/runs/d01'));
  assert.ok(!filenames.some(v=>v.includes('delivery-repair')));
  report.push({case:'P02: safely confirmed environment-only blocked attempt',portHeldByFixture:true,
   first:before,retry:after,repairRunsCreated:false});
 }
 // P03: Real old command failed, fixture Author repair and independent-actor Review approved.
 // New groups-v1 admission erroneously requires an old group testAttemptRunRef, never created by command mode.
 {
  const t=make();
  assert.ok(fs.existsSync(path.join(t.root,'foreground.ts')),'full command fixture runner must exist');
  support.writePackage(t.root,p=>{p.scripts['test:full']='node foreground.ts fail';});
  const failed=await d.formal(t.root);
  assert.ok(failed.run?.fullTest);
  assert.equal(failed.run.fullTest.outcome,'failed');
  const original=fs.readFileSync(path.join(t.root,failed.run.ref));
  const author=repair.startDeliveryRepair({
   project:t.root,role:'author',actor:d.authorActor,from:failed.run.ref,reason:'P03 fixture controlled repair'});
  d.finishRepair(t.root,author.run.ref);
  const reviewer=repair.startDeliveryReview({
   project:t.root,role:'reviewer',actor:d.reviewActor,authorRunRef:author.run.ref});
  d.finishRepair(t.root,reviewer.run.ref,'reviewer','complete','approved');
  support.writePackage(t.root,p=>{p.scripts['test:full']='node group-runner.ts';});
  g.writeGroupInput(t.root,{...t.declaration,fromRunRef:reviewer.run.ref});
  const manifest=JSON.parse(fs.readFileSync(path.join(t.root,'.mendi/delivery-groups/d01/manifest.json')));
  assert.equal(manifest.testAttemptRunRef,undefined);
  let thrown=null;
  try{groupAdmission(t.root,{...d.fullInput(t.root),inputFile:'group-input.json'});}
  catch(e){thrown={name:e.name,code:e.code??null,message:e.message};}
  assert.ok(thrown,'current native admission should demonstrate missing group attempt');
  assert.match(thrown.message,/当前 attempt|未定义|缺失/);
  assert.ok(fs.readFileSync(path.join(t.root,failed.run.ref)).equals(original));
  report.push({case:'P03: reviewed legacy command failed -> new groups-v1 first execution',oldCommand:{outcome:failed.run.fullTest.outcome,runRef:failed.run.ref},
   repairRunRef:author.run.ref,reviewRunRef:reviewer.run.ref,reviewVerdict:'approved fixture only',
   missingTestAttemptRunRef:true,groupAdmissionError:thrown,oldFailureUnchanged:true});
 }
 // P04: Existing retest and candidate-verification intentionally accepts local subset
 // plus retained original passed groups. This is existing D04 behavior and D05 target mismatch.
 {
  const t=make();
  fs.writeFileSync(path.join(t.root,'middle.test.ts'),
    "import test from 'node:test';test('P04 initially fails',()=>{throw Error('P04 original')});");
  const before=g.attemptResult(await g.groupRun(t.root));
  const first=snapshot({...before,root:t.root});
  assert.deepEqual(first.states.map(x=>x.state),['passed','failed','passed']);
  const c2={...g.groupCandidate,id:'p04-candidate-2',basis:{...g.groupCandidate.basis,changes:'fixture repair limited to middle.test.ts'}};
  fs.writeFileSync(path.join(t.root,'middle.test.ts'),
    "import test from 'node:test';test('P04 repaired',()=>{});");
  fs.writeFileSync(path.join(t.root,'impact.json'),JSON.stringify({
    candidate:c2,extent:'local',affectedGroupIds:['middle'],
    retained:[{id:'prefix',reason:'fixture unchanged'},{id:'tail',reason:'fixture unchanged'}],
    reason:'fixture local change only'
  }));
  const author=repair.startDeliveryRepair({project:t.root,role:'author',actor:d.authorActor,
    from:before.run.ref,inputFile:'impact.json',reason:'P04 local fixture code repair'});
  d.finishRepair(t.root,author.run.ref);
  const reviewer=repair.startDeliveryReview({project:t.root,role:'reviewer',actor:d.reviewActor,authorRunRef:author.run.ref});
  d.finishRepair(t.root,reviewer.run.ref,'reviewer','complete','approved');
  g.writeGroupInput(t.root,{...t.declaration,purpose:'retest',candidate:c2,selection:['middle'],fromRunRef:reviewer.run.ref});
  const partial=g.attemptResult(await g.groupRun(t.root));
  assert.deepEqual(partial.run.attempt.selection,['middle']);
  assert.equal(partial.ok,true);
  const sources=['prefix','middle','tail'].map(id=>({id,runRef:id==='middle'?partial.run.ref:before.run.ref,applicability:'fixture only; approved local impact'}));
  fs.writeFileSync(path.join(t.root,'verify.json'),JSON.stringify({fromRunRef:partial.run.ref,planRef:'group-plan.json',candidate:c2,sources}));
  const v=verify.createVerification({project:t.root,inputFile:'verify.json',role:'author',actor:d.authorActor});
  assert.equal(v.candidateVerification?.conclusion,'verified');
  report.push({case:'P04: existing partial retest + multi-run candidate verification',first,
    retest:snapshot({...partial,root:t.root}),selectedSubset:partial.run.attempt.selection,
    verification:v.candidateVerification?.conclusion,verificationSourceRuns:sources.map(x=>({id:x.id,runRef:x.runRef})),
    note:'Fixture review is recorded test setup, NOT actual MenDi Change Reviewer approval'});
 }
 const result={status:'passed',capturedAt:new Date().toISOString(),baseline:'current workspace code; no MenDi implementation changes',
  methods:'native product calls on freshly isolated product-v2 target fixtures, executed real group-node-runner and full command',
  cases:report,limitations:['stage review identity labels in fixture do not prove a real independent Reviewer','fixtures are not the actual DreMo target','D05 requirements not yet implemented','P02 blocked is not a generic failed environmental classification']};
 fs.writeFileSync(path.join(artifact,'proof-results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:result.status,cases:report.map(x=>({case:x.case,...(x.observed?{states:x.observed.states,next:x.observed.nextAction}:{})})),artifact:path.relative(repo,path.join(artifact,'proof-results.json'))},null,2));
}finally{
 // Delete only directories this process created, after their evidence was read and summarized.
 // Unknown/incomplete fixture execution or lock must be retained, never treated as success.
 const isResolved=report.length===4&&fs.existsSync(path.join(artifact,'proof-results.json'));
 if(isResolved){
  const now=fs.readdirSync(path.join(repo,'.tmp')).filter(x=>x.startsWith('mendi-apply-')&&!startingTemp.has(x));
  for(const folder of now){
    const full=path.join(repo,'.tmp',folder);
    const foreignLock=path.join(full,'project/.mendi/write.lock');
    if(fs.statSync(full).isDirectory()&&!fs.existsSync(foreignLock))fs.rmSync(full,{recursive:true,force:false,maxRetries:3});
  }
 }
}