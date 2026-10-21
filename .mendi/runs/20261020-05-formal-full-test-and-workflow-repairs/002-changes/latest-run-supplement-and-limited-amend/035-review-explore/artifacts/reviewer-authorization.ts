// D05-D 035: independent Reviewer original authorization literal-token check.
// Read-only against submitted records and AGENTS; writes own proof receipt only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const policy=fs.readFileSync('AGENTS.md','utf8');
const authorRef='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/033-explore/run.md';
const reviewRef='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/034-review-explore/run.md';
const author=fs.readFileSync(authorRef,'utf8');
const oldReviewer=fs.readFileSync(reviewRef,'utf8');
const sourceLine=author.split(/\r?\n/).find(v=>v.startsWith('Owner 原始消息：'));
assert.ok(sourceLine,'Source Author Run must include stated original Owner message');
const observed=sourceLine.slice('Owner 原始消息：'.length).trim().replace(/。$/, '');
const original='Owner 授权激活 D05-D：当前最新 Run 的 supplement / amend，进入 Proof Explore';
const required='owner 授权';
assert.equal(observed,original,'Author summary, ignoring sentence-final punctuation, should agree with original Owner message');
assert.ok(policy.includes('新 Change 激活须由 Owner 原始消息包含连续字样') && policy.includes(required));
assert.equal(original.includes(required),false);
assert.equal(original.includes('Owner 授权'),true);
assert.match(oldReviewer,/verdict: approved/);
const report={
 checkedAt:new Date().toISOString(),
 fixedAuthor:authorRef,
 priorReviewer:reviewRef,
 authoritySource:'Original Owner D05-D activation wording from 2026-10-21 message; also quoted exactly in 033 Author Run',
 originalOwnerMessage:original,
 policyRef:'AGENTS.md:13',
 requiredContinuousLiteral:required,
 caseSensitiveMatch:false,
 upperCaseVariantPresent:true,
 priority:'blocking-authorization-boundary',
 reason:'The active D05-D Change was activated on Owner original text lacking exact lowercase owner 授权; technical proof success is separate from new Change activation permission.',
 technicalProofPreserved:true,
 recommendedDisposition:'stop at Owner; require a fresh explicit scoped authorization containing exact owner 授权 before deciding whether to reuse current Explore proof and proceed; do not backdate or reword old Owner message or prior approved reviewer verdict',
 limitations:['Not a product-code regression or failure of 033/034 fixture proof',
  'New authorization is a real Owner decision; this script cannot supply one',
  'Do not automatically Propose, Apply, Archive, Full Test, Close, Git or install']
};
fs.writeFileSync(path.join(here,'authorization-proof.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'verified-authorization-mismatch',required,observedPrefix:original.slice(0,13),exactMatch:false,priorTechnicalVerdictPreserved:true,result:'authorization-proof.json'},null,2));