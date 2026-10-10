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

function retirement(declared = true, remaining = false) {
  const target = archiveTarget('approved');
  if (declared)
    fs.appendFileSync(path.join(target.change, '.openspec.yaml'), 'retire_capabilities: true\n');
  const main = path.join(target.root, 'openspec/specs/example/spec.md');
  fs.mkdirSync(path.dirname(main), { recursive: true });
  const requirement = (name: string) =>
    `### Requirement: ${name}\n系统 SHALL 保存需求。\n\n#### Scenario: Explicit\n- **WHEN** 明确输入\n- **THEN** 保存结果\n`;
  fs.writeFileSync(
    main,
    '# Example\n\n## Purpose\n受控退役验证。\n\n## Requirements\n\n' +
      requirement('Last') +
      (remaining ? '\n' + requirement('Keep') : ''),
  );
  fs.writeFileSync(
    path.join(target.change, 'specs/example/spec.md'),
    '## REMOVED Requirements\n\n### Requirement: Last\n**Reason**: 需求已退役。\n**Migration**: 无。\n',
  );
  return { ...target, main };
}

for (const interrupted of [false, true]) {
  test(`RA-D-001：真实退役删除最后需求；${interrupted ? '中断后新进程 local-only finish' : '正常 execute'}与 repeated finish`, () => {
    const target = retirement();
    const draft = prepare(target);
    const executed = worker(
      target.root,
      draft.run.ref,
      'execute',
      interrupted ? 'native-returned' : '',
    );
    assert.equal(executed.status, interrupted ? 88 : 0, executed.stdout + executed.stderr);
    assert.equal(fs.existsSync(target.main), false);
    assert.equal(fs.existsSync(target.change), false);
    const pending = archiveRun(target.root, interrupted);
    const raw = JSON.parse(
      fs.readFileSync(
        path.join(target.root, pending.record.archive!.attemptRef!, 'native-result.json'),
        'utf8',
      ),
    );
    assert.equal(raw.status, 0);
    assert.equal(JSON.parse(raw.stdout).archive.totals.removed, 1);
    if (interrupted) {
      assert.equal(pending.record.archive!.phase, 'invoking');
      disposeStoppedFixtureLock(target.root);
      const done = archiveCli(
        target.root,
        draft.run.ref,
        'finish',
        0,
        path.join(target.root, 'unavailable.js'),
      );
      assert.equal(done.result, 'archived');
      assert.equal(done.executionMode, 'local-only');
      assert.equal(done.openspec, null);
    }
    const terminal = fs.readFileSync(path.join(target.root, draft.run.ref));
    assert.equal(archiveCli(target.root, draft.run.ref).result, 'already-completed');
    assert.deepEqual(fs.readFileSync(path.join(target.root, draft.run.ref)), terminal);
    assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(target.root, '.mendi/project.json'), 'utf8'))
        .archivedChangeCount,
      1,
    );
  });
}

test('RA-D-001：未声明退役 / 剩余需求时的主规格丢失、退役元数据变化与必要输入缺失仍停止', () => {
  for (const fault of ['undeclared', 'remaining', 'metadata', 'inputs']) {
    // The first two archives really remove Last but retain Keep; file loss is a negative corruption.
    const target = retirement(fault !== 'undeclared', ['undeclared', 'remaining'].includes(fault));
    const draft = prepare(target);
    const executed = worker(target.root, draft.run.ref, 'execute', 'native-returned');
    assert.equal(executed.status, 88, executed.stdout + executed.stderr);
    const pending = archiveRun(target.root, true);
    const attempt = path.join(target.root, pending.record.archive!.attemptRef!);
    const raw = JSON.parse(fs.readFileSync(path.join(attempt, 'native-result.json'), 'utf8'));
    assert.equal(raw.status, 0);
    if (['undeclared', 'remaining'].includes(fault)) fs.unlinkSync(target.main);
    if (fault === 'metadata')
      fs.appendFileSync(
        path.join(JSON.parse(raw.stdout).archive.path, '.openspec.yaml'),
        'changed: true\n',
      );
    if (fault === 'inputs') fs.unlinkSync(path.join(attempt, 'inputs.json'));
    disposeStoppedFixtureLock(target.root);
    const refused = archiveCli(target.root, draft.run.ref, 'finish', 1);
    assert.equal(refused.ok, false);
    assert.equal(archiveRun(target.root).record.archive!.phase, 'invoking');
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(target.root, '.mendi/project.json'), 'utf8'))
        .archivedChangeCount ?? 0,
      0,
    );
    assert.equal(fs.readFileSync(path.join(target.root, 'native-calls.txt'), 'utf8'), 'archive\n');
  }
});
