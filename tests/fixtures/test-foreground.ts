import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2];
if (mode === 'descendant') {
  fs.writeFileSync('descendant.json', JSON.stringify({ pid: process.pid }));
  setInterval(() => {}, 1000);
} else {
  fs.writeFileSync('started.json', JSON.stringify({ pid: process.pid, cwd: process.cwd(), mode }));
  console.log(`foreground:${mode}`);
  console.error('actual stderr');
  if (mode === 'wait') {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), 'descendant'], { stdio: 'inherit', windowsHide: true });
    fs.writeFileSync('tree.json', JSON.stringify({ parent: process.pid, child: child.pid }));
    setInterval(() => {}, 1000);
  } else if (mode === 'fail') {
    console.error('[ERR_PNPM_VERIFY_DEPS_BEFORE_RUN] script-owned text');
    process.exitCode = 7;
  } else if (mode !== 'pass') throw new Error(`Unknown mode ${path.basename(mode ?? '')}`);
}
