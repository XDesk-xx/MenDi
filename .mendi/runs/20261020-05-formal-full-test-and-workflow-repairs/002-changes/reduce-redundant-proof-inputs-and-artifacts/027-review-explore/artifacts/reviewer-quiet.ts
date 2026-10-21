// D05-C 027 independently reproduce empty real stdout file -> unknown on disappearance.
// Only an isolated testTarget fixture is ever modified; no MenDi root product writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {testTarget,writePackage,execute} from '../../../../../../../tests/test-support.ts';
import {testStatus} from '../../../../../../../src/application/tests.ts';
const repo=fs.realpathSync(process.cwd()),here=path.dirname(fileURLToPath(import.meta.url));
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
let parent='',root='',marker='',markerBytes:Buffer|undefined,missingFile='',hiddenFile='',complete=false;
try {
 root=fs.realpathSync(testTarget());
 parent=fs.realpathSync(path.dirname(root));
 assert.equal(path.dirname(parent),tmp);
 assert.equal(path.basename(root),'minimal-project');
 assert.match(path.basename(parent),/^mendi-apply-/);
 marker=path.join(parent,'.mendi-d05c-reviewer-027-owned.json');
 markerBytes=Buffer.from(JSON.stringify({id:'D05-C reviewer 027',nonce:crypto.randomUUID(),root})+'\n');
 fs.writeFileSync(marker,markerBytes,{flag:'wx'});
 writePackage(root,pkg=>{
  const scripts=pkg.scripts as Record<string,string>;
  scripts['test:focused']='node -e ""';
 });
 const result=await execute(root,'focused');
 assert.equal(result.outcome,'passed');
 assert.ok('record'in result&&result.record);
 const before=testStatus({project:root,execution:result.executionId!});
 assert.equal(before.outcome,'passed');
 const refs=[result.record.stdoutRef,result.record.stderrRef];
 const sizes=refs.map(ref=>fs.statSync(path.join(root,ref)).size);
 assert.ok(sizes.includes(0));
 missingFile=path.join(root,refs[sizes.indexOf(0)]);
 hiddenFile=missingFile+'.d05c-027-hidden';
 assert.equal(fs.existsSync(hiddenFile),false);
 fs.renameSync(missingFile,hiddenFile);
 const vanished=testStatus({project:root,execution:result.executionId!});
 assert.equal(vanished.outcome,'unknown');
 assert.equal(vanished.ok,false);
 assert.ok('error' in vanished);
 assert.equal(vanished.error?.code,'ENOENT');
 fs.renameSync(hiddenFile,missingFile);hiddenFile='';
 assert.equal(testStatus({project:root,execution:result.executionId!}).outcome,'passed');
 const fail=await execute(root,'fast');
 assert.equal(fail.outcome,'failed');
 assert.ok('record' in fail && fail.record);
 const failRefs=[fail.record.stdoutRef,fail.record.stderrRef];
 const failSizes=failRefs.map(ref=>fs.statSync(path.join(root,ref)).size);
 assert.equal(testStatus({project:root,execution:fail.executionId!}).outcome,'failed');
 const proof={
  recordedAt:new Date().toISOString(),
  kind:'independent isolated product-v2 foreground test executions',
  quiet:{status:'passed',executionId:result.executionId,refs,sizes,afterZeroLogRemoval:{outcome:vanished.outcome,code:vanished.error?.code},restoredStatus:'passed'},
  failure:{status:fail.outcome,executionId:fail.executionId,refs:failRefs,sizes:failSizes},
  limitation:[
   'This deliberately RENAMES a zero-byte file only inside this new fixture; it is not a proposed product behavior',
   'Test status is not a root Delivery formal full test or groups-v1 complete acceptance',
   'Do not treat a missing or zero-byte file as evidence that execution output was safely omittable',
   'Output volume and file count are observations only, not hard acceptance gates'
  ]
 };
 fs.writeFileSync(path.join(here,'quiet-log-proof.json'),JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
 complete=true;
 console.log(JSON.stringify({passed:true,quietLogBytes:sizes,missingLogStatus:vanished.outcome,
  missingError:vanished.error?.code,restored:'passed',actualFailLogBytes:failSizes,artifact:'quiet-log-proof.json'},null,2));
} finally {
 if(hiddenFile&&missingFile&&fs.existsSync(hiddenFile)&&!fs.existsSync(missingFile))fs.renameSync(hiddenFile,missingFile);
 if(complete&&parent&&marker&&markerBytes&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)
  &&fs.realpathSync(parent)===parent&&path.dirname(parent)===tmp
  &&!fs.existsSync(path.join(root,'.mendi/write.lock')))fs.rmSync(parent,{recursive:true,force:false});
}