import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const repo=fs.realpathSync(process.cwd());
const historical=path.join(repo,'.mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/014-apply');
const artifact=path.join(repo,'.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/026-explore/artifacts/historical-group-proof.json');
assert.equal(fs.existsSync(artifact),false);
let request=0,report=0,events=0,zeroStdout=0,zeroStderr=0,absentReport=0,absentEvents=0;
const missingReportOutcomes:Record<string,number>={};
const allReportOutcomes:Record<string,number>={};
const reportCleanup:Record<string,number>={};
function traverse(dir:string):void{
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const f=path.join(dir,entry.name);
  if(entry.isDirectory())traverse(f);
  if(entry.isFile()&&entry.name==='group-request.json'){
   request++;
   const sibling=(n:string)=>path.join(dir,n);
   const rep=sibling('group-report.json'),evt=sibling('group-events.jsonl'),stdout=sibling('stdout.log'),stderr=sibling('stderr.log'),result=sibling('result.json');
   const hasReport=fs.existsSync(rep),hasEvents=fs.existsSync(evt);
   if(hasReport){report++;try{const data=JSON.parse(fs.readFileSync(rep,'utf8')) as {cleanup?:unknown};const state=String(data.cleanup??'absent');reportCleanup[state]=(reportCleanup[state]??0)+1;}catch{reportCleanup['unparseable']=(reportCleanup['unparseable']??0)+1;}}
   else absentReport++;
   if(hasEvents)events++;else absentEvents++;
   if(fs.existsSync(stdout)&&fs.statSync(stdout).size===0)zeroStdout++;
   if(fs.existsSync(stderr)&&fs.statSync(stderr).size===0)zeroStderr++;
   if(fs.existsSync(result)){
    try{const data=JSON.parse(fs.readFileSync(result,'utf8')) as {outcome?:unknown};const outcome=String(data.outcome??'absent');allReportOutcomes[outcome]=(allReportOutcomes[outcome]??0)+1;if(!hasReport)missingReportOutcomes[outcome]=(missingReportOutcomes[outcome]??0)+1;}
    catch{missingReportOutcomes['unparseable-result']=(missingReportOutcomes['unparseable-result']??0)+Number(!hasReport);}
   }else if(!hasReport)missingReportOutcomes['result-missing']=(missingReportOutcomes['result-missing']??0)+1;
  }
 }
}
traverse(historical);
assert.equal(request,114);
assert.equal(report,107);
const data={scope:'Read-only historical D04-B 014-apply group-request sibling survey',counts:{requests:request,reports:report,eventFiles:events,missingReports:absentReport,missingEvents:absentEvents,zeroStdout,zeroStderr},missingReportChildOutcomes:missingReportOutcomes,allObservedChildOutcomes:allReportOutcomes,reportCleanup,limitations:['Sibling absence is not proof that a report is safely disposable','All inspected records belong to historical approved Run and were not mutated','Historical report and log contracts differ from proposed new optimized contract','No inference about target business coverage from filenames alone']};
fs.writeFileSync(artifact,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(data,null,2));