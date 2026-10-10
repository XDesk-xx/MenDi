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
} from './archive-support.ts';

for (const phase of ['prepared', 'none']) {
  test(`RA-D-002：${phase} 调用标记提交前真实中断，保留占号并由另一次显式 execute 完成`, () => {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    if (phase === 'none') {
      assert.equal(worker(target.root, draft.run.ref, 'execute', 'after-invoking').status, 88);
      disposeStoppedFixtureLock(target.root);
      assert.equal(archiveCli(target.root, draft.run.ref).result, 'observed-none');
    }
    const before = fs.readFileSync(path.join(target.root, draft.run.ref));
    const project = fs.readFileSync(path.join(target.root, '.mendi/project.json'));
    const failed = worker(target.root, draft.run.ref, 'execute', 'before-run-commit');
    assert.equal(failed.status, 88, failed.stdout + failed.stderr);
    const pending = archiveRun(target.root, true);
    assert.equal(pending.record.archive!.phase, phase);
    assert.equal(pending.record.archive!.attempt, phase === 'none' ? 1 : 0);
    assert.deepEqual(fs.readFileSync(path.join(target.root, draft.run.ref)), before);
    assert.deepEqual(fs.readFileSync(path.join(target.root, '.mendi/project.json')), project);
    assert.equal(fs.existsSync(path.join(target.root, 'native-calls.txt')), false);
    const artifacts = path.join(target.root, path.dirname(draft.run.ref), 'artifacts');
    const reserved: Record<string, Buffer> = {};
    for (const directory of fs.readdirSync(artifacts)) {
      if (!/^attempt-\d+$/.test(directory)) continue;
      for (const name of fs.readdirSync(path.join(artifacts, directory)))
        reserved[path.join(directory, name)] = fs.readFileSync(
          path.join(artifacts, directory, name),
        );
    }
    const orphan = path.join(artifacts, phase === 'none' ? 'attempt-002' : 'attempt-001');
    assert.ok(fs.existsSync(path.join(orphan, 'inputs.json')));
    assert.ok(fs.existsSync(path.join(orphan, 'invocation.json')));
    assert.equal(fs.existsSync(path.join(orphan, 'launch.json')), false);
    disposeStoppedFixtureLock(target.root);
    const done = worker(target.root, draft.run.ref, 'execute');
    assert.equal(done.status, 0, done.stdout + done.stderr);
    assert.equal(archiveRun(target.root).record.archive!.attempt, phase === 'none' ? 3 : 2);
    for (const [ref, bytes] of Object.entries(reserved))
      assert.deepEqual(fs.readFileSync(path.join(artifacts, ref)), bytes);
    assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(target.root, '.mendi/project.json'), 'utf8'))
        .archivedChangeCount,
      1,
    );
    assert.equal(archiveCli(target.root, draft.run.ref).result, 'already-completed');
  });
}

test('RA-D-002：当前 attempt 非规范号、超出安全整数、非目录与外部 junction 占号在调用前拒绝', () => {
  for (const fault of ['noncanonical', 'overflow', 'file', 'junction']) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    const artifacts = path.join(target.root, path.dirname(draft.run.ref), 'artifacts');
    fs.mkdirSync(artifacts, { recursive: true });
    const name =
      fault === 'noncanonical'
        ? 'attempt-01'
        : fault === 'overflow'
          ? 'attempt-9007199254740991'
          : 'attempt-001';
    const occupied = path.join(artifacts, name);
    if (fault === 'file') fs.writeFileSync(occupied, '保留占号');
    else if (fault === 'junction') fs.symlinkSync(path.dirname(target.root), occupied, 'junction');
    else fs.mkdirSync(occupied);
    const before = fs.readFileSync(path.join(target.root, draft.run.ref));
    const refused = worker(target.root, draft.run.ref, 'execute');
    assert.equal(refused.status, 1, refused.stdout + refused.stderr);
    assert.equal(fs.existsSync(path.join(target.root, 'native-calls.txt')), false);
    assert.deepEqual(fs.readFileSync(path.join(target.root, draft.run.ref)), before);
    assert.equal(fs.existsSync(occupied), true);
    assert.equal(fs.existsSync(target.change), true);
  }
});
