import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { actionTarget, startAuthor, finish, author, reviewer, options } from './action-support.ts';
import { startAction, saveRun, submitRun } from '../src/application/actions.ts';
import { readRunSource } from '../src/adapters/runs.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { cli, isolatedEnv } from './helpers.ts';

export function aftercareTarget(review = false) {
  const root = actionTarget();
  let run = startAuthor(root).run;
  finish(root, run.ref);
  if (review) {
    run = startAction(
      { ...reviewer(root), changeId: 'proof-entry', type: 'review-explore', authorRunRef: run.ref },
      options,
    ).run;
    fs.writeFileSync(path.join(root, 'review-body.md'), '审核未批准\n');
    saveRun({ ...reviewer(root), runRef: run.ref, bodyFile: 'review-body.md' }, options);
    submitRun(
      {
        ...reviewer(root),
        runRef: run.ref,
        outcome: 'complete',
        result: '隔离机器记录夹具，不认证实际审核语义',
        verdict: 'approved',
      },
      options,
    );
  }
  return { root, input: { ...(review ? reviewer(root) : author(root)), runRef: run.ref } };
}
export function supplement(root: string, requestId = 's1', patch: Record<string, unknown> = {}) {
  if (!fs.existsSync(path.join(root, 'proof.txt')))
    fs.writeFileSync(path.join(root, 'proof.txt'), '真实新证据\n');
  const ref = `${requestId}.json`;
  fs.writeFileSync(
    path.join(root, ref),
    JSON.stringify({
      requestId,
      source: '独立实测来源',
      reason: '补入必要事实',
      evidence: ['proof.txt'],
      ...patch,
    }),
  );
  return ref;
}
export function amendment(root: string, runRef: string, candidate?: string) {
  fs.writeFileSync(
    path.join(root, 'candidate.md'),
    candidate ?? readRunSource(root, runRef).body.trimEnd() + ' \r\n',
  );
  return {
    requestId: 'a1',
    kind: 'presentation-only',
    reason: '普通段落安全空白',
    bodyFile: 'candidate.md',
  };
}
export function actual(operation: string, input: Record<string, string | undefined>) {
  const flags = Object.entries(input).flatMap(([k, v]) =>
    v === undefined
      ? []
      : [
          `--${({ runRef: 'run', bodyFile: 'body', commentFile: 'comment', inputFile: 'input', requestId: 'request-id' } as Record<string, string>)[k] ?? k}`,
          v,
        ],
  );
  const r = cli(
    ['run', operation, ...flags, '--json'],
    input.project!,
    isolatedEnv(input.project!),
  );
  return { exit: r.status, value: JSON.parse(r.stdout || '{}'), raw: r };
}
export function baseline(root: string, ref: string) {
  const workspace = readWorkspace(root)!;
  const refs = [ref, '.mendi/project.json', workspace.manifestRef];
  const before = refs.map((r) => fs.readFileSync(path.join(root, r)));
  return () =>
    refs.forEach((r, i) => assert.deepEqual(fs.readFileSync(path.join(root, r)), before[i]));
}
