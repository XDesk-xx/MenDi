import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { addDeliveryChanges } from '../../src/application/delivery-change-add.ts';
import { errorInfo } from '../../src/core/errors.ts';

const [root, fault, actor] = process.argv.slice(2);
try {
  addDeliveryChanges(
    { project: root, inputFile: 'append.json', role: 'author', actor },
    {
      observeWrite(phase) {
        if (fault === 'drift' && phase === 'lock-acquired') {
          const result = spawnSync(
            process.execPath,
            [
              path.resolve('dist/drivers/cli.js'),
              'delivery',
              'change',
              'add',
              '--project',
              root,
              '--input',
              'append.json',
              '--role',
              'author',
              '--actor',
              actor,
              '--json',
            ],
            { encoding: 'utf8', windowsHide: true },
          );
          if (result.status !== 1) throw new Error('第二进程没有被锁阻断');
          fs.writeFileSync(path.join(root, 'second-writer.json'), result.stdout);
        }
        if (fault === 'drift' && phase === 'pending-written') {
          const file = path.join(root, 'append.json');
          const input = JSON.parse(fs.readFileSync(file, 'utf8'));
          fs.writeFileSync(file, JSON.stringify({ ...input, reason: '另一个实际输入' }));
        }
        if (phase === fault) throw new Error(`fault:${fault}`);
      },
    },
  );
  process.exitCode = 3;
} catch (error) {
  process.stdout.write(JSON.stringify(errorInfo(error)) + '\n');
  process.exitCode = 2;
}
