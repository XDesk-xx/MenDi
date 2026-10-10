import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { verificationTarget, formal, finishRepair, authorActor, reviewActor } from '../../../../../../../tests/delivery-support.ts';
import { writePackage } from '../../../../../../../tests/test-support.ts';
import { startDeliveryRepair, startDeliveryReview } from '../../../../../../../src/application/delivery-repair.ts';
import { readDeliveryRun } from '../../../../../../../src/adapters/delivery-runs.ts';
import { renderRun } from '../../../../../../../src/adapters/runs.ts';
import { query } from '../../../../../../../src/application/project.ts';
import { acquireProjectLock, releaseProjectLock } from '../../../../../../../src/adapters/workspace.ts';

// Independent review evidence: fresh controlled target, no changes to product implementation.
const root = verificationTarget();
writePackage(root, (p) => { (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts fail'; });
const failed = await formal(root);
assert.equal(failed.run!.fullTest!.outcome, 'failed');
const author = startDeliveryRepair({ project: root, from: failed.run!.ref, reason: 'Controlled entry repair', role: 'author', actor: authorActor });
writePackage(root, (p) => { (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts pass'; });
finishRepair(root, author.run.ref);
const review = startDeliveryReview({ project: root, authorRunRef: author.run.ref, role: 'reviewer', actor: reviewActor });
finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
const approved = readDeliveryRun(root, review.run.ref, 'd01');
fs.writeFileSync(path.join(root, review.run.ref), renderRun(approved.header, ''));
const accepted = await formal(root);
assert.equal(accepted.ok, true, JSON.stringify(accepted));
console.log(JSON.stringify({ finding: 'RA-B-001', root, missingReviewBody: true, reviewRef: review.run.ref, accepted: accepted.ok, outcome: accepted.run!.fullTest!.outcome }));
fs.writeFileSync(path.join(root, review.run.ref), renderRun(approved.header, approved.body));

// Inject an actual competing lease just after query's initial workspace read,
// at the first direct result read. This models the interleaving deterministically.
const executionFile = path.join(root, '.mendi/delivery-groups/d01/tests', accepted.run!.fullTest!.executionId!, 'result.json');
const originalRead = fs.readFileSync;
let competing: ReturnType<typeof acquireProjectLock> | undefined;
fs.readFileSync = new Proxy(originalRead, {
  apply(target, receiver, args) {
    if (!competing && String(args[0]) === executionFile) competing = acquireProjectLock(root, 'review-controlled-competing-writer');
    return Reflect.apply(target, receiver, args);
  },
});
try {
  const observed = query({ project: root });
  assert.ok(competing);
  assert.ok('verification' in observed && observed.verification);
  assert.equal(observed.ok, false);
  assert.equal(observed.verification.outcome, 'unknown');
  assert.equal(observed.next.action, 'delivery-next');
  console.log(JSON.stringify({ finding: 'RA-B-002', root, ok: observed.ok, outcome: observed.verification.outcome, stable: observed.verification.stable, next: observed.next }));
} finally {
  fs.readFileSync = originalRead;
  if (competing) releaseProjectLock(root, competing);
}
