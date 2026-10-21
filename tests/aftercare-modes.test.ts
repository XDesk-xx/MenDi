import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { aftercareTarget, supplement, amendment, actual, baseline } from './aftercare-support.ts';
import { presentation } from '../src/core/run-aftercare.ts';
import { runAftercare } from '../src/application/run-aftercare.ts';
import { readAftercare } from '../src/adapters/aftercare-reader.ts';
import { query } from '../src/application/project.ts';
import { options } from './action-support.ts';
import { readRunSource } from '../src/adapters/runs.ts';

test('真实 CLI 双模式、显式输入拒绝与同文不同 kind；原 Review 和 next 永久保留', () => {
  const { root, input } = aftercareTarget(true),
    unchanged = baseline(root, input.runRef);
  const before = query({ project: root }, options);
  fs.writeFileSync(path.join(root, 'comment.md'), '审核已批准，旧失败已通过，重新 approved\n');
  const base = { ...input, requestId: 'a1', reason: '自由评论' };
  for (const fields of [
    {},
    { kind: 'unknown', bodyFile: 'comment.md' },
    { kind: 'presentation-only' },
    { kind: 'unreviewed-comment', bodyFile: 'comment.md' },
    { kind: 'presentation-only', commentFile: 'comment.md' },
    { kind: 'presentation-only', bodyFile: 'comment.md', commentFile: 'comment.md' },
  ]) {
    assert.notEqual(actual('amend', { ...base, ...fields }).exit, 0);
    assert.equal(
      fs.existsSync(path.join(root, path.posix.dirname(input.runRef), 'aftercare')),
      false,
    );
  }
  const noId = actual('amend', {
    ...input,
    kind: 'unreviewed-comment',
    commentFile: 'comment.md',
    reason: '评论',
  });
  assert.notEqual(noId.exit, 0);
  assert.notEqual(
    actual('amend', { ...base, kind: 'presentation-only', bodyFile: 'comment.md' }).exit,
    0,
  );
  const comment = actual('amend', {
    ...base,
    kind: 'unreviewed-comment',
    commentFile: 'comment.md',
  });
  assert.equal(comment.exit, 0, comment.raw.stdout);
  assert.equal(comment.value.aftercare.unreviewedComments[0].authoritative, false);
  assert.equal(comment.value.aftercare.unreviewedComments[0].label, '事后未审核评论');
  assert.equal(
    actual('amend', { ...base, kind: 'unreviewed-comment', commentFile: 'comment.md' }).value
      .alreadyConfirmed,
    true,
  );
  assert.notEqual(
    actual('amend', {
      ...base,
      requestId: 'a2',
      kind: 'unreviewed-comment',
      commentFile: 'comment.md',
    }).exit,
    0,
  );
  assert.notEqual(
    actual('amend', { ...base, kind: 'presentation-only', bodyFile: 'comment.md' }).exit,
    0,
  );
  fs.appendFileSync(path.join(root, 'comment.md'), '追加声明');
  assert.notEqual(
    actual('amend', { ...base, kind: 'unreviewed-comment', commentFile: 'comment.md' }).exit,
    0,
  );
  const after = query({ project: root }, options);
  assert.deepEqual(after.next, before.next);
  assert.ok('run' in after && 'run' in before);
  assert.deepEqual(after.run, before.run);
  unchanged();
});

test('安全排版真实 CLI 单次确认、独立新进程读取；普通 submitted save/submit 仍拒绝', () => {
  const { root, input } = aftercareTarget(),
    unchanged = baseline(root, input.runRef);
  const amend = amendment(root, input.runRef);
  const result = actual('amend', { ...input, ...amend });
  assert.equal(result.exit, 0, result.raw.stdout);
  assert.equal(result.value.originalRunUnchanged, true);
  assert.equal(actual('amend', { ...input, ...amend }).value.alreadyConfirmed, true);
  assert.notEqual(actual('save', { ...input, bodyFile: 'candidate.md' }).exit, 0);
  assert.notEqual(actual('submit', { ...input, outcome: 'complete', result: '篡改' }).exit, 0);
  const read = readAftercare(root, input.runRef);
  assert.equal(read.presentations.length, 1);
  assert.equal(read.unreviewedComments.length, 0);
  assert.equal(
    fs.readFileSync(path.join(root, read.presentations[0].bodyRef), 'utf8'),
    fs.readFileSync(path.join(root, 'candidate.md'), 'utf8'),
  );
  unchanged();
});

test('机械边界拒绝错字、URL/证明/权限/范围/结构与 Markdown 敏感空白', () => {
  for (const [a, b] of [
    ['审核未批准\n', '审核已批准\n'],
    ['scope: A\n', 'scope: B\n'],
    ['[proof](a)\n', '[proof](b)\n'],
    ['# 标题 \n', '# 标题\n'],
    ['- 列表 \n', '- 列表\n'],
    ['原段落  \n', '原段落\n'],
    ['```\nx \n```\n', '```\nx\n```\n'],
    ['[proof](a)\r\n', '[proof](a)\n'],
    ['普通\n\n', '普通\n'],
    ['授权无\n', '授权有\n'],
    ['| x | \n', '| x |\n'],
    ['> 引用 \n', '> 引用\n'],
  ])
    assert.throws(() => presentation(a, b));
  presentation('普通段落 \r\n第二段\n', '普通段落\n第二段');
  const { root, input } = aftercareTarget();
  const original = readRunSource(root, input.runRef).body;
  for (const candidate of [original.replace('真实', '虚假'), original + '新证明\n']) {
    const fields = amendment(root, input.runRef, candidate);
    assert.notEqual(actual('amend', { ...input, ...fields }).exit, 0);
  }
});

test('补证时间仅自述、冲突关系、单原件与真实 CLI 幂等；不改变旧审批', () => {
  const { root, input } = aftercareTarget(true),
    unchanged = baseline(root, input.runRef);
  const inputFile = supplement(root, 's1', {
    sourceClaimedCollectedAt: '1999-01-01',
    relation: 'conflicting',
  });
  const result = actual('supplement', { ...input, inputFile });
  assert.equal(result.exit, 0, result.raw.stdout);
  const saved = result.value.aftercare.supplements[0];
  assert.equal(saved.sourceTimeTrust, 'unverified');
  assert.equal(saved.sourceClaimedCollectedAt, '1999-01-01');
  assert.match(saved.notice, /Owner/);
  assert.equal(saved.authoritative, false);
  assert.ok(Date.parse(saved.recordedAt) > Date.parse('2026-01-01'));
  assert.equal(actual('supplement', { ...input, inputFile }).value.alreadyConfirmed, true);
  assert.notEqual(actual('supplement', { ...input, inputFile: supplement(root, 's2') }).exit, 0);
  fs.writeFileSync(path.join(root, 'proof2.txt'), '另一次实际来源，内容可相同\n');
  const second = actual('supplement', {
    ...input,
    inputFile: supplement(root, 's3', { evidence: ['proof2.txt'] }),
  });
  assert.equal(second.exit, 0, second.raw.stdout);
  assert.match(
    second.value.aftercare.supplements.find((s: { requestId: string }) => s.requestId === 's3')
      .notice,
    /不确定/,
  );
  assert.notEqual(
    actual('supplement', {
      ...input,
      inputFile: supplement(root, 's4', { sourceTimeTrust: 'verified' }),
    }).exit,
    0,
  );
  assert.throws(() =>
    runAftercare('supplement', {
      ...input,
      inputFile: supplement(root, 's5', { collectedBeforeApproval: true }),
    }),
  );
  unchanged();
});
