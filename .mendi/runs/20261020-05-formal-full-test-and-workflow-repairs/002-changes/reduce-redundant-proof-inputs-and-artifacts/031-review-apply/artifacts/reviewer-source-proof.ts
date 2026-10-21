// D05-C 031 independent product-test evidence source proof.
// Only modifies this Reviewer's current evidence area and a newly minted isolated .tmp fixture.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {EvidenceSession,EvidenceIncomplete} from '../../../../../../../tests/evidence-support.ts';
import {sandbox,repository} from '../../../../../../../tests/helpers.ts';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=fs.realpathSync(process.cwd());
const tmp=fs.realpathSync(path.join(repo,'.tmp'));
const isolated=fs.realpathSync(sandbox());
assert.equal(path.dirname(isolated),tmp);assert.match(path.basename(isolated),/^mendi-apply-/);
const marker=path.join(isolated,'.mendi-reviewer-031-owned.json');
const markerBytes=Buffer.from(JSON.stringify({review:'D05-C/031',nonce:crypto.randomUUID(),isolated})+'\n');
fs.writeFileSync(marker,markerBytes,{flag:'wx'});
const root=path.join(isolated,'source'),evidence=path.join(here,'one-source-originals');
fs.mkdirSync(root);
const source=path.join(root,'actual.log');
fs.copyFileSync(path.join(repository,'tests/fixtures/evidence-original.txt'),source);
let succeeded=false;
try {
 const session=new EvidenceSession(evidence);
 const original={root,ref:'actual.log',lifetime:'temporary' as const};
 const first=session.file(original);
 const twice=session.file(original);
 assert.deepEqual(twice,first);
 const secondInstance=new EvidenceSession(evidence);
 assert.deepEqual(secondInstance.file(original),first);
 const sourceBytes=fs.readFileSync(source);
 assert.ok(fs.readFileSync(path.join(first.root,first.ref)).equals(sourceBytes));
 session.record('reviewer-scenes.jsonl',{id:'same-original-first',source:first});
 session.record('reviewer-scenes.jsonl',{id:'same-original-reused',source:twice});
 const other=path.join(root,'same-text-different-invocation.log');
 fs.copyFileSync(source,other);
 const distinct=session.file({root,ref:path.basename(other),lifetime:'temporary'});
 assert.notEqual(first.ref,distinct.ref);
 assert.ok(fs.readFileSync(path.join(distinct.root,distinct.ref)).equals(sourceBytes));
 const fixture=session.file({root:repository,ref:'tests/fixtures/evidence-original.txt',lifetime:'reconstructible',
   reproduce:{entry:'tests/evidence-support.test.ts',args:['node','--test']}});
 assert.equal(fixture.state,'referenced');
 assert.equal(fixture.ref,'tests/fixtures/evidence-original.txt');
 assert.throws(()=>session.file({root,ref:'../outside',lifetime:'temporary'}),EvidenceIncomplete);
 assert.throws(()=>session.file({root,ref:'missing',lifetime:'temporary'}),EvidenceIncomplete);
 assert.throws(()=>session.file({root,ref:'actual.log',lifetime:'durable'}),EvidenceIncomplete);
 fs.unlinkSync(source);
 fs.unlinkSync(other);
 assert.ok(fs.readFileSync(path.join(first.root,first.ref)).equals(sourceBytes));
 assert.ok(fs.readFileSync(path.join(distinct.root,distinct.ref)).equals(sourceBytes));
 const originals=fs.readdirSync(path.join(evidence,'originals'));
 assert.equal(originals.length,2);
 const scenes=fs.readFileSync(path.join(evidence,'reviewer-scenes.jsonl'),'utf8');
 assert.equal(scenes.trim().split('\n').length,2);
 assert.equal(scenes.includes(sourceBytes.toString()),false);
 const output={
  recordedAt:new Date().toISOString(),
  kind:'independent Reviewer real file capture and lifecycle proof',
  twoCapturedOriginals:originals.length,
  sameOriginalReferences:[first.ref,twice.ref],
  differentIdentityRef:distinct.ref,
  preservedAfterDisposableSourceRemoval:true,
  sameOriginalThreeUsesIncludingIndependentSession:true,
  reconstructibleSource:fixture,
  actualBytes:sourceBytes.length,
  evidenceOriginalRefs:[first,distinct],
  evidenceScenes:'one-source-originals/reviewer-scenes.jsonl',
  negativeCases:['outside-relative-root','missing-direct-source','temporary-pretends-durable'],
  boundaries:['This test does not launch groups-v1; executable product tests run separately','Only deletes isolated source files owned by Reviewer','Does not assert full storage optimization across all stages']
 };
 fs.writeFileSync(path.join(here,'independent-source-proof.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
 succeeded=true;
 console.log(JSON.stringify({passed:true,originals:originals.length,reuses:3,persistedAfterTempRemoval:true,
  result:'independent-source-proof.json'},null,2));
} finally {
 if(succeeded&&fs.existsSync(marker)&&fs.readFileSync(marker).equals(markerBytes)&&
   fs.realpathSync(isolated)===isolated&&path.dirname(isolated)===tmp&&
   !fs.existsSync(path.join(isolated,'.mendi/write.lock')))fs.rmSync(isolated,{recursive:true,force:false});
}