import assert from 'node:assert/strict';
import test from 'node:test';
import { identifier, object, MendiError } from '../src/core/errors.ts';

test('路径式 ID 与非对象输入在领域边界拒绝', () => {
  for (const id of ['../other', 'C:\\other', 'a/b', '..', 'a\\b', 'Upper', 'con', 'nul', 'com1']) {
    assert.throws(
      () => identifier(id, 'ID'),
      (error: unknown) => error instanceof MendiError && error.code === 'invalid-id',
    );
  }
  for (const value of [null, [], 'text']) assert.throws(() => object(value, '记录'), MendiError);
  assert.equal(identifier('20261009-01-delivery', 'ID'), '20261009-01-delivery');
});
