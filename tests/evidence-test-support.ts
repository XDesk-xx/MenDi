import fs from 'node:fs';
import path from 'node:path';
import { sandbox } from './helpers.ts';
import type { EvidenceReference } from './evidence-support.ts';

const outer = process.env.MENDI_TEST_EVIDENCE_DIR;
export function output(label: string) {
  return outer ? path.join(outer, `${label}-${process.pid}`) : path.join(sandbox(), label);
}
export async function evidenceMode<T>(
  directory: string | undefined,
  run: () => T | Promise<T>,
  apply?: string,
): Promise<T> {
  const previous = [process.env.MENDI_TEST_EVIDENCE_DIR, process.env.MENDI_APPLY_EVIDENCE];
  if (directory) process.env.MENDI_TEST_EVIDENCE_DIR = directory;
  else delete process.env.MENDI_TEST_EVIDENCE_DIR;
  if (apply) process.env.MENDI_APPLY_EVIDENCE = apply;
  else delete process.env.MENDI_APPLY_EVIDENCE;
  try {
    return await run();
  } finally {
    for (const [index, key] of ['MENDI_TEST_EVIDENCE_DIR', 'MENDI_APPLY_EVIDENCE'].entries()) {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    }
  }
}
export function rows(directory: string, prefix: string) {
  return fs
    .readFileSync(path.join(directory, `${prefix}-${process.pid}.jsonl`), 'utf8')
    .trim()
    .split('\n')
    .map((v) => JSON.parse(v));
}
export function read(reference: EvidenceReference) {
  return fs.readFileSync(path.join(reference.root, reference.ref));
}
