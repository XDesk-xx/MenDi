import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { testTarget, pnpmEntry } from './test-support.ts';
import { command, isolatedEnv, prepareChange, scopeFile } from './helpers.ts';
import { openDelivery, bindChange } from '../src/application/project.ts';
import { startAction, saveRun, submitRun } from '../src/application/actions.ts';
import { archiveAction } from '../src/application/archive.ts';
import { archiveInput } from './archive-support.ts';
import { options } from './action-support.ts';
import { runProcess, type ProcessRunner } from '../src/adapters/openspec.ts';

// 原生 scaffold / bind / Archive；阶段批准仅为前置夹具，不能认证仓库 Change。
const stageRunner: ProcessRunner = (entry, args, cwd) => {
  const result = options.runner(entry, args, cwd);
  if (args[0] === '--version') return result;
  if (args[0] === 'list') return runProcess(entry, args, cwd);
  const change = args[args.indexOf('--change') + 1];
  return {
    ...result,
    stdout: JSON.stringify({
      ...JSON.parse(result.stdout),
      changes: [{ name: change }],
      changeName: change,
    }),
  };
};
export function sequentialTarget() {
  const root = testTarget(false);
  const env = isolatedEnv(path.dirname(root));
  const setup = command(pnpmEntry, ['install', '--offline', '--ignore-scripts'], root, {
    ...env,
    COREPACK_ENABLE_NETWORK: '0',
  });
  assert.equal(setup.status, 0, setup.stderr);
  for (const [change, capability] of [
    ['proof-entry', 'example'],
    ['second-entry', 'second-example'],
  ]) {
    prepareChange(root, env, change);
    const home = path.join(root, 'openspec/changes', change);
    fs.writeFileSync(path.join(home, 'proposal.md'), '# Proposal\n\n受控变化。\n');
    fs.writeFileSync(path.join(home, 'design.md'), '# Design\n\n受控实施。\n');
    fs.writeFileSync(path.join(home, 'tasks.md'), '# Tasks\n\n- [x] 1.1 受控行为已完成\n');
    fs.mkdirSync(path.join(home, 'specs', capability), { recursive: true });
    fs.writeFileSync(
      path.join(home, 'specs', capability, 'spec.md'),
      '# Spec Delta\n\n## Purpose\n\n该受控规格用于独立项目的顺序归档验证，记录明确场景及本次实际效果，不认证真实用户或当前仓库 Change 的实施与审核批准。\n\n## ADDED Requirements\n\n### Requirement: Controlled operation\n系统 SHALL 保存本次明确操作的结果。\n\n#### Scenario: Explicit operation\n- **WHEN** 明确执行受控操作\n- **THEN** 保存本次结果\n',
    );
  }
  openDelivery({
    project: root,
    id: 'd01',
    title: '顺序验证',
    scopePath: scopeFile(root),
    changeId: 'proof-entry',
    slot: 'A',
  });
  const first = approvedArchive(root, 'proof-entry');
  const completed = archiveAction(archiveInput(root, first.run.ref));
  assert.equal(completed.result, 'archived');
  return { root, first, firstBinding: completed.local.changeBindings[0] };
}
export function associateSecond(root: string) {
  return bindChange({ project: root, slot: 'B', changeId: 'second-entry' });
}
export function stage(root: string, changeId: string, type: string, authorRunRef?: string) {
  const review = type.startsWith('review-');
  const actor = review ? 'reviewer-one' : 'author-one';
  const role = review ? 'reviewer' : 'author';
  const started = startAction(
    { project: root, changeId, type, role, actor, ...(authorRunRef ? { authorRunRef } : {}) },
    { runner: stageRunner },
  );
  const bodyFile = path.join(root, 'body.md');
  fs.writeFileSync(bodyFile, '夹具阶段前置，不是仓库批准。\n');
  saveRun(
    { project: root, role, actor, runRef: started.run.ref, bodyFile },
    { runner: stageRunner },
  );
  submitRun(
    {
      project: root,
      role,
      actor,
      runRef: started.run.ref,
      outcome: 'complete',
      result: '受控前置',
      ...(review ? { verdict: 'approved' } : {}),
    },
    { runner: stageRunner },
  );
  return started;
}
export function approvedArchive(root: string, changeId: string) {
  for (const phase of ['explore', 'propose', 'apply']) {
    const author = stage(root, changeId, phase);
    stage(root, changeId, 'review-' + phase, author.run.ref);
  }
  return startAction({
    project: root,
    changeId,
    type: 'archive',
    role: 'author',
    actor: 'archive-author',
  });
}
