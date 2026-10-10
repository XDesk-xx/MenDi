// Controlled child writer for cross-process conflict tests, never a product command.
import fs from 'node:fs';
import { bindChange, openDelivery } from '../../src/application/project.ts';
const [operation, project, release] = process.argv.slice(2);
const options = { observeWrite: (phase: string) => {
  if (phase !== 'lock-acquired') return;
  process.send?.({ ready: true });
  const deadline = Date.now() + 15_000;
  while (!fs.existsSync(release)) {
    if (Date.now() > deadline) throw new Error('test writer release timed out');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  }
} };
try {
  const result = operation === 'open'
    ? openDelivery({ project, id: 'd01', title: '并发夹具', scopePath: 'scope.json' }, options)
    : bindChange({ project, changeId: 'proof-entry', slot: 'A' }, options);
  process.send?.({ result });
} catch (error) {
  process.send?.({ error: error instanceof Error ? error.message : String(error) }); process.exitCode = 1;
}
