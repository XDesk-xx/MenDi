import fs from 'node:fs';
import path from 'node:path';
import { managedPath } from './paths.ts';
import { readRunSource, renderRun, scanRunNumbers, currentRun } from './runs.ts';
import {
  parseDeliveryRun,
  deliveryLocation,
  type DeliveryRunRecord,
} from '../core/delivery-runs.ts';
import { parseProject, parseWorkspace, type Workspace } from '../core/records.ts';
import { errorInfo, MendiError } from '../core/errors.ts';
import { readWorkspace, type WriteObserver } from './workspace.ts';
import { replaceManagedFile } from './action-store.ts';

export interface DeliveryDocument {
  ref: string;
  header: Record<string, unknown>;
  record: DeliveryRunRecord;
  body: string;
}
export function readDeliveryRun(root: string, ref: string, id: string): DeliveryDocument {
  try {
    deliveryLocation(ref, id);
    const { header, body } = readRunSource(root, ref);
    return { ref, header, body, record: parseDeliveryRun(header, ref, id) };
  } catch (error) {
    if (error instanceof MendiError) throw error;
    throw new MendiError('run-input-missing', '无法读取必要 Delivery Run。', {
      ref,
      ...errorInfo(error),
    });
  }
}
export function currentDeliveryRun(root: string, workspace: Workspace) {
  return workspace.mode === 'product' && workspace.manifest.deliveryRunRef !== undefined
    ? readDeliveryRun(root, String(workspace.manifest.deliveryRunRef), workspace.id)
    : null;
}
export function currentProgress(root: string, workspace: Workspace) {
  return currentDeliveryRun(root, workspace) ?? currentRun(root, workspace);
}
export function createDeliveryRun(
  root: string,
  workspace: Workspace,
  seed: Omit<DeliveryRunRecord, 'runNumber' | 'actionId'> & { actionId?: string },
  written: string[],
  observe?: WriteObserver,
) {
  const allocation = scanRunNumbers(root, workspace.id);
  const number = String(allocation.number).padStart(3, '0');
  const ref = `.mendi/runs/${workspace.id}/${number}-${seed.actionType}/run.md`;
  const header = {
    ...seed,
    runNumber: allocation.number,
    actionId: seed.actionId ?? `${workspace.id}-${number}-${seed.actionType}`,
  };
  parseDeliveryRun(header, ref, workspace.id);
  const directory = path.dirname(managedPath(root, ref));
  const created = fs.mkdirSync(path.dirname(directory), { recursive: true });
  if (created) written.push(created);
  fs.mkdirSync(directory);
  written.push(directory);
  const content = renderRun(header, '');
  fs.writeFileSync(managedPath(root, ref), content, { flag: 'wx' });
  written.push(managedPath(root, ref));
  observe?.('run-written', managedPath(root, ref));
  const manifest = {
    ...workspace.manifest,
    deliveryRunRef: ref,
    ...(seed.fullTest ? { fullTestRunRef: ref } : {}),
  };
  parseWorkspace(parseProject(workspace.project), manifest);
  const manifestContent = JSON.stringify(manifest, null, 2) + '\n';
  replaceManagedFile(
    root,
    workspace.manifestRef,
    manifestContent,
    written,
    'before-manifest-commit',
    observe,
  );
  observe?.('before-readback', managedPath(root, ref));
  const readback = readWorkspace(root, true)!;
  const run = currentDeliveryRun(root, readback);
  if (
    !run ||
    run.ref !== ref ||
    fs.readFileSync(managedPath(root, ref), 'utf8') !== content ||
    fs.readFileSync(managedPath(root, workspace.manifestRef), 'utf8') !== manifestContent
  )
    throw new MendiError('invalid-run', 'Delivery 写入读回不一致。');
  return { workspace: readback, run, incompleteReservations: allocation.incompleteReservations };
}
export function replaceDeliveryDraft(
  root: string,
  run: DeliveryDocument,
  header: Record<string, unknown>,
  body: string,
  written: string[],
  observe?: WriteObserver,
) {
  const current = readDeliveryRun(root, run.ref, run.record.deliveryId);
  if (
    current.record.status !== 'draft' ||
    JSON.stringify(current.header) !== JSON.stringify(run.header) ||
    current.body !== run.body
  )
    throw new MendiError('run-already-submitted', 'Delivery draft 已提交或发生变化。');
  parseDeliveryRun(header, run.ref, run.record.deliveryId);
  const content = renderRun(header, body);
  replaceManagedFile(root, run.ref, content, written, 'before-run-commit', observe);
  observe?.('before-readback', managedPath(root, run.ref));
  const readback = readDeliveryRun(root, run.ref, run.record.deliveryId);
  if (fs.readFileSync(managedPath(root, run.ref), 'utf8') !== content)
    throw new MendiError('invalid-run', 'Delivery Run 读回不一致。');
  return readback;
}
