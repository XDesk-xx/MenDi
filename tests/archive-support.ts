import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { stageTarget, reviewApply } from './delivery-stage-support.ts';
import { startAction } from '../src/application/actions.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { currentRun } from '../src/adapters/runs.ts';
import { cli, command, isolatedEnv } from './helpers.ts';
import { probeProcess } from '../src/application/diagnosis.ts';

export function archiveTarget(approved: string) {
  const target = stageTarget(true);
  const review = reviewApply(target, approved);
  return { ...target, review };
}
export function prepare(target: ReturnType<typeof archiveTarget>) {
  return startAction({
    project: target.root,
    changeId: 'proof-entry',
    type: 'archive',
    role: 'author',
    actor: 'archive-author',
  });
}
export function archiveInput(root: string, runRef: string, mode = 'execute') {
  return { project: root, runRef, role: 'author', actor: 'archive-author', mode };
}
export function worker(root: string, runRef: string, mode: string, fault = '', response = '') {
  const result = command(
    'tests/fixtures/archive-worker.ts',
    [root, runRef, mode, fault, response],
    process.cwd(),
    isolatedEnv(path.dirname(root)),
  );
  if (process.env.MENDI_TEST_EVIDENCE_DIR) {
    const run = archiveRun(root, fs.existsSync(path.join(root, '.mendi/write.lock')));
    const files: Record<string, string> = {};
    if (run.record.archive!.attemptRef) {
      const directory = path.join(root, run.record.archive!.attemptRef!);
      for (const name of fs.readdirSync(directory))
        if (
          /^(inputs|invocation|launch|native-exit|native-result|observation-\d+)\.json$/.test(name)
        )
          files[name] = fs.readFileSync(path.join(directory, name), 'utf8');
    }
    fs.mkdirSync(process.env.MENDI_TEST_EVIDENCE_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(process.env.MENDI_TEST_EVIDENCE_DIR, `archive-scenes-${process.pid}.jsonl`),
      JSON.stringify({
        root,
        runRef,
        mode,
        fault,
        response,
        status: result.status,
        run,
        files,
        project: JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8')),
      }) + '\n',
    );
  }
  return result;
}
// This is explicit fixture-only Owner lock disposition after a stopped worker, never a CLI unlock.
export function disposeStoppedFixtureLock(root: string) {
  const resolved = fs.realpathSync(root);
  const parent = fs.realpathSync(path.join(process.cwd(), '.tmp')) + path.sep;
  assert.ok(resolved.startsWith(parent));
  const lock = path.join(resolved, '.mendi/write.lock');
  const bytes = fs.readFileSync(lock);
  const owner = JSON.parse(bytes.toString());
  assert.equal(probeProcess(owner.pid), 'not-found');
  assert.deepEqual(fs.readFileSync(lock), bytes);
  fs.unlinkSync(lock);
}
export function archiveCli(root: string, ref: string, mode = 'finish', exit = 0, bin?: string) {
  const result = cli(
    [
      'action',
      'archive',
      '--project',
      root,
      '--run',
      ref,
      '--role',
      'author',
      '--actor',
      'archive-author',
      '--mode',
      mode,
      '--json',
      ...(bin ? ['--openspec-bin', bin] : []),
    ],
    root,
    isolatedEnv(path.dirname(root)),
  );
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
export function archiveRun(root: string, ownLock = false) {
  return currentRun(root, readWorkspace(root, ownLock)!)!;
}
