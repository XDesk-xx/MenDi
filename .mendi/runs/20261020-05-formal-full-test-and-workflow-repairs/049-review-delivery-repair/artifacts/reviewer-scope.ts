// Reviewer D05 049: independent direct repair scope and failed Run evidence proof.
// Scope: exact one-line Storybook nested browser API port change; no Author/old Run editing.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=process.cwd();
const id='20261020-05-formal-full-test-and-workflow-repairs';
const parent='.mendi/runs/'+id;
const beforeFile=parent+'/048-delivery-repair/artifacts/vitest-config-before.ts';
const configFile='tests/fixtures/storybook-project/vitest.config.ts';
const line="            api: { host: '127.0.0.1', port: 64115, strictPort: true },";
const current=fs.readFileSync(configFile,'utf8');
const before=fs.readFileSync(beforeFile,'utf8');
assert.ok(current.includes(line+'\n'));
assert.equal(current.split(line).length,2);
assert.equal(current.replace(line+'\n',''),before);
const git=(args:string[])=>{
 const child=spawnSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true,timeout:20000,maxBuffer:3*1024*1024});
 assert.equal(child.status,0,'git '+args.join(' '));
 return child.stdout;
};
const baseline=git(['show','HEAD:'+configFile]);
assert.equal(baseline,before,'Before fix bytes differ from currently checked-out Git HEAD fixture');
const branch=git(['rev-parse','HEAD']).trim();
assert.equal(branch,'7445a9f765e91c5574dd649667bee5349dd6a413');
const files=git(['diff','--name-only']).split(/\r?\n/).filter(Boolean).sort();
assert.deepEqual(files,['.mendi/delivery-groups/'+id+'/manifest.json',configFile].sort());
const diff=git(['diff','--',configFile]);
assert.ok(diff.includes('+'+line));
assert.equal((diff.match(/^\+            api:/gm)??[]).length,1);
assert.deepEqual(diff.split(/\r?\n/).filter(line=>line.startsWith('-')&&!line.startsWith('---')),[]);// no deleted source lines
const failedRef=parent+'/047-delivery-full-test/run.md';
const failed=fs.readFileSync(failedRef,'utf8');
assert.match(failed,/outcome: failed/);
assert.match(failed,/F03 UI/);
assert.match(failed,/4\/5/);
const childErrorFile=parent+'/047-delivery-full-test/artifacts/ui-port-failure-original.log';
const child=fs.readFileSync(childErrorFile,'utf8');
assert.match(child,/EACCES: permission denied ::1:63315/);
assert.match(child,/Vitest caught 1 unhandled error/);
const prior=fs.readFileSync(parent+'/046-delivery-full-test/run.md','utf8');
assert.match(prior,/outcome: failed/);
const author=fs.readFileSync(parent+'/048-delivery-repair/run.md','utf8');
assert.match(author,/actionType: delivery-repair/);
assert.match(author,/previousRunRef: .*047-delivery-full-test\/run.md/);
assert.ok(author.includes(configFile));
const manifest=JSON.parse(fs.readFileSync('.mendi/delivery-groups/'+id+'/manifest.json','utf8'));
assert.equal(manifest.state,'open');
assert.equal(manifest.activeChangeId,null);
assert.equal(manifest.changeBindings.length,4);
assert.deepEqual(manifest.changeBindings.map((c:{state:string})=>c.state),['archived','archived','archived','archived']);
assert.equal(manifest.latestRunRef,parent+'/048-delivery-repair/run.md');
assert.equal(manifest.next.action,'review-delivery-repair');
assert.equal(manifest.next.role,'reviewer');
assert.equal(fs.existsSync('.mendi/write.lock'),false);
const checksum=(s:Buffer)=>crypto.createHash('sha256').update(s).digest('hex');
const result={
 reviewedAt:new Date().toISOString(),
 fixedAuthor:parent+'/048-delivery-repair/run.md',
 fixedFailed:failedRef,
 preexistingFailed:parent+'/046-delivery-full-test/run.md',
 projectBranchHead:branch,
 affectedTrackedFiles:files,
 repairDiffVerifiedAsOneAdd:true,
 configBaselineGitAndAuthorBeforeIdentical:true,
 sourceConfigSha256:checksum(fs.readFileSync(configFile)),
 originalError:'EACCES ::1:63315, Vitest unhandled listen prior to Storybook suite',
 candidatePort:{host:'127.0.0.1',port:64115,strictPort:true},
 fullCoveragePreserved:{F01:'pnpm check',F02:'pnpm test 336',F03:'UI 5',F04:'installation 4',F05:'strict specs + status/next 10'},
 actualProofScope:'Direct source+historical failure scope only. Separate new Reviewer F03 UI execution required.',
 limitations:['Does not constitute new F01-F05 formal Full Test','No prior 046/047 Run or error modified','No OS excluded port table or external service edited']
};
fs.writeFileSync(path.join(here,'scope-proof.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verified:true,oneLine:true,failedOriginalEACCES:true,branch,unchangedOtherTrackedSource:true,manifestNext:manifest.next.action},null,2));