import { currentBinding } from '../core/associations.ts';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { managedPath } from './paths.ts';
import { currentRun, readRun, renderRun, scanRunNumbers, type RunDocument } from './runs.ts';
import {
  readWorkspace,
  lockedWrite,
  type WriteObserver,
  type ActionWritePhase,
} from './workspace.ts';
import { parseRun, type RunRecord } from '../core/actions.ts';
import { parseProject, parseWorkspace, type Workspace } from '../core/records.ts';
import { MendiError, object } from '../core/errors.ts';

function writeExclusive(root: string, ref: string, content: string, written: string[]) {
  const file = managedPath(root, ref);
  const fd = fs.openSync(file, 'wx');
  written.push(file);
  try {
    fs.writeFileSync(fd, content);
  } finally {
    fs.closeSync(fd);
  }
}
export function replaceManagedFile(
  root: string,
  ref: string,
  content: string,
  written: string[],
  phase: ActionWritePhase,
  observe?: WriteObserver,
) {
  const temporary = `${ref}.${randomUUID()}.tmp`;
  writeExclusive(root, temporary, content, written);
  observe?.(phase, managedPath(root, ref));
  fs.renameSync(managedPath(root, temporary), managedPath(root, ref));
  written.push(managedPath(root, ref));
}
export function writeAction<T>(
  root: string,
  operation: string,
  update: (workspace: Workspace, written: string[]) => T,
  observe?: WriteObserver,
) {
  return lockedWrite(
    root,
    operation,
    (written) => {
      const workspace = readWorkspace(root, true);
      if (!workspace || workspace.mode !== 'product')
        throw new MendiError(
          'manual-state-read-only',
          'Action 写入仅支持已经 Open 的 product 记录。',
        );
      return update(workspace, written);
    },
    observe,
    true,
  );
}
export function createRun(
  root: string,
  workspace: Workspace,
  seed: Omit<RunRecord, 'runNumber' | 'actionId'> & { actionId?: string },
  written: string[],
  observe?: WriteObserver,
  initialBody = '',
) {
  const allocation = scanRunNumbers(root, workspace.id);
  const number = String(allocation.number).padStart(3, '0');
  const binding = currentBinding(workspace);
  if (!binding || binding.changeId !== seed.changeId)
    throw new MendiError('invalid-action', '当前 Change 缺少 binding。');
  const batchId = binding.batchId ?? `${number}-changes`;
  const ref = `.mendi/runs/${workspace.id}/${batchId}/${seed.changeId}/${number}-${seed.actionType}/run.md`;
  const header = {
    ...seed,
    runNumber: allocation.number,
    actionId: seed.actionId ?? `${seed.changeId}-${number}-${seed.actionType}`,
  };
  parseRun(header, ref, workspace.id, seed.changeId);
  const parent = path.dirname(path.dirname(managedPath(root, ref)));
  const created = fs.mkdirSync(parent, { recursive: true });
  if (created) written.push(created);
  const directory = path.dirname(managedPath(root, ref));
  fs.mkdirSync(directory);
  written.push(directory);
  const content = renderRun(header, initialBody);
  writeExclusive(root, ref, content, written);
  observe?.('run-written', managedPath(root, ref));
  const manifest = {
    ...workspace.manifest,
    changeBindings: (workspace.manifest.changeBindings as unknown[]).map((value) => {
      const b = object(value, 'binding');
      return b.changeId === seed.changeId
        ? {
            ...b,
            state: seed.actionType === 'archive' ? 'archiving' : 'active',
            latestRunRef: ref,
            batchId,
          }
        : b;
    }),
    changeBatches: binding.batchId
      ? workspace.manifest.changeBatches
      : [
          ...(workspace.manifest.changeBatches as unknown[]),
          {
            id: batchId,
            firstRun: number,
            runsRef: `.mendi/runs/${workspace.id}/${batchId}`,
            changeIds: [seed.changeId],
          },
        ],
    currentBatchId: batchId,
  };
  parseWorkspace(parseProject(workspace.project), manifest);
  replaceManagedFile(
    root,
    workspace.manifestRef,
    JSON.stringify(manifest, null, 2) + '\n',
    written,
    'before-manifest-commit',
    observe,
  );
  observe?.('before-readback', managedPath(root, ref));
  const readback = readWorkspace(root, true);
  if (!readback) throw new MendiError('invalid-run', '写入后没有当前记录。');
  const run = currentRun(root, readback);
  if (!run || run.ref !== ref) throw new MendiError('invalid-run', '写入后指针不一致。');
  if (
    fs.readFileSync(managedPath(root, ref), 'utf8') !== content ||
    fs.readFileSync(managedPath(root, workspace.manifestRef), 'utf8') !==
      JSON.stringify(manifest, null, 2) + '\n'
  )
    throw new MendiError('invalid-run', '写入后内容读回不一致。');
  return { run, workspace: readback, incompleteReservations: allocation.incompleteReservations };
}
export function replaceDraft(
  root: string,
  run: RunDocument,
  header: Record<string, unknown>,
  body: string,
  written: string[],
  observe?: WriteObserver,
) {
  parseRun(header, run.ref, run.record.deliveryId, run.record.changeId);
  const content = renderRun(header, body);
  replaceManagedFile(root, run.ref, content, written, 'before-run-commit', observe);
  observe?.('before-readback', managedPath(root, run.ref));
  const readback = readRun(root, run.ref, run.record.deliveryId, run.record.changeId);
  if (fs.readFileSync(managedPath(root, run.ref), 'utf8') !== content)
    throw new MendiError('invalid-run', 'Run 写入后内容读回不一致。');
  return readback;
}
