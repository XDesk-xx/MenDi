import fs from 'node:fs';
import { managedPath, present } from './paths.ts';
import { MendiError } from '../core/errors.ts';
import type { RunDocument } from './runs.ts';

// Reserve only within this run, preserving directories left before the Run marker committed.
export function reserveArchiveAttempt(root: string, run: RunDocument, written: string[]) {
  const parentRef = `${run.ref.slice(0, -'run.md'.length)}artifacts`;
  const parent = managedPath(root, parentRef);
  let maximum = run.record.archive!.attempt;
  if (present(parent)) {
    for (const name of fs.readdirSync(parent)) {
      const match = /^attempt-(\d+)$/.exec(name);
      if (!match) continue;
      const number = Number(match[1]);
      if (
        !Number.isSafeInteger(number) ||
        number < 1 ||
        name !== `attempt-${String(number).padStart(3, '0')}` ||
        !fs.statSync(managedPath(root, `${parentRef}/${name}`)).isDirectory()
      )
        throw new MendiError('archive-attempt-conflict', '当前 Run 的 attempt 占号无效。');
      maximum = Math.max(maximum, number);
    }
  }
  const attempt = maximum + 1;
  if (!Number.isSafeInteger(attempt))
    throw new MendiError('archive-attempt-conflict', '当前 attempt 不能继续安全编号。');
  if (!present(parent)) {
    fs.mkdirSync(parent);
    written.push(parent);
  }
  const attemptRef = `${parentRef}/attempt-${String(attempt).padStart(3, '0')}`;
  const directory = managedPath(root, attemptRef);
  fs.mkdirSync(directory);
  written.push(directory);
  return { attempt, attemptRef };
}
