import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  fixture,
  sandbox,
  repository,
  isolatedEnv,
  command,
  openspecEntry,
  cli,
} from '../../../../../../../tests/helpers.ts';
import { createWorkspace } from '../../../../../../../src/adapters/workspace.ts';
import { initialRound } from '../../../../../../../src/core/rounds.ts';
import { loadChangeMethods } from '../../../../../../../src/adapters/methods.ts';

// Explore only: existing method handoff and real instructions, no candidate method implementation.
const home = path.join(
  repository,
  '.mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/018-review-explore/artifacts',
);
const evidence = path.resolve(process.argv[2] ?? path.join(home, 'proof-01'));
assert.ok(evidence.startsWith(home + path.sep));
assert.ok(!fs.existsSync(evidence), 'preserve previous attempts');
fs.mkdirSync(evidence);
process.env.MENDI_TEST_EVIDENCE_DIR = evidence;
const save = (name: string, value: unknown) =>
  fs.writeFileSync(path.join(evidence, name), JSON.stringify(value, null, 2) + '\n');
const parent = sandbox();
const root = fixture(parent);
const env = isolatedEnv(parent);
const context = '教师发布练习需明确确认；学生只能读取获准材料。当前界面名称不等于长期业务契约。';
const rule = 'proposal 须说明权限、默认截止与关键能力可达性的未决决定；事实不足不能冒称已确认。';
fs.writeFileSync(
  path.join(root, 'openspec/config.yaml'),
  `schema: spec-driven\ncontext: |\n  ${context}\nrules:\n  proposal:\n    - ${rule}\n`,
);
const created = command(openspecEntry, ['new', 'change', 'proof-entry', '--json'], root, env);
assert.equal(created.status, 0, created.stderr);
for (const name of ['openspec-explore', 'openspec-propose']) {
  const ref = `.agents/skills/${name}/SKILL.md`;
  fs.mkdirSync(path.dirname(path.join(root, ref)), { recursive: true });
  fs.copyFileSync(path.join(repository, ref), path.join(root, ref));
}
createWorkspace(
  root,
  {
    formatVersion: 2,
    recordingMode: 'product',
    name: 'method-proof',
    deliveryGroupsDir: '.mendi/delivery-groups',
    activeDeliveryId: 'd01',
    deliveries: [{ id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' }],
  },
  initialRound({
    formatVersion: 2,
    recordingMode: 'product',
    id: 'd01',
    title: '方法交接限定实验',
    state: 'open',
    openedOn: '2026-10-17',
    goal: '核对当前方法与动态指引，不认证宿主语义判断',
    plannedChanges: [{ slot: 'C', title: '方法', dependsOn: [] }],
    activeChangeId: 'proof-entry',
    changeBindings: [
      {
        planningSlot: 'C',
        changeId: 'proof-entry',
        changeRef: 'openspec/changes/proof-entry',
        state: 'explore',
      },
    ],
    changeBatches: [],
  }),
);
const started = cli(
  [
    'action',
    'start',
    '--project',
    root,
    '--change',
    'proof-entry',
    '--type',
    'explore',
    '--role',
    'author',
    '--actor',
    'proof-author',
    '--json',
  ],
  root,
  env,
);
save('start-command.json', {
  exitCode: started.status,
  stdout: started.stdout,
  stderr: started.stderr,
});
assert.equal(started.status, 0, started.stderr + started.stdout);
const response = JSON.parse(started.stdout);
const actionId = response.run.actionId as string;
assert.equal(typeof actionId, 'string');
const instructions = cli(
  [
    'action',
    'instructions',
    '--project',
    root,
    '--action',
    actionId,
    '--artifact',
    'proposal',
    '--json',
  ],
  root,
  env,
);
save('instructions-command.json', {
  exitCode: instructions.status,
  stdout: instructions.stdout,
  stderr: instructions.stderr,
});
assert.equal(instructions.status, 0, instructions.stderr + instructions.stdout);
const actual = JSON.parse(instructions.stdout).instructions;
assert.equal(actual.context.trim(), context);
assert.ok(actual.rules.includes(rule));
const methods = [];
for (const type of ['explore', 'propose', 'review-explore', 'review-propose'] as const) {
  const loaded = loadChangeMethods(type, [], root);
  assert.equal(
    loaded.stage.content,
    fs.readFileSync(path.join(repository, loaded.stage.ref), 'utf8'),
  );
  assert.equal(loaded.guidance.length, 0);
  assert.equal(loaded.upstream.length, type.startsWith('review-') ? 0 : 1);
  for (const method of loaded.upstream) {
    assert.equal(method.projectRoot, root);
    assert.equal(method.content, fs.readFileSync(method.file, 'utf8'));
  }
  methods.push({ type, ...loaded });
}
save('actual-methods.json', methods);
save('observation.json', {
  root,
  actionId,
  realCLIStart: true,
  proposalContext: actual.context,
  proposalRules: actual.rules,
  selectedStorybook: false,
  businessArtifactsCreated: fs.existsSync(
    path.join(root, 'openspec/changes/proof-entry/proposal.md'),
  ),
  facts:
    '四阶段实际正文及目标上游来源均可交接；Reviewer不继承Author上游；context/rules由真实instructions原样传递。',
  limits:
    '仅证明已有交接机制；不证明宿主会提问、会识别UI业务影响或已通过独立审核。未运行UI、修改产品方法或提交目标阶段。',
});
assert.equal(fs.existsSync(path.join(root, 'openspec/changes/proof-entry/proposal.md')), false);
console.log(
  JSON.stringify({ evidence, root, actionId, outcome: 'handoff-and-instructions-observed' }),
);

// Reviewer补验：动态背景不能缓存；Reviewer不依赖Author上游；缺必要Author方法不可静默兜底。
const newerContext = '已确认普通UI调整不新建Change；默认截止未决定时不得定稿依赖方案。';
fs.writeFileSync(path.join(root, 'openspec/config.yaml'), 'schema: spec-driven\ncontext: |\n  ' + newerContext + '\n');
const fresh = cli(['action','instructions','--project',root,'--action',actionId,'--artifact','proposal','--json'],root,env);
save('fresh-instructions-command.json',{exitCode:fresh.status,stdout:fresh.stdout,stderr:fresh.stderr});
assert.equal(fresh.status,0);
assert.equal(JSON.parse(fresh.stdout).instructions.context.trim(),newerContext);
for (const name of ['openspec-explore','openspec-propose'])
 fs.renameSync(path.join(root,'.agents/skills',name,'SKILL.md'),path.join(root,'.agents/skills',name,'SKILL.held'));
for (const type of ['review-explore','review-propose'] as const)
 assert.equal(loadChangeMethods(type,[],root).upstream.length,0);
for (const type of ['explore','propose'] as const)
 assert.throws(()=>loadChangeMethods(type,[],root),{code:'skill-unavailable'});
assert.equal(fs.existsSync(path.join(root,'openspec/changes/proof-entry/proposal.md')),false);
save('reviewer-boundaries.json',{dynamicContext:true,reviewerWithoutAuthorUpstream:true,authorMissingMethodRejected:true,noProposalCreated:true,limits:'真实CLI及loader观察；没有测试宿主的产品判断或用户界面'});
console.log('Reviewer handoff boundary probes PASS');
