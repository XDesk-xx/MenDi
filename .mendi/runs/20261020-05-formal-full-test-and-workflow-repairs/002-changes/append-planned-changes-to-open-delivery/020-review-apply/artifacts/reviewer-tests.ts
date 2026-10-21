// D05-B independent Reviewer product regression runner; only isolated test fixtures.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=process.cwd();
const here=path.dirname(fileURLToPath(import.meta.url));
const files=[
 'tests/change-add.test.ts',
 'tests/change-add-recovery.test.ts',
 'tests/change-add-lifecycle.test.ts',
 'tests/rounds.test.ts',
 'tests/group-history.test.ts',
 'tests/delivery-query.test.ts',
 'tests/migration-rounds.test.ts',
 'tests/baseline-integration.test.ts',
 'tests/lifecycle-close.test.ts',
 'tests/lifecycle-reopen.test.ts'
];
const absent=files.filter(f=>!fs.existsSync(path.join(root,f)));
if(absent.length)throw new Error('Missing tests: '+absent.join(','));
const args=['--test','--test-concurrency=2',...files];
const started=new Date().toISOString();
const child=spawnSync(process.execPath,args,{
 cwd:root,encoding:'utf8',maxBuffer:50*1024*1024,timeout:900000,windowsHide:true,
 env:{...process.env,MENDI_APPLY_EVIDENCE:'',MENDI_TEST_EVIDENCE_DIR:''}
});
const raw=child.stdout??'',err=child.stderr??'';
fs.writeFileSync(path.join(here,'independent-tests.tap.log'),raw,{flag:'wx'});
if(err)fs.writeFileSync(path.join(here,'independent-tests.stderr.log'),err,{flag:'wx'});
const count=(key:string):number|null=>{
 const m=new RegExp('^# '+key+' (\\d+)\\s*$','m').exec(raw);
 return m?Number(m[1]):null;
};
const result={
 recordedAt:new Date().toISOString(),startedAt:started,
 scope:'independent Reviewer: D05-B new feature, scope lineage, historical command/attempt, Close/Reopen, baseline/migration regression',
 command:[process.execPath,...args],files,exitCode:child.status,signal:child.signal,
 error:child.error?String(child.error):null,
 counts:{tests:count('tests'),passed:count('pass'),failed:count('fail'),skipped:count('skipped'),cancelled:count('cancelled')},
 artifacts:{stdout:'independent-tests.tap.log',stderr:err?'independent-tests.stderr.log':null},
 limits:[
  'Only isolated product fixtures; NOT root MenDi formal Delivery Full Test/Close',
  'No Source/Author/previous Run edits; no stable install or Git action',
  'Do not reinterpret a test pass as Reviewer verdict without source inspection'
 ]
};
fs.writeFileSync(path.join(here,'independent-tests-result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exit:result.exitCode,counts:result.counts,files:files.length,receipt:path.relative(root,path.join(here,'independent-tests-result.json'))},null,2));
if(result.exitCode!==0||result.counts.failed!==0||!result.counts.tests)process.exitCode=1;
