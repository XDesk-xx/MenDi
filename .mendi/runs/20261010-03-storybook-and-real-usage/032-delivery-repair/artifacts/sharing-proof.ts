import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const base = path.join(process.cwd(), '.tmp');
const root = fs.mkdtempSync(path.join(base, 'repair-032-sharing-'));
const target = path.join(root, 'result.json');
const staged = path.join(root, 'result.json.tmp');
fs.writeFileSync(target, 'prepared\n', { flag: 'wx' });
fs.writeFileSync(staged, 'running\n', { flag: 'wx' });
const holder = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
  '$ErrorActionPreference="Stop"; $f=[IO.File]::Open($env:MENDI_PROOF_FILE,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read); try { [Console]::WriteLine("ready"); [Console]::ReadLine() | Out-Null } finally { $f.Dispose() }'],
  { env: { ...process.env, MENDI_PROOF_FILE: target }, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
const closed = new Promise<number | null>((resolve, reject) => {
  holder.once('error', reject);
  holder.once('close', resolve);
});
let stderr = '';
holder.stderr.on('data', chunk => { stderr += chunk; });
let code: string | undefined;
try {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('holder readiness timeout: ' + stderr)), 5000);
    holder.stdout.on('data', chunk => {
      if (String(chunk).includes('ready')) { clearTimeout(timer); resolve(); }
    });
    holder.once('error', error => { clearTimeout(timer); reject(error); });
  });
  try { fs.renameSync(staged, target); } catch (error) {
    code = (error as NodeJS.ErrnoException).code;
  }
  assert.ok(code, 'without FILE_SHARE_DELETE the replacement must fail');
  assert.equal(fs.readFileSync(target, 'utf8'), 'prepared\n');
  assert.equal(fs.readFileSync(staged, 'utf8'), 'running\n');
} finally {
  holder.stdin.end('\n');
}
assert.equal(await closed, 0, stderr);
fs.renameSync(staged, target);
assert.equal(fs.readFileSync(target, 'utf8'), 'running\n');
console.log(JSON.stringify({ root, lockedRenameCode: code, afterRelease: 'passed', holderClosed: true }));
