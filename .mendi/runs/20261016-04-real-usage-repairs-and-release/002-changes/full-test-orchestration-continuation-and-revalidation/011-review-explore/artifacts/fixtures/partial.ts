import test from 'node:test';
test('first-completed', () => {});
test('pending-on-abort', async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
});
