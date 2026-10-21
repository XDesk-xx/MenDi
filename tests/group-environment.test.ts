import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupTarget,
  writeGroupInput,
  groupRun,
  attemptResult,
  recordApplyScene,
} from './group-support.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import { finishRepair, authorActor, reviewActor, fullInput } from './delivery-support.ts';
import { runFullTest } from '../src/application/delivery-full-test.ts';

for (const preparationState of ['blocked', 'failed'])
  test(`P02 真实 ${preparationState} 准备失败，安全恢复后新全量，无空 Repair / Review`, async () => {
    const { root, declaration, plan } = groupTarget();
    if (preparationState === 'failed') {
      fs.writeFileSync(
        path.join(root, 'prepare.ts'),
        "import fs from 'node:fs';fs.accessSync('ready.txt');",
      );
      plan.groups[1] = {
        ...plan.groups[1],
        kind: 'command',
        selection: ['prepare.ts'],
        command: 'node prepare.ts',
        artifacts: [],
        completion: '真实准备命令确认 ready.txt 存在',
      };
      fs.writeFileSync(path.join(root, 'group-plan.json'), JSON.stringify(plan));
    }
    const input = {
      ...declaration,
      materialRefs: [
        'prefix.test.ts',
        'middle.test.ts',
        'tail.test.ts',
        'group-runner.ts',
        'group-control.json',
        ...(preparationState === 'failed' ? ['prepare.ts'] : []),
      ],
    };
    fs.writeFileSync(
      path.join(root, 'group-control.json'),
      JSON.stringify({ preparationFile: 'ready.txt', preparationState }),
    );
    writeGroupInput(root, input);
    const failed = attemptResult(await groupRun(root));
    assert.equal(failed.run.attempt!.formalOutcome, preparationState);
    const bytes = fs.readFileSync(path.join(root, failed.run.ref));
    const evidence = {
      failedRunRef: failed.run.ref,
      projectRoot: root,
      phase: 'preparation',
      cleanup: 'confirmed',
      contractUnchanged: true,
      resources: [
        {
          id: 'ready-file',
          projectRoot: root,
          identity: path.join(root, 'ready.txt'),
          ownership: 'project',
          state: 'recovered',
          cleanup: 'confirmed',
          preflight: '实际写入后 existsSync 确认，随后完整重跑',
        },
      ],
    };
    const recovery = {
      failedRunRef: failed.run.ref,
      evidenceRef: 'recovery.json',
      reason: '本项目准备文件恢复，无业务或执行语义变化',
    };
    writeGroupInput(root, { ...input, fromRunRef: failed.run.ref, environmentRecovery: recovery });
    const number = scanRunNumbers(root, 'd01').number;
    for (const bad of [
      { ...evidence, failedRunRef: 'wrong' },
      { ...evidence, contractUnchanged: false },
      { ...evidence, cleanup: 'unknown' },
      { ...evidence, resources: evidence.resources.map((r) => ({ ...r, ownership: 'external' })) },
      {
        ...evidence,
        resources: evidence.resources.map((r) => ({ ...r, identity: 'another-resource' })),
      },
    ]) {
      fs.writeFileSync(path.join(root, 'recovery.json'), JSON.stringify(bad));
      assert.equal((await groupRun(root)).ok, false);
      assert.equal(scanRunNumbers(root, 'd01').number, number);
    }
    fs.writeFileSync(path.join(root, 'recovery.json'), JSON.stringify(evidence));
    const original = fs.readFileSync(path.join(root, 'middle.test.ts'));
    fs.appendFileSync(
      path.join(root, 'middle.test.ts'),
      "\ntest('new actual assertion',()=>{if(1+1!==2)throw Error('contract')});\n",
    );
    assert.equal((await groupRun(root)).ok, false);
    fs.writeFileSync(path.join(root, 'middle.test.ts'), original);
    fs.writeFileSync(path.join(root, '.mendi/write.lock'), 'unknown-writer');
    assert.equal((await groupRun(root)).ok, false);
    // 本用例明确创建且未启动写者的负例锁，删除仅限此夹具。
    fs.unlinkSync(path.join(root, '.mendi/write.lock'));
    fs.writeFileSync(path.join(root, 'ready.txt'), 'owned-ready');
    assert.equal(fs.existsSync(path.join(root, 'ready.txt')), true);
    const complete = attemptResult(await groupRun(root));
    assert.equal(complete.ok, true, JSON.stringify(complete));
    assert.equal(complete.run.attempt!.environmentRecovery!.failedRunRef, failed.run.ref);
    assert.deepEqual(complete.run.attempt!.selection, declaration.selection);
    assert.equal(complete.run.runNumber, number);
    assert.ok(fs.readFileSync(path.join(root, failed.run.ref)).equals(bytes));
    recordApplyScene(`P02-${preparationState}`, root, complete, { failed: failed.run });
  });

test('普通业务失败不能只靠 environment 原因和自报资源身份绕过修复审核', async () => {
  const { root, declaration } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'middle.test.ts'),
    "import test from 'node:test';test('business',()=>{throw Error('real defect')});",
  );
  const input = { ...declaration, materialRefs: ['middle.test.ts', 'group-runner.ts'] };
  writeGroupInput(root, input);
  const failed = attemptResult(await groupRun(root));
  fs.writeFileSync(
    path.join(root, 'recovery.json'),
    JSON.stringify({
      failedRunRef: failed.run.ref,
      projectRoot: root,
      phase: 'preparation',
      cleanup: 'confirmed',
      contractUnchanged: true,
      resources: [
        {
          id: 'fake',
          projectRoot: root,
          identity: 'fake',
          ownership: 'project',
          state: 'recovered',
          cleanup: 'confirmed',
          preflight: 'claim',
        },
      ],
    }),
  );
  writeGroupInput(root, {
    ...input,
    fromRunRef: failed.run.ref,
    environmentRecovery: {
      failedRunRef: failed.run.ref,
      evidenceRef: 'recovery.json',
      reason: 'environment',
    },
  });
  assert.equal((await groupRun(root)).ok, false);
});

for (const gap of ['blocked', 'not-run'])
  test(`准备 ${gap} 后执行语义实变须走实际 Repair / 独立 Review，再完整重跑`, async () => {
    const { root, declaration } = groupTarget();
    fs.writeFileSync(
      path.join(root, 'group-control.json'),
      JSON.stringify({ preparationFile: 'ready.txt' }),
    );
    const blocked = attemptResult(
      gap === 'blocked'
        ? await groupRun(root)
        : await runFullTest({
            ...fullInput(root),
            inputFile: 'group-input.json',
            pnpmBin: path.join(root, 'missing.js'),
          }),
    );
    assert.equal(blocked.run.attempt!.formalOutcome, gap);
    const candidate = {
      ...declaration.candidate,
      id: 'prepared-fix',
      basis: {
        ...declaration.candidate.basis,
        changes: 'runner 先准备本项目 ready 文件，保留原资源检查与全部业务测试',
      },
    };
    fs.writeFileSync(
      path.join(root, 'impact.json'),
      JSON.stringify({
        candidate,
        extent: 'common',
        affectedGroupIds: declaration.selection,
        retained: [],
        reason: '真实准备入口语义修复',
      }),
    );
    const repair = startDeliveryRepair({
      project: root,
      role: 'author',
      actor: authorActor,
      from: blocked.run.ref,
      reason: '准备入口修复',
      inputFile: 'impact.json',
    });
    const runner = path.join(root, 'group-runner.ts');
    fs.writeFileSync(
      runner,
      fs
        .readFileSync(runner, 'utf8')
        .replace(
          'const requestFile =',
          "fs.writeFileSync('ready.txt','project-owned-ready');\nconst requestFile =",
        ),
    );
    finishRepair(root, repair.run.ref);
    const review = startDeliveryReview({
      project: root,
      role: 'reviewer',
      actor: reviewActor,
      authorRunRef: repair.run.ref,
    });
    finishRepair(root, review.run.ref, 'reviewer', 'complete', 'approved');
    writeGroupInput(root, { ...declaration, candidate, fromRunRef: review.run.ref });
    const passed = attemptResult(await groupRun(root));
    assert.equal(passed.ok, true, JSON.stringify(passed));
    assert.deepEqual(passed.run.attempt!.selection, declaration.selection);
  });

test('准备失败与 wrapper 零退出矛盾仍须修复，不因环境标签提示直接重跑', async () => {
  const { root, declaration } = groupTarget();
  fs.writeFileSync(
    path.join(root, 'group-control.json'),
    JSON.stringify({ preparationFile: 'ready.txt', wrapperZero: true }),
  );
  writeGroupInput(root, declaration);
  const invalid = attemptResult(await groupRun(root));
  assert.equal(invalid.run.attempt!.formalOutcome, 'invalid');
  assert.equal(invalid.next.action, 'delivery-repair');
});
