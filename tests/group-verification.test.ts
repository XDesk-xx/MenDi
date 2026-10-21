import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupTarget,
  groupRun,
  attemptResult,
  writeGroupInput,
  recordApplyScene,
} from './group-support.ts';
import { createVerification } from '../src/application/candidate-verification.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import {
  finishRepair,
  authorActor,
  reviewActor,
  fullInput,
  legacyFullTestStatus,
} from './delivery-support.ts';
import { writeLegacyCommand } from './fixtures/legacy-command.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { renderRun } from '../src/adapters/runs.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';

test('v2 正式重跑拒绝修订后的陈旧 approved、changes-requested 与 rejected', async () => {
  const { root, declaration } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('real failure',()=>{throw Error('defect')});",
  );
  const failed = attemptResult(await groupRun(root));
  const candidate = { ...declaration.candidate, id: 'reviewed-repair' };
  fs.writeFileSync(
    path.join(root, 'impact.json'),
    JSON.stringify({
      candidate,
      extent: 'common',
      affectedGroupIds: declaration.selection,
      retained: [],
      reason: '真实失败修复范围',
    }),
  );
  const start = (revisesRunRef?: string) =>
    startDeliveryRepair({
      project: root,
      role: 'author',
      actor: authorActor,
      from: failed.run.ref,
      reason: '修订当前实质修复',
      inputFile: 'impact.json',
      ...(revisesRunRef ? { revisesRunRef } : {}),
    });
  const author = start();
  finishRepair(root, author.run.ref);
  const review = startDeliveryReview({
    project: root,
    role: 'reviewer',
    actor: reviewActor,
    authorRunRef: author.run.ref,
  });
  finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
  const revision = start(author.run.ref);
  finishRepair(root, revision.run.ref);
  const rejectRun = async (fromRunRef: string) => {
    const number = scanRunNumbers(root, 'd01').number;
    writeGroupInput(root, { ...declaration, candidate, fromRunRef });
    assert.equal((await groupRun(root)).ok, false);
    assert.equal(scanRunNumbers(root, 'd01').number, number);
  };
  await rejectRun(review.run.ref);
  let currentReview = startDeliveryReview({
    project: root,
    role: 'reviewer',
    actor: reviewActor,
    authorRunRef: revision.run.ref,
  });
  finishRepair(root, currentReview.run.ref, 'reviewer', 'complete', 'changes-requested');
  await rejectRun(currentReview.run.ref);
  const finalAuthor = start(revision.run.ref);
  finishRepair(root, finalAuthor.run.ref);
  currentReview = startDeliveryReview({
    project: root,
    role: 'reviewer',
    actor: reviewActor,
    authorRunRef: finalAuthor.run.ref,
  });
  finishRepair(root, currentReview.run.ref, 'reviewer', 'complete', 'rejected');
  await rejectRun(currentReview.run.ref);
});

for (const legacy of [false, true])
  test(`P03 ${legacy ? '旧 command' : 'v2 group'} failed → 当前修复 / 独立审核 → 新全量，原失败不变`, async () => {
    const { root, declaration } = groupTarget();
    fs.writeFileSync(
      path.join(root, 'middle.test.ts'),
      "import test from 'node:test';test('actual failure',()=>{throw Error('business')});",
    );
    if (legacy) {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      pkg.scripts['test:full'] = 'node --test middle.test.ts';
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg));
    }
    const failed = legacy ? await writeLegacyCommand(fullInput(root)) : await groupRun(root);
    assert.ok(failed.run, JSON.stringify(failed));
    assert.equal(failed.run.result, 'failed');
    const original = fs.readFileSync(path.join(root, failed.run.ref));
    const c2 = {
      ...declaration.candidate,
      id: 'fixed',
      basis: { ...declaration.candidate.basis, changes: '修复实际失败断言' },
    };
    fs.writeFileSync(
      path.join(root, 'impact.json'),
      JSON.stringify({
        candidate: c2,
        extent: 'common',
        affectedGroupIds: declaration.selection,
        retained: [],
        reason: '重新完整运行全部必需组',
      }),
    );
    const repair = startDeliveryRepair({
      project: root,
      role: 'author',
      actor: authorActor,
      from: failed.run.ref,
      reason: '实质修复',
      ...(legacy ? {} : { inputFile: 'impact.json' }),
    });
    finishRepair(root, repair.run.ref);
    assert.throws(
      () =>
        startDeliveryReview({
          project: root,
          role: 'reviewer',
          actor: authorActor,
          authorRunRef: repair.run.ref,
        }),
      /不能|Reviewer/,
    );
    writeGroupInput(root, { ...declaration, candidate: c2, fromRunRef: repair.run.ref });
    assert.equal((await groupRun(root)).ok, false);
    const review = startDeliveryReview({
      project: root,
      role: 'reviewer',
      actor: reviewActor,
      authorRunRef: repair.run.ref,
    });
    finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
    const document = readDeliveryRun(root, review.run.ref, 'd01');
    const approved = fs.readFileSync(path.join(root, review.run.ref));
    fs.writeFileSync(path.join(root, review.run.ref), renderRun(document.header, ''));
    writeGroupInput(root, { ...declaration, candidate: c2, fromRunRef: review.run.ref });
    assert.equal((await groupRun(root)).ok, false);
    fs.writeFileSync(path.join(root, review.run.ref), approved);
    fs.writeFileSync(
      path.join(root, 'middle.test.ts'),
      "import test from 'node:test';test('fixed real assertion',()=>{});",
    );
    if (legacy) {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      pkg.scripts['test:full'] = 'node group-runner.ts';
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg));
    }
    for (const patch of [
      { purpose: 'retest' },
      { purpose: 'continue' },
      { selection: ['middle'] },
      { fromRunRef: repair.run.ref },
    ]) {
      writeGroupInput(root, {
        ...declaration,
        candidate: c2,
        fromRunRef: review.run.ref,
        ...patch,
      });
      const number = scanRunNumbers(root, 'd01').number;
      assert.equal((await groupRun(root)).ok, false);
      assert.equal(scanRunNumbers(root, 'd01').number, number);
    }
    writeGroupInput(root, { ...declaration, candidate: c2, fromRunRef: review.run.ref });
    const full = attemptResult(await groupRun(root));
    assert.equal(full.ok, true, JSON.stringify(full));
    assert.equal(full.run.attempt!.formalOutcome, 'passed');
    assert.equal(full.run.attempt!.repairApproval!.reviewRunRef, review.run.ref);
    assert.deepEqual(
      full.run.attempt!.progress.map((p) => p.sourceRunRef),
      declaration.selection.map(() => full.run.ref),
    );
    assert.ok(fs.readFileSync(path.join(root, failed.run.ref)).equals(original));
    if (legacy)
      assert.equal(
        legacyFullTestStatus({ project: root, runRef: failed.run.ref }).verification.outcome,
        'failed',
      );
    const number = scanRunNumbers(root, 'd01').number;
    assert.throws(
      () =>
        createVerification({
          project: root,
          role: 'author',
          actor: authorActor,
          inputFile: 'anything.json',
        }),
      /不再新建|完整/,
    );
    assert.equal(scanRunNumbers(root, 'd01').number, number);
    if (legacy) {
      const child = legacyFullTestStatus({ project: root, runRef: failed.run.ref }).verification
        .child!;
      recordApplyScene('P03-P04-legacy-repair-full', root, full, {
        originalFailure: failed.run,
        originalChild: child,
        originalStdout: fs.readFileSync(path.join(root, child.stdoutRef), 'utf8'),
        originalStderr: fs.readFileSync(path.join(root, child.stderrRef), 'utf8'),
        verificationCreate: 'historical-verification-read-only; 不占号断言通过',
      });
      fs.writeFileSync(
        path.join(root, 'close.json'),
        JSON.stringify({
          testAttemptRunRef: full.run.ref,
          applicability: {
            conclusion: 'applicable',
            materials: c2.basis.materials,
            changes: c2.basis.changes,
            reason: '修复后真实完整重跑',
          },
        }),
      );
      assert.equal(
        deliveryLifecycle('delivery-close', {
          project: root,
          role: 'author',
          actor: authorActor,
          inputFile: 'close.json',
        }).local.state,
        'closed',
      );
      assert.equal(readWorkspace(root)!.manifest.fullTestRunRef, failed.run.ref);
    }
  });
