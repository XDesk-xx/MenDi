import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { inspectSelection } from './d02-a/selection.ts';
import { executeFixtureTest, pnpmEntry } from './d02-a/test-entry.ts';
import { archiveTarget, prepare, archiveCli } from '../../tests/archive-support.ts';
import { command, cli, prepareChange, isolatedEnv, fixture, sandbox } from '../../tests/helpers.ts';
import { readWorkspace } from '../../src/adapters/workspace.ts';
import { readRun, renderRun, scanRunNumbers } from '../../src/adapters/runs.ts';
import { bindingFor } from '../../src/core/records.ts';

if (process.argv[2] === '--select') {
  console.log(JSON.stringify(inspectSelection(process.argv[3], process.argv[4] === 'baseline')));
} else {
  const output = path.resolve(process.argv[2]);
  fs.mkdirSync(output, { recursive: true });
  process.env.MENDI_TEST_EVIDENCE_DIR = path.join(output, 'commands');
  const scenes: Record<string, unknown>[] = [];
  const target = archiveTarget('approved');
  const manifestFile = path.join(target.root, '.mendi/delivery-groups/d01/manifest.json');
  const writeManifest = (data: unknown) =>
    fs.writeFileSync(manifestFile, JSON.stringify(data, null, 2) + '\n');
  const input = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  input.plannedChanges.push({ slot: 'B', title: '第二 Change', dependsOn: ['A'] });
  writeManifest(input);
  const draft = prepare(target);
  const archived = archiveCli(target.root, draft.run.ref, 'execute');
  assert.equal(archived.result, 'archived');
  fs.copyFileSync(
    path.join(target.root, archived.run.archive.attemptRef, 'native-result.json'),
    path.join(output, 'native-archive-result.json'),
  );
  const prior = readWorkspace(target.root)!;
  assert.equal(prior.project.archivedChangeCount, 1);
  const oldRunFile = path.join(target.root, draft.run.ref),
    oldRun = fs.readFileSync(oldRunFile);
  const env = isolatedEnv(path.dirname(target.root));
  prepareChange(target.root, env, 'proof-next');
  const beforeBind = fs.readFileSync(manifestFile);
  const rejected = cli(
    ['change', 'bind', '--project', target.root, '--change', 'proof-next', '--slot', 'B', '--json'],
    target.root,
    env,
  );
  assert.equal(rejected.status, 1);
  assert.equal(JSON.parse(rejected.stdout).error.code, 'change-bind-conflict');
  assert.deepEqual(fs.readFileSync(manifestFile), beforeBind);
  scenes.push({
    id: 'P01',
    nativeArchive: 'completed',
    archiveOrdinal: 1,
    nextBind: 'change-bind-conflict',
    originalPreserved: true,
  });

  // Persist a bounded candidate association in this sandbox, not in the real MenDi project.
  const next = bindingFor(prior.scope, 'B', 'proof-next');
  const allocation = scanRunNumbers(target.root, 'd01');
  const number = String(allocation.number).padStart(3, '0');
  const batchId = prior.bindings[0].batchId!;
  const nextRef = `.mendi/runs/d01/${batchId}/proof-next/${number}-explore/run.md`;
  const source = readRun(target.root, target.refs.explore, 'd01', 'proof-entry');
  fs.mkdirSync(path.dirname(path.join(target.root, nextRef)), { recursive: true });
  fs.writeFileSync(
    path.join(target.root, nextRef),
    renderRun(
      {
        ...source.header,
        changeId: 'proof-next',
        actionId: 'proof-next-001-explore',
        runNumber: Number(number),
      },
      '第二 Change 选择实验夹具；没有语义批准。\n',
    ),
    { flag: 'wx' },
  );
  const candidate = JSON.parse(beforeBind.toString());
  candidate.activeChangeId = 'proof-next';
  candidate.changeBindings.push({ ...next, state: 'active', batchId, latestRunRef: nextRef });
  candidate.changeBatches[0].changeIds.push('proof-next');
  candidate.unknownRef = '../unavailable';
  writeManifest(candidate);
  const thisFile = fileURLToPath(import.meta.url);
  function probe(baseline = false) {
    const r = command(
      thisFile,
      ['--select', target.root, baseline ? 'baseline' : 'candidate'],
      process.cwd(),
      env,
    );
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout);
  }
  assert.equal(probe(true).selectedChange, 'proof-entry');
  assert.equal(probe().selectedChange, 'proof-next');
  assert.equal(probe().runRef, nextRef);
  const realQuery = cli(['status', '--project', target.root, '--json'], target.root, env);
  assert.equal(realQuery.status, 1);
  scenes.push({
    id: 'P02',
    baselineSelection: 'old archived proof-entry',
    candidateSelection: 'proof-next',
    newRun: number,
    actualProductAdmission: JSON.parse(realQuery.stdout).error.code,
    limitation: '只验证选择片段；多 binding 产品协议仍拒绝。',
  });

  // Historical input can disappear; the actually selected Run must remain mandatory.
  fs.unlinkSync(oldRunFile);
  assert.equal(probe(true).error, 'run-input-missing');
  assert.equal(probe().selectedChange, 'proof-next');
  const newFile = path.join(target.root, nextRef),
    newBytes = fs.readFileSync(newFile);
  fs.unlinkSync(newFile);
  assert.equal(probe().error, 'run-input-missing');
  fs.writeFileSync(newFile, newBytes);
  const second = candidate.changeBindings[1];
  delete second.latestRunRef;
  writeManifest(candidate);
  assert.equal(probe().runRef, null);
  second.latestRunRef = '../outside';
  writeManifest(candidate);
  assert.equal(probe().error, 'unsafe-reference');
  second.latestRunRef = nextRef;
  writeManifest(candidate);
  fs.writeFileSync(
    newFile,
    renderRun(
      { ...source.header, changeId: 'different', runNumber: Number(number) },
      '错身份夹具\n',
    ),
  );
  assert.equal(probe().error, 'invalid-run');
  fs.writeFileSync(newFile, newBytes);
  fs.writeFileSync(oldRunFile, oldRun);
  assert.deepEqual(fs.readFileSync(oldRunFile), oldRun);
  assert.deepEqual(
    candidate.changeBindings[0],
    JSON.parse(beforeBind.toString()).changeBindings[0],
  );
  scenes.push({
    id: 'P03',
    historyMissing: 'candidate succeeds',
    unknownRef: 'ignored',
    noCurrentRun: 'null, no historical fallback',
    currentMissing: 'run-input-missing',
    pathEscape: 'unsafe-reference',
    wrongIdentity: 'invalid-run',
    oldBindingPreserved: true,
  });

  const testRoot = fixture(sandbox(), 'test-entry-project');
  const version = command(pnpmEntry, ['--version'], testRoot, {
    ...process.env,
    COREPACK_ENABLE_NETWORK: '0',
  });
  assert.equal(version.status, 0, version.stderr);
  assert.equal(version.stdout.trim(), '11.22.0');
  const notRun = { kind: 'full', outcome: 'not-run', exitCode: null };
  const testLog = path.join(output, 'test-commands.jsonl');
  const passed = await executeFixtureTest(testRoot, 'focused', testLog);
  const failed = await executeFixtureTest(testRoot, 'fast', testLog);
  const interrupted = await executeFixtureTest(testRoot, 'full', testLog, true);
  assert.equal(passed.outcome, 'passed');
  assert.equal(passed.exitCode, 0);
  assert.equal(failed.outcome, 'failed');
  assert.notEqual(failed.exitCode, 0);
  assert.equal(interrupted.outcome, 'interrupted');
  assert.ok(interrupted.stopConfirmed);
  scenes.push({
    id: 'P04',
    targetScripts: ['test:focused', 'test:fast', 'test:full'],
    results: [passed, failed, notRun, interrupted],
    fullPassed: false,
  });
  fs.writeFileSync(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        result: 'passed',
        target: target.root,
        testTarget: testRoot,
        scenes,
        limits: [
          '独立批准由夹具提供，非真人身份认证。',
          'candidate 是选择片段与受控持久化，未实现多 Change 产品 bind / 第二次 Archive。',
          '不验证正式 Full Test 或 Close / Reopen；脚本成功退出不等同整次 full 通过。',
        ],
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify({
      result: 'passed',
      scenes: scenes.length,
      report: path.join(output, 'report.json'),
    }),
  );
}
