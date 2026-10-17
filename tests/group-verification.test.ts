import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupTarget,
  groupRun,
  attemptResult,
  writeGroupInput,
  groupCandidate,
} from './group-support.ts';
import {
  createVerification,
  verificationStatus,
} from '../src/application/candidate-verification.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import { finishRepair, authorActor, reviewActor } from './delivery-support.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { renderRun } from '../src/adapters/runs.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { query } from '../src/application/project.ts';
import { cli, isolatedEnv } from './helpers.ts';

function verify(root: string, fromRunRef: string, candidate: unknown, sources: unknown[]) {
  fs.writeFileSync(
    path.join(root, 'verify.json'),
    JSON.stringify({ fromRunRef, planRef: 'group-plan.json', candidate, sources }),
  );
  return createVerification({
    project: root,
    inputFile: 'verify.json',
    role: 'author',
    actor: authorActor,
  });
}

test('真实公共输入变化要求完整影响复验，不能用局部选择沿用旧前缀', async () => {
  const { root, declaration } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('failed',()=>{throw Error('repair trigger')});",
  );
  const failed = attemptResult(await groupRun(root));
  fs.writeFileSync(path.join(root, 'common.ts'), 'export const value=2;\n');
  for (const id of ['prefix', 'middle', 'tail'])
    fs.writeFileSync(
      path.join(root, `${id}.test.ts`),
      `import test from 'node:test';import assert from 'node:assert/strict';import {value} from './common.ts';test('${id} common contract',()=>assert.equal(value,2));\n`,
    );
  const c2 = {
    ...groupCandidate,
    id: 'common-2',
    basis: { ...groupCandidate.basis, changes: '全部测试接到新的共同契约输入 common.ts' },
  };
  const impact = {
    candidate: c2,
    extent: 'common',
    affectedGroupIds: ['prefix', 'middle', 'tail'],
    retained: [],
    reason: '实际共同模块及全部消费者改变，完整复验',
  };
  fs.writeFileSync(path.join(root, 'impact.json'), JSON.stringify(impact));
  const repair = startDeliveryRepair({
    project: root,
    role: 'author',
    actor: authorActor,
    from: failed.run.ref,
    inputFile: 'impact.json',
    reason: '公共契约修复',
  });
  finishRepair(root, repair.run.ref);
  const review = startDeliveryReview({
    project: root,
    role: 'reviewer',
    actor: reviewActor,
    authorRunRef: repair.run.ref,
  });
  finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
  writeGroupInput(root, {
    ...declaration,
    purpose: 'retest',
    candidate: c2,
    selection: ['middle'],
    fromRunRef: review.run.ref,
  });
  const reduced = await groupRun(root);
  assert.equal(reduced.ok, false);
  assert.equal('run' in reduced, false);
  writeGroupInput(root, {
    ...declaration,
    purpose: 'retest',
    candidate: c2,
    fromRunRef: review.run.ref,
  });
  const full = attemptResult(await groupRun(root));
  assert.equal(full.ok, true, JSON.stringify(full));
  assert.deepEqual(full.run.attempt!.selection, ['prefix', 'middle', 'tail']);
  const verified = verify(
    root,
    full.run.ref,
    c2,
    ['prefix', 'middle', 'tail'].map((id) => ({
      id,
      runRef: full.run.ref,
      applicability: '当前公共变化后的完整实际复验',
    })),
  );
  assert.equal(verified.ok, true);
});
test('真实失败→独立尾项续测→固定原失败修复与审核→局部复验→多来源 verified / Close', async () => {
  const { root, declaration } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';import assert from 'node:assert/strict';test('middle-contract',()=>assert.equal(1,2));",
  );
  fs.writeFileSync(path.join(root, 'group-control.json'), JSON.stringify({ stopAfter: 'middle' }));
  const first = attemptResult(await groupRun(root));
  const original = fs.readFileSync(path.join(root, first.run.ref));
  fs.writeFileSync(path.join(root, 'group-control.json'), '{}');
  writeGroupInput(root, {
    ...declaration,
    purpose: 'continue',
    selection: ['tail'],
    fromRunRef: first.run.ref,
  });
  const tail = attemptResult(await groupRun(root));
  // 真实业务契约修复；以下独立 actor / 审核正文仅是隔离产品准入夹具，不自签根 Change。
  const c2 = {
    ...groupCandidate,
    id: 'c2',
    basis: { ...groupCandidate.basis, changes: 'middle 断言修复；prefix / tail 的材料与配置保持' },
  };
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';import assert from 'node:assert/strict';test('middle-contract',()=>assert.equal(1,1));",
  );
  fs.writeFileSync(
    path.join(root, 'impact.json'),
    JSON.stringify({
      candidate: c2,
      extent: 'local',
      affectedGroupIds: ['middle'],
      retained: [
        { id: 'prefix', reason: 'prefix材料与依赖未受局部断言修复影响' },
        { id: 'tail', reason: 'tail材料与依赖未受局部断言修复影响' },
      ],
      reason: '只改受控 middle 断言，核对实际文件与定向结果',
    }),
  );
  const repair = startDeliveryRepair({
    project: root,
    role: 'author',
    actor: authorActor,
    from: first.run.ref,
    reason: '修复当前未解决中段契约',
    inputFile: 'impact.json',
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
    /相同/,
  );
  writeGroupInput(root, {
    ...declaration,
    purpose: 'retest',
    candidate: c2,
    selection: ['middle'],
    fromRunRef: repair.run.ref,
  });
  assert.equal((await groupRun(root)).ok, false);
  const review = startDeliveryReview({
    project: root,
    role: 'reviewer',
    actor: reviewActor,
    authorRunRef: repair.run.ref,
  });
  finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
  writeGroupInput(root, {
    ...declaration,
    purpose: 'retest',
    candidate: c2,
    selection: ['middle'],
    fromRunRef: review.run.ref,
  });
  const retest = attemptResult(await groupRun(root));
  assert.equal(retest.ok, true, JSON.stringify(retest));
  assert.deepEqual(retest.run.attempt!.selection, ['middle']);
  const sources = [
    {
      id: 'prefix',
      runRef: first.run.ref,
      applicability: '当前独立审核认可不受局部 middle 变化影响',
    },
    { id: 'middle', runRef: retest.run.ref, applicability: '当前候选实际复验' },
    { id: 'tail', runRef: tail.run.ref, applicability: '当前独立审核认可 tail 材料未变' },
  ];
  const verified = verify(root, retest.run.ref, c2, sources);
  assert.equal(verified.ok, true, JSON.stringify(verified));
  assert.equal(verified.candidateVerification.sources.length, 3);
  assert.ok(fs.readFileSync(path.join(root, first.run.ref)).equals(original));
  const verifiedBytes = fs.readFileSync(path.join(root, verified.run.ref));
  const current = readDeliveryRun(root, verified.run.ref, 'd01');
  fs.writeFileSync(
    path.join(root, verified.run.ref),
    renderRun(
      {
        ...current.header,
        verification: { ...current.record.verification!, repairImpact: undefined },
      },
      current.body,
    ),
  );
  assert.throws(() => verificationStatus({ project: root, runRef: verified.run.ref }), /影响|对象/);
  fs.writeFileSync(path.join(root, verified.run.ref), verifiedBytes);
  // 当前结论自足：查询 / Close 不递归旧失败日志和修复正文。
  fs.renameSync(path.join(root, first.run.ref), path.join(root, first.run.ref) + '.held');
  fs.renameSync(path.join(root, review.run.ref), path.join(root, review.run.ref) + '.held');
  assert.equal(
    verificationStatus({ project: root, runRef: verified.run.ref }).candidateVerification
      .conclusion,
    'verified',
  );
  assert.equal(query({ project: root }).next.action, 'delivery-next');
  fs.writeFileSync(
    path.join(root, 'close.json'),
    JSON.stringify({
      verificationRunRef: verified.run.ref,
      applicability: {
        conclusion: 'applicable',
        materials: c2.basis.materials,
        changes: c2.basis.changes,
        reason: '实际候选由当前多来源结论覆盖',
      },
    }),
  );
  const closed = deliveryLifecycle('delivery-close', {
    project: root,
    inputFile: 'close.json',
    role: 'author',
    actor: authorActor,
  });
  assert.equal(closed.ok, true);
  assert.equal(closed.local.state, 'closed');
  const read = cli(['status', '--project', root, '--json'], root, isolatedEnv(root));
  assert.equal(read.status, 0, read.stderr);
  assert.equal(JSON.parse(read.stdout).local.state, 'closed');
});
test('当前组复验失败后不得任选旧成功；缺来源 incomplete 和混合 Close 写前拒绝', async () => {
  const { root, declaration } = groupTarget();
  const first = attemptResult(await groupRun(root));
  const incomplete = verify(root, first.run.ref, groupCandidate, []);
  assert.equal(incomplete.ok, false);
  assert.equal(incomplete.candidateVerification.conclusion, 'incomplete');
  fs.writeFileSync(
    path.join(root, 'close.json'),
    JSON.stringify({
      verificationRunRef: incomplete.run.ref,
      fullTestRunRef: first.run.ref,
      applicability: { conclusion: 'applicable', materials: 'x', changes: '', reason: 'x' },
    }),
  );
  assert.throws(
    () =>
      deliveryLifecycle('delivery-close', {
        project: root,
        inputFile: 'close.json',
        role: 'author',
        actor: authorActor,
      }),
    /恰选/,
  );
  const fixedSources = first.run.attempt!.plan.groups.map((g) => ({
    id: g.id,
    runRef: first.run.ref,
    applicability: '补齐缺失的显式来源，不重跑已确认事实',
  }));
  const corrected = verify(root, incomplete.run.ref, groupCandidate, fixedSources);
  assert.equal(corrected.ok, true);
  assert.throws(
    () => verify(root, corrected.run.ref, groupCandidate, [...fixedSources, fixedSources[0]]),
    /重复/,
  );
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('later-failure',()=>{throw Error('new actual failure')});",
  );
  writeGroupInput(root, { ...declaration, fromRunRef: corrected.run.ref });
  const second = attemptResult(await groupRun(root));
  assert.equal(second.run.attempt!.progress[1].state, 'failed');
  const old = verify(
    root,
    second.run.ref,
    groupCandidate,
    first.run.attempt!.plan.groups.map((g) => ({
      id: g.id,
      runRef: first.run.ref,
      applicability: '试图任取旧成功',
    })),
  );
  assert.equal(old.ok, false);
  assert.ok(old.candidateVerification.gaps.some((g) => g.includes('当前仍有失败')));
  fs.writeFileSync(
    path.join(root, 'close.json'),
    JSON.stringify({
      verificationRunRef: old.run.ref,
      applicability: { conclusion: 'applicable', materials: 'x', changes: '', reason: 'x' },
    }),
  );
  assert.throws(
    () =>
      deliveryLifecycle('delivery-close', {
        project: root,
        inputFile: 'close.json',
        role: 'author',
        actor: authorActor,
      }),
    /verified/,
  );
});
