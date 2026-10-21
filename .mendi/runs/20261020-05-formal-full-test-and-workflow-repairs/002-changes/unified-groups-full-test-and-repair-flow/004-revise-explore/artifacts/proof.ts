// D05-A 004-revise-explore. All effects are confined to freshly created test fixtures.
// Fixture reviewer labels are not genuine approval for MenDi source changes.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

import { groupTarget, groupRun, attemptResult, writeGroupInput, groupCandidate } from '../../../../../../../tests/group-support.ts';
import { formal, finishRepair, fullInput, authorActor, reviewActor } from '../../../../../../../tests/delivery-support.ts';
import { writePackage } from '../../../../../../../tests/test-support.ts';
import { startDeliveryRepair, startDeliveryReview } from '../../../../../../../src/application/delivery-repair.ts';
import { createVerification } from '../../../../../../../src/application/candidate-verification.ts';
import { groupAdmission } from '../../../../../../../src/application/group-admission.ts';

const repo = process.cwd();
const runArtifacts = path.join(repo, '.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/004-revise-explore/artifacts');
const outputPath = path.join(runArtifacts, 'proof-results.json');
assert.ok(fs.existsSync(path.join(repo, 'package.json')), 'run from MenDi repository root');
assert.ok(fs.existsSync(runArtifacts), 'only current 004-revise-explore artifacts are writable');
assert.equal(fs.existsSync(outputPath), false, 'do not overwrite prior proof results');
const tmp = fs.realpathSync(path.join(repo, '.tmp'));

type Target = ReturnType<typeof groupTarget>;
type GroupResult = ReturnType<typeof attemptResult>;
type Case = Record<string, unknown>;
interface OwnedDirectory {
  root: string;
  parent: string;
  marker: string;
  bytes: Buffer;
}
const owned: OwnedDirectory[] = [];
const cases: Case[] = [];

function fixture(): Target {
  const target = groupTarget();
  const root = fs.realpathSync(target.root);
  const parent = fs.realpathSync(path.dirname(root));
  assert.equal(path.dirname(parent), tmp, 'fixture must be an immediate child of the isolated test root');
  assert.equal(path.basename(root), 'project');
  assert.match(path.basename(parent), /^mendi-apply-/);
  assert.ok(!owned.some((x) => x.parent === parent), 'fixture path must be unique');
  const marker = path.join(parent, '.d05-a-004-owner.json');
  const bytes = Buffer.from(JSON.stringify({ owner: 'D05-A/004', nonce: crypto.randomUUID(), root }) + '\n');
  fs.writeFileSync(marker, bytes, { flag: 'wx' });
  owned.push({ root, parent, marker, bytes });
  return target;
}

function observe(value: GroupResult, root: string) {
  const attempt = value.run.attempt;
  assert.ok(attempt);
  const ref = attempt.executionId
    ? path.join(root, '.mendi/delivery-groups/d01/tests', attempt.executionId, 'group-report.json')
    : null;
  const actual: { groups: Array<{ id: string; state: string }> } | null =
    ref && fs.existsSync(ref) ? JSON.parse(fs.readFileSync(ref, 'utf8')) : null;
  return {
    ok: value.ok,
    runRef: value.run.ref,
    protocol: value.groupExecution.protocolState,
    next: value.next?.action,
    progress: attempt.progress.map((row) => ({ id: row.id, state: row.state })),
    actual: actual?.groups.map((row) => ({ id: row.id, state: row.state })) ?? [],
  };
}

function cleanupOwnedFixtures(): { deleted: string[]; sentinelPreserved: boolean; markerVerified: number } {
  // Simulate another session creating a same-prefix directory while this proof is active.
  // It is NOT in the fixture-ownership list and must survive fixture cleanup.
  const sentinelDir = fs.mkdtempSync(path.join(tmp, 'mendi-apply-'));
  const sentinelMarker = path.join(sentinelDir, 'untouched-by-fixture-cleanup.txt');
  const sentinelBytes = Buffer.from('D05-A 004 simulated unrelated active workspace\n');
  fs.writeFileSync(sentinelMarker, sentinelBytes, { flag: 'wx' });
  const deleted: string[] = [];
  let verified = 0;
  try {
    for (const entry of owned) {
      // No directory discovery, no enumeration of other matching names, no wildcard delete.
      assert.equal(fs.realpathSync(entry.parent), entry.parent);
      assert.equal(path.dirname(entry.parent), tmp);
      assert.equal(fs.realpathSync(entry.root), entry.root);
      assert.equal(path.basename(entry.root), 'project');
      assert.ok(fs.readFileSync(entry.marker).equals(entry.bytes), 'owner marker must be unchanged');
      assert.equal(fs.existsSync(path.join(entry.root, '.mendi/write.lock')), false, 'unknown fixture lock: retain site');
      verified++;
      fs.rmSync(entry.parent, { recursive: true, force: false });
      assert.equal(fs.existsSync(entry.parent), false);
      deleted.push(entry.parent);
    }
    const preserved = fs.existsSync(sentinelDir) && fs.readFileSync(sentinelMarker).equals(sentinelBytes);
    assert.ok(preserved, 'same-prefix directory outside owned list must survive');
    return { deleted, sentinelPreserved: preserved, markerVerified: verified };
  } finally {
    // Independently clean up only this proof's explicitly tracked sentinel, after identity checks.
    if (fs.existsSync(sentinelDir)) {
      if (fs.realpathSync(sentinelDir) === sentinelDir &&
          path.dirname(sentinelDir) === tmp &&
          fs.existsSync(sentinelMarker) &&
          fs.readFileSync(sentinelMarker).equals(sentinelBytes)) {
        fs.rmSync(sentinelDir, { recursive: true, force: false });
      }
    }
  }
}

async function run(): Promise<void> {
  // P01: Two independent failing groups are both executed and reported.
  {
    const t = fixture();
    fs.writeFileSync(path.join(t.root, 'middle.test.ts'),
      "import test from 'node:test';test('middle fails',()=>{throw Error('004 middle')});");
    fs.writeFileSync(path.join(t.root, 'tail.test.ts'),
      "import test from 'node:test';test('tail fails',()=>{throw Error('004 independent tail')});");
    const v = observe(attemptResult(await groupRun(t.root)), t.root);
    assert.deepEqual(v.progress.map((x) => x.state), ['passed', 'failed', 'failed']);
    assert.equal(v.protocol, 'valid');
    assert.equal(v.next, 'delivery-repair');
    cases.push({ id: 'P01', observed: v });
  }
  // P02: Known port block does not demand repair/review; a complete fresh initial passes.
  {
    const t = fixture();
    const service = net.createServer();
    await new Promise<void>((resolve, reject) => {
      service.once('error', reject);
      service.listen(0, '127.0.0.1', () => resolve());
    });
    const address = service.address();
    assert.ok(address && typeof address === 'object');
    fs.writeFileSync(path.join(t.root, 'group-control.json'),
      JSON.stringify({ ports: { middle: address.port } }));
    let first: GroupResult;
    try {
      first = attemptResult(await groupRun(t.root));
    } finally {
      await new Promise<void>((resolve, reject) => {
        service.close((err) => err ? reject(err) : resolve());
      });
    }
    const before = observe(first, t.root);
    assert.deepEqual(before.progress.map((x) => x.state), ['passed', 'blocked', 'passed']);
    fs.writeFileSync(path.join(t.root, 'group-control.json'), '{}');
    writeGroupInput(t.root, { ...t.declaration, fromRunRef: first.run.ref });
    const after = observe(attemptResult(await groupRun(t.root)), t.root);
    assert.deepEqual(after.progress.map((x) => x.state), ['passed', 'passed', 'passed']);
    assert.equal(after.ok, true);
    assert.ok(!fs.readdirSync(path.join(t.root, '.mendi/runs/d01')).some((x) => x.includes('delivery-repair')));
    cases.push({ id: 'P02', observed: { before, after, noRepairRun: true, controlledPort: true } });
  }
  // P03: Existing old-command failure / repair approval cannot enter first new group attempt.
  {
    const t = fixture();
    writePackage(t.root, (p) => { (p.scripts as Record<string,string>)['test:full'] = 'node foreground.ts fail'; });
    const failed = await formal(t.root);
    assert.ok(failed.run?.fullTest);
    assert.equal(failed.run.fullTest.outcome, 'failed');
    const original = fs.readFileSync(path.join(t.root, failed.run.ref));
    const author = startDeliveryRepair({ project: t.root, role: 'author', actor: authorActor,
      from: failed.run.ref, reason: '004 fixture repair' });
    finishRepair(t.root, author.run.ref);
    const reviewer = startDeliveryReview({ project: t.root, role: 'reviewer', actor: reviewActor, authorRunRef: author.run.ref });
    finishRepair(t.root, reviewer.run.ref, 'reviewer', 'complete', 'approved');
    writePackage(t.root, (p) => { (p.scripts as Record<string,string>)['test:full'] = 'node group-runner.ts'; });
    writeGroupInput(t.root, { ...t.declaration, fromRunRef: reviewer.run.ref });
    const manifest: { testAttemptRunRef?: string } = JSON.parse(
      fs.readFileSync(path.join(t.root, '.mendi/delivery-groups/d01/manifest.json'), 'utf8'));
    assert.equal(manifest.testAttemptRunRef, undefined);
    let rejected: { message: string; code?: string } | null = null;
    try {
      groupAdmission(t.root, { ...fullInput(t.root), inputFile: 'group-input.json' });
    } catch (err: unknown) {
      if (!(err instanceof Error)) throw err;
      rejected = { message: err.message, ...('code' in err ? { code: String(err.code) } : {}) };
    }
    assert.ok(rejected);
    assert.match(rejected.message, /当前 attempt/);
    assert.ok(fs.readFileSync(path.join(t.root, failed.run.ref)).equals(original));
    cases.push({ id: 'P03', observed: { rejection: rejected, originalFailedUnchanged: true, reviewRunRef: reviewer.run.ref, approvedIsFixtureOnly: true } });
  }
  // P04: Existing product still considers selected retest + old passed groups verified.
  {
    const t = fixture();
    fs.writeFileSync(path.join(t.root, 'middle.test.ts'),
      "import test from 'node:test';test('original failure',()=>{throw Error('004 original')});");
    const first = attemptResult(await groupRun(t.root));
    const before = observe(first, t.root);
    assert.deepEqual(before.progress.map((x) => x.state), ['passed', 'failed', 'passed']);
    const c2 = { ...groupCandidate, id: '004-repaired', basis: { ...groupCandidate.basis, changes: 'only middle fixture changed' } };
    fs.writeFileSync(path.join(t.root, 'middle.test.ts'), "import test from 'node:test';test('fixed',()=>{});");
    fs.writeFileSync(path.join(t.root, 'impact.json'), JSON.stringify({
      candidate: c2, extent: 'local', affectedGroupIds: ['middle'],
      retained: [{ id: 'prefix', reason: 'unchanged' }, { id: 'tail', reason: 'unchanged' }],
      reason: 'fixture middle-only change',
    }));
    const author = startDeliveryRepair({ project: t.root, role: 'author', actor: authorActor,
      from: first.run.ref, inputFile: 'impact.json', reason: '004 local fixture repair' });
    finishRepair(t.root, author.run.ref);
    const reviewer = startDeliveryReview({ project: t.root, role: 'reviewer', actor: reviewActor, authorRunRef: author.run.ref });
    finishRepair(t.root, reviewer.run.ref, 'reviewer', 'complete', 'approved');
    writeGroupInput(t.root, { ...t.declaration, purpose: 'retest', candidate: c2,
      selection: ['middle'], fromRunRef: reviewer.run.ref });
    const selected = attemptResult(await groupRun(t.root));
    assert.deepEqual(selected.run.attempt?.selection, ['middle']);
    const source = ['prefix', 'middle', 'tail'].map((id) => ({
      id, runRef: id === 'middle' ? selected.run.ref : first.run.ref,
      applicability: 'test-only approved fixture',
    }));
    fs.writeFileSync(path.join(t.root, 'verify.json'),
      JSON.stringify({ fromRunRef: selected.run.ref, planRef: 'group-plan.json', candidate: c2, sources: source }));
    const verified = createVerification({ project: t.root, inputFile: 'verify.json', role: 'author', actor: authorActor });
    assert.equal(verified.candidateVerification?.conclusion, 'verified');
    cases.push({ id: 'P04', observed: { selected: selected.run.attempt?.selection,
      verification: verified.candidateVerification?.conclusion, sourceRuns: source } });
  }

  assert.equal(cases.length, 4);
  // The previous proof enumerated ALL post-start .tmp/mendi-apply-* directories.
  // This replacement deletes ONLY exact parent directories captured from own fixture calls.
  const cleanup = cleanupOwnedFixtures();
  assert.equal(cleanup.deleted.length, 4);
  assert.equal(cleanup.markerVerified, 4);
  assert.ok(cleanup.sentinelPreserved);
  const result = {
    status: 'passed', timestamp: new Date().toISOString(),
    proof: 'D05-A 004-revise-explore',
    cases,
    cleanup: { fixturePathsVerifiedAndDeleted: cleanup.deleted.length,
      eachUsedExplicitOwnerMarker: true, unrelatedSamePrefixDirectoryPreserved: cleanup.sentinelPreserved },
    boundaries: [
      'Real fixture execution, not a MenDi root formal Full Test',
      'Fixture role labels are not a real independent approval',
      'Known blocked port is narrower than all environmental failed cases',
      'Unconfirmed/locked fixture must not be deleted; this script stops before cleanup on error',
    ],
  };
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: result.status, proofIds: cases.map((x) => x.id),
    cleanup: result.cleanup, evidence: path.relative(repo, outputPath) }, null, 2));
}
await run();
