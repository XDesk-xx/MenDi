import { inspectProject } from '../adapters/project.ts';
import { migrationPreview } from '../adapters/migration-preview.ts';
import { applyMigration, resumeMigration } from '../adapters/migration-store.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { MendiError, text } from '../core/errors.ts';
import { state } from './project.ts';
import type { WriteObserver } from '../adapters/workspace.ts';
import { loadMethods } from '../adapters/methods.ts';

export function migrateDelivery(
  input: {
    project: string;
    mode: 'preview' | 'apply' | 'resume';
    inputFile?: string;
    runRef?: string;
    role?: string;
    actor?: string;
  },
  options: { observeWrite?: WriteObserver } = {},
) {
  const { root } = inspectProject(input.project);
  const methods = loadMethods('delivery-migrate', []);
  const base = {
    ok: true,
    operation: `delivery-migrate-${input.mode}`,
    projectRoot: root,
    openspec: null,
    executionMode: 'local-only' as const,
    upstreamAccess: 'not-required' as const,
    methods,
  };
  if (input.mode !== 'preview' && input.role !== 'author')
    throw new MendiError('action-role-mismatch', '显式迁移写入要求 Author。');
  const actor = input.mode === 'preview' ? '' : text(input.actor, 'actor');
  if (input.mode === 'resume') {
    const result = resumeMigration(
      root,
      text(input.runRef, '原迁移 Run'),
      actor,
      options.observeWrite,
    );
    return {
      ...base,
      local: state(result.workspace),
      run: { ref: result.run.ref, ...result.run.record },
      result: result.alreadyCompleted ? 'already-completed' : 'migrated',
    };
  }
  const current = readWorkspace(root);
  if (current?.mode === 'product' && current.manifest.formatVersion === 2)
    return { ...base, local: state(current), result: 'already-migrated' };
  if (input.mode === 'preview') {
    const plan = migrationPreview(root);
    return { ...base, local: current ? state(current) : null, result: 'preview-ready', plan };
  }
  const result = applyMigration(
    root,
    text(input.inputFile, '项目内预览 JSON'),
    actor,
    options.observeWrite,
  );
  return {
    ...base,
    local: state(result.workspace),
    run: { ref: result.run.ref, ...result.run.record },
    result: 'migrated',
  };
}
