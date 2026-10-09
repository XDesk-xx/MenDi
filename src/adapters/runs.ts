import fs from 'node:fs';
import { parse, stringify } from 'yaml';
import { managedPath } from './paths.ts';
import { errorInfo, MendiError } from '../core/errors.ts';
import { parseRun, runLocation, type RunRecord } from '../core/actions.ts';
import type { Workspace } from '../core/records.ts';

export interface RunDocument {
  ref: string;
  record: RunRecord;
  header: Record<string, unknown>;
  body: string;
}
export function readRun(
  root: string,
  ref: string,
  deliveryId: string,
  changeId: string,
): RunDocument {
  const file = managedPath(root, ref);
  runLocation(ref, deliveryId, changeId);
  try {
    const source = fs.readFileSync(file, 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source);
    if (!match) throw new MendiError('invalid-run', 'Run 缺少结构化头部。', { ref });
    const header = parse(match[1]) as Record<string, unknown>;
    return { ref, record: parseRun(header, ref, deliveryId, changeId), header, body: match[2] };
  } catch (error) {
    if (error instanceof MendiError) throw error;
    throw new MendiError(
      errorInfo(error).code === 'ENOENT' ? 'run-input-missing' : 'invalid-run',
      '无法读取必要 Run。',
      { ref, ...errorInfo(error) },
    );
  }
}
export function currentRun(root: string, workspace: Workspace): RunDocument | null {
  if (workspace.mode !== 'product') return null;
  const binding = workspace.bindings.find((b) => b.changeId === workspace.activeChangeId);
  return binding?.latestRunRef
    ? readRun(root, binding.latestRunRef, workspace.id, binding.changeId)
    : null;
}
export function renderRun(header: Record<string, unknown>, body: string) {
  return `---\n${stringify(header)}---\n${body}`;
}
export function scanRunNumbers(root: string, deliveryId: string) {
  const base = `.mendi/runs/${deliveryId}`;
  const reservations: { number: number; ref: string; incomplete: boolean }[] = [];
  const directories = (ref: string) => {
    const dir = managedPath(root, ref);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((name) => fs.statSync(managedPath(root, `${ref}/${name}`)).isDirectory());
  };
  function add(ref: string, name: string) {
    const match = /^(\d{3,})-(?!changes$)[a-z0-9-]+$/.exec(name);
    if (!match) return;
    const number = Number(match[1]);
    if (
      !Number.isSafeInteger(number) ||
      number < 1 ||
      String(number).padStart(3, '0') !== match[1] ||
      reservations.some((r) => r.number === number)
    )
      throw new MendiError('run-number-conflict', 'Run 已占号目录存在重复或非法编号。', {
        ref,
        number,
      });
    const file = managedPath(root, `${ref}/run.md`);
    reservations.push({ number, ref: `${ref}/run.md`, incomplete: !fs.existsSync(file) });
  }
  for (const name of directories(base)) {
    const ref = `${base}/${name}`;
    if (/^\d{3,}-changes$/.test(name)) {
      for (const change of directories(ref))
        for (const run of directories(`${ref}/${change}`)) add(`${ref}/${change}/${run}`, run);
    } else add(ref, name);
  }
  reservations.sort((a, b) => a.number - b.number);
  const number = (reservations.at(-1)?.number ?? 0) + 1;
  if (!Number.isSafeInteger(number))
    throw new MendiError('run-number-conflict', 'Run 编号超出可安全表示范围。');
  return { number, incompleteReservations: reservations.filter((r) => r.incomplete), reservations };
}
