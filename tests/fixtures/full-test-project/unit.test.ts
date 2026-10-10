import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { consumeCompletion } from './consumer.ts';

test('consumer accepts archived completion and rejects a wrong contract', () => {
  fs.appendFileSync('executed-groups.jsonl', JSON.stringify({ group: 'unit' }) + '\n');
  assert.equal(consumeCompletion({ deliveryId: 'd01', changeId: 'first-entry', kind: 'change-archived' }), 'd01:first-entry');
  assert.throws(() => consumeCompletion({ deliveryId: 'd01', changeId: 'first-entry', kind: 'wrong' }), /expected archived completion/);
});
