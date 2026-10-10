import fs from 'node:fs';
import path from 'node:path';
import { startAction } from '../src/application/actions.ts';
import { actionTarget, author, reviewer, finish, options } from './action-support.ts';

// Each call creates a separate controlled target. Approval below is explicit fixture data,
// never a verdict on the repository Change. Native operation tests use the fixed real tool.
export function stageTarget(done = false) {
  const root = actionTarget();
  const change = path.join(root, 'openspec/changes/proof-entry');
  fs.mkdirSync(path.join(change, 'specs/example'), { recursive: true });
  fs.writeFileSync(
    path.join(change, '.openspec.yaml'),
    'schema: spec-driven\ncreated: 2026-10-10\n',
  );
  fs.writeFileSync(path.join(change, 'proposal.md'), '# Proposal\n\n受控产品行为。\n');
  fs.writeFileSync(path.join(change, 'design.md'), '# Design\n\n受控实现与验证。\n');
  fs.writeFileSync(
    path.join(change, 'tasks.md'),
    `# Tasks\n\n- [${done ? 'x' : ' '}] 1.1 验证受控行为\n`,
  );
  fs.writeFileSync(
    path.join(change, 'specs/example/spec.md'),
    '# Spec Delta\n\n## ADDED Requirements\n\n### Requirement: Controlled operation\n' +
      '系统 SHALL 保存当前明确操作的结果。\n\n#### Scenario: Explicit operation\n' +
      '- **WHEN** 用户明确执行操作\n- **THEN** 保存当前操作的结果\n',
  );
  const refs: Record<string, string> = {};
  for (const phase of ['explore', 'propose']) {
    const a = startAction({ ...author(root), changeId: 'proof-entry', type: phase }, options);
    finish(root, a.run.ref);
    refs[phase] = a.run.ref;
    const r = startAction(
      {
        ...reviewer(root),
        changeId: 'proof-entry',
        type: `review-${phase}`,
        authorRunRef: a.run.ref,
      },
      options,
    );
    finish(root, r.run.ref, 'reviewer', 'complete', 'approved');
  }
  const apply = startAction({ ...author(root), changeId: 'proof-entry', type: 'apply' }, options);
  return { root, change, apply, refs };
}

export function reviewApply(target: ReturnType<typeof stageTarget>, verdict: string) {
  finish(target.root, target.apply.run.ref);
  const review = startAction(
    {
      ...reviewer(target.root),
      changeId: 'proof-entry',
      type: 'review-apply',
      authorRunRef: target.apply.run.ref,
    },
    options,
  );
  finish(target.root, review.run.ref, 'reviewer', 'complete', verdict);
  return review;
}

export function owner(project: string, runRef: string, resolution: string) {
  return {
    project,
    runRef,
    role: 'owner',
    actor: 'fixture-owner',
    reason: '当前受控处置',
    resolution,
    toRole: 'author',
    toActor: 'author-two',
  };
}
