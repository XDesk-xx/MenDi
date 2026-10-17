import test from 'node:test';
import assert from 'node:assert/strict';
test('one-good-assertion', () => assert.equal(1, 1));
test('one-bad-assertion', () => assert.equal(1, 2));
