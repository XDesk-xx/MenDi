// MenDi D05-B Reviewer 018: direct re-review of revised Author 017 Propose.
// This proof is read-only except its own evidence artifacts. It never executes
// the new change-add writer, Formal Full Test, Close, Git, or test fixtures.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deliveryDefinition, deliveryLocation } from '../../../../../../../src/core/delivery-runs.ts';

const repo=process.cwd();
const here=path.dirname(fileURLToPath(import.meta.url));
const ch='append-planned-changes-to-open-delivery';
const docRoot='openspec/changes/'+ch;
const history='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/'+ch;
const files={
  actionSpec:docRoot+'/specs/action-runs/spec.md',
  workspaceSpec:docRoot+'/specs/delivery-workspace/spec.md',
  verificationSpec:docRoot+'/specs/delivery-verification/spec.md',
  lifecycleSpec:docRoot+'/specs/delivery-lifecycle/spec.md',
  proposal:docRoot+'/proposal.md',
  design:docRoot+'/design.md',
  tasks:docRoot+'/tasks.md',
  author:history+'/017-revise-propose/run.md',
  previousReview:history+'/016-review-propose/run.md',
  runtimeDispatcher:'src/application/delivery-full-test.ts',
  runtimeWriter:'src/application/group-attempt.ts',
  runTypes:'src/core/delivery-runs.ts'
} as const;
type Key=keyof typeof files;
const raw=Object.fromEntries(Object.entries(files).map(([k,ref])=>[k,fs.readFileSync(path.join(repo,ref),'utf8')])) as Record<Key,string>;
function findLine(key:Key,fragment:string):number{
  const n=raw[key].split(/\r?\n/).findIndex(line=>line.includes(fragment));
  assert.ok(n>=0,'Missing expected statement '+key+' '+fragment);
  return n+1;
}
assert.match(raw.author,/actionType: revise-propose/);
assert.match(raw.author,/status: completed/);
assert.match(raw.author,/revisesRunRef: .*\/015-propose\/run\.md/);
assert.match(raw.author,/previousRunRef: .*\/016-review-propose\/run\.md/);
assert.match(raw.previousReview,/verdict: changes-requested/);

const specLines=raw.actionSpec.split(/\r?\n/);
const whenLine=findLine('actionSpec','Author 显式执行新的完整');
const thenLine=findLine('actionSpec','本次 Run 为');
const typeLine=findLine('runtimeWriter',"actionType: 'delivery-test-attempt'");
const modeLine=findLine('runtimeDispatcher',"raw?.mode !== 'groups-v1'");
assert.match(specLines[whenLine-1],/groups-v1/);
assert.match(specLines[thenLine-1],/015-delivery-test-attempt/);
assert.match(specLines[thenLine-1],/仅为该占号示例/);
assert.match(specLines[thenLine-1],/实际编号取当前 Delivery/);
assert.match(specLines[thenLine-1],/delivery-full-test/);
assert.match(specLines[thenLine-1],/只读兼容/);
assert.match(raw.actionSpec,/共享连续编号/);
assert.match(raw.runtimeWriter,/actionType: 'delivery-test-attempt'/);
assert.match(raw.runtimeDispatcher,/return await runGroupAttempt/);
assert.equal(deliveryLocation('.mendi/runs/d01/015-delivery-test-attempt/run.md','d01').type,'delivery-test-attempt');
assert.equal(deliveryLocation('.mendi/runs/d01/015-delivery-test-attempt/run.md','d01').number,15);
assert.equal(deliveryDefinition('delivery-full-test').type,'delivery-full-test');
assert.equal(deliveryLocation('.mendi/runs/d01/015-delivery-full-test/run.md','d01').type,'delivery-full-test');

const cases=[
 {id:'F1-fixed-new-formal-writer',passed:true,doc:files.actionSpec,
  where:{when:whenLine,then:thenLine,sourceWriter:typeLine,modeGuard:modeLine},
  evidence:'New groups-v1 official Full Test is explicitly 015-delivery-test-attempt, 015 only an example; old delivery-full-test remains read-only'},
 {id:'typed-parser-and-shared-sequence',passed:true,
  evidence:'Real current deliveryLocation recognizes each distinct type; new Run writer chooses delivery-test-attempt, action-runs delta retains shared Delivery numbering'},
 {id:'prior-explore-scope-compatibility',passed:true,
  where:{historical:findLine('design','scopeAdditions'),owner:findLine('workspaceSpec','actor 字符串不能代替真人授权')},
  evidence:'Current design and spec still require finite scope additions and historical same-round Run reads; not a claim that implementation is done'},
 {id:'append-handoff-and-recovery',passed:true,
  where:{separate:findLine('design','scopeAddRunRef'),stability:findLine('workspaceSpec','Atomic append receipt and bounded recovery')},
  evidence:'Separate scope-add receipt from deliveryRunRef and active Change, typed old Full Test pointer remains historical, unsafe/pending/unknown are denied'}
];
const taskCount=(raw.tasks.match(/^- \[ \] \d+\.\d+ /gm)??[]).length;
assert.equal(taskCount,15);
assert.match(raw.proposal,/旧 Open、正式/);
assert.match(raw.design,/delivery-change-add/);
assert.match(raw.tasks,/并发\/中断/);
assert.match(raw.verificationSpec,/旧 PASS/);
assert.match(raw.lifecycleSpec,/groups-v1/);
assert.match(raw.workspaceSpec,/Historical scopes survive same-round plan extension/);
const type=fs.existsSync('D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js');
assert.equal(type,true);
const bin='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const args=[bin,'validate',ch,'--strict','--json'];
const out=spawnSync(process.execPath,args,{
  cwd:repo,encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:8*1024*1024
});
const rawValidation={command:[process.execPath,...args],exitCode:out.status,signal:out.signal,stdout:out.stdout??'',stderr:out.stderr??'',error:out.error?String(out.error):null};
fs.writeFileSync(path.join(here,'openspec-validation.json'),JSON.stringify(rawValidation,null,2)+'\n',{flag:'wx'});
assert.equal(out.status,0,'Fixed OpenSpec strict validation must pass');
const parsed=JSON.parse(out.stdout) as {summary?:{totals?:{failed?:number,passed?:number}}};
assert.equal(parsed.summary?.totals?.failed,0);
assert.equal(parsed.summary?.totals?.passed,1);
const ref=history+'/017-revise-propose/run.md';
const proof={
  recordedAt:new Date().toISOString(),
  fixedAuthorRun:ref,
  priorReviewerRun:history+'/016-review-propose/run.md',
  currentCommit:spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).stdout.trim(),
  verdictEvidence:'F1 corrected; no new Review Propose blocker found',
  cases,
  planning:{taskCount,deltaSpecs:['action-runs','delivery-workspace','delivery-verification','delivery-lifecycle'],
   allFourSpecsAccessible:true},
  validation:{exitCode:out.status,raw:'openspec-validation.json'},
  boundaries:[
    'Only Propose semantic and current source-code consistency checked; no new delivery change add writer is implemented yet',
    'The 016 independent proof is retained as the original scope compatibility finding, not rerun in this narrowly revised Propose',
    'No new product acceptance, real Full Test, Close, Git, deployment, or DreMo changes'
  ]
};
fs.writeFileSync(path.join(here,'proof-results.json'),JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'saved',fixedAuthor:ref,cases:cases.map(c=>c.id),tasks:taskCount,strictOpenSpec:out.status,proof:path.relative(repo,path.join(here,'proof-results.json'))},null,2));