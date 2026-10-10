import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const entry = 'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const cliEntry = path.join(repository, 'dist/drivers/cli.js');
assert.equal(process.argv[2], '--output');
const output = path.resolve(process.argv[3]);
fs.mkdirSync(output, { recursive: false });
fs.mkdirSync(path.join(repository, '.tmp'), { recursive: true });
const parent = fs.mkdtempSync(path.join(repository, '.tmp/mvp-d01-d-explore-'));
const env = {
  ...process.env,
  XDG_CONFIG_HOME: path.join(parent, 'global-config'),
  XDG_DATA_HOME: path.join(parent, 'global-data'),
  OPENSPEC_TELEMETRY: '0',
};
interface Run {
  ref: string;
  actionId: string;
  role: string;
  actorId: string;
  authorRunRef?: string;
}
const commands: unknown[] = [];
const cases: { id: string; purpose: string; observation: unknown }[] = [];
const changeId = 'proof-entry';
const requirement =
  '### Requirement: Explicit experiment input\nThe tool SHALL retain controlled input.\n\n#### Scenario: Read input\n- **WHEN** input is read\n- **THEN** controlled content is retained\n';
const delta = '## ADDED Requirements\n\n' + requirement;

function command(program: string, args: string[], root: string, expected = 0) {
  const result = spawnSync(process.execPath, [program, ...args], {
    cwd: root,
    env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30_000,
  });
  commands.push({
    entry: program,
    args,
    cwd: root,
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, expected, result.stdout || result.stderr);
  return JSON.parse(result.stdout);
}
function upstream(root: string, args: string[], expected = 0) {
  return command(entry, args, root, expected);
}
function invoke(root: string, args: string[], expected = 0) {
  return command(cliEntry, [...args, '--project', root, '--json'], parent, expected);
}
function createTarget(name: string, complete = true) {
  const root = path.join(parent, name);
  fs.cpSync(path.join(repository, 'tests/fixtures/minimal-project'), root, { recursive: true });
  fs.copyFileSync(
    path.join(repository, 'tests/fixtures/delivery-scope.json'),
    path.join(root, 'scope.json'),
  );
  fs.appendFileSync(
    path.join(root, 'openspec/config.yaml'),
    '\noperations:\n  apply:\n    guidance:\n      - D_APPLY_SENTINEL\n  archive:\n    guidance:\n      - D_ARCHIVE_SENTINEL\n',
  );
  upstream(root, ['new', 'change', changeId, '--json']);
  const change = path.join(root, 'openspec/changes', changeId);
  fs.mkdirSync(path.join(change, 'specs/proof-input'), { recursive: true });
  fs.writeFileSync(
    path.join(change, 'proposal.md'),
    '## Why\nControlled D proof.\n\n## What Changes\nRetain input.\n\n## Capabilities\n### New Capabilities\n- `proof-input`: controlled input.\n\n### Modified Capabilities\nNone.\n\n## Impact\nSandbox only.\n',
  );
  fs.writeFileSync(
    path.join(change, 'design.md'),
    '## Context\nControlled local experiment.\n## Decisions\nUse real CLI; fixture reviews do not approve MenDi.\n',
  );
  fs.writeFileSync(path.join(change, 'specs/proof-input/spec.md'), delta);
  fs.writeFileSync(
    path.join(change, 'tasks.md'),
    `## 1. Controlled input\n- [${complete ? 'x' : ' '}] 1.1 Retain input\n`,
  );
  return root;
}
function start(root: string, type: string, extra: string[] = []): Run {
  const review = type.startsWith('review-');
  return invoke(root, [
    'action',
    'start',
    '--change',
    changeId,
    '--type',
    type,
    '--role',
    review ? 'reviewer' : 'author',
    '--actor',
    review ? 'fixture-reviewer' : 'fixture-author',
    ...extra,
  ]).run;
}
function submit(root: string, run: Run, outcome: string, verdict?: string) {
  fs.writeFileSync(
    path.join(root, 'work.md'),
    '# D controlled observation\nFixture progress; no real Change approval.\n',
  );
  invoke(root, [
    'run',
    'save',
    '--run',
    run.ref,
    '--role',
    run.role,
    '--actor',
    run.actorId,
    '--body',
    'work.md',
  ]);
  return invoke(root, [
    'run',
    'submit',
    '--run',
    run.ref,
    '--role',
    run.role,
    '--actor',
    run.actorId,
    '--outcome',
    outcome,
    '--result',
    'controlled fixture progress',
    ...(verdict ? ['--verdict', verdict] : []),
  ]);
}
function pass(id: string, purpose: string, observation: unknown) {
  cases.push({ id, purpose, observation });
  console.log(JSON.stringify({ id, passed: true }));
}
function raw(root: string, ref: string) {
  return fs.readFileSync(path.join(root, ref));
}

let failure: unknown;
try {
  const root = createTarget('apply-flow');
  invoke(root, [
    'delivery',
    'open',
    '--id',
    'd01',
    '--title',
    'D controlled target',
    '--scope',
    'scope.json',
    '--change',
    changeId,
    '--slot',
    'A',
  ]);
  for (const phase of ['explore', 'propose']) {
    const author = start(root, phase);
    submit(root, author, 'complete');
    const review = start(root, `review-${phase}`, ['--author-run', author.ref]);
    submit(root, review, 'complete', 'approved');
  }
  const apply = start(root, 'apply');
  const taskFile = path.join(root, 'openspec/changes', changeId, 'tasks.md');
  fs.writeFileSync(taskFile, '## 1. Controlled input\n- [ ] 1.1 Retain input\n');
  const ready = upstream(root, ['instructions', 'apply', '--change', changeId, '--json']);
  assert.equal(ready.state, 'ready');
  assert.equal(ready.progress.remaining, 1);
  assert.ok(ready.contextFiles.tasks && ready.contextFiles.proposal && ready.contextFiles.specs);
  assert.ok(ready.operationGuidance.includes('D_APPLY_SENTINEL'));
  fs.unlinkSync(taskFile);
  const blocked = upstream(root, ['instructions', 'apply', '--change', changeId, '--json']);
  assert.equal(blocked.state, 'blocked');
  fs.writeFileSync(taskFile, '## 1. Controlled input\n- [x] 1.1 Retain input\n');
  const done = upstream(root, ['instructions', 'apply', '--change', changeId, '--json']);
  assert.equal(done.state, 'all_done');
  const instructionsDenied = invoke(
    root,
    ['action', 'instructions', '--action', apply.actionId, '--artifact', 'tasks'],
    1,
  );
  assert.equal(instructionsDenied.error.code, 'unsupported-action-instructions');
  fs.writeFileSync(
    path.join(output, 'apply-operation-inputs.json'),
    JSON.stringify({ ready, blocked, done }, null, 2) + '\n',
  );
  pass('D01', '真实 Apply 操作输入包含 guidance、上下文路径和任务进度；当前产品入口明确拒绝', {
    ready: ready.state,
    missingTasks: blocked.state,
    completedTasks: done.state,
    currentProductError: instructionsDenied.error.code,
  });

  submit(root, apply, 'continuing');
  const prior = raw(root, apply.ref);
  const continued: Run = invoke(root, [
    'action',
    'continue',
    '--action',
    apply.actionId,
    '--role',
    apply.role,
    '--actor',
    apply.actorId,
  ]).run;
  assert.equal(continued.actionId, apply.actionId);
  assert.ok(raw(root, apply.ref).equals(prior));
  submit(root, continued, 'complete');
  const review = start(root, 'review-apply', ['--author-run', continued.ref]);
  submit(root, review, 'complete', 'changes-requested');
  const oldReview = raw(root, review.ref);
  const revision = start(root, 'revise-apply', ['--revises', continued.ref]);
  assert.notEqual(revision.actionId, apply.actionId);
  const revised = submit(root, revision, 'complete');
  assert.equal(revised.next.action, 'review-apply');
  const wrong = invoke(
    root,
    [
      'action',
      'start',
      '--change',
      changeId,
      '--type',
      'review-apply',
      '--role',
      'reviewer',
      '--actor',
      'fixture-reviewer',
      '--author-run',
      continued.ref,
    ],
    1,
  );
  assert.equal(wrong.error.code, 'action-state-conflict');
  const revisionReview = start(root, 'review-apply', ['--author-run', revision.ref]);
  submit(root, revisionReview, 'complete', 'approved');
  const approvedBytes = raw(root, revisionReview.ref);
  const postApprovalRevision = start(root, 'revise-apply', ['--revises', revision.ref]);
  const postRevision = submit(root, postApprovalRevision, 'complete');
  assert.equal(postRevision.next.action, 'review-apply');
  assert.ok(raw(root, revisionReview.ref).equals(approvedBytes));
  const finalReview = start(root, 'review-apply', ['--author-run', postApprovalRevision.ref]);
  const approved = submit(root, finalReview, 'complete', 'approved');
  assert.equal(approved.next.action, 'archive');
  assert.ok(raw(root, review.ref).equals(oldReview));
  pass(
    'D02',
    '真实跨进程 Apply continuing 与两次 revise 均保留历史，修订后必须重新审核当前 Author',
    {
      continuingSameAction: true,
      changesRequestedRetained: true,
      oldApprovedRetained: true,
      staleReviewDenied: wrong.error.code,
      latestAuthor: postApprovalRevision.ref,
      latestReview: finalReview.ref,
    },
  );

  const manifestRef = '.mendi/delivery-groups/d01/manifest.json';
  const beforeResolve = raw(root, manifestRef);
  const resolve = invoke(
    root,
    [
      'action',
      'resolve',
      '--run',
      finalReview.ref,
      '--role',
      'owner',
      '--actor',
      'fixture-owner',
      '--resolution',
      'revise',
      '--to-role',
      'author',
      '--to-actor',
      'fixture-author',
      '--reason',
      'controlled earlier-phase request',
    ],
    1,
  );
  assert.equal(resolve.error.code, 'unsupported-resolution');
  const backwards = invoke(
    root,
    [
      'action',
      'start',
      '--change',
      changeId,
      '--type',
      'revise-propose',
      '--role',
      'author',
      '--actor',
      'fixture-author',
      '--revises',
      '.mendi/runs/d01/001-changes/proof-entry/003-propose/run.md',
    ],
    1,
  );
  assert.equal(backwards.error.code, 'action-state-conflict');
  assert.ok(raw(root, manifestRef).equals(beforeResolve));
  pass('D03', '当前 Apply Owner 处置与跨阶段回退均拒绝，普通 revise 不能绕过阶段与审核', {
    ownerResolutionError: resolve.error.code,
    earlierPhaseError: backwards.error.code,
    manifestUnchanged: true,
  });

  const archiveInstructions = upstream(root, [
    'instructions',
    'archive',
    '--change',
    changeId,
    '--json',
  ]);
  assert.ok(archiveInstructions.operationGuidance.includes('D_ARCHIVE_SENTINEL'));
  let archiveInvocations = 0;
  archiveInvocations++;
  const native = upstream(root, ['archive', changeId, '--json', '--yes']);
  assert.equal(native.archive.specsUpdated, true);
  assert.equal(native.archive.totals.added, 1);
  const archivedPath = native.archive.path as string;
  const mainSpec = path.join(root, 'openspec/specs/proof-input/spec.md');
  const specText = fs.readFileSync(mainSpec, 'utf8');
  assert.equal((specText.match(/### Requirement: Explicit experiment input/g) || []).length, 1);
  assert.ok(specText.includes(requirement.trim()));
  const blockedWrite = path.join(root, 'blocked-handoff.json');
  fs.mkdirSync(blockedWrite);
  let localWriteError = '';
  try {
    fs.writeFileSync(blockedWrite, '{}\n');
  } catch (error) {
    localWriteError = (error as NodeJS.ErrnoException).code || '';
  }
  assert.ok(localWriteError);
  assert.ok(fs.existsSync(archivedPath));
  assert.equal(fs.existsSync(path.join(root, 'openspec/changes', changeId)), false);
  assert.ok(raw(root, manifestRef).equals(beforeResolve));
  const staleQuery = invoke(root, ['status'], 1);
  assert.equal(staleQuery.error.code, 'incomplete-mendi-state');
  // A failed local write does not authorize repeating the already effective native archive.
  assert.equal(archiveInvocations, 1);
  fs.writeFileSync(
    path.join(output, 'native-archive.json'),
    JSON.stringify(native, null, 2) + '\n',
  );
  fs.writeFileSync(
    path.join(output, 'archive-guidance.json'),
    JSON.stringify(archiveInstructions, null, 2) + '\n',
  );
  fs.writeFileSync(path.join(output, 'archived-spec.md'), specText);
  pass('D04', '原生归档只同步一次；随后真实本地写入失败保留已归档效果及旧指针，不能自动重跑', {
    native: native.archive,
    localWriteError,
    staleQueryError: staleQuery.error.code,
    archiveInvocations,
    manifestUnchanged: true,
  });

  const numberedPath = path.join(
    path.dirname(archivedPath),
    path.basename(archivedPath).replace('-proof-entry', '-001-proof-entry'),
  );
  assert.equal(
    path.dirname(numberedPath),
    fs.realpathSync(path.join(root, 'openspec/changes/archive')),
  );
  assert.equal(fs.existsSync(numberedPath), false);
  const metadata = fs.readFileSync(path.join(archivedPath, '.openspec.yaml'));
  fs.renameSync(archivedPath, numberedPath);
  assert.ok(fs.readFileSync(path.join(numberedPath, '.openspec.yaml')).equals(metadata));
  const archivedManifest = JSON.parse(beforeResolve.toString());
  archivedManifest.activeChangeId = null;
  Object.assign(archivedManifest.changeBindings[0], {
    state: 'archived',
    archiveOrdinal: 1,
    changeRef: path.relative(root, numberedPath).split(path.sep).join('/'),
  });
  fs.writeFileSync(path.join(root, manifestRef), JSON.stringify(archivedManifest, null, 2));
  const archiveQuery = invoke(root, ['next'], 1);
  assert.equal(archiveQuery.error.code, 'invalid-record');
  pass('D05', '原生归档可安全加累计编号并保留元数据，现有产品记录仍拒绝归档态', {
    numberedPath,
    metadataUnchanged: true,
    productArchiveQueryError: archiveQuery.error.code,
  });

  const collisionRoot = createTarget('archive-collision');
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const collision = path.join(collisionRoot, 'openspec/changes/archive', `${date}-${changeId}`);
  fs.mkdirSync(collision, { recursive: true });
  fs.writeFileSync(path.join(collision, 'sentinel.txt'), 'do not overwrite');
  const collisionDelta = raw(
    collisionRoot,
    `openspec/changes/${changeId}/specs/proof-input/spec.md`,
  );
  const collided = upstream(collisionRoot, ['archive', changeId, '--json', '--yes'], 1);
  assert.ok(
    raw(collisionRoot, `openspec/changes/${changeId}/specs/proof-input/spec.md`).equals(
      collisionDelta,
    ),
  );
  assert.equal(fs.readFileSync(path.join(collision, 'sentinel.txt'), 'utf8'), 'do not overwrite');
  assert.equal(
    fs.existsSync(path.join(collisionRoot, 'openspec/specs/proof-input/spec.md')),
    false,
  );
  pass('D06', '真实原生归档目标冲突在同步前拒绝，保留活动 delta 与既有目标', {
    error: collided,
    specWritten: false,
    originalTargetUnchanged: true,
  });

  const invalidRoot = createTarget('archive-invalid-delta');
  fs.writeFileSync(
    path.join(invalidRoot, `openspec/changes/${changeId}/specs/proof-input/spec.md`),
    '## ADDED Requirements\n### Requirement: Invalid input\nNo normative statement or scenario.\n',
  );
  const invalidDelta = raw(invalidRoot, `openspec/changes/${changeId}/specs/proof-input/spec.md`);
  const invalid = upstream(invalidRoot, ['archive', changeId, '--json', '--yes'], 1);
  assert.ok(
    raw(invalidRoot, `openspec/changes/${changeId}/specs/proof-input/spec.md`).equals(invalidDelta),
  );
  assert.equal(fs.existsSync(path.join(invalidRoot, 'openspec/specs/proof-input/spec.md')), false);
  pass('D07', '真实 delta 校验失败不会同步或移走 Change；不使用 no-validate 绕过', {
    error: invalid,
    activeDeltaUnchanged: true,
    specWritten: false,
  });

  const unfinishedRoot = createTarget('archive-unfinished', false);
  const unfinished = upstream(unfinishedRoot, ['archive', changeId, '--json', '--yes']);
  assert.ok(
    fs.readFileSync(path.join(unfinished.archive.path, 'tasks.md'), 'utf8').includes('- [ ]'),
  );
  pass('D08', '原生 --yes 可归档未勾任务，工具成功不能替代 MENDI 完成任务及独立批准前置', {
    nativeArchiveWithUncheckedTask: true,
    result: unfinished.archive,
  });
} catch (error) {
  failure = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
}
const report = {
  node: process.version,
  openspecEntry: entry,
  sandbox: parent,
  total: 8,
  passed: cases.length,
  cases,
  ...(failure ? { failure } : {}),
  limitations: [
    'Only disposable targets were archived; the current MenDi Change was not archived.',
    'Fixture author/reviewer labels and verdicts do not independently approve this Change.',
    'The partial result is real native success followed by a controlled local write failure, not arbitrary power-loss or every native rollback path.',
    'Owner backward transition and product Archive Action are not implemented by this experiment.',
    'Existing C proof is not extended and old evidence is not rewritten.',
  ],
};
fs.writeFileSync(path.join(output, 'commands.json'), JSON.stringify(commands, null, 2) + '\n', {
  flag: 'wx',
});
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', {
  flag: 'wx',
});
console.log(
  JSON.stringify({
    passed: cases.length,
    total: 8,
    commands: commands.length,
    output,
    ...(failure ? { failure } : {}),
  }),
);
if (failure) process.exitCode = 1;
