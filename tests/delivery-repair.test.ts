import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formal,
  verificationTarget,
  finishRepair,
  authorActor,
  reviewActor,
  manifest,
} from './delivery-support.ts';
import { startDeliveryRepair, startDeliveryReview } from '../src/application/delivery-repair.ts';
import { continueAction, saveRun, submitRun } from '../src/application/actions.ts';
import { writePackage, execute } from './test-support.ts';
import { query, bindChange } from '../src/application/project.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { scanRunNumbers, renderRun } from '../src/adapters/runs.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { fullTestStatus } from '../src/application/delivery-full-test.ts';
import { completedTarget } from './delivery-support.ts';
import { cli, isolatedEnv } from './helpers.ts';

async function failed() {
  const root = verificationTarget();
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts fail';
  });
  const result = await formal(root);
  assert.equal(result.run!.fullTest!.outcome, 'failed');
  return { root, ref: result.run!.ref };
}
function repair(root: string, from: string, revisesRunRef?: string) {
  return startDeliveryRepair({
    project: root,
    from,
    reason: '原范围内接线修复',
    role: 'author',
    actor: authorActor,
    ...(revisesRunRef ? { revisesRunRef } : {}),
  });
}
function review(root: string, authorRunRef: string) {
  return startDeliveryReview({ project: root, authorRunRef, role: 'reviewer', actor: reviewActor });
}
test('修复 / Review continuing 保持 Action 与 Author；草稿只读本地、提交需要真实对象', async () => {
  const { root, ref } = await failed();
  const failure = fs.readFileSync(path.join(root, ref));
  const before = readWorkspace(root)!;
  const started = repair(root, ref);
  assert.equal(readWorkspace(root)!.activeChangeId, null);
  assert.deepEqual(readWorkspace(root)!.bindings, before.bindings);
  assert.equal(started.methods.stage.ref, 'skills/actions/delivery-repair/SKILL.md');
  assert.throws(() =>
    saveRun({
      project: root,
      runRef: started.run.ref,
      role: 'author',
      actor: 'wrong',
      bodyFile: 'absent.md',
    }),
  );
  assert.throws(() =>
    submitRun({
      project: root,
      runRef: started.run.ref,
      role: 'author',
      actor: authorActor,
      outcome: 'complete',
      result: 'empty',
    }),
  );
  finishRepair(root, started.run.ref, 'author', 'continuing');
  const continued = continueAction({
    project: root,
    actionId: started.run.actionId,
    role: 'author',
    actor: authorActor,
  });
  assert.equal(continued.run.actionId, started.run.actionId);
  finishRepair(root, continued.run.ref);
  assert.throws(
    () =>
      startDeliveryReview({
        project: root,
        authorRunRef: continued.run.ref,
        role: 'reviewer',
        actor: authorActor,
      }),
    /Reviewer/,
  );
  assert.throws(() => review(root, started.run.ref));
  const r = review(root, continued.run.ref);
  assert.equal(r.methods.stage.ref, 'skills/actions/review-delivery-repair/SKILL.md');
  finishRepair(root, r.run.ref, 'reviewer', 'continuing');
  const rc = continueAction({
    project: root,
    actionId: r.run.actionId,
    role: 'reviewer',
    actor: reviewActor,
  });
  assert.equal(rc.run.authorRunRef, continued.run.ref);
  const authorFile = path.join(root, continued.run.ref);
  const authorBytes = fs.readFileSync(authorFile);
  fs.unlinkSync(authorFile);
  const current = query({ project: root });
  assert.ok('run' in current);
  assert.equal(current.run!.ref, rc.run.ref);
  const bodyFile = path.join(root, 'note.md');
  fs.writeFileSync(bodyFile, '缺 Author 的故障说明');
  saveRun({ project: root, runRef: rc.run.ref, role: 'reviewer', actor: reviewActor, bodyFile });
  assert.throws(() =>
    submitRun({
      project: root,
      runRef: rc.run.ref,
      role: 'reviewer',
      actor: reviewActor,
      outcome: 'complete',
      result: 'bad',
      verdict: 'approved',
    }),
  );
  fs.writeFileSync(authorFile, authorBytes);
  finishRepair(root, rc.run.ref, 'reviewer', 'complete', 'approved');
  assert.equal(query({ project: root }).next.action, 'delivery-full-test');
  assert.deepEqual(fs.readFileSync(path.join(root, ref)), failure);
});
test('changes-requested / 主动修订替换旧批准；rejected 停 Owner，不能普通继续', async () => {
  const { root, ref } = await failed();
  const a = repair(root, ref);
  finishRepair(root, a.run.ref);
  const r = review(root, a.run.ref);
  finishRepair(root, r.run.ref, 'reviewer', 'complete', 'changes-requested');
  const bytes = fs.readFileSync(path.join(root, r.run.ref));
  const revision = repair(root, ref, a.run.ref);
  finishRepair(root, revision.run.ref);
  assert.equal(revision.run.actionType, 'revise-delivery-repair');
  assert.equal((await formal(root)).ok, false);
  const rr = review(root, revision.run.ref);
  finishRepair(root, rr.run.ref, 'reviewer', 'complete', 'approved');
  const approved = fs.readFileSync(path.join(root, rr.run.ref));
  const proactive = repair(root, ref, revision.run.ref);
  assert.equal((await formal(root)).ok, false);
  assert.deepEqual(fs.readFileSync(path.join(root, rr.run.ref)), approved);
  finishRepair(root, proactive.run.ref);
  const rejected = review(root, proactive.run.ref);
  finishRepair(root, rejected.run.ref, 'reviewer', 'complete', 'rejected');
  assert.equal(query({ project: root }).next.action, 'owner-decision');
  assert.throws(() => repair(root, ref, proactive.run.ref));
  assert.throws(() =>
    continueAction({
      project: root,
      actionId: rejected.run.actionId,
      role: 'reviewer',
      actor: reviewActor,
    }),
  );
  assert.throws(() => bindChange({ project: root, slot: 'C', changeId: 'third-entry' }));
  assert.deepEqual(fs.readFileSync(path.join(root, r.run.ref)), bytes);
});
test('修复拒绝普通 / 旧失败，普通 submit / continue 不认证正式 full', async () => {
  const { root, ref } = await failed();
  const ordinary = await execute(root, 'fast');
  assert.throws(() => repair(root, ordinary.executionId!));
  assert.throws(() =>
    submitRun({
      project: root,
      runRef: ref,
      role: 'author',
      actor: authorActor,
      outcome: 'complete',
      result: 'passed',
    }),
  );
  const current = query({ project: root });
  assert.ok('run' in current);
  assert.throws(() =>
    continueAction({
      project: root,
      actionId: current.run!.actionId,
      role: 'author',
      actor: authorActor,
    }),
  );
  const a = repair(root, ref);
  finishRepair(root, a.run.ref);
  const r = review(root, a.run.ref);
  finishRepair(root, r.run.ref, 'reviewer', 'complete', 'approved');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'full-test.json'), 'utf8'));
  data.collection = ['单元场景'];
  fs.writeFileSync(path.join(root, 'full-test.json'), JSON.stringify(data));
  assert.equal((await formal(root)).ok, false);
  data.collection = ['单元场景', '跨 Change 接线场景'];
  fs.writeFileSync(path.join(root, 'full-test.json'), JSON.stringify(data));
  const fresh = await formal(root);
  assert.equal(fresh.run!.fullTest!.outcome, 'failed');
  assert.throws(() => repair(root, ref));
  fs.unlinkSync(path.join(root, ref));
  fs.unlinkSync(path.join(root, r.run.ref));
  fs.unlinkSync(path.join(root, a.run.ref));
  assert.equal(repair(root, fresh.run!.ref).run.actionType, 'delivery-repair');
});
test('两项真实归档 → 正式接线失败 → focused → 定向审核夹具 → 新整次执行及异目录新进程', async () => {
  const root = completedTarget(true);
  const data = manifest(root);
  const bindings = JSON.stringify(data.changeBindings);
  const archivedCount = readWorkspace(root)!.project.archivedChangeCount;
  const archivedRuns = data.changeBindings.map((binding: { latestRunRef: string }) => ({
    ref: binding.latestRunRef,
    bytes: fs.readFileSync(path.join(root, binding.latestRunRef)),
  }));
  const env = isolatedEnv(path.dirname(root));
  const args = [
    'delivery',
    'full-test',
    'run',
    '--project',
    root,
    '--input',
    'full-test.json',
    '--role',
    'author',
    '--actor',
    authorActor,
    '--pnpm-bin',
    'C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js',
    '--json',
  ];
  const failedCommand = cli(args, path.dirname(root), env);
  assert.equal(failedCommand.status, 1, failedCommand.stdout);
  const failedResult = JSON.parse(failedCommand.stdout);
  assert.equal(failedResult.verification.outcome, 'failed');
  assert.equal(failedResult.verification.child.exitCode, 1);
  const failureRef = failedResult.run.ref;
  const child = failedResult.verification.child;
  const files = [
    failureRef,
    `.mendi/delivery-groups/d01/tests/${child.executionId}/result.json`,
    child.stdoutRef,
    child.stderrRef,
  ];
  const bytes = files.map((f) => fs.readFileSync(path.join(root, f)));
  assert.match(bytes[2].toString(), /expected archived completion/);
  const startedCommand = cli(
    [
      'delivery',
      'repair',
      'start',
      '--project',
      root,
      '--from',
      failureRef,
      '--reason',
      '原范围内修复 producer 完成事件',
      '--role',
      'author',
      '--actor',
      authorActor,
      '--json',
    ],
    path.dirname(root),
    env,
  );
  assert.equal(startedCommand.status, 0, startedCommand.stdout);
  const a = JSON.parse(startedCommand.stdout);
  const producer = path.join(root, 'checks/producer.ts');
  fs.writeFileSync(
    producer,
    fs.readFileSync(producer, 'utf8').replace('change-completed', 'change-archived'),
  );
  assert.equal((await execute(root, 'focused')).ok, true);
  finishRepair(
    root,
    a.run.ref,
    'author',
    'complete',
    undefined,
    '受控 Author：producer.ts 的 kind 从 change-completed 修正为 change-archived；consumer / 单元 / 接线测试及完整集合未缩减，原真实 full exit 1，修复后真实 focused exit 0。仅验证记录协议，完整验收等待新 full；无 Git 基准。\n',
  );
  const reviewCommand = cli(
    [
      'delivery',
      'repair',
      'review',
      '--project',
      root,
      '--author-run',
      a.run.ref,
      '--role',
      'reviewer',
      '--actor',
      reviewActor,
      '--json',
    ],
    path.dirname(root),
    env,
  );
  assert.equal(reviewCommand.status, 0, reviewCommand.stdout);
  const r = JSON.parse(reviewCommand.stdout);
  finishRepair(root, r.run.ref, 'reviewer', 'complete', 'approved');
  const passedCommand = cli(args, path.dirname(root), env);
  assert.equal(passedCommand.status, 0, passedCommand.stdout);
  const passed = JSON.parse(passedCommand.stdout);
  assert.equal(passed.verification.outcome, 'passed');
  const groups = fs
    .readFileSync(path.join(root, 'executed-groups.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line).group);
  assert.equal(groups.filter((v) => v === 'unit').length, 2);
  assert.equal(groups.filter((v) => v === 'integration').length, 3);
  for (const [i, f] of files.entries())
    assert.deepEqual(fs.readFileSync(path.join(root, f)), bytes[i]);
  assert.equal(JSON.stringify(manifest(root).changeBindings), bindings);
  assert.equal(readWorkspace(root)!.project.archivedChangeCount, archivedCount);
  for (const archived of archivedRuns)
    assert.deepEqual(fs.readFileSync(path.join(root, archived.ref)), archived.bytes);
  const status = cli(['status', '--project', root, '--json'], path.dirname(root), env);
  assert.equal(status.status, 0, status.stdout);
  assert.equal(JSON.parse(status.stdout).run.ref, passed.run.ref);
  assert.equal(
    fullTestStatus({ project: root, runRef: failureRef }).verification.outcome,
    'failed',
  );
  const oldStatus = cli(
    ['delivery', 'full-test', 'status', '--project', root, '--run', failureRef, '--json'],
    path.dirname(root),
    env,
  );
  assert.equal(oldStatus.status, 0, oldStatus.stdout);
  assert.equal(JSON.parse(oldStatus.stdout).verification.outcome, 'failed');
  const evidence = process.env.MENDI_TEST_EVIDENCE_DIR;
  if (evidence)
    fs.appendFileSync(
      path.join(evidence, `integration-scenes-${process.pid}.jsonl`),
      JSON.stringify({
        root,
        failed: failedResult,
        passed,
        logs: {
          failed: { stdout: bytes[2].toString(), stderr: bytes[3].toString() },
          passed: {
            stdout: fs.readFileSync(path.join(root, passed.verification.child.stdoutRef), 'utf8'),
            stderr: fs.readFileSync(path.join(root, passed.verification.child.stderrRef), 'utf8'),
          },
        },
        groups,
        archivedBindingsUnchanged: true,
        failureBytesUnchanged: true,
        reviewFixtureOnly: true,
      }) + '\n',
    );
  const allocation = scanRunNumbers(root, 'd01');
  assert.equal(allocation.number, 19);
});

test('已审核的范围内 full 配置修复允许新整次运行，不追读原失败父链', async () => {
  const { root, ref } = await failed();
  const a = repair(root, ref);
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node foreground.ts pass';
  });
  finishRepair(
    root,
    a.run.ref,
    'author',
    'complete',
    undefined,
    '受控配置修复：完整集合不变，full script 从受控 fail 改为 pass；实际覆盖充分由 Reviewer 负责，不把字符串推断当覆盖认证。\n',
  );
  const r = review(root, a.run.ref);
  finishRepair(root, r.run.ref, 'reviewer', 'complete', 'approved');
  const passed = await formal(root);
  assert.equal(passed.ok, true, JSON.stringify(passed));
  fs.unlinkSync(path.join(root, ref));
  assert.equal((await formal(root)).ok, true);
  const reviewFile = path.join(root, r.run.ref);
  const approvedReview = fs.readFileSync(reviewFile);
  const readReview = readDeliveryRun(root, r.run.ref, 'd01');
  fs.writeFileSync(reviewFile, renderRun(readReview.header, ''));
  assert.equal((await formal(root)).ok, false);
  fs.writeFileSync(
    reviewFile,
    renderRun(
      {
        ...readReview.header,
        repair: { ...readReview.record.repair!, reason: '未审核的其他修复对象' },
      },
      readReview.body,
    ),
  );
  assert.equal((await formal(root)).ok, false);
  fs.writeFileSync(reviewFile, approvedReview);
});
