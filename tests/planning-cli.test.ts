import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { stringify } from 'yaml';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import {
  cli,
  fixture,
  isolatedEnv,
  prepareChange,
  sandbox,
  scopeFile,
  snapshot,
  repository,
} from './helpers.ts';

test('真实 MenDi / OpenSpec：instructions、proof、修改要求、Author / Reviewer handoff、四产物和 rejected 同阶段修订', () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  const root = fixture(parent);
  scopeFile(root);
  fs.writeFileSync(
    path.join(root, 'openspec/config.yaml'),
    stringify({
      schema: 'spec-driven',
      context: '中文产物。仅当前 Change，不自动安装工具。',
      rules: {
        proposal: ['说明范围、失败行为和限制。'],
        specs: ['缺工具必须失败，不自动安装。'],
        design: ['记录真实依赖与输入边界。'],
        tasks: ['包含缺工具失败验证。'],
      },
    }),
  );
  prepareChange(root, env);
  const invoke = (args: string[], status = 0) => {
    const result = cli([...args, '--project', root, '--json'], parent, env);
    assert.equal(result.status, status, result.stdout || result.stderr);
    return JSON.parse(result.stdout);
  };
  invoke([
    'delivery',
    'open',
    '--id',
    'd01',
    '--title',
    '阶段接线夹具',
    '--scope',
    'scope.json',
    '--change',
    'proof-entry',
    '--slot',
    'A',
  ]);
  const actor = (role: string, id: string) => ['--role', role, '--actor', id];
  const start = (type: string, id: string, extra: string[] = []) =>
    invoke([
      'action',
      'start',
      '--change',
      'proof-entry',
      '--type',
      type,
      ...actor(type.startsWith('review-') ? 'reviewer' : 'author', id),
      '--tool',
      'openspec',
      ...extra,
    ]);
  const bodyFile = path.join(root, 'work.md');
  const save = (run: Record<string, string>, body: string) => {
    fs.writeFileSync(bodyFile, body);
    return invoke([
      'run',
      'save',
      '--run',
      run.ref,
      ...actor(run.role, run.actorId),
      '--body',
      bodyFile,
      '--openspec-bin',
      path.join(root, 'missing.js'),
    ]);
  };
  const finish = (run: Record<string, string>, body: string, verdict?: string) => {
    const saved = save(run, body);
    assert.equal(saved.executionMode, 'local-only');
    assert.equal(saved.openspec, null);
    return invoke([
      'run',
      'submit',
      '--run',
      run.ref,
      ...actor(run.role, run.actorId),
      '--outcome',
      'complete',
      '--result',
      '受控语义材料见正文',
      ...(verdict ? ['--verdict', verdict] : []),
    ]);
  };
  const handoff = (run: Record<string, string>, id: string) =>
    invoke([
      'action',
      'resolve',
      '--run',
      run.ref,
      '--role',
      'owner',
      '--actor',
      'fixture-owner',
      '--resolution',
      'handoff',
      '--to-role',
      run.role,
      '--to-actor',
      id,
      '--reason',
      '受控实验换接收者',
    ]);
  const guidance = (run: Record<string, string>, artifact: string) => {
    const before = snapshot(root);
    const result = invoke([
      'action',
      'instructions',
      '--action',
      run.actionId,
      '--artifact',
      artifact,
    ]);
    assert.deepEqual(snapshot(root), before);
    assert.equal(result.instructions.artifactId, artifact);
    assert.ok(result.instructions.context.includes('不自动安装'));
    assert.ok(result.instructions.instruction.length > 10);
    assert.ok(result.instructions.template.length > 10);
    return result.instructions;
  };
  const explored = start('explore', 'fixture-author-one');
  assert.ok(explored.methods.stage.content.includes('Run'));
  assert.ok(explored.methods.guidance[0].content.includes('workspace diagnose'));
  guidance(explored.run, 'proposal');
  const before = snapshot(root);
  assert.equal(
    invoke(['action', 'instructions', '--action', explored.run.actionId, '--artifact', 'specs'], 1)
      .error.code,
    'unsupported-action-instructions',
  );
  assert.equal(
    invoke(['action', 'instructions', '--action', 'stale', '--artifact', 'proposal'], 1).error.code,
    'action-state-conflict',
  );
  assert.deepEqual(snapshot(root), before);
  const notes =
    '目的：验证阶段输入只读及缺工具可保存。方法：真实 CLI 错 artifact / 陈旧 Action 拒绝、读前后字节比较。结果：均拒绝且不写入。约束“不自动安装”使工具不可用定义为正式操作失败，不新增自动安装任务。限制：未证明全部产品验收；actor / verdict 均为夹具。';
  save(explored.run, notes);
  const unavailableBefore = snapshot(root);
  assert.equal(
    invoke(
      [
        'run',
        'submit',
        '--run',
        explored.run.ref,
        ...actor('author', 'fixture-author-one'),
        '--outcome',
        'complete',
        '--result',
        '工具缺失实验',
        '--openspec-bin',
        path.join(root, 'missing.js'),
      ],
      1,
    ).error.code,
    'invalid-tool-entry',
  );
  assert.deepEqual(snapshot(root), unavailableBefore);
  const old = fs.readFileSync(path.join(root, explored.run.ref));
  const human = cli(
    [
      'run',
      'save',
      '--project',
      root,
      '--run',
      explored.run.ref,
      ...actor('author', 'fixture-author-one'),
      '--body',
      bodyFile,
      '--openspec-bin',
      path.join(root, 'missing.js'),
    ],
    parent,
    env,
  );
  assert.equal(human.status, 0);
  assert.ok(human.stdout.includes('local-only'));
  const received = handoff(explored.run, 'fixture-author-two');
  assert.equal(received.run.actionId, explored.run.actionId);
  assert.deepEqual(fs.readFileSync(path.join(root, explored.run.ref)), old);
  assert.equal(invoke(['status']).run.actorId, 'fixture-author-two');
  assert.equal(
    invoke(
      [
        'run',
        'save',
        '--run',
        received.run.ref,
        ...actor('author', 'fixture-author-one'),
        '--body',
        bodyFile,
      ],
      1,
    ).error.code,
    'action-role-mismatch',
  );
  assert.equal(finish(received.run, notes).next.action, 'review-explore');
  const review = start('review-explore', 'fixture-reviewer-one', [
    '--author-run',
    received.run.ref,
  ]);
  save(review.run, '夹具审核进展：固定实际 Author 和输入，尚未 verdict。');
  const nextReview = handoff(review.run, 'fixture-reviewer-two');
  assert.equal(nextReview.run.authorRunRef, received.run.ref);
  assert.equal(nextReview.run.verdict, undefined);
  guidance(nextReview.run, 'proposal');
  finish(
    nextReview.run,
    '夹具 changes-requested：补明确输出模式和实际依赖；工具成功不替代审核。',
    'changes-requested',
  );
  const revised = start('revise-explore', 'fixture-author-two', ['--revises', received.run.ref]);
  finish(revised.run, notes + ' 修订：specs 输出模式不是单文件，后续每 artifact 读取其直接依赖。');
  const supplement = start('review-explore', 'fixture-reviewer-two', [
    '--author-run',
    revised.run.ref,
  ]);
  finish(
    supplement.run,
    '夹具审核已核对新增依赖说明与实际读回，风险范围足以进入方案。',
    'approved',
  );
  const proposal = start('propose', 'fixture-author-two');
  const change = path.join(root, 'openspec/changes/proof-entry');
  const blocked = guidance(proposal.run, 'tasks');
  assert.ok(blocked.dependencies.some((d: { done: boolean }) => !d.done));
  const specsBlocked = guidance(proposal.run, 'specs');
  assert.equal(specsBlocked.dependencies[0].done, false);
  const p = guidance(proposal.run, 'proposal');
  assert.ok(p.rules.some((r: string) => r.includes('范围')));
  fs.writeFileSync(
    path.join(change, 'proposal.md'),
    '## Why\n必须明确缺工具失败。\n## What Changes\n只读指引，不自动安装。\n## Capabilities\n### New Capabilities\n- `bounded-proof`: 必要输入\n### Modified Capabilities\n无\n## Impact\n当前目标。\n',
  );
  const s = guidance(proposal.run, 'specs');
  assert.equal(s.dependencies[0].done, true);
  assert.equal(s.outputPath, 'specs/**/*.md');
  fs.mkdirSync(path.join(change, 'specs/bounded-proof'), { recursive: true });
  fs.writeFileSync(
    path.join(change, 'specs/bounded-proof/spec.md'),
    '## ADDED Requirements\n### Requirement: Missing tool fails\nThe system SHALL fail without installing a missing tool.\n#### Scenario: Missing input\n- **WHEN** the selected tool is missing\n- **THEN** fail without installing\n',
  );
  const d = guidance(proposal.run, 'design');
  assert.equal(d.dependencies[0].done, true);
  fs.writeFileSync(
    path.join(change, 'design.md'),
    '## Context\n目标 context 禁止自动安装。\n## Decisions\n只用选定工具；缺工具失败。\n## Risks\n不认证 actor 身份。\n',
  );
  const t = guidance(proposal.run, 'tasks');
  assert.ok(t.dependencies.every((dep: { done: boolean }) => dep.done));
  assert.ok(t.dependencies.some((dep: { path: string }) => dep.path === 'specs/**/*.md'));
  fs.writeFileSync(
    path.join(change, 'tasks.md'),
    '## 1. 实施\n- [ ] 1.1 缺工具失败、不安装的回归。\n',
  );
  finish(
    proposal.run,
    '夹具方案：依 context 不自动安装，proposal 范围、specs 失败行为、design 输入和 tasks 缺工具测试一致。真实四类 instructions / 依赖如上，结构齐备不替代独立审核。',
  );
  const rp = start('review-propose', 'fixture-reviewer-two', ['--author-run', proposal.run.ref]);
  guidance(rp.run, 'tasks');
  finish(rp.run, '夹具 rejected：要求补路径越界输入场景，停 Owner。', 'rejected');
  const verdictBytes = fs.readFileSync(path.join(root, rp.run.ref));
  assert.equal(
    invoke(
      [
        'action',
        'start',
        '--change',
        'proof-entry',
        '--type',
        'revise-propose',
        ...actor('author', 'fixture-author-two'),
        '--revises',
        proposal.run.ref,
      ],
      1,
    ).error.code,
    'action-state-conflict',
  );
  const ownerRevision = invoke([
    'action',
    'resolve',
    '--run',
    rp.run.ref,
    '--role',
    'owner',
    '--actor',
    'fixture-owner',
    '--resolution',
    'revise',
    '--to-role',
    'author',
    '--to-actor',
    'fixture-author-three',
    '--reason',
    '同阶段补路径场景',
  ]);
  assert.equal(ownerRevision.run.actionType, 'revise-propose');
  assert.equal(ownerRevision.run.revisesRunRef, proposal.run.ref);
  assert.deepEqual(fs.readFileSync(path.join(root, rp.run.ref)), verdictBytes);
  fs.appendFileSync(
    path.join(change, 'specs/bounded-proof/spec.md'),
    '\n#### Scenario: Unsafe managed path\n- **WHEN** a required managed path escapes the target\n- **THEN** fail without reading or writing outside\n',
  );
  fs.appendFileSync(
    path.join(change, 'design.md'),
    '\n受管路径在读取前拒绝 ..、绝对路径和 junction 越界；历史说明不是必要输入。\n',
  );
  fs.appendFileSync(
    path.join(change, 'tasks.md'),
    '- [ ] 1.2 受管路径越界拒绝、无外部读写的回归。\n',
  );
  assert.ok(fs.readFileSync(path.join(change, 'tasks.md'), 'utf8').includes('越界拒绝'));
  finish(
    ownerRevision.run,
    '夹具修订：增加路径越界拒绝设计与测试；约束保持不自动安装，待新的独立审核。',
  );
  const finalReview = start('review-propose', 'fixture-reviewer-three', [
    '--author-run',
    ownerRevision.run.ref,
  ]);
  assert.equal(
    finish(
      finalReview.run,
      '夹具补审核对修订范围及失败场景。仅受控实验，不是当前 Change 审核。',
      'approved',
    ).next.action,
    'apply',
  );
});

test('两个真实进程 resolve 竞争只允许接收 Run，持锁 diagnose 观察存活且不改字节', async () => {
  const parent = sandbox();
  const env = isolatedEnv(parent);
  const root = fixture(parent);
  scopeFile(root);
  prepareChange(root, env);
  const invoke = (args: string[], status = 0) => {
    const result = cli([...args, '--project', root, '--json'], parent, env);
    assert.equal(result.status, status, result.stdout || result.stderr);
    return JSON.parse(result.stdout);
  };
  invoke([
    'delivery',
    'open',
    '--id',
    'd01',
    '--title',
    '竞争夹具',
    '--scope',
    'scope.json',
    '--change',
    'proof-entry',
    '--slot',
    'A',
  ]);
  const a = invoke([
    'action',
    'start',
    '--change',
    'proof-entry',
    '--type',
    'explore',
    '--role',
    'author',
    '--actor',
    'fixture-original',
  ]);
  const old = fs.readFileSync(path.join(root, a.run.ref));
  const release = path.join(parent, 'release');
  const child = fork(
    path.join(repository, 'tests/fixtures/action-resolver.ts'),
    [root, a.run.ref, release],
    { cwd: parent, env, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] },
  );
  let stderr = '';
  child.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });
  const exited = once(child, 'exit');
  const [ready] = await once(child, 'message');
  assert.equal(ready.ready, true, ready.error);
  try {
    const before = snapshot(root);
    const observed = invoke(['workspace', 'diagnose']);
    assert.equal(observed.lock.pid, child.pid);
    assert.equal(observed.lock.liveness, 'alive');
    assert.deepEqual(snapshot(root), before);
    assert.equal(
      invoke(
        [
          'action',
          'resolve',
          '--run',
          a.run.ref,
          '--role',
          'owner',
          '--actor',
          'fixture-owner',
          '--resolution',
          'handoff',
          '--to-role',
          'author',
          '--to-actor',
          'competitor',
          '--reason',
          '受控竞争',
        ],
        1,
      ).error.code,
      'write-in-progress-or-interrupted',
    );
    assert.deepEqual(snapshot(root), before);
  } finally {
    fs.writeFileSync(release, 'release');
  }
  const [exit] = await exited;
  assert.equal(exit, 0, stderr);
  const state = invoke(['status']);
  assert.equal(state.run.runNumber, 2);
  assert.equal(state.run.actorId, 'receiver');
  assert.deepEqual(fs.readFileSync(path.join(root, a.run.ref)), old);
});
