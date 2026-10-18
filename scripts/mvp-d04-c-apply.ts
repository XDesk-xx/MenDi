import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  fixture,
  sandbox,
  repository,
  isolatedEnv,
  cli,
  command,
  openspecEntry,
} from '../tests/helpers.ts';
import { createWorkspace } from '../src/adapters/workspace.ts';
import { initialRound } from '../src/core/rounds.ts';
import { loadChangeMethods } from '../src/adapters/methods.ts';

// Current Apply handoff only; no UI implementation, fake stage approval or old proof extension.
const home = path.join(
  repository,
  '.mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/021-apply/artifacts',
);
const evidence = path.resolve(process.argv[2] ?? path.join(home, 'handoff-01'));
assert.ok(evidence.startsWith(home + path.sep));
assert.ok(!fs.existsSync(evidence), 'retain earlier attempts');
fs.mkdirSync(evidence);
process.env.MENDI_TEST_EVIDENCE_DIR = evidence;
const root = fixture(sandbox());
const env = isolatedEnv(path.dirname(root));
const context = '教师明确确认后发布，学生只读获准材料；本次菜单位置可迭代。';
const rule = '默认截止仍未决，不得替Owner选择；普通UI调整不新建Change。';
fs.writeFileSync(
  path.join(root, 'openspec/config.yaml'),
  `schema: spec-driven\ncontext: |\n  ${context}\nrules:\n  proposal:\n    - ${rule}\n`,
);
const change = command(openspecEntry, ['new', 'change', 'proof-entry', '--json'], root, env);
assert.equal(change.status, 0, change.stderr);
for (const name of [
  'openspec-explore',
  'openspec-propose',
  'openspec-update-change',
  'openspec-apply-change',
]) {
  const ref = `.agents/skills/${name}/SKILL.md`;
  fs.mkdirSync(path.dirname(path.join(root, ref)), { recursive: true });
  fs.copyFileSync(path.join(repository, ref), path.join(root, ref));
}
createWorkspace(
  root,
  {
    formatVersion: 2,
    recordingMode: 'product',
    name: 'current-method-handoff',
    deliveryGroupsDir: '.mendi/delivery-groups',
    activeDeliveryId: 'd01',
    deliveries: [{ id: 'd01', manifestRef: '.mendi/delivery-groups/d01/manifest.json' }],
  },
  initialRound({
    formatVersion: 2,
    recordingMode: 'product',
    id: 'd01',
    title: '当前方法交接',
    state: 'open',
    openedOn: '2026-10-17',
    goal: '仅核对传递，不认证语义',
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
    'apply-proof-author',
    '--json',
  ],
  root,
  env,
);
assert.equal(started.status, 0, started.stdout + started.stderr);
const value = JSON.parse(started.stdout);
const source = fs.readFileSync(path.join(repository, 'skills/actions/explore/SKILL.md'), 'utf8');
assert.equal(value.methods.stage.content, source);
assert.equal(value.methods.upstream[0].projectRoot, root);
assert.equal(value.methods.guidance.length, 0);
const instruction = cli(
  [
    'action',
    'instructions',
    '--project',
    root,
    '--action',
    value.run.actionId,
    '--artifact',
    'proposal',
    '--json',
  ],
  root,
  env,
);
assert.equal(instruction.status, 0, instruction.stdout + instruction.stderr);
const actual = JSON.parse(instruction.stdout).instructions;
assert.equal(actual.context.trim(), context);
assert.ok(actual.rules.includes(rule));
const stages = [
  'explore',
  'propose',
  'review-explore',
  'review-propose',
  'apply',
  'review-apply',
  'revise-explore',
  'revise-propose',
  'revise-apply',
] as const;
const observations = stages.map((stage) => {
  const loaded = loadChangeMethods(stage, [], root);
  assert.equal(loaded.stage.content, fs.readFileSync(loaded.stage.file, 'utf8'));
  assert.equal(loaded.upstream.length, stage.startsWith('review-') ? 0 : 1);
  assert.equal(loaded.guidance.length, 0);
  return {
    type: stage,
    ref: loaded.stage.ref,
    file: loaded.stage.file,
    upstream: loaded.upstream.map((m) => m.name),
    matchesSource: true,
    content: stage === 'explore' ? 'See actual CLI command output.' : loaded.stage.content,
  };
});
fs.writeFileSync(path.join(evidence, 'methods.json'), JSON.stringify(observations, null, 2) + '\n');
assert.equal(fs.existsSync(path.join(root, 'openspec/changes/proof-entry/proposal.md')), false);
console.log(
  JSON.stringify({
    root,
    actionId: value.run.actionId,
    handoffMatchesSource: true,
    instructionsMatchTarget: true,
    selectedStorybook: false,
    stages: observations.length,
    limitation: '真实CLI只启动Explore，其余为loader；传递核对不认证语义或完成审核。',
  }),
);
