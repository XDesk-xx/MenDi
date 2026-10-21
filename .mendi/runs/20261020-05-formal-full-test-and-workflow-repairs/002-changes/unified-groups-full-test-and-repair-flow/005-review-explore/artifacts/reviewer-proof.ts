// Reviewer 005: independent adversarial verification of the *actual* Author 004
// cleanup function with an in-memory filesystem. No project or real temporary
// directory can be deleted by this proof.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = process.cwd();
const artifact = path.dirname(fileURLToPath(import.meta.url));
const authorPath = '.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/004-revise-explore/artifacts/proof.ts';
const priorProofPath = '.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/004-revise-explore/artifacts/proof-results.json';
const manifestPath = '.mendi/delivery-groups/20261020-05-formal-full-test-and-workflow-repairs/manifest.json';
const authorSource = fs.readFileSync(path.join(repo,authorPath),'utf8');
const originalManifest = fs.readFileSync(path.join(repo,manifestPath));
const submitted: unknown = JSON.parse(fs.readFileSync(path.join(repo,priorProofPath),'utf8'));
const submittedCases = (submitted as { cases?: Array<{ id: string }> }).cases ?? [];
assert.deepEqual(submittedCases.map(c=>c.id),['P01','P02','P03','P04']);
const begin = authorSource.indexOf('function cleanupOwnedFixtures()');
const finish = authorSource.indexOf('\nasync function run(): Promise<void>', begin);
assert.ok(begin>=0 && finish>begin, 'Author cleanup implementation must be extractable');
const extracted = authorSource.slice(begin,finish);
assert.match(extracted,/for\s*\(const entry of owned\)/);
assert.match(extracted,/fs\.readFileSync\(entry\.marker\)\.equals\(entry\.bytes\)/);
assert.match(extracted,/\.mendi\/write\.lock/);
assert.doesNotMatch(extracted,/readdirSync/, 'Author cleanup must not enumerate .tmp');
const js = stripTypeScriptTypes(extracted, { mode: 'strip' });

type Owned = { root:string; parent:string; marker:string; bytes:Buffer };
type Outcome = { deleted:string[]; sentinelPreserved:boolean; markerVerified:number };
type MockDisk = {
  owned:Owned[];
  root:string;
  parent:string;
  foreign:string;
  marker:string;
  files:Map<string,Buffer>;
  dirs:Set<string>;
  rmCalls:string[];
  overrides:Map<string,string>;
  api: {
    mkdtempSync:(prefix:string)=>string;
    writeFileSync:(file:string, data:string|Buffer, opts?:{flag?:string})=>void;
    realpathSync:(file:string)=>string;
    existsSync:(file:string)=>boolean;
    readFileSync:(file:string)=>Buffer;
    rmSync:(dir:string, options?:{recursive?:boolean;force?:boolean})=>void;
  }
};
const tmp = path.join(repo,'.tmp','reviewer-005-VIRTUAL-DO-NOT-CREATE');
function virtualDisk(): MockDisk {
  const parent = path.join(tmp,'mendi-apply-owned');
  const root = path.join(parent,'project');
  const foreign = path.join(tmp,'mendi-apply-foreign');
  const marker = path.join(parent,'.d05-a-004-owner.json');
  const bytes = Buffer.from(JSON.stringify({owner:'D05-A/004',nonce:'synthetic-005',root})+'\n');
  const files = new Map<string,Buffer>([[marker,bytes],[path.join(foreign,'not-owned.txt'),Buffer.from('foreign')]]);
  const dirs = new Set<string>([parent,root,foreign]);
  const rmCalls:string[] = [];
  const overrides = new Map<string,string>();
  const api = {
    mkdtempSync(prefix:string):string {
      assert.equal(prefix,path.join(tmp,'mendi-apply-'));
      const made=prefix+'sentinel-005';
      assert.equal(dirs.has(made),false);
      dirs.add(made);
      return made;
    },
    writeFileSync(file:string,data:string|Buffer,opts?:{flag?:string}):void {
      if(opts?.flag==='wx')assert.equal(files.has(file),false,'must be new virtual file');
      files.set(file,Buffer.isBuffer(data)?Buffer.from(data):Buffer.from(data));
    },
    realpathSync(file:string):string {return overrides.get(file)??file;},
    existsSync(file:string):boolean {return dirs.has(file)||files.has(file);},
    readFileSync(file:string):Buffer {
      const value=files.get(file);
      assert.ok(value, 'virtual file missing: '+file);
      return Buffer.from(value);
    },
    rmSync(dir:string,options?:{recursive?:boolean;force?:boolean}):void {
      assert.equal(options?.recursive,true);
      assert.equal(options?.force,false);
      assert.ok(dirs.has(dir),'virtual directory must exist');
      rmCalls.push(dir);
      for(const d of [...dirs])if(d===dir||d.startsWith(dir+path.sep))dirs.delete(d);
      for(const f of [...files.keys()])if(f.startsWith(dir+path.sep))files.delete(f);
    }
  };
  return {root,parent,foreign,marker,files,dirs,rmCalls,overrides,api,owned:[{root,parent,marker,bytes}]};
}
function invoke(disk:MockDisk):Outcome {
  const observed = runInNewContext(js+'\ncleanupOwnedFixtures()',{
    fs:disk.api, path, assert, tmp, owned:disk.owned, Buffer
  },{timeout:15000}) as Outcome;
  return observed;
}
const results:Array<{id:string;passed:boolean;details:string}>=[];
{
  const disk=virtualDisk();
  const output=invoke(disk);
  assert.equal(output.markerVerified,1);
  assert.equal(output.sentinelPreserved,true);
  assert.equal(output.deleted.length,1);
  assert.equal(output.deleted[0],disk.parent);
  assert.equal(disk.dirs.has(disk.parent),false);
  assert.equal(disk.dirs.has(disk.foreign),true);
  assert.equal(disk.rmCalls.includes(disk.foreign),false);
  assert.equal(disk.rmCalls.length,2,'only listed parent and newly-owned sentinel removed');
  results.push({id:'F1-normal-plus-foreign',passed:true,details:'actual extracted cleanup removes listed owned parent, preserves same-prefix foreign directory'});
}
{
  const disk=virtualDisk();
  disk.files.set(path.join(disk.root,'.mendi','write.lock'),Buffer.from('locked'));
  let error:unknown;
  try {invoke(disk);} catch(e){error=e;}
  assert.match(String(error),/unknown fixture lock/);
  assert.equal(disk.dirs.has(disk.parent),true);
  assert.equal(disk.dirs.has(disk.foreign),true);
  assert.equal(disk.rmCalls.includes(disk.parent),false);
  results.push({id:'F1-locked',passed:true,details:'locked owned fixture not removed; foreign unchanged'});
}
{
  const disk=virtualDisk();
  disk.files.set(disk.marker,Buffer.from('other owner'));
  let error:unknown;
  try{invoke(disk);}catch(e){error=e;}
  assert.match(String(error),/owner marker must be unchanged/);
  assert.equal(disk.dirs.has(disk.parent),true);
  assert.equal(disk.rmCalls.includes(disk.parent),false);
  results.push({id:'F1-marker-conflict',passed:true,details:'altered ownership marker refuses deletion'});
}
{
  const disk=virtualDisk();
  disk.overrides.set(disk.parent, disk.parent+'-redirected');
  let error:unknown;
  try{invoke(disk);}catch(e){error=e;}
  assert.ok(error,'redirected realpath must fail');
  assert.equal(disk.dirs.has(disk.parent),true);
  assert.equal(disk.rmCalls.includes(disk.parent),false);
  results.push({id:'F1-realpath-conflict',passed:true,details:'changed canonical parent refuses deletion'});
}

const args=[
  'node_modules/typescript/bin/tsc','--noEmit','--strict','--module','NodeNext',
  '--moduleResolution','NodeNext','--target','ES2022','--skipLibCheck',
  '--allowImportingTsExtensions',authorPath
];
const typecheck=spawnSync(process.execPath,args,{
  cwd:repo,encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024,windowsHide:true
});
const diagnostics=[typecheck.stdout,typecheck.stderr].filter(Boolean).join('\n');
if(diagnostics)fs.writeFileSync(path.join(artifact,'author-typecheck.log'), diagnostics, {flag:'wx'});
assert.equal(typecheck.status,0,'Author revised proof must pass strict TypeScript check');
assert.equal(diagnostics,'','Author revised proof must have no diagnostics');
assert.ok(fs.readFileSync(path.join(repo,manifestPath)).equals(originalManifest),'read-only independent check cannot change manifest');
const evidence={
  recordedAt:new Date().toISOString(),
  reviewer:'D05-A/005 independent Reviewer',
  fixedAuthorRun:authorPath.replace(/artifacts\/proof\.ts$/,'run.md'),
  source:{path:authorPath,sha256:crypto.createHash('sha256').update(authorSource).digest('hex')},
  method:'extract actual Author 004 cleanup function; Node stripTypeScriptTypes; run source inside vm on memory-only filesystem; no physical fixture dirs or real deletion',
  assertions:results,
  f1:{status:'supported-for-explore',simulatedTests:results.length,allPassed:true,
    limit:'Virtual filesystem proves control-flow under tested attacks, not all possible OS races, symlink replacement, or full product cleanup'},
  f2:{status:'passed',command:[process.execPath,...args],exitCode:typecheck.status,
    output:typecheck.stdout??'',stderr:typecheck.stderr??'',log:diagnostics?'author-typecheck.log':null},
  previous:{p01toP04:submittedCases.map(c=>c.id),provenance:'Author 004 isolated real group target results, independently read; not rerun by Reviewer 005'},
  boundaries:[
    'No root D05 formal Full Test, implementation, Git, installation, or DreMo changes',
    'No real deletion or cleanup; mocked filesystem only for independent negative controls',
    'Fixture actors and approvals do not authenticate the real independent Reviewer',
    'D05 groups-v1 policy remains a future Propose/Apply obligation'
  ]
};
const evidencePath=path.join(artifact,'proof-results.json');
fs.writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'passed',f1NegativeControls:results.length,authorStrictTsExitCode:typecheck.status,
  evidence:path.relative(repo,evidencePath)},null,2));
