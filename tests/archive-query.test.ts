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
} from './archive-support.ts';
import { query } from '../src/application/project.ts';
import { cli, isolatedEnv } from './helpers.ts';
import { runProcess } from '../src/adapters/openspec.ts';

function queryWithoutActiveStatus(root: string) {
  const calls: string[][] = [];
  const result = query(
    { project: root },
    {
      runner: (entry, args, cwd) => {
        calls.push(args);
        if (args[0] === 'status') throw new Error('归档交接不得调用旧活动 Change status');
        return runProcess(entry, args, cwd);
      },
    },
  );
  assert.deepEqual(
    calls.map((args) => args[0]),
    ['--version', 'list'],
  );
  assert.equal(result.upstream, null);
  return result;
}
test('prepared / invoking / none / confirmed 和部分计数或终态 Run 的只读查询仅解释当前交接', () => {
  const prepared = archiveTarget('approved');
  prepare(prepared);
  assert.equal(queryWithoutActiveStatus(prepared.root).next.action, 'archive-execute');
  for (const fault of [
    'after-invoking',
    'before-archive-numbering',
    'after-count-commit',
    'after-archive-run-commit',
  ]) {
    const target = archiveTarget('approved');
    const draft = prepare(target);
    assert.equal(worker(target.root, draft.run.ref, 'execute', fault).status, 88);
    assert.throws(() => queryWithoutActiveStatus(target.root), /写入锁/);
    disposeStoppedFixtureLock(target.root);
    const files = [
      '.mendi/project.json',
      '.mendi/delivery-groups/d01/manifest.json',
      draft.run.ref,
    ];
    const before = files.map((ref) => fs.readFileSync(path.join(target.root, ref)));
    const result = queryWithoutActiveStatus(target.root);
    assert.equal(result.next.action, 'archive-finish');
    assert.equal(result.local!.changeBindings[0].state, 'archiving');
    files.forEach((ref, i) =>
      assert.deepEqual(fs.readFileSync(path.join(target.root, ref)), before[i]),
    );
    if (fault === 'after-invoking') {
      archiveCli(target.root, draft.run.ref);
      assert.equal(queryWithoutActiveStatus(target.root).next.action, 'archive-execute');
      assert.equal(fs.existsSync(target.change), true);
    }
  }
});
test('最终查询只依赖当前必要记录，不依赖归档内容、历史说明 / 批准或未知 Ref，不激活下一 Change', () => {
  const target = archiveTarget('approved');
  const draft = prepare(target);
  const result = archiveCli(target.root, draft.run.ref, 'execute');
  const archive = path.join(target.root, result.local.changeBindings[0].changeRef);
  fs.renameSync(archive, path.join(target.root, 'saved-archive'));
  fs.unlinkSync(path.join(target.root, target.review.run.ref));
  fs.unlinkSync(path.join(target.root, target.apply.run.ref));
  const manifestFile = path.join(target.root, '.mendi/delivery-groups/d01/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.obsoleteExplanationRef = 'missing.md';
  manifest.unknownRef = '../outside';
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  const before = fs.readFileSync(manifestFile);
  const facts = queryWithoutActiveStatus(target.root);
  assert.equal(facts.next.action, 'delivery-next');
  assert.equal(facts.local!.activeChangeId, null);
  const actualCli = cli(
    ['next', '--project', target.root, '--json'],
    target.root,
    isolatedEnv(path.dirname(target.root)),
  );
  assert.equal(actualCli.status, 0, actualCli.stdout + actualCli.stderr);
  assert.equal(JSON.parse(actualCli.stdout).next.action, 'delivery-next');
  assert.deepEqual(fs.readFileSync(manifestFile), before);
  fs.unlinkSync(path.join(target.root, draft.run.ref));
  assert.throws(() => query({ project: target.root }));
});
test('普通活动源缺失仍失败，过渡记录不能用错误类型 / 身份伪装合法归档', () => {
  const target = archiveTarget('approved');
  fs.renameSync(target.change, path.join(target.root, 'moved-active'));
  assert.throws(() => query({ project: target.root }), /当前活动 Change/);
  const fake = archiveTarget('approved');
  const file = path.join(fake.root, '.mendi/delivery-groups/d01/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.changeBindings[0].state = 'archiving';
  fs.writeFileSync(file, JSON.stringify(manifest));
  assert.throws(() => query({ project: fake.root }), /Archive Run/);
});
