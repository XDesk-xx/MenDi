import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { repository, cli, isolatedEnv } from '../../tests/helpers.ts';
import {
  sequentialTarget,
  associateSecond,
  approvedArchive,
} from '../../tests/sequential-support.ts';
import { execute, statusCli, writePackage } from '../../tests/test-support.ts';
import { archiveInput } from '../../tests/archive-support.ts';
import { archiveAction } from '../../src/application/archive.ts';
import { readWorkspace } from '../../src/adapters/workspace.ts';
import { readRun } from '../../src/adapters/runs.ts';
import { managedPath } from '../../src/adapters/paths.ts';

// 仅 Explore 实验：使用真实现有产品执行器，未实现正式 Full Test 或认证真人 Review。
const output = path.resolve(process.argv[2]);
assert.ok(!fs.existsSync(output), '另选新证据目录，不覆盖旧结果');
fs.mkdirSync(output, { recursive: true });
process.env.MENDI_TEST_EVIDENCE_DIR = path.join(output, 'commands');
const scenes: Record<string, unknown>[] = [];
const target = sequentialTarget();
const root = target.root;
associateSecond(root);
const second = approvedArchive(root, 'second-entry');
const archived = archiveAction(archiveInput(root, second.run.ref));
assert.equal(archived.result, 'archived');
const workspace = readWorkspace(root)!;
assert.equal(workspace.activeChangeId, null);
assert.equal(workspace.project.archivedChangeCount, 2);
assert.deepEqual(
  workspace.bindings.map((b) => b.state),
  ['archived', 'archived'],
);
for (const binding of workspace.bindings) {
  const run = readRun(root, binding.latestRunRef!, 'd01', binding.changeId);
  assert.ok(run.record.archive?.attemptRef);
  fs.copyFileSync(
    managedPath(root, `${run.record.archive.attemptRef}/native-result.json`),
    path.join(output, `${binding.changeId}-native-archive.json`),
  );
}
const lifecycleRefs = [
  '.mendi/project.json',
  '.mendi/delivery-groups/d01/manifest.json',
  ...workspace.bindings.map((binding) => binding.latestRunRef!),
];
const lifecycle = lifecycleRefs.map((ref) => fs.readFileSync(managedPath(root, ref)));
function lifecycleUnchanged() {
  lifecycleRefs.forEach((ref, i) =>
    assert.deepEqual(fs.readFileSync(managedPath(root, ref)), lifecycle[i]),
  );
}
function executionRecord(result: Awaited<ReturnType<typeof execute>>) {
  const record = 'record' in result ? result.record : result.observed;
  assert.ok(record);
  assert.equal(record.executionState, 'finished');
  assert.equal(record.formalDeliveryTest, false);
  assert.equal(record.scope, 'command');
  return record;
}
const plain = executionRecord(await execute(root, 'full'));
assert.equal(plain.outcome, 'passed');
assert.equal(plain.changeId, null);
assert.equal(statusCli(root, plain.executionId).record.formalDeliveryTest, false);
lifecycleUnchanged();
scenes.push({
  id: 'P01',
  archivedChanges: 2,
  ordinaryFull: plain.executionId,
  outcome: plain.outcome,
  formalDeliveryTest: false,
  lifecycleUnchanged: true,
});

fs.cpSync(path.join(repository, 'tests/fixtures/full-test-project'), root, { recursive: true });
writePackage(root, (pkg) => {
  pkg.scripts = {
    'test:focused': 'node --test integration.test.ts',
    'test:fast': 'node --test unit.test.ts',
    'test:full': 'node --test --test-concurrency=1 integration.test.ts unit.test.ts',
  };
});
const materialRefs = ['producer.ts', 'consumer.ts', 'integration.test.ts', 'unit.test.ts'];
// 按实验真实读取的材料做字节比较，无文件 hash 清单、全库 gate 或历史链。
function material() {
  const pkg = JSON.parse(fs.readFileSync(managedPath(root, 'package.json'), 'utf8'));
  return {
    files: materialRefs.map((ref) => fs.readFileSync(managedPath(root, ref), 'utf8')),
    fullScript: pkg.scripts['test:full'],
  };
}
function saveMaterial(folder: string) {
  const home = path.join(output, folder);
  fs.mkdirSync(home);
  for (const ref of [...materialRefs, 'package.json'])
    fs.copyFileSync(managedPath(root, ref), path.join(home, ref));
}
function groupOffset() {
  const file = path.join(root, 'executed-groups.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').length : 0;
}
function newGroups(offset: number) {
  return fs
    .readFileSync(path.join(root, 'executed-groups.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .slice(offset)
    .map((line) => JSON.parse(line).group);
}
const original = material();
saveMaterial('before-repair');
let offset = groupOffset();
const failed = executionRecord(await execute(root, 'full'));
assert.equal(failed.outcome, 'failed');
assert.notEqual(failed.exitCode, 0);
assert.deepEqual(newGroups(offset), ['integration', 'unit']);
assert.equal(statusCli(root, failed.executionId).record.outcome, 'failed');
const failedRefs = [
  failed.stdoutRef,
  failed.stderrRef,
  `.mendi/delivery-groups/d01/tests/${failed.executionId}/result.json`,
];
const failedBytes = failedRefs.map((ref) => fs.readFileSync(managedPath(root, ref)));
scenes.push({
  id: 'P02',
  execution: failed.executionId,
  outcome: failed.outcome,
  exitCode: failed.exitCode,
  groups: newGroups(offset),
  freshProcessRead: 'failed',
});

const producer = managedPath(root, 'producer.ts');
assert.ok(fs.readFileSync(producer, 'utf8').includes("kind: 'change-completed'"));
fs.writeFileSync(
  producer,
  fs.readFileSync(producer, 'utf8').replace("kind: 'change-completed'", "kind: 'change-archived'"),
);
assert.notDeepEqual(material(), original);
offset = groupOffset();
const focused = executionRecord(await execute(root));
assert.equal(focused.outcome, 'passed');
assert.deepEqual(newGroups(offset), ['integration']);
const env = isolatedEnv(path.dirname(root));
const repairAuthor = readRun(root, second.run.ref, 'd01', 'second-entry').record.archive!
  .authorRunRef;
const repair = cli(
  [
    'action',
    'start',
    '--project',
    root,
    '--change',
    'second-entry',
    '--type',
    'revise-apply',
    '--revises',
    repairAuthor,
    '--role',
    'author',
    '--actor',
    'repair-author',
    '--json',
  ],
  path.dirname(root),
  env,
);
assert.equal(repair.status, 1);
const repairError = JSON.parse(repair.stdout).error.code;
assert.equal(repairError, 'invalid-action');
saveMaterial('after-repair');
const reviewFixture = {
  fixtureOnly: true,
  authorActor: 'fixture-author',
  reviewerActor: 'fixture-reviewer',
  verdict: 'approved',
  materials: material(),
};
assert.notEqual(reviewFixture.authorActor, reviewFixture.reviewerActor);
// 这是审核声明的适用性实验，不能替代当前仓库独立 Reviewer。
fs.writeFileSync(
  path.join(output, 'review-fixture.json'),
  JSON.stringify(reviewFixture, null, 2) + '\n',
);
fs.writeFileSync(path.join(root, 'explanation.md'), '只有说明变动，不影响受测代码或命令。\n');
assert.deepEqual(material(), reviewFixture.materials);
writePackage(root, (pkg) => {
  (pkg.scripts as Record<string, string>)['test:full'] += ' --test-name-pattern=consumer';
});
assert.notDeepEqual(material(), reviewFixture.materials);
writePackage(root, (pkg) => {
  (pkg.scripts as Record<string, string>)['test:full'] = reviewFixture.materials.fullScript;
});
assert.deepEqual(material(), reviewFixture.materials);
assert.throws(() => managedPath(root, '../outside.ts'), /受管引用/);
fs.renameSync(producer, producer + '.missing');
assert.throws(() => material(), { code: 'ENOENT' });
fs.renameSync(producer + '.missing', producer);
scenes.push({
  id: 'P03',
  focused: focused.executionId,
  groups: ['integration'],
  oldReviewBasisStale: true,
  afterArchiveRepair: repairError,
  independentReview: 'fixture declaration only',
  documentationOnlyPreservesBasis: true,
  changedFullScriptInvalidatesBasis: true,
  missingMaterialRejected: true,
  pathEscapeRejected: true,
});

assert.deepEqual(material(), reviewFixture.materials);
offset = groupOffset();
const rerun = executionRecord(await execute(root, 'full'));
assert.equal(rerun.outcome, 'passed');
assert.equal(rerun.exitCode, 0);
assert.deepEqual(newGroups(offset), ['integration', 'unit']);
assert.notEqual(rerun.executionId, failed.executionId);
failedRefs.forEach((ref, i) =>
  assert.deepEqual(fs.readFileSync(managedPath(root, ref)), failedBytes[i]),
);
assert.equal(statusCli(root, failed.executionId).record.outcome, 'failed');
assert.equal(statusCli(root, rerun.executionId).record.outcome, 'passed');
lifecycleUnchanged();
fs.copyFileSync(
  path.join(root, 'executed-groups.jsonl'),
  path.join(output, 'executed-groups.jsonl'),
);
scenes.push({
  id: 'P04',
  execution: rerun.executionId,
  outcome: rerun.outcome,
  groups: newGroups(offset),
  oldFailureBytesPreserved: true,
  lifecycleUnchanged: true,
  formalDeliveryTest: false,
});
fs.writeFileSync(
  path.join(output, 'report.json'),
  JSON.stringify(
    {
      role: 'author',
      purpose: 'Explore-only bounded experiment',
      target: root,
      scenes,
      limitations: [
        '阶段与审核前置均为受控声明，未认证真人身份。',
        '所有执行均为现有普通 command，未实现或执行根项目正式 Full Test。',
        '适用性仅比较本实验已知输入；生产协议、并发及跨进程当前正式结果选择留给 Propose / Apply。',
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({
    outcome: 'proof-supported',
    groups: scenes.length,
    report: path.join(output, 'report.json'),
  }),
);
