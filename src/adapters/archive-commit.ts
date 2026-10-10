import fs from 'node:fs';
import { managedPath, present } from './paths.ts';
import { currentRun, type RunDocument } from './runs.ts';
import { replaceDraft, replaceManagedFile } from './action-store.ts';
import { readWorkspace, type WriteObserver } from './workspace.ts';
import { loadArchiveInputs, observeArchiveEffects } from './archive-effects.ts';
import { archiveName, archivedCount } from '../core/archive.ts';
import { parseProject, parseWorkspace, type Workspace } from '../core/records.ts';
import { MendiError, object } from '../core/errors.ts';

export function completeArchive(
  root: string,
  workspace: Workspace,
  initial: RunDocument,
  written: string[],
  observe?: WriteObserver,
) {
  const inputs = loadArchiveInputs(root, workspace, initial);
  const effect = observeArchiveEffects(root, initial.record.archive!, inputs);
  if (effect.phase !== 'confirmed')
    throw new MendiError('archive-effects-unconfirmed', '收口需要已确认的实际效果。');
  const archive = { ...initial.record.archive!, ...effect };
  const date = archiveName(
    effect.archiveRef,
    initial.record.changeId,
    effect.archiveRef.endsWith(
      `-${String(archive.ordinal).padStart(3, '0')}-${initial.record.changeId}`,
    )
      ? archive.ordinal
      : undefined,
  );
  const numberedRef = `openspec/changes/archive/${date}-${String(archive.ordinal).padStart(3, '0')}-${initial.record.changeId}`;
  const source = managedPath(root, effect.archiveRef);
  const target = managedPath(root, numberedRef);
  if (effect.archiveRef !== numberedRef) {
    if (present(target))
      throw new MendiError('archive-number-conflict', '编号目标已存在，不能覆盖。');
    observe?.('before-archive-numbering', source);
    // Re-resolve both paths after the interruption hook; a junction must not redirect the move.
    managedPath(root, effect.archiveRef);
    managedPath(root, numberedRef);
    if (present(target)) throw new MendiError('archive-number-conflict', '编号目标写前变化。');
    fs.renameSync(source, target);
    written.push(target);
  }
  archive.archiveRef = numberedRef;
  const count = archivedCount(workspace.project);
  if (![archive.countBasis, archive.ordinal].includes(count))
    throw new MendiError('archive-count-conflict', '累计计数与本次预定编号冲突。');
  const project = { ...workspace.project, archivedChangeCount: archive.ordinal };
  if (count === archive.countBasis) {
    replaceManagedFile(
      root,
      '.mendi/project.json',
      JSON.stringify(project, null, 2) + '\n',
      written,
      'before-entry-commit',
      observe,
    );
    observe?.('after-count-commit', managedPath(root, '.mendi/project.json'));
  }
  let run = initial;
  if (run.record.status !== 'submitted') {
    run = replaceDraft(
      root,
      run,
      { ...run.header, archive, status: 'submitted', outcome: 'complete', result: 'archived' },
      run.body,
      written,
      observe,
    );
    observe?.('after-archive-run-commit', managedPath(root, run.ref));
  } else if (run.record.archive!.archiveRef !== numberedRef)
    throw new MendiError('archive-state-conflict', '终态 Run 与实际编号目标不一致，不能改历史。');
  const manifest = {
    ...workspace.manifest,
    activeChangeId: null,
    changeBindings: (workspace.manifest.changeBindings as unknown[]).map((value) => {
      const binding = object(value, 'binding');
      return binding.changeId === initial.record.changeId
        ? { ...binding, state: 'archived', changeRef: numberedRef, archiveOrdinal: archive.ordinal }
        : binding;
    }),
  };
  parseWorkspace(parseProject(project), manifest);
  replaceManagedFile(
    root,
    workspace.manifestRef,
    JSON.stringify(manifest, null, 2) + '\n',
    written,
    'before-manifest-commit',
    observe,
  );
  observe?.('before-readback', managedPath(root, workspace.manifestRef));
  const readback = readWorkspace(root, true)!;
  const final = currentRun(root, readback)!;
  if (
    JSON.stringify(readback.project) !== JSON.stringify(project) ||
    JSON.stringify(readback.manifest) !== JSON.stringify(manifest) ||
    final.ref !== run.ref ||
    JSON.stringify(final.record) !== JSON.stringify(run.record) ||
    final.body !== run.body
  )
    throw new MendiError('archive-readback-failed', '归档完成交接读回不一致。');
  return { workspace: readback, run: final, result: 'archived' as const };
}
