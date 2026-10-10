import fs from 'node:fs';
import path from 'node:path';
import { archiveAction } from '../../src/application/archive.ts';
import { runProcess } from '../../src/adapters/openspec.ts';

const [root, runRef, mode, fault, response] = process.argv.slice(2);
try {
  const result = archiveAction({ project: root, runRef, mode, role: 'author', actor: 'archive-author' }, {
    runner: (entry, args, cwd) => {
      if (args[0] === 'archive') fs.appendFileSync(path.join(root, 'native-calls.txt'), 'archive\n');
      const raw = runProcess(entry, args, cwd);
      if (args[0] !== 'archive') return raw;
      if (response === 'lost') return { ...raw, stdout: '' };
      if (response === 'wrong-root') {
        const data = JSON.parse(raw.stdout); data.root.path = path.dirname(root);
        return { ...raw, stdout: JSON.stringify(data) };
      }
      if (response === 'wrong-change' || response === 'wrong-path') {
        const data = JSON.parse(raw.stdout);
        if (response === 'wrong-change') data.archive.change = 'another';
        else data.archive.path = path.dirname(root);
        return { ...raw, stdout: JSON.stringify(data) };
      }
      return raw;
    },
    observeWrite: (phase, file) => {
      if ((fault === 'hold-execute' && phase === 'after-invoking') || (fault === 'hold-finish' && phase === 'lock-acquired')) {
        fs.writeFileSync(path.join(root, 'worker-ready'), 'held');
        const until = Date.now() + 20_000;
        while (!fs.existsSync(path.join(root, 'worker-release')) && Date.now() < until)
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30);
        if (!fs.existsSync(path.join(root, 'worker-release'))) throw new Error('test gate timed out');
      }
      if (fault === 'final-readback' && phase === 'before-readback' && file.endsWith('manifest.json')) process.exit(88);
      if (phase === fault && (phase !== 'before-manifest-commit' || file.endsWith('manifest.json')))
        process.exit(88);
    },
  });
  console.log(JSON.stringify(result));
} catch (error) {
  console.log(JSON.stringify({ ok: false, error: String(error) }));
  process.exitCode = 1;
}
