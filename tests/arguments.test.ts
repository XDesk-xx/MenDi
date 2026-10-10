import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArguments } from '../src/drivers/arguments.ts';
import { MendiError } from '../src/core/errors.ts';

test('帮助、显式目标与参数组合', () => {
  assert.equal(parseArguments(['--help']).command, 'help');
  assert.equal(
    parseArguments(['status', '--project', 'D:/some project', '--json']).values.project,
    'D:/some project',
  );
  for (const args of [
    ['status'],
    ['status', '--project', 'x', '--project', 'y'],
    ['status', '--project', 'x', '--unknown', 'v'],
    ['other'],
    [
      'delivery',
      'open',
      '--project',
      'x',
      '--id',
      'd01',
      '--title',
      '标题',
      '--scope',
      'scope.json',
      '--change',
      'proof-entry',
    ],
    ['next', '--project', 'x', '--json', '--json'],
  ]) {
    assert.throws(
      () => parseArguments(args),
      (e: unknown) => e instanceof MendiError && e.exitCode === 2,
    );
  }
});
