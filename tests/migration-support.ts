import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { actionTarget, startAuthor } from './action-support.ts';
import { migrateDelivery } from '../src/application/delivery-migration.ts';
import { releaseProjectLock } from '../src/adapters/workspace.ts';
import type { MigrationPlan } from '../src/adapters/migration-preview.ts';
import { readRunSource, renderRun } from '../src/adapters/runs.ts';

// Explicit version-one record fixtures, not historic Author / Reviewer evidence.
export function legacyTarget(draft = false) {
  const root = actionTarget();
  const started = draft ? startAuthor(root) : null;
  const projectRef = path.join(root, '.mendi/project.json');
  const manifestRef = path.join(root, '.mendi/delivery-groups/d01/manifest.json');
  const project = JSON.parse(fs.readFileSync(projectRef, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(manifestRef, 'utf8'));
  project.formatVersion = 1;
  manifest.formatVersion = 1;
  delete manifest.rounds;
  delete manifest.currentRoundId;
  fs.writeFileSync(projectRef, JSON.stringify(project, null, 2) + '\n');
  fs.writeFileSync(manifestRef, JSON.stringify(manifest, null, 2) + '\n');
  return { root, started, projectRef, manifestRef };
}
export function preview(root: string): MigrationPlan {
  const result = migrateDelivery({ project: root, mode: 'preview' });
  assert.ok('plan' in result && result.plan);
  return result.plan;
}
export function migrationInput(root: string) {
  fs.writeFileSync(
    path.join(root, 'migration-preview.json'),
    JSON.stringify(preview(root), null, 2) + '\n',
  );
  return {
    project: root,
    mode: 'apply' as const,
    role: 'author',
    actor: 'migration-author',
    inputFile: 'migration-preview.json',
  };
}
export function fixtureLockDisposition(root: string) {
  assert.ok(path.resolve(root).startsWith(path.resolve('.tmp') + path.sep));
  const lock = path.join(root, '.mendi/write.lock'),
    owner = fs.readFileSync(lock, 'utf8');
  const record = JSON.parse(owner);
  assert.equal(record.pid, process.pid);
  assert.match(record.operation, /^delivery-migrate(?:-resume)?$/);
  // This test owns the synchronous failed writer; no product auto-unlock or external scene is involved.
  releaseProjectLock(root, { lock, owner });
}

/** Build explicit old-format test inputs before recording the migration preservation baseline. */
export function legacyFixture(root: string) {
  assert.ok(path.resolve(root).startsWith(path.resolve('.tmp') + path.sep));
  const strip = (value: Record<string, unknown>) => {
    const rounds = value.rounds as Record<string, unknown>[] | undefined;
    const previous = rounds && rounds.length > 1 ? rounds.at(-2) : undefined;
    if (value.state === 'open' && previous) {
      for (const key of ['fullTestRunRef', 'closeRunRef', 'closedOn'])
        if (value[key] === undefined && previous[key] !== undefined) value[key] = previous[key];
    }
    delete value.rounds;
    delete value.currentRoundId;
    delete value.migrationRunRef;
    value.formatVersion = 1;
    return value;
  };
  const entry = path.join(root, '.mendi/project.json');
  const project = JSON.parse(fs.readFileSync(entry, 'utf8'));
  project.formatVersion = 1;
  fs.writeFileSync(entry, JSON.stringify(project, null, 2) + '\n');
  const manifestRef = project.deliveries.find(
    (d: { id: string }) => d.id === project.activeDeliveryId,
  ).manifestRef;
  fs.writeFileSync(
    path.join(root, manifestRef),
    JSON.stringify(
      strip(JSON.parse(fs.readFileSync(path.join(root, manifestRef), 'utf8'))),
      null,
      2,
    ) + '\n',
  );
  const base = `.mendi/runs/${project.activeDeliveryId}`;
  for (const name of fs.existsSync(path.join(root, base))
    ? fs.readdirSync(path.join(root, base))
    : []) {
    if (!/^\d{3,}-(?:delivery-|revise-delivery-|review-delivery-)/.test(name)) continue;
    const ref = `${base}/${name}/run.md`,
      run = readRunSource(root, ref);
    const removeRound = (value: unknown) => {
      if (value && typeof value === 'object') {
        const data = value as Record<string, unknown>;
        delete data.roundId;
        delete data.baselineFacts;
      }
    };
    for (const key of ['fullTest', 'repair', 'lifecycle']) removeRound(run.header[key]);
    removeRound((run.header.lifecycle as Record<string, unknown> | undefined)?.acceptance);
    fs.writeFileSync(path.join(root, ref), renderRun(run.header, run.body));
    for (const kind of ['before-project', 'before-manifest']) {
      const file = path.join(root, base, name, 'artifacts', `${kind}.json`);
      if (!fs.existsSync(file)) continue;
      const stored: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (stored === null) continue;
      const value = typeof stored === 'string' ? JSON.parse(stored) : stored;
      if (kind === 'before-manifest') strip(value);
      else value.formatVersion = 1;
      fs.writeFileSync(
        file,
        JSON.stringify(
          typeof stored === 'string' ? JSON.stringify(value, null, 2) + '\n' : value,
          null,
          2,
        ) + '\n',
      );
    }
  }
}
