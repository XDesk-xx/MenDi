// D05 Reviewer 049: independent FULL scoped F03 Storybook UI test in an isolated, new target.
// Maintains target ownership and one raw command-output copy per stage.
// Does NOT run F01-F05 formal acceptance, change product code, or alter prior Full Test records.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repository=fs.realpathSync(process.cwd());
const here=path.dirname(fileURLToPath(import.meta.url));
const fixture='tests/fixtures/storybook-project/vitest.config.ts';
const literal="            api: { host: '127.0.0.1', port: 64115, strictPort: true },";
const tracked=fs.readFileSync(fixture,'utf8');
const old='            instances: [{ browser: \'chromium\' }],';
assert.ok(tracked.includes(literal));
assert.equal(tracked.split(literal).length,2);
const original=fs.readFileSync('.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/048-delivery-repair/artifacts/vitest-config-before.ts','utf8');
assert.equal(tracked.replace(literal+'\n',''),original);
assert.ok(original.includes(old));
const diff=spawnSync('git',['diff','--',fixture],{cwd:repository,encoding:'utf8',windowsHide:true,timeout:20000});
assert.equal(diff.status,0);
assert.equal((diff.stdout.match(/^\+            api:/gm)??[]).length,1);
const sandbox=path.resolve(repository,'.tmp','d05-049-independent-review-ui');
const tmp=fs.realpathSync(path.resolve(repository,'.tmp'));
assert.equal(path.dirname(sandbox),tmp);
assert.equal(fs.existsSync(sandbox),false,'Target must be NEW and not override a previous target');
const evidenceDir=path.join(here,'ui-evidence');
assert.equal(fs.existsSync(evidenceDir),false);
fs.mkdirSync(evidenceDir,{recursive:true});
const corepack='C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js';
assert.ok(fs.existsSync(corepack));
const env={
 ...process.env,
 MENDI_UI_PNPM_BIN:corepack,
 MENDI_UI_EVIDENCE_DIR:evidenceDir,
 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:'1',
 STORYBOOK_DISABLE_TELEMETRY:'1',
};
const results:Array<{stage:string,command:string[],cwd:string,startedAt:string,endedAt:string,exitCode:number|null,signal:string|null,error:string|null,stdoutRef:string,stderrRef:string|null,counts?:Record<string,number|null>}>=[];
const run=(stage:string,cwd:string,args:string[],environment:NodeJS.ProcessEnv,timeout:number)=>{
 const start=new Date().toISOString();
 const child=spawnSync(process.execPath,args,{cwd,env:environment,encoding:'utf8',windowsHide:true,
  timeout,maxBuffer:32*1024*1024});
 const stdout=child.stdout??'',stderr=child.stderr??'';
 const out=stage+'.stdout.log',err=stderr?stage+'.stderr.log':null;
 fs.writeFileSync(path.join(here,out),stdout,{flag:'wx'});
 if(err)fs.writeFileSync(path.join(here,err),stderr,{flag:'wx'});
 const count=(name:string)=>{const hit=new RegExp('^# '+name+' (\\d+)\\s*$','m').exec(stdout);return hit?Number(hit[1]):null;};
 const receipt={
  stage,command:[process.execPath,...args],cwd,startedAt:start,endedAt:new Date().toISOString(),
  exitCode:child.status,signal:child.signal,error:child.error?String(child.error):null,
  stdoutRef:out,stderrRef:err,
  ...(stage==='test-ui'?{counts:{tests:count('tests'),pass:count('pass'),fail:count('fail'),
    skipped:count('skipped'),todo:count('todo'),cancelled:count('cancelled')}}:{})
 };
 results.push(receipt);
 return receipt;
};
const preparer=run('prepare-ui',repository,[corepack,'prepare:ui-tests',sandbox],env,330000);
let ownMarker='',ownBytes:Buffer|undefined;
if(preparer.exitCode===0){
 assert.ok(fs.existsSync(sandbox));
 const actual=fs.realpathSync(sandbox);
 assert.equal(actual,sandbox);
 ownMarker=path.join(sandbox,'.mendi-reviewer049-owner.json');
 ownBytes=Buffer.from(JSON.stringify({scope:'D05 049 Reviewer F03 full UI',root:sandbox,nonce:crypto.randomUUID()})+'\n');
 fs.writeFileSync(ownMarker,ownBytes,{flag:'wx'});
 const repaired=fs.readFileSync(path.join(sandbox,'finite-results','vitest.config.ts'),'utf8');
 assert.equal(repaired,tracked);
 const result=run('test-ui',repository,[corepack,'test:ui'],
  {...env,MENDI_UI_TARGETS_DIR:sandbox},650000);
 if(result.exitCode===0){
  assert.deepEqual(result.counts,{tests:5,pass:5,fail:0,skipped:0,todo:0,cancelled:0});
  const browser=path.join(evidenceDir,'preview','browser','browser.json');
  const image=path.join(evidenceDir,'preview','browser','counter.png');
  const stop=path.join(evidenceDir,'preview','preview-stop.json');
  assert.ok(fs.existsSync(browser)&&fs.existsSync(image)&&fs.existsSync(stop));
  const observation=JSON.parse(fs.readFileSync(browser,'utf8'));
  assert.equal(observation.disabled,true);
  assert.deepEqual(observation.pageErrors,[]);
  const shut=JSON.parse(fs.readFileSync(stop,'utf8'));
  assert.equal(shut.confirmed,true);
  assert.equal(shut.listenerUnavailable,true);
  assert.equal(shut.childAndPipesClosed,true);
 }
}
const success=preparer.exitCode===0&&results.length===2&&results[1].exitCode===0;
const output={
 recordedAt:new Date().toISOString(),review:'049-review-delivery-repair',
 fixedAuthor:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/048-delivery-repair/run.md',
 fixedFailed:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/047-delivery-full-test/run.md',
 candidateBase:'7445a9f765e91c5574dd649667bee5349dd6a413',
 repairFile:fixture,diffLines:1,scope:'independent F03 full 5 UI tests, NOT entire F01-F05 Full Test',
 temporaryTarget:sandbox,
 evidenceDir,
 results,
 allFivePassed:success,
 limit:['This validates one local Win32 environment and the changed Storybook fixture','Port ownership is only the actual run; no external project/port excluded ranges modified','No prior failed Full Test outcome rewritten','No F01/F02/F04/F05 full formal pass inferred']
};
fs.writeFileSync(path.join(here,'independent-ui-results.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({success,stages:results.map(x=>({id:x.stage,exit:x.exitCode,counts:x.counts??null})),
  originalConfigOnlySingleNewLine:true,browserArtifactsReady:success},null,2));
if(!success)process.exitCode=1;
// Keep the exact owned prepared target for failure/unknown evidence if any.
// After successful preview shutdown and checks, cleanup only this nonce-marked sandbox.
if(success&&ownMarker&&ownBytes&&fs.existsSync(ownMarker)&&fs.readFileSync(ownMarker).equals(ownBytes)&&
 fs.realpathSync(sandbox)===sandbox&&path.dirname(sandbox)===tmp){
 const possibleLock=path.join(sandbox,'.mendi','write.lock');
 if(!fs.existsSync(possibleLock)) fs.rmSync(sandbox,{recursive:true,force:false});
}
