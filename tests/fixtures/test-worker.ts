import fs from 'node:fs';
import { runTest } from '../../src/application/tests.ts';

const [root, pnpmBin] = process.argv.slice(2);
await runTest({ project: root, pnpmBin, actor: 'controlled-worker', kind: 'focused' }, {
  observe: (phase, file) => {
    if (phase === 'before-test-readback' && JSON.parse(fs.readFileSync(file, 'utf8')).executionState === 'running')
      process.exit(88);
  },
});
