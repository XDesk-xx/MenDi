import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArguments, help } from '../src/drivers/arguments.ts';
test('四个 Delivery 入口精确解析必要参数，未知 / 缺参 / 重复不接受', () => {
  const cases = [
    [
      'delivery',
      'full-test',
      'run',
      '--project',
      'target',
      '--input',
      'full.json',
      '--role',
      'author',
      '--actor',
      'a',
      '--pnpm-bin',
      'C:/pnpm.js',
    ],
    ['delivery', 'full-test', 'status', '--project', 'target', '--run', 'formal-ref'],
    [
      'delivery',
      'repair',
      'start',
      '--project',
      'target',
      '--from',
      'formal-ref',
      '--reason',
      '范围内',
      '--role',
      'author',
      '--actor',
      'a',
      '--revises',
      'author-ref',
    ],
    [
      'delivery',
      'repair',
      'review',
      '--project',
      'target',
      '--author-run',
      'author-ref',
      '--role',
      'reviewer',
      '--actor',
      'r',
    ],
  ];
  const names = [
    'delivery-full-test-run',
    'delivery-full-test-status',
    'delivery-repair-start',
    'delivery-repair-review',
  ];
  for (const [i, args] of cases.entries()) {
    assert.equal(parseArguments(args).command, names[i]);
    assert.throws(() => parseArguments(args.slice(0, 3)));
    assert.throws(() => parseArguments([...args, '--openspec-bin', 'upstream']));
    assert.throws(() => parseArguments([...args, '--project', 'duplicate']));
  }
  assert.throws(() => parseArguments(['delivery', 'repair', 'finish', '--project', 'target']));
  assert.match(help, /materialApplicability=requires-semantic-check/);
});
