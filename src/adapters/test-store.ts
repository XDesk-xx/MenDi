import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { managedPath, present } from './paths.ts';
import { MendiError } from '../core/errors.ts';
import { parseProject, parseWorkspace } from '../core/records.ts';
import {
  executionLocation,
  parseExecution,
  type TestExecution,
  type TestKind,
} from '../core/test-execution.ts';

export type TestPhase =
  | 'prepared'
  | 'before-intent-commit'
  | 'before-pid-commit'
  | 'after-launch'
  | 'before-log-write'
  | 'before-terminal-commit'
  | 'before-test-readback'
  | 'before-test-lock-release';
export type TestObserver = (phase: TestPhase, file: string) => void;

// test status 只消费身份和指定执行，不读取生命周期 Run 正文。
export function executionWorkspace(root: string, deliveryId?: string) {
  const projectRef = '.mendi/project.json';
  const projectBytes = fs.readFileSync(managedPath(root, projectRef));
  const index = parseProject(JSON.parse(projectBytes.toString()), deliveryId);
  if (index.project.pendingDeliveryRunRef !== undefined)
    throw new MendiError('delivery-commit-pending', '生命周期提交未确认。');
  const manifestBytes = fs.readFileSync(managedPath(root, index.manifestRef));
  const workspace = parseWorkspace(index, JSON.parse(manifestBytes.toString()));
  if (workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', '测试执行记录只支持 product Delivery。');
  return { workspace, projectBytes, manifestBytes };
}
export function reserveExecution(root: string, deliveryId: string, kind: TestKind) {
  const base = `.mendi/delivery-groups/${deliveryId}/tests`;
  fs.mkdirSync(managedPath(root, base), { recursive: true });
  const numbers = new Set<number>();
  for (const name of fs.readdirSync(managedPath(root, base))) {
    if (!/^\d+-(focused|fast|full)$/.test(name)) continue;
    const location = executionLocation(name, deliveryId);
    if (!fs.statSync(managedPath(root, location.ref)).isDirectory() || numbers.has(location.number))
      throw new MendiError('test-number-conflict', '执行编号重复或占号不是目录。');
    numbers.add(location.number);
  }
  const number = Math.max(0, ...numbers) + 1;
  if (!Number.isSafeInteger(number))
    throw new MendiError('test-number-conflict', '执行编号无法安全增长。');
  const id = `${String(number).padStart(3, '0')}-${kind}`;
  const { ref } = executionLocation(id, deliveryId);
  fs.mkdirSync(managedPath(root, ref));
  return { id, ref };
}
export function saveExecution(
  root: string,
  record: TestExecution,
  phase: TestPhase,
  observe?: TestObserver,
  initial = false,
) {
  parseExecution(record, root, record.deliveryId, record.executionId);
  const ref = `${executionLocation(record.executionId, record.deliveryId).ref}/result.json`;
  const file = managedPath(root, ref);
  const content = JSON.stringify(record, null, 2) + '\n';
  if (initial) fs.writeFileSync(file, content, { flag: 'wx' });
  else {
    const before = parseExecution(
      JSON.parse(fs.readFileSync(file, 'utf8')),
      root,
      record.deliveryId,
      record.executionId,
    );
    if (before.executionState === 'finished')
      throw new MendiError('test-result-immutable', '终态执行不可重写。');
    const temporary = `${ref}.${randomUUID()}.tmp`;
    fs.writeFileSync(managedPath(root, temporary), content, { flag: 'wx' });
    observe?.(phase, file);
    fs.renameSync(managedPath(root, temporary), managedPath(root, ref));
  }
  observe?.('before-test-readback', file);
  if (fs.readFileSync(managedPath(root, ref), 'utf8') !== content)
    throw new MendiError('test-readback-failed', '执行内容读回不一致。');
}
export function observeExecution(
  root: string,
  id: string,
  observe?: () => void,
  deliveryId?: string,
) {
  const before = executionWorkspace(root, deliveryId);
  const { ref } = executionLocation(id, before.workspace.id);
  const resultRef = `${ref}/result.json`;
  const raw = fs.readFileSync(managedPath(root, resultRef));
  const record = parseExecution(JSON.parse(raw.toString()), root, before.workspace.id, id);
  const logRefs = [record.stdoutRef, record.stderrRef];
  const logs = logRefs.map((ref) => fs.readFileSync(managedPath(root, ref)));
  const lock = managedPath(root, '.mendi/write.lock');
  const lockedBefore = present(lock);
  observe?.();
  const after = executionWorkspace(root, deliveryId);
  const changed =
    !after.projectBytes.equals(before.projectBytes) ||
    !after.manifestBytes.equals(before.manifestBytes) ||
    !fs.readFileSync(managedPath(root, resultRef)).equals(raw) ||
    logRefs.some((ref, i) => !fs.readFileSync(managedPath(root, ref)).equals(logs[i]));
  return {
    record,
    stable: !lockedBefore && !present(lock) && !changed && record.executionState === 'finished',
    locked: lockedBefore || present(lock),
    changed,
  };
}
// 持锁写者的直接读回仍校验实际结果与必要日志，不把自己的锁当成外部竞争。
export function readExecution(root: string, id: string, deliveryId: string) {
  const { ref } = executionLocation(id, deliveryId);
  const record = parseExecution(
    JSON.parse(fs.readFileSync(managedPath(root, `${ref}/result.json`), 'utf8')),
    root,
    deliveryId,
    id,
  );
  for (const log of [record.stdoutRef, record.stderrRef]) fs.readFileSync(managedPath(root, log));
  return record;
}
