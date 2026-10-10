import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { repository, cli, isolatedEnv, prepareChange } from '../../tests/helpers.ts';
import {
  verificationTarget,
  formal,
  manifest,
  writeManifest,
  fullInput,
} from '../../tests/delivery-support.ts';
import { fullTestStatus, runFullTest } from '../../src/application/delivery-full-test.ts';
import { readDeliveryRun } from '../../src/adapters/delivery-runs.ts';
import { readExecution } from '../../src/adapters/test-store.ts';
import { bindChange } from '../../src/application/project.ts';
import { startAction } from '../../src/application/actions.ts';
import { parseProject, parseWorkspace } from '../../src/core/records.ts';
import { MendiError } from '../../src/core/errors.ts';

// 仅调查既有边界；closed / 范围扩展是明确夹具投影，不实现 Close / Reopen。
const output = path.resolve(process.argv[2]);
assert.ok(!fs.existsSync(output), '使用新证据目录，不覆盖旧结果');
fs.mkdirSync(output, { recursive: true });
process.env.MENDI_TEST_EVIDENCE_DIR = output;
const temporary = path.join(repository, '.tmp');
const coldTemporary =
  !fs.existsSync(temporary) || fs.readdirSync(temporary).every((name) => name === '.gitkeep');
const root = verificationTarget();
const env = isolatedEnv(path.dirname(root));
const first = await formal(root);
assert.equal(first.ok, true, JSON.stringify(first));
assert.ok(first.run?.fullTest?.executionId);
assert.equal(first.run.fullTest.outcome, 'passed');
const fullRef = first.run.ref;
const executionId = first.run.fullTest.executionId;
const fullBytes = fs.readFileSync(path.join(root, fullRef));
const scenes: Record<string, unknown>[] = [
  {
    id: 'P01',
    purpose: '从受控输入实际归档两项并产生真实正式结果',
    coldTemporary,
    root,
    fullRef,
    executionId,
    outcome: 'passed',
    fixtureReviewsOnly: true,
  },
];
function projectedError(value: Record<string, unknown>) {
  const project = JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8'));
  try {
    parseWorkspace(parseProject(project), value);
  } catch (error) {
    assert.ok(error instanceof MendiError);
    return { code: error.code, message: error.message };
  }
  assert.fail('当前产品模型应拒绝尚未支持的投影');
}
function queryCommand(args: string[], exit: number) {
  const result = cli([...args, '--project', root, '--json'], path.dirname(root), env);
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
function originalFullUnchanged() {
  assert.deepEqual(fs.readFileSync(path.join(root, fullRef)), fullBytes);
}
const originalManifest = manifest(root);
const deletedHistory: string[] = [];
for (const approval of first.run.fullTest.approvals) {
  for (const ref of [approval.archiveRunRef, approval.reviewRunRef, approval.authorRunRef]) {
    fs.unlinkSync(path.join(root, ref));
    deletedHistory.push(ref);
  }
}
writeManifest(root, { ...originalManifest, historyRef: '../missing-history' });
for (const command of ['status', 'next']) {
  const observed = queryCommand([command], 0);
  assert.equal(observed.run.ref, fullRef);
  assert.equal(observed.verification.outcome, 'passed');
  assert.equal(observed.upstream, null);
}
scenes.push({
  id: 'P02',
  purpose: '已完成结果查询不依赖旧 Archive / Review / Author 或未知说明',
  deletedHistory,
  queryOutcome: 'passed',
});

writeManifest(root, { ...originalManifest, goal: originalManifest.goal + '：明确改变的候选范围' });
const changedScope = fullTestStatus({ project: root, runRef: fullRef });
assert.equal(changedScope.verification.outcome, 'passed');
assert.equal(changedScope.verification.scopeMatch, 'changed');
assert.equal(changedScope.verification.materialApplicability, 'requires-semantic-check');
const beforeRejectedRun = fs.readFileSync(
  path.join(root, '.mendi/delivery-groups/d01/manifest.json'),
);
const rejectedRun = await runFullTest(fullInput(root));
assert.equal(rejectedRun.ok, false);
assert.ok('error' in rejectedRun);
assert.equal(rejectedRun.outcome, 'not-run');
assert.equal(rejectedRun.error?.code, 'delivery-state-conflict');
assert.equal(rejectedRun.committedPaths.length, 0);
assert.deepEqual(
  fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json')),
  beforeRejectedRun,
);
writeManifest(root, originalManifest);
const packagePath = path.join(root, 'package.json');
const packageBytes = fs.readFileSync(packagePath);
const pkg = JSON.parse(packageBytes.toString());
pkg.scripts['test:full'] = 'node foreground.ts fail';
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
const changedCommand = fullTestStatus({ project: root, runRef: fullRef });
assert.equal(changedCommand.verification.outcome, 'passed');
assert.equal(changedCommand.verification.commandMatch, 'changed');
fs.writeFileSync(packagePath, packageBytes);
scenes.push({
  id: 'P03',
  purpose: '结果可读不代表当前材料适用',
  scopeChange: changedScope.verification,
  commandChange: changedCommand.verification,
  rerunRejection: rejectedRun,
});
originalFullUnchanged();

writeManifest(root, { ...originalManifest, state: 'closed', closedOn: '2026-10-10' });
const closedManifestBytes = fs.readFileSync(
  path.join(root, '.mendi/delivery-groups/d01/manifest.json'),
);
const closedResults = [];
for (const args of [
  ['status'],
  ['next'],
  ['delivery', 'full-test', 'status', '--run', fullRef],
  ['test', 'status', '--execution', executionId],
]) {
  const observed = queryCommand(args, 1);
  assert.equal(observed.ok, false);
  assert.equal(observed.error.code, 'invalid-record');
  closedResults.push({ args, observed });
}
const directRun = readDeliveryRun(root, fullRef, 'd01');
const directChild = readExecution(root, executionId, 'd01');
assert.equal(directRun.record.fullTest?.outcome, 'passed');
assert.equal(directChild.outcome, 'passed');
for (const operation of ['close', 'reopen']) {
  const unsupported = queryCommand(['delivery', operation], 2);
  assert.equal(unsupported.ok, false);
  closedResults.push({ args: ['delivery', operation], observed: unsupported });
}
assert.deepEqual(
  fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json')),
  closedManifestBytes,
);
scenes.push({
  id: 'P04',
  purpose: 'closed 读取被运行前置挡住，直接记录仍真实存在',
  fixtureProjectionOnly: true,
  closedResults,
  directParent: directRun.record.fullTest?.outcome,
  directChild: directChild.outcome,
});

const projectPath = path.join(root, '.mendi/project.json');
const projectBytes = fs.readFileSync(projectPath);
const project = JSON.parse(projectBytes.toString());
const newOpen = queryCommand(
  [
    'delivery',
    'open',
    '--id',
    'd02',
    '--title',
    '新 Delivery',
    '--scope',
    path.join(root, 'scope.json'),
  ],
  1,
);
assert.equal(newOpen.error.code, 'existing-mendi-state');
assert.deepEqual(fs.readFileSync(projectPath), projectBytes);
assert.deepEqual(
  fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json')),
  closedManifestBytes,
);
const expandedIndex = {
  ...project,
  activeDeliveryId: 'd02',
  deliveries: [
    ...project.deliveries,
    { id: 'd02', manifestRef: '.mendi/delivery-groups/d02/manifest.json' },
  ],
};
let indexError: unknown;
try {
  parseProject(expandedIndex);
} catch (error) {
  assert.ok(error instanceof MendiError);
  indexError = { code: error.code, message: error.message };
}
assert.ok(indexError, '目前 product 索引只能有一项；新增项目不能只修改 Open 的存在检查');
scenes.push({
  id: 'P05',
  purpose: 'closed 后新 Open 及多 Delivery 索引的实际限制',
  newOpen,
  expandedIndexError: indexError,
  projectBytesUnchanged: true,
});

// 恢复 open 并扩展夹具范围，只调查既有 bind 与编号，不冒充实际 Reopen。
const extended = {
  ...originalManifest,
  plannedChanges: [
    ...originalManifest.plannedChanges,
    { slot: 'C', title: '后续受控工作', dependsOn: ['B'] },
  ],
};
writeManifest(root, extended);
prepareChange(root, env, 'third-entry');
const bound = bindChange({ project: root, changeId: 'third-entry', slot: 'C' });
assert.equal(bound.local.activeChangeId, 'third-entry');
const afterBinding = manifest(root);
assert.equal(afterBinding.deliveryRunRef, undefined);
assert.equal(afterBinding.fullTestRunRef, fullRef);
const historical = fullTestStatus({ project: root, runRef: fullRef });
assert.equal(historical.verification.outcome, 'passed');
assert.equal(historical.verification.scopeMatch, 'unavailable');
const started = startAction({
  project: root,
  changeId: 'third-entry',
  type: 'explore',
  role: 'author',
  actor: 'proof-author',
});
assert.equal(started.run.runNumber, first.run.runNumber + 1);
const current = queryCommand(['status'], 0);
assert.equal(current.run.changeId, 'third-entry');
assert.equal(current.next.action, 'run-save-or-submit');
assert.equal(current.verification, undefined);
originalFullUnchanged();
assert.equal(JSON.parse(fs.readFileSync(projectPath, 'utf8')).archivedChangeCount, 2);
scenes.push({
  id: 'P06',
  purpose: '后续工作退出当前验收，保留可读历史与连续编号',
  fixtureRangeExpansionOnly: true,
  activeChangeId: bound.local.activeChangeId,
  deliveryRunRefCleared: true,
  retainedFullTestRunRef: fullRef,
  historicalOutcome: historical.verification.outcome,
  historicalScopeMatch: historical.verification.scopeMatch,
  currentRunRef: started.run.ref,
  previousRunNumber: first.run.runNumber,
  currentRunNumber: started.run.runNumber,
  archiveCount: 2,
  next: current.next,
});

const currentManifest = manifest(root);
const active = currentManifest.changeBindings.find(
  (item: { changeId: string }) => item.changeId === 'third-entry',
);
const nextBatchId = String(started.run.runNumber).padStart(3, '0') + '-changes';
const splitBatches = {
  ...currentManifest,
  changeBatches: [
    {
      ...currentManifest.changeBatches[0],
      changeIds: currentManifest.changeBatches[0].changeIds.filter(
        (id: string) => id !== 'third-entry',
      ),
    },
    {
      id: nextBatchId,
      firstRun: String(started.run.runNumber).padStart(3, '0'),
      runsRef: `.mendi/runs/d01/${nextBatchId}`,
      changeIds: ['third-entry'],
    },
  ],
  changeBindings: currentManifest.changeBindings.map(
    (item: { changeId: string; batchId: string; latestRunRef: string }) =>
      item.changeId === 'third-entry'
        ? {
            ...item,
            batchId: nextBatchId,
            latestRunRef: item.latestRunRef.replace(active.batchId + '/', nextBatchId + '/'),
          }
        : item,
  ),
};
const batchError = projectedError(splitBatches);
assert.equal(batchError.code, 'invalid-record');
const currentOnlyScope = {
  ...currentManifest,
  plannedChanges: currentManifest.plannedChanges
    .filter((item: { slot: string }) => item.slot === 'C')
    .map((item: Record<string, unknown>) => ({ ...item, dependsOn: [] })),
};
const rangeError = projectedError(currentOnlyScope);
assert.equal(rangeError.code, 'invalid-record');
assert.deepEqual(
  fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json')),
  Buffer.from(JSON.stringify(currentManifest, null, 2) + '\n'),
);
scenes.push({
  id: 'P07',
  purpose: '原 Delivery 新批次及新范围不能只追加字段',
  pureInputProjectionOnly: true,
  proposedBatchId: nextBatchId,
  batchError,
  currentOnlyScopeError: rangeError,
  savedManifestUnchanged: true,
});

fs.writeFileSync(
  path.join(output, 'report.json'),
  JSON.stringify(
    {
      source: 'current maintained inputs and real product operations',
      root,
      coldTemporary,
      scenes,
      limitations: [
        'Close / Reopen / 多 Delivery Open 尚未实现，closed 与范围扩展仅为夹具投影。',
        '阶段 Review 仅为声明夹具；本次不能批准真实 Change，也不认证 Owner 身份。',
        'unknown 的实际取消与后代证据沿用 B 020，不重跑完整旧 proof。',
        '不宣称生命周期端到端验收、closed 已可用或新 PASS 已适用。',
      ],
    },
    null,
    2,
  ) + '\n',
);
process.stdout.write(
  JSON.stringify({ ok: true, scenes: scenes.length, coldTemporary, fullRef, output }) + '\n',
);
