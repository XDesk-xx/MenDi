import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { groupTarget, groupRun, attemptResult, writeGroupInput } from '../../../../../../../tests/group-support.ts';
import { createVerification } from '../../../../../../../src/application/candidate-verification.ts';
import { deliveryLifecycle } from '../../../../../../../src/application/delivery-lifecycle.ts';
import { scanRunNumbers } from '../../../../../../../src/adapters/runs.ts';
const out = path.dirname(fileURLToPath(import.meta.url));
process.env.MENDI_TEST_EVIDENCE_DIR = out;
const observations: unknown[] = [];
function verify(root: string, ref: string, candidate: unknown, sources: unknown[]) {
 fs.writeFileSync(path.join(root,'independent-verify.json'),JSON.stringify({fromRunRef:ref,planRef:'group-plan.json',candidate,sources}));
 return createVerification({project:root,inputFile:'independent-verify.json',role:'author',actor:'delivery-author'});
}
const sources = (ref:string) => ['prefix','middle','tail'].map(id=>({id,runRef:ref,applicability:'独立审核隔离目标的直接来源'}));
function close(root:string,ref:string) {
 fs.writeFileSync(path.join(root,'independent-close.json'),JSON.stringify({verificationRunRef:ref,applicability:{conclusion:'applicable',materials:'受控目标',changes:'',reason:'对抗性尝试使用旧结论'}}));
 return deliveryLifecycle('delivery-close',{project:root,inputFile:'independent-close.json',role:'author',actor:'delivery-author'});
}
// 整条组合独立编排；仅复用建靶及真实进程启动助手，不复用 Author 断言。
{
 const {root,declaration}=groupTarget();
 const first=attemptResult(await groupRun(root));
 const old=verify(root,first.run.ref,declaration.candidate,sources(first.run.ref));
 assert.equal(old.ok,true);
 // 显式尝试复用同 candidate 声明，虽实际源码已变，仍必须阻断旧成功覆盖新失败。
 fs.writeFileSync(path.join(root,'middle.test.ts'),"import test from 'node:test';import fs from 'node:fs';test('transient business failure',()=>{if(fs.existsSync('fail-switch'))throw Error('later failure');});");
 fs.writeFileSync(path.join(root,'fail-switch'),'1');
 fs.writeFileSync(path.join(root,'group-control.json'),JSON.stringify({stopAfter:'middle'}));
 writeGroupInput(root,{...declaration,fromRunRef:old.run.ref});
 const later=attemptResult(await groupRun(root));
 assert.deepEqual(later.run.attempt!.progress.map(p=>p.state),['passed','failed','not-run']);
 const failedBytes=fs.readFileSync(path.join(root,later.run.ref));
 fs.writeFileSync(path.join(root,'group-control.json'),'{}');
 writeGroupInput(root,{...declaration,purpose:'continue',selection:['tail'],fromRunRef:later.run.ref});
 const tail=attemptResult(await groupRun(root));
 assert.equal(tail.ok,true);
 assert.equal(tail.next.action,'delivery-repair');
 const mixed=sources(first.run.ref).map(s=>({...s,runRef:s.id==='middle'?first.run.ref:s.id==='tail'?tail.run.ref:later.run.ref}));
 const attempted=verify(root,tail.run.ref,declaration.candidate,mixed);
 assert.equal(attempted.ok,false);
 assert.equal(attempted.candidateVerification.conclusion,'incomplete');
 assert.ok(attempted.candidateVerification.gaps.some(s=>s.includes('middle')));
 assert.throws(()=>close(root,old.run.ref));
 assert.throws(()=>close(root,attempted.run.ref));
 assert.ok(fs.readFileSync(path.join(root,later.run.ref)).equals(failedBytes));
 observations.push({scene:'old-pass-new-failure-successful-tail',root,old:old.run.ref,later:later.run.ref,tail:tail.run.ref,attempted,passed:true});
}
{
 const {root,declaration}=groupTarget();
 const first=attemptResult(await groupRun(root));
 const old=verify(root,first.run.ref,declaration.candidate,sources(first.run.ref));
 writeGroupInput(root,{...declaration,fromRunRef:old.run.ref});
 const broken=await groupRun(root,{observeWrite(phase){if(phase==='before-lock-release')throw Error('reviewer-after-submitted-before-release');}});
 assert.equal(broken.ok,false);
 assert.ok('outcome' in broken && broken.outcome==='unknown');
 assert.ok(broken.run?.attempt);
 assert.equal(broken.run.status,'submitted');
 assert.equal(broken.run.attempt.observation!.protocolState,'valid');
 assert.ok(broken.run.attempt.progress.every(p=>p.state==='passed'));
 const n=scanRunNumbers(root,'d01').number;
 assert.throws(()=>verify(root,broken.run!.ref,declaration.candidate,sources(broken.run!.ref)),/锁/);
 assert.throws(()=>close(root,old.run.ref),/锁/);
 assert.equal(scanRunNumbers(root,'d01').number,n);
 assert.ok(fs.existsSync(path.join(root,'.mendi/write.lock')));
 observations.push({scene:'unknown-outer-inner-all-pass-and-old-verified',root,old:old.run.ref,broken,passed:true});
}
fs.writeFileSync(path.join(out,'independent-results.json'),JSON.stringify(observations,null,2));
console.log('Independent combined scenarios PASS: 2');
