import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runAftercare, type AftercareInput } from '../../src/application/run-aftercare.ts';
import { errorInfo } from '../../src/core/errors.ts';

const [root, mode] = process.argv.slice(2);
const input = JSON.parse(
  fs.readFileSync(path.join(root, 'aftercare-job.json'), 'utf8'),
) as AftercareInput;
try {
  const result = runAftercare(input.kind ? 'amend' : 'supplement', input, {
    observe(phase, file) {
      if (mode === 'race' && phase === 'lock-acquired') {
        const other = spawnSync(
          process.execPath,
          [
            path.resolve('dist/drivers/cli.js'),
            'run',
            'supplement',
            '--project',
            root,
            '--run',
            input.runRef,
            '--role',
            input.role,
            '--actor',
            input.actor,
            '--input',
            input.inputFile!,
            '--json',
          ],
          { encoding: 'utf8', windowsHide: true },
        );
        fs.writeFileSync(
          path.join(root, 'second-writer.json'),
          JSON.stringify({ exit: other.status, stdout: other.stdout }),
        );
      }
      if (mode === 'source-drift' && phase === 'original-written')
        fs.appendFileSync(path.join(root, 'proof.txt'), '漂移');
      if (mode === 'source-drift-before' && phase === 'lock-acquired')
        fs.appendFileSync(path.join(root, 'proof.txt'), '漂移');
      if (mode === 'partial' && phase === 'intent-written') {
        fs.writeFileSync(path.join(root, path.dirname(file), 'evidence-0.bin'), 'partial');
        throw new Error('fault:partial-copy');
      }
      if (phase === mode) throw new Error(`fault:${mode}`);
    },
  });
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  process.stdout.write(JSON.stringify(errorInfo(error)));
  process.exitCode = 2;
}
