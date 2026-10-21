// D05-D Reviewer 040: independent planning and interface audit.
// Source/planning read-only. Only Reviewer 040 artifacts are created.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const base='.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/';
const change='openspec/changes/latest-run-supplement-and-limited-amend/';
const here=path.dirname(fileURLToPath(import.meta.url));
const files={
 author:base+'039-revise-propose/run.md',
 priorReview:base+'038-review-propose/run.md',
 reauth:base+'036-review-explore/run.md',
 ownerReceipt:base+'036-review-explore/artifacts/authorization-proof.json',
 proposal:change+'proposal.md',design:change+'design.md',
 task:change+'tasks.md',
 spec:change+'specs/run-post-submission/spec.md',
 actionSpec:change+'specs/action-runs/spec.md',
 workspaceSpec:change+'specs/delivery-workspace/spec.md',
 actionRecord:'src/core/actions.ts',deliveryRecord:'src/core/delivery-runs.ts'
} as const;
type FileKey=keyof typeof files;
const textFiles=Object.fromEntries(Object.entries(files).map(([k,v])=>[k,fs.readFileSync(v,'utf8')])) as Record<FileKey,string>;
function where(key:FileKey,needle:string) {
 const lines=textFiles[key].split(/\r?\n/);
 const idx=lines.findIndex(t=>t.includes(needle));
 assert.ok(idx>=0,'missing '+needle+' in '+files[key]);
 return {file:files[key],line:idx+1,quote:lines[idx].trim().slice(0,400)};
}
assert.ok(textFiles.author.includes('actionType: revise-propose'));
assert.ok(textFiles.author.includes('revisesRunRef: '+base+'037-propose/run.md'));
assert.ok(textFiles.author.includes('previousRunRef: '+files.priorReview));
assert.ok(textFiles.priorReview.includes('verdict: changes-requested'));
assert.ok(textFiles.reauth.includes('verdict: approved'));
const owner=JSON.parse(textFiles.ownerReceipt) as {
 ownerAuthorizationOriginal:string,checked:{exact:boolean,scope:boolean},originalActivationStillInvalid:boolean
};
assert.ok(owner.ownerAuthorizationOriginal.includes('owner 授权'));
assert.equal(owner.checked.exact,true);assert.equal(owner.checked.scope,true);
assert.equal(owner.originalActivationStillInvalid,true);
const nTasks=(textFiles.task.match(/^- \[ \] \d+\.\d+ /gm)??[]).length;
assert.equal(nTasks,16);
const cases=[
 {id:'F1-corrected',kind:'approval',references:[
  where('proposal','sourceClaimedCollectedAt'),
  where('design','sourceTimeTrust=unverified'),
  where('spec','来源自述'),
  where('task','虚假过去日期')],
  reason:'recordedAt is an operation time, claimed collection date remains explicitly unverified. No old approval time source invented.'},
 {id:'F2-corrected',kind:'approval',references:[
  where('proposal','--request-id'),
  where('design','首版每个 Run 至多一次 confirmed amend'),
  where('spec','One amend per Run with explicit request identity'),
  where('task','第二不同 ID')],
  reason:'Amend requires explicit request ID and rejects a second confirmed distinct operation; replay cases are specified.'},
 {id:'F3-authority-corrected',kind:'approval',references:[
  where('proposal','unreviewed-comment/authoritative=false'),
  where('design','kind=unreviewed-comment'),
  where('spec','Unreviewed comment asserts a new approval'),
  where('workspaceSpec','Free aftercare comment contains a false approval claim'),
  where('task','附注即使自由声称')],
  reason:'Free comment is segregated as non-authoritative and cannot change official verdict/PASS/next.'},
 {id:'eligibility-and-failure-paths',kind:'approval',references:[
  where('design','### D1.'),
  where('design','### D4.'),
  where('task','下游 draft'),
  where('spec','Interrupted between evidence and receipt'),
  where('actionSpec','Special post-submission commands do not weaken draft-only save')],
  reason:'Current Change versus Delivery source, shared run numbers, fail-closed input and recovery retained.'}
];
const amendLine=where('design','命令 ');
const lineOfCli=where('design','run amend --project');
const cli=lineOfCli.quote;
assert.ok(cli.includes('--body')&&cli.includes('--reason')&&cli.includes('--request-id'));
assert.equal(cli.includes('--kind'),false);
assert.equal(cli.includes('--comment'),false);
assert.ok(textFiles.spec.includes('Unsafe typo or hyperlink rewrite'));
assert.ok(textFiles.spec.includes('Explicit post-submission addendum'));
assert.ok(textFiles.task.includes('拒绝错字/URL'));
assert.ok(textFiles.task.includes('自由事后附注必须另存'));
const example={
 originalSubmittedBody:'审核未批准',
 incomingBody:'审核已批准',
 sameAmendCommandShape:'run amend --project ROOT --run REF --role reviewer --actor ACTOR --request-id EXAMPLE --body incoming.md --reason follow-up',
 interpretations:[
  {intent:'replace-original-reviewed-body',required:'reject as substantive edit'},
  {intent:'add-a-free-unreviewed-comment',required:'accept isolated unreviewed-comment/authoritative=false'}
 ]
};
const gap={
 id:'F4',
 severity:'MEDIUM',
 scope:'Propose input contract / mechanical routing, not current product exploit',
 title:'No specified discriminator for amend display correction versus unreviewed free-text addendum',
 sources:[lineOfCli,
  where('design','1. **非结构化普通段落'),
  where('design','2. **自由事后评论'),
  where('spec','Safe presentation-only correction'),
  where('spec','Explicit post-submission addendum'),
  where('spec','Unsafe typo or hyperlink rewrite'),
  where('task','自由事后附注必须另存')],
 explanation:'The public amend command accepts one Markdown body input and no explicit kind/typed comment input or formal parse delimiter. The formal contract must reject substantive replacement text while accepting arbitrary aftercare note text as non-authoritative. Without a defined discriminator, identical request shape cannot be reliably assigned a correction or comment intent; implementation would need to invent a user-visible interface choice.',
 expectedRevision:'Define explicit machine-observable input kind (e.g. --kind presentation-only|unreviewed-comment or separate --comment with mutual exclusion) and schema/validation. presentation-only treats --body as full candidate and rejects substantive diffs; unreviewed-comment treats input only as an isolated comment, never a candidate replacement, with authoritative=false. Test same bytes under each explicit kind, invalid/missing kind, mutually conflicting inputs, and official query state not changed.',
 example
};
const entry='D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const args=[entry,'validate','latest-run-supplement-and-limited-amend','--strict','--json'];
const p=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:10*1024*1024});
const strict={command:[process.execPath,...args],exitCode:p.status,signal:p.signal,stdout:p.stdout??'',stderr:p.stderr??'',error:p.error?String(p.error):null};
fs.writeFileSync(path.join(here,'openspec-validation.json'),JSON.stringify(strict,null,2)+'\n',{flag:'wx'});
assert.equal(strict.exitCode,0);
const parsed=JSON.parse(strict.stdout) as {summary:{totals:{items:number,passed:number,failed:number}}};
assert.deepEqual(parsed.summary.totals,{items:1,passed:1,failed:0});
const result={
 reviewedAt:new Date().toISOString(),
 fixedAuthor:files.author,
 previousReview:files.priorReview,
 ownerAuthorization:'036 independent reauthorization verified, does not touch DreMo',
 taskCount:nTasks,
 method:'current source + formal planning contract crosswalk and CLI interface ambiguity argument; no product feature is implemented',
 resolvedPrior:cases,
 newBlockingFinding:gap,
 independentOpenSpec:{valid:true,totals:parsed.summary.totals,raw:'openspec-validation.json'},
 limits:['This proves an incomplete user-visible command/input contract, not a runtime exploit','No new product CLI executed','No Author document/source/history changed']
};
fs.writeFileSync(path.join(here,'reviewer-results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({fixedAuthor:files.author,resolvedPrior:cases.map(c=>c.id),taskCount:nTasks,newFinding:gap.id,validation:parsed.summary.totals},null,2));