import { currentBinding } from '../core/associations.ts';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { MendiError, errorInfo } from '../core/errors.ts';
import { parseProject, parseWorkspace, type Workspace } from '../core/records.ts';
import { managedPath, present } from './paths.ts';
import { readRun } from './runs.ts';
import { archivedCount } from '../core/archive.ts';
import { currentDeliveryRun } from './delivery-runs.ts';
import { completionScope } from '../core/delivery-verification.ts';

export type WritePhase =
  | 'lock-acquired'
  | 'manifest-written'
  | 'before-entry-commit'
  | 'before-manifest-commit'
  | 'before-readback'
  | 'before-lock-release';
// Action writers use the same observer for focused interruption tests.
export type ActionWritePhase =
  | WritePhase
  | 'run-written'
  | 'before-run-commit'
  | 'after-invoking'
  | 'before-native-call'
  | 'native-returned'
  | 'before-none-observation'
  | 'before-archive-numbering'
  | 'after-count-commit'
  | 'after-archive-run-commit'
  | 'intent-written'
  | 'pending-written'
  | 'terminal-written'
  | 'lifecycle-manifest-written'
  | 'index-written';
export type WriteObserver = (phase: ActionWritePhase, file: string) => void;

export function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
  } catch (error) {
    const code =
      errorInfo(error).code === 'ENOENT' ? 'incomplete-mendi-state' : 'invalid-mendi-state';
    throw new MendiError(
      code,
      '无法读取完整有效的 MenDi 记录。',
      { file, ...errorInfo(error) },
      '核对该路径及原写入结果；查询不会自动恢复或清理。',
    );
  }
}

export function readWorkspace(
  root: string,
  ownLock = false,
  deliveryId?: string,
): Workspace | null {
  const directory = managedPath(root, '.mendi');
  if (!present(directory)) return null;
  const lock = managedPath(root, '.mendi/write.lock');
  if (!ownLock && present(lock))
    throw new MendiError(
      'write-in-progress-or-interrupted',
      '目标存在写入锁，操作可能正在进行或已中断。',
      { lock },
      '核对锁归属与写入现场；不会自动抢占或删除锁。',
    );
  const index = parseProject(readJson(managedPath(root, '.mendi/project.json')), deliveryId);
  if (index.project.pendingDeliveryRunRef !== undefined)
    throw new MendiError(
      'delivery-commit-pending',
      '生命周期提交未确认，停止普通操作。',
      { pendingDeliveryRunRef: index.project.pendingDeliveryRunRef },
      '核对现场后显式 resume；不自动清锁。',
    );
  const workspace = parseWorkspace(index, readJson(managedPath(root, index.manifestRef)));
  const selected = currentBinding(workspace);
  const delivery = currentDeliveryRun(root, workspace);
  if (delivery?.record.lifecycle) {
    const lifecycle = delivery.record.lifecycle;
    if (
      delivery.record.status !== 'submitted' ||
      JSON.stringify(lifecycle.scope) !== JSON.stringify(workspace.scope) ||
      (lifecycle.operation === 'delivery-close' &&
        (lifecycle.fullTestRunRef !== workspace.manifest.fullTestRunRef ||
          JSON.stringify(lifecycle.acceptance?.scope) !==
            JSON.stringify(completionScope(workspace)))) ||
      (lifecycle.operation === 'delivery-reopen' &&
        lifecycle.priorCloseRef !== workspace.manifest.closeRunRef) ||
      (lifecycle.operation === 'delivery-open' &&
        (workspace.manifest.openRunRef !== delivery.ref || lifecycle.title !== workspace.title))
    )
      throw new MendiError('invalid-record', '当前生命周期摘要与 manifest 不一致。');
  }
  if (workspace.mode === 'product') {
    for (const key of ['deliveryRunRef', 'fullTestRunRef', 'closeRunRef', 'openRunRef'])
      if (workspace.manifest[key] !== undefined) managedPath(root, String(workspace.manifest[key]));
    if (
      delivery?.record.repair &&
      delivery.record.repair.failedFullTestRunRef !== workspace.manifest.fullTestRunRef
    )
      throw new MendiError('invalid-record', '修复当前来源与最近正式指针矛盾。');
  }
  for (const binding of workspace.bindings) {
    managedPath(root, binding.changeRef);
    if (binding.latestRunRef) managedPath(root, binding.latestRunRef);
    if (binding !== selected || delivery) continue;
    if (workspace.mode === 'product' && ['archiving', 'archived'].includes(binding.state)) {
      const run = readRun(root, binding.latestRunRef!, workspace.id, binding.changeId);
      const archive = run.record.archive;
      if (
        !archive ||
        (binding.state === 'archived' &&
          (run.record.status !== 'submitted' ||
            binding.changeRef !== archive.archiveRef ||
            binding.archiveOrdinal !== archive.ordinal ||
            archivedCount(workspace.project) < archive.ordinal)) ||
        (binding.state === 'archiving' &&
          (![archive.countBasis, archive.ordinal].includes(archivedCount(workspace.project)) ||
            (['prepared', 'none'].includes(archive.phase) &&
              archivedCount(workspace.project) !== archive.countBasis) ||
            (run.record.status === 'submitted' &&
              archivedCount(workspace.project) !== archive.ordinal)))
      )
        throw new MendiError('invalid-record', '归档交接、当前 Archive Run 与计数不一致。');
      continue;
    }
    const file = managedPath(root, binding.changeRef);
    // Only the current active Change is an input read by the upstream query.
    if (binding.changeId === workspace.activeChangeId && !present(file)) {
      throw new MendiError('incomplete-mendi-state', '当前活动 Change 路径不存在。', {
        file,
        changeId: binding.changeId,
      });
    }
  }
  return workspace;
}

function exclusiveJson(file: string, value: unknown): void {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}

function replaceJson(
  root: string,
  ref: string,
  value: unknown,
  phase: WritePhase,
  observe?: WriteObserver,
): string {
  const file = managedPath(root, ref);
  const temporary = managedPath(root, `${ref}.${randomUUID()}.tmp`);
  exclusiveJson(temporary, value);
  observe?.(phase, file);
  // Keep the original file intact if replacement fails; never unlink it first.
  fs.renameSync(temporary, file);
  return file;
}

export interface ProjectLock {
  lock: string;
  owner: string;
}
export function acquireProjectLock(root: string, operation: string): ProjectLock {
  const lock = managedPath(root, '.mendi/write.lock');
  const owner = JSON.stringify({ token: randomUUID(), pid: process.pid, operation });
  let descriptor: number;
  try {
    descriptor = fs.openSync(lock, 'wx');
  } catch (error) {
    throw new MendiError(
      'write-conflict',
      '无法取得目标写入锁。',
      { lock, ...errorInfo(error) },
      '核对现有锁与写入现场，不覆盖已有工作。',
    );
  }
  try {
    fs.writeFileSync(descriptor, owner);
  } finally {
    fs.closeSync(descriptor);
  }
  return { lock, owner };
}
export function releaseProjectLock(root: string, lease: ProjectLock): void {
  const lock = managedPath(root, '.mendi/write.lock');
  if (lock !== lease.lock || fs.readFileSync(lock, 'utf8') !== lease.owner)
    throw new MendiError('write-conflict', '锁归属已变化，保留现有锁。');
  fs.unlinkSync(lock);
}

export function lockedWrite<T>(
  root: string,
  operation: string,
  action: (committed: string[]) => T,
  observe?: WriteObserver,
  retainOnFailure = false,
): T {
  const lease = acquireProjectLock(root, operation);
  const { lock } = lease;
  const committed: string[] = [];
  let output: T | undefined;
  let actionError: unknown;
  let releaseError: unknown;
  try {
    observe?.('lock-acquired', lock);
    output = action(committed);
  } catch (error) {
    actionError = error;
  }
  if (!(retainOnFailure && actionError && committed.length))
    try {
      observe?.('before-lock-release', lock);
      releaseProjectLock(root, lease);
    } catch (error) {
      releaseError = error;
    }
  if (actionError || releaseError) {
    if (actionError instanceof MendiError && !committed.length && !releaseError) throw actionError;
    throw new MendiError(
      'workspace-write-failed',
      'MenDi 写入未完整成功。',
      {
        operation,
        lock,
        committedPaths: committed,
        ...(/^delivery-(open|close|reopen)(-resume)?$/.test(operation) && committed.length
          ? { outcome: 'unknown' }
          : {}),
        ...(actionError ? { error: errorInfo(actionError) } : {}),
        ...(releaseError ? { releaseError: errorInfo(releaseError) } : {}),
      },
      '核对已提交路径、残留临时文件及锁；不会自动回滚或清理现场。',
    );
  }
  if (!output) throw new MendiError('workspace-write-failed', '写入未返回读回结果。', { lock });
  return output;
}

export function createWorkspace(
  root: string,
  project: Record<string, unknown>,
  manifest: Record<string, unknown>,
  observe?: WriteObserver,
): Workspace {
  const index = parseProject(project);
  parseWorkspace(index, manifest);
  const directory = managedPath(root, '.mendi');
  try {
    fs.mkdirSync(directory);
  } catch (error) {
    throw new MendiError(
      'existing-mendi-state',
      '首次 Open 要求目标尚无 .mendi 状态。',
      { directory, ...errorInfo(error) },
      '保留已有记录或残留并核对，不自动重新 Open。',
    );
  }
  return lockedWrite(
    root,
    'delivery-open',
    (committed) => {
      const file = managedPath(root, index.manifestRef);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      exclusiveJson(file, manifest);
      committed.push(file);
      observe?.('manifest-written', file);
      committed.push(
        replaceJson(root, '.mendi/project.json', project, 'before-entry-commit', observe),
      );
      observe?.('before-readback', file);
      const result = readWorkspace(root, true);
      if (!result) throw new MendiError('incomplete-mendi-state', '提交后记录不存在。');
      return result;
    },
    observe,
  );
}

export function updateWorkspace(
  root: string,
  update: (current: Workspace) => Record<string, unknown>,
  observe?: WriteObserver,
): Workspace {
  if (!readWorkspace(root)) throw new MendiError('delivery-not-open', '目标尚未 Open。');
  return lockedWrite(
    root,
    'change-bind',
    (committed) => {
      const current = readWorkspace(root, true);
      if (!current) throw new MendiError('incomplete-mendi-state', '加锁后项目入口不存在。');
      const manifest = update(current);
      parseWorkspace(parseProject(current.project), manifest);
      committed.push(
        replaceJson(root, current.manifestRef, manifest, 'before-manifest-commit', observe),
      );
      observe?.('before-readback', current.manifestRef);
      const result = readWorkspace(root, true);
      if (!result) throw new MendiError('incomplete-mendi-state', '提交后记录不存在。');
      return result;
    },
    observe,
  );
}
