import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Fresh diagnostic targets only; never reopen the 031/034 failure files.
const directory = fs.mkdtempSync(path.join(process.cwd(), '.tmp/035-holder-timing-'));
const observations = [];
const groupStarted = performance.now();
for (let iteration = 0; iteration < Number(process.argv[2] ?? '12'); iteration++) {
  assert.ok(performance.now() - groupStarted < 55000, 'diagnostic group budget');
  const file = path.join(directory, `${iteration}.json`);
  const staged = file + '.tmp';
  fs.writeFileSync(file, 'original\n', { flag: 'wx' });
  fs.writeFileSync(staged, 'replacement\n', { flag: 'wx' });
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    '$ErrorActionPreference="Stop"; $f=[IO.File]::Open($env:MENDI_HOLD_FILE,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read); $watch=[Diagnostics.Stopwatch]::StartNew(); try { [Console]::WriteLine("ready"); if ($env:MENDI_HOLD_MS) { Start-Sleep -Milliseconds ([int]$env:MENDI_HOLD_MS) } else { [Console]::ReadLine() | Out-Null } } finally { $f.Dispose(); [Console]::WriteLine("released-ms="+$watch.Elapsed.TotalMilliseconds.ToString([Globalization.CultureInfo]::InvariantCulture)) }'],
    { env: { ...process.env, MENDI_HOLD_FILE: file, MENDI_HOLD_MS: '150' }, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let stdout = '', stderr = '';
  const closed = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject); child.once('close', resolve);
  });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(Error('readiness timeout')); }, 5000);
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.includes('ready')) { clearTimeout(timer); resolve(); }
    });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
  });
  const started = performance.now();
  const attempts: { elapsedMs: number; code: string }[] = [];
  let replaced = false;
  const wait = new Int32Array(new SharedArrayBuffer(4));
  for (;;) {
    try { fs.renameSync(staged, file); replaced = true; break; }
    catch (error) {
      attempts.push({ elapsedMs: performance.now() - started, code: (error as NodeJS.ErrnoException).code ?? 'unknown' });
      const remaining = 500 - (performance.now() - started);
      if (remaining <= 0) break;
      Atomics.wait(wait, 0, 0, Math.min(25, remaining));
    }
  }
  const elapsedMs = performance.now() - started;
  const closeTimer = setTimeout(() => child.kill(), 5000);
  const exitCode = await closed;
  clearTimeout(closeTimer);
  assert.equal(exitCode, 0, stderr);
  const releaseMs = Number(/released-ms=([\d.]+)/.exec(stdout)?.[1]);
  assert.ok(Number.isFinite(releaseMs), stdout);
  observations.push({ iteration, pid: child.pid, requestedSleepMs: 150, releaseMs, elapsedMs, replaced, attempts, stdout, stderr, exitCode, childAndPipesClosed: true, originalIntactOnFailure: replaced ? null : fs.readFileSync(file, 'utf8') === 'original\n', stagedIntactOnFailure: replaced ? null : fs.readFileSync(staged, 'utf8') === 'replacement\n' });
}
console.log(JSON.stringify({ platform: process.platform, node: process.version, os: os.release(), directory, groupElapsedMs: performance.now() - groupStarted, observations }, null, 2));
