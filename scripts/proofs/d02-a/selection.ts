import fs from 'node:fs';
import path from 'node:path';
import { parseProject, parseWorkspace, type Workspace } from '../../../src/core/records.ts';
import { object, text, MendiError } from '../../../src/core/errors.ts';
import { currentRun, readRun } from '../../../src/adapters/runs.ts';

// Fixture-only adapter isolates selection from the still single-binding product validator.
// It does not prove admission of a multi-binding product record or migrate any real project.
function selectionInput(root: string): Workspace {
  const project = object(
    JSON.parse(fs.readFileSync(path.join(root, '.mendi/project.json'), 'utf8')),
    'project',
  );
  const ref = `.mendi/delivery-groups/${text(project.activeDeliveryId, 'id')}/manifest.json`;
  const manifest = object(JSON.parse(fs.readFileSync(path.join(root, ref), 'utf8')), 'manifest');
  const index = parseProject({
    ...project,
    formatVersion: undefined,
    recordingMode: 'manual-bootstrap',
  });
  const workspace = parseWorkspace(index, {
    ...manifest,
    formatVersion: undefined,
    recordingMode: 'manual-bootstrap',
    next: { action: 'explore', status: 'fixture' },
  });
  const raw = manifest.changeBindings as Record<string, unknown>[];
  return {
    ...workspace,
    mode: 'product',
    bindings: workspace.bindings.map((binding, i) => ({
      ...binding,
      ...(raw[i].latestRunRef === undefined
        ? {}
        : { latestRunRef: text(raw[i].latestRunRef, 'latestRunRef') }),
      ...(raw[i].batchId === undefined ? {} : { batchId: text(raw[i].batchId, 'batchId') }),
    })),
  };
}

export function inspectSelection(root: string, baseline: boolean) {
  try {
    const workspace = selectionInput(root);
    if (baseline) {
      const run = currentRun(root, workspace);
      return { ok: true, selectedChange: run?.record.changeId ?? null, runRef: run?.ref ?? null };
    }
    const binding = workspace.activeChangeId
      ? workspace.bindings.find((b) => b.changeId === workspace.activeChangeId)
      : workspace.bindings.at(-1);
    if (!binding || (workspace.activeChangeId === null && binding.state !== 'archived'))
      throw new MendiError(
        'candidate-selection-conflict',
        '候选要求明确活动对象或最后已归档对象。',
      );
    const run = binding.latestRunRef
      ? readRun(root, binding.latestRunRef, workspace.id, binding.changeId)
      : null;
    return { ok: true, selectedChange: binding.changeId, runRef: run?.ref ?? null };
  } catch (error) {
    if (!(error instanceof MendiError)) throw error;
    return { ok: false, error: error.code };
  }
}
