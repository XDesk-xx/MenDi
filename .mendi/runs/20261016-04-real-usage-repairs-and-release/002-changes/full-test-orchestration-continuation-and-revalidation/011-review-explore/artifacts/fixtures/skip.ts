import test from 'node:test';
test('required-but-skipped', { skip: 'fixture prerequisite unavailable' }, () => {
  throw new Error('must never execute');
});
test('required-but-todo', { todo: true }, () => {});
