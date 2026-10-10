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
import { archiveAction } from '../src/application/archive.ts';
import { runProcess } from '../src/adapters/openspec.ts';

test('实际原生 MODIFIED / REMOVED / RENAMED 同步的定向读回保留未涉及需求', () => {
  const target = archiveTarget('approved');
  const main = path.join(target.root, 'openspec/specs/example/spec.md');
  fs.mkdirSync(path.dirname(main), { recursive: true });
  const req = (name: string, body: string) =>
    `### Requirement: ${name}\n系统 SHALL ${body}。\n\n#### Scenario: Explicit\n- **WHEN** 明确输入\n- **THEN** ${body}\n`;
  fs.writeFileSync(
    main,
    '# Example\n\n## Purpose\n受控主规格。\n\n## Requirements\n\n' +
      ['Keep', 'Modify', 'Remove', 'Rename'].map((name) => req(name, '保存')).join('\n'),
  );
  fs.writeFileSync(
    path.join(target.change, 'specs/example/spec.md'),
    '## MODIFIED Requirements\n\n' +
      req('Modify', '更新') +
      '\n## REMOVED Requirements\n\n### Requirement: Remove\n**Reason**: 合并。\n**Migration**: 无。\n' +
      '\n## RENAMED Requirements\n\n- FROM: `### Requirement: Rename`\n- TO: `### Requirement: Renamed`\n',
  );
  const draft = prepare(target);
  const result = archiveCli(target.root, draft.run.ref, 'execute');
  assert.equal(result.result, 'archived');
  const text = fs.readFileSync(main, 'utf8');
  assert.match(text, /Requirement: Keep/);
  assert.match(text, /Requirement: Renamed/);
  assert.doesNotMatch(text, /Requirement: Remove/);
  assert.match(text, /系统 SHALL 更新/);
});
test('实际日期变更后本地定位；无 count 字段解释为零，编号依据保持不变', () => {
  const target = archiveTarget('approved');
  const draft = prepare(target);
  assert.equal(
    worker(target.root, draft.run.ref, 'execute', 'before-archive-numbering').status,
    88,
  );
  const run = archiveRun(target.root, true);
  const candidate = path.join(target.root, run.record.archive!.archiveRef!);
  fs.renameSync(candidate, path.join(path.dirname(candidate), '2026-10-11-proof-entry'));
  disposeStoppedFixtureLock(target.root);
  const result = archiveCli(target.root, draft.run.ref);
  assert.equal(
    result.local.changeBindings[0].changeRef,
    'openspec/changes/archive/2026-10-11-001-proof-entry',
  );
  assert.equal(result.run.archive.ordinal, 1);
});
test('源目标并存、多个候选、编号冲突、元数据 / 规格改变、外链均停止收口且不降级 confirmed', () => {
  for (const fault of ['coexist', 'multiple', 'ordinal-conflict', 'metadata', 'main', 'junction']) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    assert.equal(
      worker(target.root, draft.run.ref, 'execute', 'before-archive-numbering').status,
      88,
    );
    const run = archiveRun(target.root, true);
    const ref = run.record.archive!.archiveRef!;
    const candidate = path.join(target.root, ref);
    const extra = path.join(
      path.dirname(candidate),
      `${path.basename(candidate).slice(0, 10)}-001-proof-entry`,
    );
    if (fault === 'coexist') fs.cpSync(candidate, target.change, { recursive: true });
    if (fault === 'multiple' || fault === 'ordinal-conflict')
      fs.cpSync(candidate, extra, { recursive: true });
    if (fault === 'metadata')
      fs.appendFileSync(path.join(candidate, '.openspec.yaml'), 'changed: true\n');
    if (fault === 'main')
      fs.appendFileSync(
        path.join(target.root, 'openspec/specs/example/spec.md'),
        '\n### Requirement: Unknown\n改变。\n',
      );
    if (fault === 'junction') fs.symlinkSync(path.dirname(target.root), extra, 'junction');
    disposeStoppedFixtureLock(target.root);
    assert.throws(() => archiveAction(archiveInput(target.root, draft.run.ref, 'finish')), fault);
    assert.equal(archiveRun(target.root).record.archive!.phase, 'confirmed');
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(target.root, '.mendi/project.json'), 'utf8'))
        .archivedChangeCount ?? 0,
      0,
    );
  }
});
test('原生真实碰撞错误保留公开失败响应，不能凭非零退出证明无效果', () => {
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
        if (phase === 'before-native-call') {
          const now = new Date();
          const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          fs.mkdirSync(path.join(target.root, `openspec/changes/archive/${date}-proof-entry`), {
            recursive: true,
          });
        }
      },
    }),
  );
  assert.equal(calls, 1);
  const run = archiveRun(target.root, true);
  assert.equal(run.record.archive!.phase, 'invoking');
  const raw = JSON.parse(
    fs.readFileSync(
      path.join(target.root, run.record.archive!.attemptRef!, 'native-result.json'),
      'utf8',
    ),
  );
  assert.notEqual(raw.status, 0);
  assert.equal(JSON.parse(raw.stdout).archive, null);
});

test('累计编号继续增长到四位，不从 Run 编号或本 Delivery 重置', () => {
  const target = archiveTarget('approved');
  const file = path.join(target.root, '.mendi/project.json');
  const project = JSON.parse(fs.readFileSync(file, 'utf8'));
  project.archivedChangeCount = 999;
  fs.writeFileSync(file, JSON.stringify(project, null, 2) + '\n');
  const draft = prepare(target);
  assert.equal(draft.run.archive!.ordinal, 1000);
  const done = archiveCli(target.root, draft.run.ref, 'execute');
  assert.match(done.local.changeBindings[0].changeRef, /-1000-proof-entry$/);
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).archivedChangeCount, 1000);
});

test('实际效果已发生但必要直接批准 / attempt 缺失时 finish 停止，不以源消失判完成', () => {
  for (const ref of ['review', 'inputs']) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    assert.equal(
      worker(target.root, draft.run.ref, 'execute', 'before-archive-numbering').status,
      88,
    );
    const run = archiveRun(target.root, true);
    disposeStoppedFixtureLock(target.root);
    fs.unlinkSync(
      path.join(
        target.root,
        ref === 'review' ? target.review.run.ref : `${run.record.archive!.attemptRef}/inputs.json`,
      ),
    );
    assert.throws(() => archiveAction(archiveInput(target.root, draft.run.ref, 'finish')));
    assert.equal(archiveRun(target.root).record.status, 'draft');
    assert.equal(archiveRun(target.root).record.archive!.phase, 'confirmed');
  }
});
