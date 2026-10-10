import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  archiveTarget,
  prepare,
  archiveRun,
  worker,
  disposeStoppedFixtureLock,
  archiveCli,
  archiveInput,
} from './archive-support.ts';
import { stageTarget, reviewApply, owner } from './delivery-stage-support.ts';
import { startAction, submitRun, continueAction, saveRun } from '../src/application/actions.ts';
import { archiveAction } from '../src/application/archive.ts';
import { resolveAction } from '../src/application/action-resolution.ts';
import { actionInstructions } from '../src/application/action-instructions.ts';
import { runProcess } from '../src/adapters/openspec.ts';

test('Archive prepare 必须直接独立批准及 all_done；准备只建 typed draft，笔记只本地保存', () => {
  const unfinished = stageTarget();
  reviewApply(unfinished, 'approved');
  assert.throws(() => prepare({ ...unfinished, review: unfinished.apply }), /all_done/);
  for (const verdict of ['rejected', 'changes-requested']) {
    const bad = archiveTarget(verdict);
    assert.throws(() => prepare(bad));
  }
  const missing = archiveTarget('approved');
  fs.unlinkSync(path.join(missing.change, 'design.md'));
  assert.throws(() => prepare(missing));
  const self = archiveTarget('approved');
  const reviewFile = path.join(self.root, self.review.run.ref);
  fs.writeFileSync(
    reviewFile,
    fs.readFileSync(reviewFile, 'utf8').replace('actorId: reviewer-one', 'actorId: author-one'),
  );
  assert.throws(() => prepare(self));
  const target = archiveTarget('approved');
  const before = fs.readFileSync(path.join(target.root, '.mendi/project.json'));
  let calls = 0;
  const draft = startAction(
    {
      project: target.root,
      changeId: 'proof-entry',
      type: 'archive',
      role: 'author',
      actor: 'archive-author',
    },
    {
      runner: (entry, args, cwd) => {
        if (args[0] === 'archive') calls++;
        return runProcess(entry, args, cwd);
      },
    },
  );
  assert.equal(calls, 0);
  assert.deepEqual(fs.readFileSync(path.join(target.root, '.mendi/project.json')), before);
  assert.equal(draft.run.archive!.phase, 'prepared');
  assert.equal(draft.local.changeBindings[0].state, 'archiving');
  const instructions = actionInstructions({
    project: target.root,
    actionId: draft.run.actionId,
    operation: 'archive',
  });
  assert.equal(instructions.instructions.changeName, 'proof-entry');
  const body = path.join(target.root, 'notes.md');
  fs.writeFileSync(body, '保留 Archive 笔记。\n');
  saveRun(
    { ...archiveInput(target.root, draft.run.ref), bodyFile: body },
    {
      runner: () => {
        throw new Error('save 不应访问工具');
      },
    },
  );
  assert.equal(archiveRun(target.root).record.archive!.phase, 'prepared');
  assert.throws(() =>
    submitRun({
      ...archiveInput(target.root, draft.run.ref),
      outcome: 'complete',
      result: 'archived',
    }),
  );
  assert.throws(() =>
    continueAction({ ...archiveInput(target.root, draft.run.ref), actionId: draft.run.actionId }),
  );
  for (const type of ['review-archive', 'revise-archive', 'apply'])
    assert.throws(() =>
      startAction({
        project: target.root,
        role: 'author',
        actor: 'archive-author',
        changeId: 'proof-entry',
        type,
      }),
    );
  const invalid = worker(target.root, draft.run.ref, 'execute', 'after-invoking');
  assert.equal(invalid.status, 88, invalid.stdout + invalid.stderr);
  assert.equal(archiveRun(target.root, true).record.archive!.phase, 'invoking');
});

test('真实固定原生 Archive 同步、累计编号、local-only repeated finish 与 prepared Owner rollback', () => {
  const target = archiveTarget('approved');
  const draft = prepare(target);
  const result = archiveCli(target.root, draft.run.ref, 'execute');
  assert.equal(result.result, 'archived');
  assert.equal(result.archiveStatus, 'completed');
  assert.equal(result.local.activeChangeId, null);
  assert.equal(result.run.archive.ordinal, 1);
  assert.match(result.local.changeBindings[0].changeRef, /\d{4}-\d{2}-\d{2}-001-proof-entry$/);
  assert.equal(fs.existsSync(target.change), false);
  assert.match(
    fs.readFileSync(path.join(target.root, 'openspec/specs/example/spec.md'), 'utf8'),
    /Controlled operation/,
  );
  const refs = ['.mendi/project.json', '.mendi/delivery-groups/d01/manifest.json', draft.run.ref];
  const before = refs.map((ref) => fs.readFileSync(path.join(target.root, ref)));
  const finished = archiveCli(
    target.root,
    draft.run.ref,
    'finish',
    0,
    path.join(target.root, 'missing-tool.js'),
  );
  assert.equal(finished.result, 'already-completed');
  assert.equal(finished.openspec, null);
  assert.equal(finished.executionMode, 'local-only');
  refs.forEach((ref, i) =>
    assert.deepEqual(fs.readFileSync(path.join(target.root, ref)), before[i]),
  );
  assert.throws(() => archiveAction(archiveInput(target.root, draft.run.ref)));
  const rollbackTarget = archiveTarget('approved');
  const p = prepare(rollbackTarget);
  const rollback = resolveAction({
    ...owner(rollbackTarget.root, p.run.ref, 'rollback'),
    phase: 'apply',
    revisesRunRef: rollbackTarget.apply.run.ref,
  });
  assert.equal(rollback.run.actionType, 'revise-apply');
  assert.equal(rollback.local.changeBindings[0].state, 'active');
});

test('真实原生已完成但公开响应丢失 / 错身份 / 错 root / 越界返回非零，保留错误并由新进程 finish 收口', () => {
  for (const response of ['lost', 'wrong-root', 'wrong-change', 'wrong-path']) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    const result = worker(target.root, draft.run.ref, 'execute', '', response);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
    const pending = archiveRun(target.root, true);
    assert.equal(pending.record.archive!.phase, 'confirmed');
    disposeStoppedFixtureLock(target.root);
    const finished = archiveCli(target.root, draft.run.ref);
    assert.equal(finished.result, 'archived');
    assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
    const raw = JSON.parse(
      fs.readFileSync(
        path.join(target.root, pending.record.archive!.attemptRef!, 'native-result.json'),
        'utf8',
      ),
    );
    assert.equal(raw.status, 0);
    if (response === 'lost') assert.equal(raw.stdout, '');
  }
});

test('execute 锁内直接批准变化在原生调用前拒绝，不建立 attempt', () => {
  const target = archiveTarget('approved');
  const draft = prepare(target);
  let calls = 0;
  assert.throws(() =>
    archiveAction(archiveInput(target.root, draft.run.ref), {
      runner: (entry, args, cwd) => {
        if (args[0] === 'archive') calls++;
        return runProcess(entry, args, cwd);
      },
      observeWrite: (phase) => {
        if (phase === 'lock-acquired')
          fs.appendFileSync(path.join(target.root, target.apply.run.ref), '\n漂移');
      },
    }),
  );
  assert.equal(calls, 0);
  assert.equal(archiveRun(target.root).record.archive!.attempt, 0);
  assert.equal(fs.existsSync(path.join(target.root, '.mendi/write.lock')), false);
});
