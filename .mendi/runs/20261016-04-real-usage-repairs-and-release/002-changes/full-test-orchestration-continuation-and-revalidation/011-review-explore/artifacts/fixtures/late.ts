import test from 'node:test';
test('passed-before-file-exit', () => {});
setTimeout(() => process.exit(7), 100);
