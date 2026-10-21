// D05-C Reviewer 027 independent read-only D04-B historical sampling.
// Writes only this Reviewer's artifact; it never updates previous Runs/reports/logs.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=fs.realpathSync(process.cwd());
const here=path.dirname(fileURLToPath(import.meta.url));
const historical=path.join(root,'.mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/014-apply');
assert.ok(fs.statSync(historical).isDirectory());
interface Result {outcome?: string}
const counts={
 requests:0,reports:0,events:0,results:0,
 missingReportResults:{} as Record<string,number>,
 allOutcomes:{} as Record<string,number>,
 cleanup:{} as Record<string,number>,
 zeroStdout:0,zeroStderr:0
};
const bump=(bag:Record<string,number>,k:string)=>{bag[k]=(bag[k]??0)+1;};
const walk=(folder:string)=>{
 for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  const f=path.join(folder,entry.name);
  if(entry.isDirectory()){walk(f);continue;}
  if(!entry.isFile()||entry.name!=='group-request.json')continue;
  counts.requests++;
  const sibling=(name:string)=>path.join(folder,name);
  const report=sibling('group-report.json'),events=sibling('group-events.jsonl'),
   result=sibling('result.json'),stdout=sibling('stdout.log'),stderr=sibling('stderr.log');
  if(fs.existsSync(report)){
   counts.reports++;
   const data=JSON.parse(fs.readFileSync(report,'utf8')) as {cleanup?:string};
   bump(counts.cleanup,typeof data.cleanup==='string'?data.cleanup:'absent');
  }
  if(fs.existsSync(events))counts.events++;
  if(fs.existsSync(stdout)&&fs.statSync(stdout).size===0)counts.zeroStdout++;
  if(fs.existsSync(stderr)&&fs.statSync(stderr).size===0)counts.zeroStderr++;
  if(fs.existsSync(result)){
   counts.results++;
   const content=JSON.parse(fs.readFileSync(result,'utf8')) as Result;
   const outcome=String(content.outcome??'missing-outcome');
   bump(counts.allOutcomes,outcome);
   if(!fs.existsSync(report))bump(counts.missingReportResults,outcome);
  } else if(!fs.existsSync(report))bump(counts.missingReportResults,'missing-result');
 }
};
walk(historical);
assert.equal(counts.requests,114);
assert.equal(counts.results,114);
assert.equal(counts.reports,107);
assert.equal(counts.events,111);
assert.equal(counts.zeroStdout,74);
assert.equal(counts.zeroStderr,3);
assert.deepEqual(counts.missingReportResults,{'not-run':3,'interrupted':2,'unknown':2});
assert.deepEqual(counts.cleanup,{'confirmed':103,'unknown':4});
assert.equal(Object.keys(counts.missingReportResults).some(k=>k==='passed'||k==='failed'),false);
const report={
 recordedAt:new Date().toISOString(),kind:'independent read-only historical D04-B group report sibling census',
 fixedAuthor:'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/026-explore/run.md',
 counts,
 limitations:[
  'This census covers the D04-B 014-apply historical fixture only, not all future group protocols',
  'Absence of a report or event is NOT justification to delete or suppress any required output',
  'No existing Run/artifact was written; this proof does not perform Formal Full Test',
  'The list of historical run artifacts is a different population from product .mendi/delivery-groups/*/tests logs'
 ]
};
fs.writeFileSync(path.join(here,'historical-audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,requests:counts.requests,reports:counts.reports,
 missing:counts.missingReportResults,cleanup:counts.cleanup,reviewerArtifact:'historical-audit.json'},null,2));