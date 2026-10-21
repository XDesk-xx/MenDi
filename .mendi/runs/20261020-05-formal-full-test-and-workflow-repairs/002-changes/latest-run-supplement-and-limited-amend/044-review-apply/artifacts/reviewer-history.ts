// D05-D 044 Reviewer: bounded direct-history, explicit prior sources only.
// No global hash ledger, no history scan, no modification to existing submitted Runs.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=process.cwd();
const prefix='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/';
const entries=[
 {ref:prefix+'latest-run-supplement-and-limited-amend/033-explore/run.md',digest:'3A2798AEE331FF624A0220D57C0809A2F634EE675BD470D3EDE92C20324C9BB2',expected:'explore'},
 {ref:prefix+'latest-run-supplement-and-limited-amend/034-review-explore/run.md',digest:'22ED4800C7F1B2D6A8881A168209138D302C876FFCB10C12A3F44C58FE903C45',expected:'approved'},
 {ref:prefix+'latest-run-supplement-and-limited-amend/035-review-explore/run.md',digest:'71B59A862B649D06B4EA94AF40E4DD27DAE7F8A3E4D46F621D2607F96C97C2ED',expected:'rejected'},
 {ref:prefix+'latest-run-supplement-and-limited-amend/036-review-explore/run.md',digest:'EF5D563DBFD27EDE8DEDDE8BED2D9023ABC9321338C667EC245B3C17A8A55AA5',expected:'approved'},
 {ref:prefix+'unified-groups-full-test-and-repair-flow/012-archive/run.md',digest:'D4CF128B7FA186033FBF1A28FF49BF65E46CB3D4CCAF9201C5AB858580D328AE',expected:'archived'},
 {ref:prefix+'append-planned-changes-to-open-delivery/025-archive/run.md',digest:'BBBBC7542F44B54CBF976828F0AF7900DA927487034AEC1D3C8DED1C7B2D0049',expected:'archived'},
 {ref:prefix+'reduce-redundant-proof-inputs-and-artifacts/032-archive/run.md',digest:'F37C503DCF1DFC2B92C64946A82F961160AA1F3D53F61B6A9385DDB2ABED1066',expected:'archived'}
];
const summary=[];
for(const entry of entries){
 const bytes=fs.readFileSync(entry.ref);
 const hash=createHash('sha256').update(bytes).digest('hex').toUpperCase();
 assert.equal(hash,entry.digest,'Required prior submitted source changed: '+entry.ref);
 const source=bytes.toString('utf8');
 if(entry.expected==='archived')assert.ok(source.includes('result: archived'));
 else if(entry.expected==='explore')assert.ok(source.includes('actionType: explore'));
 else assert.ok(source.includes('verdict: '+entry.expected));
 if(entry.expected==='archived'){
  const cmd=spawnSync('git',['show','HEAD:'+entry.ref],{cwd:root,encoding:null,windowsHide:true,maxBuffer:1024*1024});
  assert.equal(cmd.status,0,'Archived history committed source at HEAD');
  assert.ok(bytes.equals(cmd.stdout),'Previous archive changed from last checkpoint');
 }
 summary.push({ref:entry.ref,priorDigestMatches:true,gitHEADMatches:entry.expected==='archived'?true:null,status:entry.expected});
}
fs.writeFileSync(path.join(here,'independent-history.json'),JSON.stringify({review:'D05-D/044',recordedAt:new Date().toISOString(),
 method:'Direct 7 bounded historical Run byte checks against already recorded source hashes; archived 3 additionally compared with Git HEAD',
 entries:summary,limits:['This is scoped direct source integrity, not global hashes or a new validation gate','No older Run was modified']},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checked:summary.length,priorBytesIntact:true,gitArchivesUnchanged:true,artifact:'independent-history.json'},null,2));