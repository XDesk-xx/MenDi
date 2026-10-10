import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  archiveTarget,
  prepare,
  worker,
  disposeStoppedFixtureLock,
  archiveCli,
  archiveRun,
  archiveInput,
} from './archive-support.ts';
import { owner } from './delivery-stage-support.ts';
import { resolveAction } from '../src/application/action-resolution.ts';
import { archiveAction } from '../src/application/archive.ts';

test('RP-D-001：调用标记后真实中断，新进程 finish 仅观察 none；独立 execute 创建第二次尝试', () => {
  const target = archiveTarget('approved');
  const draft = prepare(target);
  const interrupted = worker(target.root, draft.run.ref, 'execute', 'after-invoking');
  assert.equal(interrupted.status, 88, interrupted.stdout + interrupted.stderr);
  const prior = archiveRun(target.root, true);
  const attempt = path.join(target.root, prior.record.archive!.attemptRef!);
  const marker = fs.readFileSync(path.join(attempt, 'invocation.json'));
  const inputs = fs.readFileSync(path.join(attempt, 'inputs.json'));
  const project = fs.readFileSync(path.join(target.root, '.mendi/project.json'));
  const manifest = fs.readFileSync(
    path.join(target.root, '.mendi/delivery-groups/d01/manifest.json'),
  );
  assert.equal(fs.existsSync(path.join(target.root, 'native-calls.txt')), false);
  assert.throws(() => archiveAction(archiveInput(target.root, draft.run.ref)));
  disposeStoppedFixtureLock(target.root);
  assert.throws(() => archiveAction(archiveInput(target.root, draft.run.ref)));
  assert.throws(() =>
    resolveAction({
      ...owner(target.root, draft.run.ref, 'rollback'),
      phase: 'apply',
      revisesRunRef: target.apply.run.ref,
    }),
  );
  const observed = archiveCli(
    target.root,
    draft.run.ref,
    'finish',
    0,
    path.join(target.root, 'unavailable.js'),
  );
  assert.equal(observed.result, 'observed-none');
  assert.equal(observed.archiveStatus, 'pending');
  assert.equal(observed.run.status, 'draft');
  assert.equal(observed.run.archive.phase, 'none');
  assert.equal(observed.next.action, 'archive-execute');
  assert.equal(observed.local.activeChangeId, 'proof-entry');
  assert.equal(archiveRun(target.root).body, prior.body);
  assert.deepEqual(fs.readFileSync(path.join(attempt, 'invocation.json')), marker);
  assert.deepEqual(fs.readFileSync(path.join(attempt, 'inputs.json')), inputs);
  assert.deepEqual(fs.readFileSync(path.join(target.root, '.mendi/project.json')), project);
  assert.deepEqual(
    fs.readFileSync(path.join(target.root, '.mendi/delivery-groups/d01/manifest.json')),
    manifest,
  );
  const runBytes = fs.readFileSync(path.join(target.root, draft.run.ref));
  assert.equal(archiveCli(target.root, draft.run.ref).result, 'observed-none');
  assert.deepEqual(fs.readFileSync(path.join(target.root, draft.run.ref)), runBytes);
  const done = worker(target.root, draft.run.ref, 'execute');
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.equal(archiveRun(target.root).record.archive!.attempt, 2);
  assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
  assert.deepEqual(fs.readFileSync(path.join(attempt, 'invocation.json')), marker);
});

test('RP-D-001：真实原生验证失败后、none 保存前中断；保留原错误，观察后 Owner rollback 另建 revise', () => {
  const target = archiveTarget('approved');
  const delta = path.join(target.change, 'specs/example/spec.md');
  fs.writeFileSync(
    delta,
    '## ADDED Requirements\n\n### Requirement: Invalid\n缺少规范词和场景。\n',
  );
  const draft = prepare(target);
  const failure = worker(target.root, draft.run.ref, 'execute', 'before-none-observation');
  assert.equal(failure.status, 88, failure.stdout + failure.stderr);
  const pending = archiveRun(target.root, true);
  const rawFile = path.join(target.root, pending.record.archive!.attemptRef!, 'native-result.json');
  const raw = fs.readFileSync(rawFile);
  assert.notEqual(JSON.parse(raw.toString()).status, 0);
  disposeStoppedFixtureLock(target.root);
  const observed = archiveCli(target.root, draft.run.ref);
  assert.equal(observed.result, 'observed-none');
  assert.equal(observed.run.status, 'draft');
  assert.deepEqual(fs.readFileSync(rawFile), raw);
  assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
  const rollback = resolveAction({
    ...owner(target.root, draft.run.ref, 'rollback'),
    phase: 'propose',
    revisesRunRef: target.refs.propose,
  });
  assert.equal(rollback.run.actionType, 'revise-propose');
  assert.equal(rollback.run.ownerDecision!.sourceRunRef, draft.run.ref);
  assert.equal(rollback.next.action, 'run-save-or-submit');
  assert.deepEqual(fs.readFileSync(rawFile), raw);
});

test('真实提交点中断后 finish 只补缺失交接；一次计数、终态 Run 不重写、原生不重调', () => {
  for (const fault of [
    'before-archive-numbering',
    'after-count-commit',
    'after-archive-run-commit',
    'before-manifest-commit',
    'final-readback',
    'before-lock-release',
  ]) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    const failed = worker(target.root, draft.run.ref, 'execute', fault);
    assert.equal(failed.status, 88, `${fault}: ${failed.stdout}${failed.stderr}`);
    const pending = archiveRun(target.root, true);
    const terminal =
      pending.record.status === 'submitted'
        ? fs.readFileSync(path.join(target.root, draft.run.ref))
        : null;
    disposeStoppedFixtureLock(target.root);
    const finished = archiveCli(
      target.root,
      draft.run.ref,
      'finish',
      0,
      path.join(target.root, 'missing.js'),
    );
    assert.ok(['archived', 'already-completed'].includes(finished.result));
    assert.equal(finished.run.archive.ordinal, 1);
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(target.root, '.mendi/project.json'), 'utf8'))
        .archivedChangeCount,
      1,
    );
    if (terminal)
      assert.deepEqual(fs.readFileSync(path.join(target.root, draft.run.ref)), terminal);
    const before = fs.readFileSync(path.join(target.root, draft.run.ref));
    assert.equal(archiveCli(target.root, draft.run.ref).result, 'already-completed');
    assert.deepEqual(fs.readFileSync(path.join(target.root, draft.run.ref)), before);
    assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
  }
});

test('无效果现场缺失 / 变化 / 候选 / 活跃或 unknown 写者、观察写入失败均不能伪报 none', () => {
  for (const fault of [
    'missing-input',
    'changed-source',
    'changed-main',
    'candidate',
    'alive',
    'unknown',
    'observe-write',
    'observe-readback',
  ]) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    assert.equal(worker(target.root, draft.run.ref, 'execute', 'after-invoking').status, 88);
    const run = archiveRun(target.root, true);
    disposeStoppedFixtureLock(target.root);
    const attempt = path.join(target.root, run.record.archive!.attemptRef!);
    if (fault === 'missing-input') fs.unlinkSync(path.join(attempt, 'inputs.json'));
    if (fault === 'changed-source')
      fs.appendFileSync(path.join(target.change, '.openspec.yaml'), 'changed: true\n');
    if (fault === 'changed-main') {
      fs.mkdirSync(path.join(target.root, 'openspec/specs/example'), { recursive: true });
      fs.writeFileSync(
        path.join(target.root, 'openspec/specs/example/spec.md'),
        '变更后的主规格\n',
      );
    }
    if (fault === 'candidate')
      fs.mkdirSync(path.join(target.root, 'openspec/changes/archive/2026-10-11-proof-entry'), {
        recursive: true,
      });
    const options =
      fault === 'alive' || fault === 'unknown'
        ? { probe: () => fault as 'alive' | 'unknown' }
        : fault === 'observe-write' || fault === 'observe-readback'
          ? {
              observeWrite: (phase: string) => {
                if (phase === (fault === 'observe-write' ? 'before-run-commit' : 'before-readback'))
                  throw new Error('观察故障');
              },
            }
          : {};
    assert.throws(
      () => archiveAction(archiveInput(target.root, draft.run.ref, 'finish'), options),
      fault,
    );
    const current = archiveRun(
      target.root,
      fs.existsSync(path.join(target.root, '.mendi/write.lock')),
    );
    assert.notEqual(current.record.status, 'submitted');
    if (fault !== 'observe-readback') assert.equal(current.record.archive!.phase, 'invoking');
    if (fault.startsWith('observe-'))
      assert.equal(fs.existsSync(path.join(target.root, '.mendi/write.lock')), true);
  }
});

test('已保存 none 后重新 execute 仍检查输入、批准和任务；变化不产生新 attempt / 原生调用', () => {
  for (const fault of ['source', 'approval', 'tasks']) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    assert.equal(worker(target.root, draft.run.ref, 'execute', 'after-invoking').status, 88);
    disposeStoppedFixtureLock(target.root);
    archiveCli(target.root, draft.run.ref);
    if (fault === 'source')
      fs.appendFileSync(path.join(target.change, 'proposal.md'), '方案变化\n');
    if (fault === 'approval') fs.unlinkSync(path.join(target.root, target.review.run.ref));
    if (fault === 'tasks')
      fs.writeFileSync(path.join(target.change, 'tasks.md'), '- [ ] 1.1 尚未完成\n');
    assert.throws(() => archiveAction(archiveInput(target.root, draft.run.ref)));
    assert.equal(archiveRun(target.root).record.archive!.attempt, 1);
    assert.equal(fs.existsSync(path.join(target.root, 'native-calls.txt')), false);
  }
});
