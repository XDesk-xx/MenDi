// D05-A Reviewer post-submission independent supplemental proof.
// NEVER execute the Author's unsafe proof.ts (which deletes transient directories).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = process.cwd();
const here = path.dirname(fileURLToPath(import.meta.url));
const authorProof = '.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/002-explore/artifacts/proof.ts';
const authorResults = '.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/002-explore/artifacts/proof-results.json';
const source = fs.readFileSync(path.join(repo, authorProof), 'utf8');
const original: unknown = JSON.parse(fs.readFileSync(path.join(repo, authorResults), 'utf8'));
const originalCases = (original as { cases?: unknown[] }).cases ?? [];
assert.equal(originalCases.length, 4);
const cleanupStart = source.indexOf('}finally{');
assert.ok(cleanupStart !== -1);
const cleanup = source.slice(cleanupStart);
assert.match(cleanup, /fs\.readdirSync\(path\.join\(repo,'\.tmp'\)\)/);
assert.match(cleanup, /x\.startsWith\('mendi-apply-'\)&&!startingTemp\.has\(x\)/);
assert.match(cleanup, /fs\.rmSync\(full,\{recursive:true,force:false,maxRetries:3\}\)/);
assert.ok(!cleanup.includes('roots.includes(') && !cleanup.includes('roots.some(') && !cleanup.includes('roots.has('));
const foreign = 'mendi-apply-foreign-session-created-during-review';
const startupNames = new Set<string>();
const foreignSelectedByFilter = foreign.startsWith('mendi-apply-') && !startupNames.has(foreign);
assert.equal(foreignSelectedByFilter, true);
const outputNames = ['typescript-errors.log', 'reviewer-typecheck.log', 'focused-tests.tap.log', 'focused-tests.stderr.log', 'proof-results.json'];
for (const name of outputNames) assert.ok(!fs.existsSync(path.join(here, name)), 'existing evidence is immutable: ' + name);
function run(args: string[], timeout: number) {
  return spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024, windowsHide: true });
}
const selfTsc = ['node_modules/typescript/bin/tsc', '-p', path.join(here, 'tsconfig.json')];
const self = run(selfTsc, 60_000);
const selfOutput = [self.stdout, self.stderr].filter(Boolean).join('\n');
if (selfOutput) fs.writeFileSync(path.join(here, 'reviewer-typecheck.log'), selfOutput, { flag: 'wx' });
assert.equal(self.status, 0, 'reviewer proof strict TypeScript check must pass');
const sourceTsc = ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--skipLibCheck', '--allowImportingTsExtensions', authorProof];
const authorCompile = run(sourceTsc, 90_000);
const diagnosticText = [authorCompile.stdout, authorCompile.stderr].filter(Boolean).join('\n');
fs.writeFileSync(path.join(here, 'typescript-errors.log'), diagnosticText, { flag: 'wx' });
const errorCount = diagnosticText.match(/error TS\d+:/g)?.length ?? 0;
const testArgs = ['--experimental-strip-types', '--test', 'tests/group-completion.test.ts', 'tests/group-verification.test.ts'];
const testRun = run(testArgs, 240_000);
fs.writeFileSync(path.join(here, 'focused-tests.tap.log'), testRun.stdout, { flag: 'wx' });
if (testRun.stderr) fs.writeFileSync(path.join(here, 'focused-tests.stderr.log'), testRun.stderr, { flag: 'wx' });
const testPassed = /# pass 6\s*$/m.test(testRun.stdout);
const testFailedZero = /# fail 0\s*$/m.test(testRun.stdout);
const testSkippedZero = /# skipped 0\s*$/m.test(testRun.stdout);
const git = (args: string[]) => spawnSync('git', args, { cwd: repo, encoding: 'utf8' }).stdout.trim();
const observation = {
  recordedAt: new Date().toISOString(),
  provenance: 'independent Reviewer RE-EXECUTION after 003 submission; not original 003 logs',
  git: { branch: git(['branch','--show-current']), head: git(['rev-parse','HEAD']) },
  fixedAuthorRun: path.posix.dirname(path.posix.dirname(authorProof)) + '/run.md',
  reviewerRun: path.relative(repo, path.dirname(here)).replaceAll('\\','/'),
  f1: { method: 'read-only source inspection and synthetic filter counterexample; no file deletion',
    source: authorProof, sourceLines: '141-151', foreignSelectedByFilter,
    rootsUsedByCleanup: false, limitation: 'potential foreign-directory deletion, not proof of actual deletion' },
  f2: { command: [process.execPath, ...sourceTsc], exitCode: authorCompile.status,
    errorCount, rawLog: 'typescript-errors.log' },
  reviewerProofTypecheck: { command: [process.execPath, ...selfTsc], exitCode: self.status,
    rawLog: selfOutput ? 'reviewer-typecheck.log' : null },
  focusedTests: { command: [process.execPath, ...testArgs], exitCode: testRun.status,
    pass: testPassed ? 6 : null, fail: testFailedZero ? 0 : null, skipped: testSkippedZero ? 0 : null,
    rawLog: 'focused-tests.tap.log', stderrLog: testRun.stderr ? 'focused-tests.stderr.log' : null,
    applicability: 'current D04 behavior only; no D05 formal Full Test PASS' },
  authorOriginal: { resultsRef: authorResults, cases: originalCases.length,
    method: 'read-only observation; unsafe Author proof was NOT rerun' },
  submittedReviewVerdict: 'changes-requested (unchanged)',
};
fs.writeFileSync(path.join(here, 'proof-results.json'), JSON.stringify(observation, null, 2) + '\n', { flag: 'wx' });
if (authorCompile.status !== 2 || errorCount === 0 || testRun.status !== 0 || !testPassed || !testFailedZero || !testSkippedZero) {
  console.error(JSON.stringify({ status: 'incomplete', tscExit: authorCompile.status, errors: errorCount, testExit: testRun.status, testPassed, testFailedZero, testSkippedZero }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'proof-saved', f1: 'confirmed static filter risk', f2Diagnostics: errorCount, testsPassed: 6, result: path.join(here, 'proof-results.json') }, null, 2));
}
