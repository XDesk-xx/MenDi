// Controlled child writer; this wait / injection is never exposed in the product CLI.
import fs from 'node:fs';
import { startAction } from '../../src/application/actions.ts';
const [project, release] = process.argv.slice(2);
try {
  const result = startAction({ project, changeId: 'proof-entry', type: 'explore', role: 'author', actor: 'writer' }, { observeWrite: phase => {
    if (phase !== 'lock-acquired') return;
    process.send?.({ ready: true }); const deadline = Date.now() + 15_000;
    while (!fs.existsSync(release)) { if (Date.now() > deadline) throw new Error('release timed out'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10); }
  } });
  process.send?.({ result });
} catch (error) { process.send?.({ error: error instanceof Error ? error.message : String(error) }); process.exitCode = 1; }
