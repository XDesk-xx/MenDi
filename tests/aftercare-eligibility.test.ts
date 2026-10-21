import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { aftercareTarget, supplement, amendment, actual, baseline } from './aftercare-support.ts';
import { author, reviewer, options, actionTarget, startAuthor } from './action-support.ts';
import { startAction } from '../src/application/actions.ts';
import { runAftercare } from '../src/application/run-aftercare.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { scanRunNumbers } from '../src/adapters/runs.ts';
import { repository, cli, isolatedEnv, snapshot } from './helpers.ts';
import { projectRound } from '../src/core/rounds.ts';

test('下游 draft 与空占号立即阻断旧目标；已确认同请求仍只读，不授权新写', () => {
  const { root, input } = aftercareTarget();
  const inputFile = supplement(root);
  assert.equal(actual('supplement', { ...input, inputFile }).exit, 0);
  startAction(
    {
      ...reviewer(root),
      changeId: 'proof-entry',
      type: 'review-explore',
      authorRunRef: input.runRef,
    },
    options,
  );
  const before = snapshot(path.join(root, '.mendi'));
  assert.equal(actual('supplement', { ...input, inputFile }).value.alreadyConfirmed, true);
  assert.notEqual(actual('supplement', { ...input, inputFile: supplement(root, 's2') }).exit, 0);
  assert.notEqual(actual('amend', { ...input, ...amendment(root, input.runRef) }).exit, 0);
  assert.deepEqual(snapshot(path.join(root, '.mendi')), before);
  const t = aftercareTarget();
  const n = scanRunNumbers(t.root, 'd01').number;
  fs.mkdirSync(path.join(t.root, `.mendi/runs/d01/${String(n).padStart(3, '0')}-delivery-repair`));
  assert.throws(
    () => runAftercare('supplement', { ...t.input, inputFile: supplement(t.root) }),
    /下游/,
  );
});

test('draft、错误 role/actor/run、旧 legacy/manual 不写 aftercare', () => {
  const draftRoot = actionTarget(),
    draft = startAuthor(draftRoot).run;
  assert.throws(() =>
    runAftercare('supplement', {
      ...author(draftRoot),
      runRef: draft.ref,
      inputFile: supplement(draftRoot),
    }),
  );
  const { root, input } = aftercareTarget(),
    unchanged = baseline(root, input.runRef);
  const inputFile = supplement(root);
  for (const patch of [
    { role: 'reviewer' },
    { actor: 'other' },
    { role: 'owner' },
    { runRef: input.runRef.replace('001-', '099-') },
  ])
    assert.notEqual(actual('supplement', { ...input, inputFile, ...patch }).exit, 0);
  unchanged();
  const ws = readWorkspace(root)!;
  const p = path.join(root, '.mendi/project.json'),
    m = path.join(root, ws.manifestRef);
  fs.writeFileSync(p, JSON.stringify({ ...ws.project, formatVersion: 1 }));
  fs.writeFileSync(m, JSON.stringify({ ...ws.manifest, formatVersion: 1 }));
  assert.notEqual(actual('supplement', { ...input, inputFile }).exit, 0);
  const manual = JSON.parse(
    fs.readFileSync(path.join(repository, 'tests/fixtures/manual-bootstrap-records.json'), 'utf8'),
  );
  fs.writeFileSync(p, JSON.stringify(manual.project));
  fs.writeFileSync(m, JSON.stringify(manual.manifest));
  const before = snapshot(path.join(root, '.mendi'));
  assert.notEqual(actual('supplement', { ...input, inputFile }).exit, 0);
  assert.deepEqual(snapshot(path.join(root, '.mendi')), before);
});

test('历史轮的 archived Change 不能借当前新轮重新获得权限', () => {
  const { root, input } = aftercareTarget();
  const ws = readWorkspace(root)!;
  // Deliberately inconsistent cross-round/binding state must fail closed before writes.
  const round = ws.rounds![0];
  const old = {
    ...round,
    id: 'r001',
    state: 'closed' as const,
    closedOn: '2026-10-10',
    closeRunRef: '.mendi/runs/d01/002-delivery-close/run.md',
    deliveryRunRef: '.mendi/runs/d01/002-delivery-close/run.md',
    fullTestRunRef: '.mendi/runs/d01/001-delivery-full-test/run.md',
  };
  const next = {
    ...round,
    id: 'r002',
    origin: { kind: 'reopen' as const, runRef: '.mendi/runs/d01/003-delivery-reopen/run.md' },
    reason: '新轮',
    currentBatchId: null,
    scope: { goal: '新轮', plannedChanges: [{ slot: 'B', title: '新事项', dependsOn: [] }] },
  };
  const manifest = projectRound({ ...ws.manifest, activeChangeId: null }, [old, next], 'r002');
  fs.writeFileSync(path.join(root, ws.manifestRef), JSON.stringify(manifest));
  assert.notEqual(actual('supplement', { ...input, inputFile: supplement(root) }).exit, 0);
});

test('来源绝对/越界/缺失/目录/外部 junction/别名重复和坏时间声明均拒绝', () => {
  const { root, input } = aftercareTarget();
  const outside = path.dirname(root);
  fs.writeFileSync(path.join(outside, 'external.txt'), '外部必要原件');
  fs.symlinkSync(outside, path.join(root, 'outside-link'), 'junction');
  fs.writeFileSync(path.join(root, 'proof.txt'), '原件');
  fs.linkSync(path.join(root, 'proof.txt'), path.join(root, 'alias.txt'));
  for (const evidence of [
    ['../external.txt'],
    [path.join(outside, 'external.txt')],
    ['missing.txt'],
    ['openspec'],
    ['outside-link/external.txt'],
    ['proof.txt', 'alias.txt'],
  ]) {
    const before = snapshot(path.join(root, '.mendi'));
    assert.notEqual(
      actual('supplement', { ...input, inputFile: supplement(root, 's1', { evidence }) }).exit,
      0,
    );
    assert.deepEqual(snapshot(path.join(root, '.mendi')), before);
  }
  const args = [
    'run',
    'amend',
    '--project',
    root,
    '--run',
    input.runRef,
    '--role',
    input.role,
    '--actor',
    input.actor,
    '--request-id',
    'a1',
    '--kind',
    'unreviewed-comment',
    '--comment',
    'outside-link/external.txt',
    '--reason',
    '尝试越界',
    '--json',
  ];
  assert.notEqual(cli(args, root, isolatedEnv(root)).status, 0);
});
