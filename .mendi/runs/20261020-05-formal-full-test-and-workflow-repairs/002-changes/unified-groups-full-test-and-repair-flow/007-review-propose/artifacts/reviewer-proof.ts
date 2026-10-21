// MVP-D05-A / Reviewer 007 - independent semantic-contract audit.
// Read-only proof of existing parser/pointer constraints and submitted spec conflicts.
// No product mutations, temporary directories, or legacy command execution.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readRounds, projectRound, type DeliveryRound} from '../../../../../../../src/core/rounds.ts';
import {readScope} from '../../../../../../../src/core/scope.ts';

const repo=process.cwd();
const here=path.dirname(fileURLToPath(import.meta.url));
const change='unified-groups-full-test-and-repair-flow';
const changeDir=path.join(repo,'openspec/changes',change);
const known={
  verification:'openspec/changes/unified-groups-full-test-and-repair-flow/specs/delivery-verification/spec.md',
  lifecycle:'openspec/changes/unified-groups-full-test-and-repair-flow/specs/delivery-lifecycle/spec.md',
  design:'openspec/changes/unified-groups-full-test-and-repair-flow/design.md',
  tasks:'openspec/changes/unified-groups-full-test-and-repair-flow/tasks.md',
  rounds:'src/core/rounds.ts',
  deliveryRuns:'src/adapters/delivery-runs.ts',
  closeParser:'src/core/delivery-lifecycle.ts',
};
const contents=Object.fromEntries(Object.entries(known).map(([k,v])=>[k,fs.readFileSync(path.join(repo,v),'utf8')]));
const sha256=(value:string)=>crypto.createHash('sha256').update(value).digest('hex');
const sourceSnapshot=Object.fromEntries(Object.entries(known).map(([k,v])=>[k,{path:v,sha256:sha256(contents[k])}]));
const lineOf=(key:keyof typeof known, needle:string)=>{
  const rows=contents[key].split(/\r?\n/);
  const index=rows.findIndex(v=>v.includes(needle));
  assert.ok(index>=0, 'Must find '+needle+' in '+key);
  return index+1;
};
const legacyExecution={
  admissionRejectLine:lineOf('verification','旧 command、continue/retest 和 verification-create 只保留历史读取'),
  modifiedRequirementLine:lineOf('verification','#### Scenario: Full command actually passes or fails'),
  actuationLine:lineOf('verification','保存本次执行身份与结果'),
};
assert.ok(legacyExecution.admissionRejectLine<legacyExecution.actuationLine);
const closeLegacy={
  onlyV2Line:lineOf('lifecycle','新 Close 必须固定本轮'),
  staleInputLine:lineOf('lifecycle','指定旧正式 Run'),
  legacyInputLine:lineOf('lifecycle','合法旧单次输入仍按原合同处理'),
};
const design={
  typedPointerLine:lineOf('design','manifest.testAttemptRunRef'),
  legacyPointerLine:lineOf('design','`verificationRunRef` 及 `fullTestRunRef` 用于旧历史定位'),
  selectorLine:lineOf('design','CLI 的 `fullTestRunRef`'),
};
const codeFacts={
  roundPointerTypeLine:lineOf('rounds', "key === 'fullTestRunRef' && loc.type !== 'delivery-full-test'"),
  attemptPointerTypeLine:lineOf('rounds', "key === 'testAttemptRunRef' && loc.type !== 'delivery-test-attempt'"),
  existingWriterLine:lineOf('deliveryRuns','...(seed.attempt ? { testAttemptRunRef: ref } : {})'),
  existingCloseParserLine:lineOf('closeParser',"if (prior.type !== 'delivery-full-test' || prior.number >= number)"),
};
const scope=readScope(JSON.parse(fs.readFileSync(path.join(repo,'tests/fixtures/delivery-scope.json'),'utf8')) as unknown);
const id='d01', date='2026-10-20';
const commandRef='.mendi/runs/d01/015-delivery-full-test/run.md';
const attemptRef='.mendi/runs/d01/016-delivery-test-attempt/run.md';
const core:DeliveryRound={
  id:'r001',origin:{kind:'open',runRef:'.mendi/runs/d01/001-delivery-open/run.md'},
  openedOn:date,scope,state:'open',currentBatchId:null,
  deliveryRunRef:attemptRef,testAttemptRunRef:attemptRef
};
const initial={id,openedOn:date,formatVersion:2,recordingMode:'product'};
const permitted=projectRound(initial,[core],'r001');
assert.equal(readRounds(permitted,id).length,1);
const existingOldPointer=projectRound(initial,[{...core,fullTestRunRef:commandRef}],'r001');
assert.equal(readRounds(existingOldPointer,id).length,1);
let typeError:string|null=null;
const v2IntoOldSlot=projectRound(initial,[{...core,fullTestRunRef:attemptRef}],'r001');
try{readRounds(v2IntoOldSlot,id);}catch(error:unknown){typeError=error instanceof Error?error.message:String(error);}
assert.ok(typeError?.includes('轮次结果指针类型不符'));
const sdk='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
assert.ok(fs.existsSync(sdk),'OpenSpec fixed SDK must exist');
const validate=spawnSync(process.execPath,[sdk,'validate',change,'--strict','--json'],{
  cwd:repo,encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024,windowsHide:true
});
const validateRaw={command:[process.execPath,sdk,'validate',change,'--strict','--json'],
  exitCode:validate.status,signal:validate.signal,stdout:validate.stdout,stderr:validate.stderr};
fs.writeFileSync(path.join(here,'openspec-validation.json'),JSON.stringify(validateRaw,null,2)+'\n',{flag:'wx'});
assert.equal(validate.status,0,'Structural validation should succeed or audit should stop');
const all13=(contents.tasks.match(/^- \[ \] \d+\.\d+ /gm)??[]).length;
assert.equal(all13,13,'Existing tasks count should match submission');
const evidence={
  at:new Date().toISOString(),
  role:'independent Reviewer',
  fixedAuthorRun:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/006-propose/run.md',
  git:{
    branch:spawnSync('git',['branch','--show-current'],{cwd:repo,encoding:'utf8'}).stdout.trim(),
    head:spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).stdout.trim()
  },
  snapshots:sourceSnapshot,
  findings:[
    {id:'F1',severity:'blocking',
      problem:'New command formal writes prohibited while modified test-admission scenario still requires actual legacy command execution result persistence',
      links:{spec:known.verification,lines:legacyExecution},
      evidenceKind:'submitted spec semantic contradiction; not new runtime behavior'},
    {id:'F2',severity:'blocking',
      problem:'New Close only v2 while modified Close scenario says valid legacy command input follows old contract; Close selector, parser and pointer need explicit rule',
      links:{spec:known.lifecycle,lines:closeLegacy,design:known.design,designLines:design},
      productCodeConstraints:{files:[known.rounds,known.deliveryRuns,known.closeParser],lines:codeFacts,
        oldCommandRef:commandRef,typedV2Ref:attemptRef,
        separatePointersAccepted:true,typedV2InFullTestRunRefRejected:true,
        rejectionMessage:typeError},
      evidenceKind:'submitted spec contradiction plus direct execution of current pure round parser'}
  ],
  positive:{
    strictStructure:{exitCode:validate.status,raw:'openspec-validation.json'},
    tasks:all13,
    ownerDecision:'new groups-v1 single-run passed; Close separately authorized; legacy only read',
    fourDeltasPresent:true,
    oldReadPreservationPresent:true,
    missingF1F2AreProposeSemanticContractIssues:true
  },
  limits:[
    'No D05-A product implementation existed during this review; this is a spec-level and current-parser proof only',
    'Read-only pure parsing of fabricated v2 manifest, not a new actual Close operation',
    'OpenSpec strict validate confirms structure only, not policy consistency',
    'Do not modify submitted proposal/specs or historical verdict here'
  ]
};
fs.writeFileSync(path.join(here,'proof-results.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'review-proof-saved',findings:evidence.findings.map(x=>x.id),
  oldSlotMisuseRejected:typeError,validationExit:validate.status,tasks:all13,
  result:path.relative(repo,path.join(here,'proof-results.json'))},null,2));
