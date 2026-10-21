// D05-A independent Reviewer focused regression, with original TAP evidence retained.
// Only runs existing tests on isolated product fixtures; no root Formal Full Test.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=process.cwd(), here=path.dirname(fileURLToPath(import.meta.url));
const files=[
 'tests/group-attempt.test.ts',
 'tests/group-boundaries.test.ts',
 'tests/group-consistency.test.ts',
 'tests/group-environment.test.ts',
 'tests/group-history.test.ts',
 'tests/group-verification.test.ts',
 'tests/lifecycle-close.test.ts',
 'tests/group-cli.test.ts'
];
for(const f of files)assert.ok(fs.existsSync(path.join(root,f)),f);
const args=['--test','--test-concurrency=2',...files];
const child=spawnSync(process.execPath,args,{
  cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,timeout:780000,windowsHide:true,
  env:{...process.env, MENDI_TEST_EVIDENCE_DIR:''}
});
const rawOut=child.stdout??'',rawErr=child.stderr??'';
fs.writeFileSync(path.join(here,'focused-tests.tap.log'),rawOut,{flag:'wx'});
if(rawErr)fs.writeFileSync(path.join(here,'focused-tests.stderr.log'),rawErr,{flag:'wx'});
const number=(field:string)=>{const m=new RegExp('^# '+field+' (\\d+)\\s*$','m').exec(rawOut);return m?Number(m[1]):null;};
const report={
 capturedAt:new Date().toISOString(),
 purpose:'D05-A Reviewer independently re-runs current impacted group/lifecycle tests on isolated fixtures',
 command:[process.execPath,...args],
 exitCode:child.status,
 signal:child.signal,
 error:child.error?String(child.error):null,
 files,
 summary:{tests:number('tests'),pass:number('pass'),fail:number('fail'),skipped:number('skipped'),cancelled:number('cancelled')},
 artifacts:{stdout:'focused-tests.tap.log',stderr:rawErr?'focused-tests.stderr.log':null},
 limits:['Not root delivery formal full test','Selected tests only; other Author tests retain their own provenance','No source edits, no real DreMo writes']
};
fs.writeFileSync(path.join(here,'focused-tests-result.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:child.status===0&&number('fail')===0?'passed':'failed',
  exitCode:child.status,summary:report.summary,log:path.relative(root,path.join(here,'focused-tests.tap.log'))},null,2));
if(child.status!==0||number('fail')!==0||!number('tests'))process.exitCode=1;
