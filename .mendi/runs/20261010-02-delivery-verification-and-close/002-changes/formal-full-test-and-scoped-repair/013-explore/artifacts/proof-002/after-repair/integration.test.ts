import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { produceCompletion } from './producer.ts';
import { consumeCompletion } from './consumer.ts';

test('producer and consumer share the archived completion contract', () => {
  fs.appendFileSync('executed-groups.jsonl', JSON.stringify({ group: 'integration' }) + '\n');
  assert.equal(consumeCompletion(produceCompletion()), 'd01:second-entry');
});
