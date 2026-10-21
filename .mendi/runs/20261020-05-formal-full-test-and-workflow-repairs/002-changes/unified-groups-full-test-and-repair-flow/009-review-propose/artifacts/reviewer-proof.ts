// D05-A Reviewer 009: independent read-only contract proof for Author 008.
// No product writes, no temporary fixture deletion, no legacy formal run execution.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { projectRound, readRounds, type DeliveryRound } from '../../../../../../../src/core/rounds.ts';
import { readScope } from '../../../../../../../src/core/scope.ts';

const root = process.cwd();
const here = path.dirname(fileURLToPath(import.meta.url));
const changeId = 'unified-groups-full-test-and-repair-flow';
const changeDir = 'openspec/changes/' + changeId;
const files = {
  proposal: changeDir + '/proposal.md',
  design: changeDir + '/design.md',
  tasks: changeDir + '/tasks.md',
  verification: changeDir + '/specs/delivery-verification/spec.md',
  lifecycle: changeDir + '/specs/delivery-lifecycle/spec.md',
  actions: changeDir + '/specs/action-runs/spec.md',
  execution: changeDir + '/specs/test-execution/spec.md'
} as const;
type Key = keyof typeof files;
const texts = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, fs.readFileSync(path.join(root,value),'utf8')])) as Record<Key,string>;
const sha = (value:string) => crypto.createHash('sha256').update(value).digest('hex');
const references = Object.fromEntries(Object.entries(files).map(([key,value]) => [key, { path:value, sha256: sha(texts[key as Key]) }]));
function line(key:Key, snippet:string):number {
  const index = texts[key].split(/\r?\n/).findIndex(value => value.includes(snippet));
  assert.ok(index >= 0, 'Missing contract in '+key+': '+snippet);
  return index+1;
}
const verdicts: Array<{id:string,passed:boolean,observed:string,locations:Array<{file:string,line:number}>}> = [];
const v = files.verification, lc = files.lifecycle, d = files.design, tasks = files.tasks;

// F1: Current formal write prohibition and an unambiguously read-only legacy command scenario.
const f1line = line('verification','旧 command、continue/retest 和 verification-create 只保留历史读取');
const f1when = line('verification','已存在的历史 `delivery-full-test` Run 按旧单次 command 模式完成');
const f1then = line('verification','不启动 command、不创建或改写 Run');
assert.ok(f1line < f1when && f1when < f1then);
const f1reject = line('tasks','验证拒绝不占 Run 号、不回退模式');
assert.ok(texts.verification.includes('旧 passed 不成为新版正式 Close 的验收输入'));
verdicts.push({id:'F1-legacy-command-read-only',passed:true,
  observed:'Old command scenario is a historical query, not an execution/write permission',
  locations:[{file:v,line:f1line},{file:v,line:f1when},{file:v,line:f1then},{file:tasks,line:f1reject}]});

// F2: Typed selector and strict type/round/current consistency across design, spec and tasks.
const f2design = line('design','唯一新 Close 选择：`testAttemptRunRef`');
const f2only = line('lifecycle','新版 Close MUST 使用输入 `testAttemptRunRef`');
const f2alias = line('lifecycle','新写入一律拒绝');
const f2snap = line('tasks','在 Close 自身保存 typed v2 acceptance');
const f2parser = line('tasks','typed 指针、轮次 closed 完整性与读回');
assert.ok(texts.design.includes('不采用旧 `fullTestRunRef` 参数别名'));
assert.ok(texts.lifecycle.includes('manifest.deliveryRunRef'));
assert.ok(texts.lifecycle.includes('attempt.version = 2'));
assert.ok(texts.lifecycle.includes('只有对已经完成的历史 Close / 旧正式结果的指定只读查询'));
assert.ok(texts.tasks.includes('旧字段同时留存时 v2 Close 仍安全'));
verdicts.push({id:'F2-selector-and-close-contract',passed:true,
  observed:'V2 Close only accepts typed testAttemptRunRef; legacy selectors read-only; task covers parser/rounds',
  locations:[{file:d,line:f2design},{file:lc,line:f2only},{file:lc,line:f2alias},{file:tasks,line:f2snap},{file:tasks,line:f2parser}]});

// Pure current-product parser: v2 attempt and historical command pointers coexist. Old fullTest pointer cannot point to typed attempt.
const scope = readScope(JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/delivery-scope.json'),'utf8')) as unknown);
const id = 'd01';
const date = '2026-10-20';
const attempt = '.mendi/runs/d01/016-delivery-test-attempt/run.md';
const legacy = '.mendi/runs/d01/015-delivery-full-test/run.md';
const close = '.mendi/runs/d01/017-delivery-close/run.md';
const round: DeliveryRound = {
  id:'r001',origin:{kind:'open',runRef:'.mendi/runs/d01/001-delivery-open/run.md'},
  openedOn:date,scope,state:'open',currentBatchId:null,
  deliveryRunRef:attempt,testAttemptRunRef:attempt,fullTestRunRef:legacy
};
const rootInfo = {id,openedOn:date,formatVersion:2,recordingMode:'product'};
const validOpen = projectRound(rootInfo,[round],'r001');
assert.equal(readRounds(validOpen,id).length,1);
const invalidMix = projectRound(rootInfo,[{...round,fullTestRunRef:attempt}],'r001');
let invalidMessage = '';
try{readRounds(invalidMix,id);}catch(e:unknown){invalidMessage=e instanceof Error?e.message:String(e);}
assert.match(invalidMessage,/轮次结果指针类型不符/);
const newClosed = projectRound(rootInfo,[{
  ...round, state:'closed', deliveryRunRef:close,closeRunRef:close,closedOn:date,
  fullTestRunRef:undefined
}],'r001');
let oldParserLimitation='';
try{readRounds(newClosed,id);}catch(e:unknown){oldParserLimitation=e instanceof Error?e.message:String(e);}
assert.match(oldParserLimitation,/closed 轮次缺少一致收口/);
assert.ok(texts.design.includes('Apply 必须扩展为允许本轮新 `testAttemptRunRef` 完整收口'));
verdicts.push({id:'F2-current-parser-compatibility-proof',passed:true,
  observed:'Existing parser accepts separately typed pointers, rejects assigning a typed attempt to fullTestRunRef, and currently rejects new typed-only closed round (expected Apply task)',
  locations:[{file:'src/core/rounds.ts',line:159},{file:d,line:line('design','Apply 必须扩展为允许本轮新 `testAttemptRunRef` 完整收口')}]});

// Preserve no extra scope, direct-pass decision, review flow.
assert.ok(texts.proposal.includes('不再增加日常 verification 汇总或例行 Owner 决策'));
assert.ok(texts.design.includes('新全量 Full Test'));
assert.ok(texts.execution.includes('全局取消 MUST 停止本轮'));
assert.ok(texts.actions.includes('next 提示 Owner 决定是否单独授权 Close'));
const tasksNumber = (texts.tasks.match(/^- \[ \] \d+\.\d+ /gm) ?? []).length;
assert.equal(tasksNumber,13);
verdicts.push({id:'unchanged-scope-and-test-matrix',passed:true,
  observed:'Four delta capability areas aligned with Owner direct-pass decision and 13 outstanding tasks',
  locations:[{file:files.proposal,line:5},{file:files.tasks,line:18}]});

// Fresh real OpenSpec strict validation: raw output is kept separately exactly once.
const cli = 'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
assert.ok(fs.existsSync(cli));
const args=[cli,'validate',changeId,'--strict','--json'];
const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024,windowsHide:true});
fs.writeFileSync(path.join(here,'openspec-validation.json'),
  JSON.stringify({args:[process.execPath,...args],exitCode:result.status,signal:result.signal,
  stdout:result.stdout,stderr:result.stderr},null,2)+'\n',{flag:'wx'});
assert.equal(result.status,0,'OpenSpec structural validation must succeed');
const json:unknown=JSON.parse(result.stdout);
assert.equal((json as {summary?:{totals?:{failed?:number}}}).summary?.totals?.failed,0);
const baseRun = '.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow';
const evidence={
  executedAt:new Date().toISOString(),
  subject:baseRun+'/008-revise-propose/run.md',
  previousVerdict:baseRun+'/007-review-propose/run.md',
  method:'read-only direct text cross-check plus current round parser positive/negative and fresh OpenSpec strict validation',
  sourceRefs:references,
  checks:verdicts,
  runtimeFacts:{openWithLegacyAndNewPointersAccepted:true,
    newTypedAttemptAsLegacyFullTestRejected:invalidMessage,
    newTypedClosedRoundNotYetImplemented:oldParserLimitation},
  strictValidation:{exitCode:result.status,raw:'openspec-validation.json'},
  boundaries:[
    'Propose review only. New typed Close is NOT implemented; existing parser rejection is expected prior to Apply',
    'Synthetic in-memory version-2 scope and typed Run identities, not an actual Delivery Close',
    'No application, test, project history, Git, installation, or DreMo mutation',
    'A formal product acceptance must be independently tested in Apply; structural validation alone cannot approve semantics'
  ]
};
fs.writeFileSync(path.join(here,'proof-results.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({reviewProof:'passed',checks:verdicts.map(v=>v.id),
  strictValidationExit:result.status,tasks:tasksNumber,
  resultFile:path.relative(root,path.join(here,'proof-results.json'))},null,2));
