import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { evidenceSession, type EvidenceReference } from './evidence-support.ts';
import { managedPath, present } from '../src/adapters/paths.ts';
import type { runTest } from '../src/application/tests.ts';
import type { runFullTest } from '../src/application/delivery-full-test.ts';

type TestResult = Awaited<ReturnType<typeof runTest>>;
type GroupResult = Awaited<ReturnType<typeof runFullTest>>;
const known = new Map<string, WeakMap<object, EvidenceReference>>();
function context(directory: string) {
  const session = evidenceSession(directory);
  let references = known.get(session.root);
  if (!references) {
    references = new WeakMap();
    known.set(session.root, references);
  }
  const registered = references;
  const compact = (value: unknown) =>
    JSON.parse(
      JSON.stringify(value, (_key, value: unknown) =>
        typeof value === 'object' && value !== null ? (registered.get(value) ?? value) : value,
      ),
    ) as unknown;
  return { session, references, compact };
}
function originals(directory: string, root: string, refs: string[]) {
  const session = evidenceSession(directory),
    missing: string[] = [];
  const files: Record<string, EvidenceReference> = {};
  for (const ref of new Set(refs)) {
    // Absence itself is a fact for not-run/interrupted/unknown; never infer empty or passed.
    if (!present(managedPath(root, ref))) {
      missing.push(ref);
      continue;
    }
    files[ref] = session.file({ root, ref, lifetime: 'temporary' });
  }
  return { state: missing.length ? 'incomplete' : 'captured', files, missing };
}
export function recordTestEvidence(directory: string, root: string, result: TestResult) {
  const { session, references, compact } = context(directory);
  const record = 'record' in result ? result.record : result.observed;
  const refs = record
    ? [
        `.mendi/delivery-groups/${record.deliveryId}/tests/${record.executionId}/result.json`,
        record.stdoutRef,
        record.stderrRef,
      ]
    : [];
  if ('retainedLock' in result && result.retainedLock)
    refs.push(path.relative(root, result.retainedLock).split(path.sep).join('/'));
  const captured = originals(directory, root, refs);
  if (record && captured.files[refs[0]]) references.set(record, captured.files[refs[0]]);
  const resultRef = session.value(
    `test:${fs.realpathSync(root)}:${result.executionId ?? randomUUID()}`,
    compact(result),
  );
  const scene = {
    root,
    outcome: result.outcome,
    executionId: result.executionId,
    result: resultRef,
    ...captured,
  };
  session.record(`test-scenes-${process.pid}.jsonl`, scene);
  return scene;
}
export function groupEvidence(directory: string, root: string, result: GroupResult) {
  const { session, references, compact } = context(directory),
    refs: string[] = [];
  const run = result.run,
    attempt = run?.attempt;
  if (run) refs.push(run.ref);
  if (run && attempt?.executionId) {
    const base = `.mendi/delivery-groups/${run.deliveryId}/tests/${attempt.executionId}`;
    for (const name of [
      'result.json',
      'stdout.log',
      'stderr.log',
      'group-request.json',
      'group-report.json',
      'group-events.jsonl',
    ])
      refs.push(`${base}/${name}`);
    // Only interrupted direct writes of this selected child, never a history tree.
    if (present(managedPath(root, base)))
      for (const name of fs.readdirSync(managedPath(root, base)))
        if (name.endsWith('.tmp')) refs.push(`${base}/${name}`);
  } else if (run) {
    const precheck = path.posix.dirname(run.ref) + '/artifacts/precheck.json';
    if (present(managedPath(root, precheck))) refs.push(precheck);
  }
  if ('retainedLock' in result && result.retainedLock)
    refs.push(path.relative(root, result.retainedLock).split(path.sep).join('/'));
  const captured = originals(directory, root, refs);
  if (run && captured.files[run.ref]) references.set(run, captured.files[run.ref]);
  const child = 'groupExecution' in result ? result.groupExecution?.child : undefined;
  if (child) {
    const ref = `.mendi/delivery-groups/${child.deliveryId}/tests/${child.executionId}/result.json`;
    if (captured.files[ref]) references.set(child, captured.files[ref]);
  }
  const resultRef = session.value(
    `group:${fs.realpathSync(root)}:${run?.ref ?? randomUUID()}`,
    compact(result),
  );
  return { scene: { root, result: resultRef, ...captured }, compact };
}
