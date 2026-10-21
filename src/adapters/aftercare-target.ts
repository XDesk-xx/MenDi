import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { MendiError, text } from '../core/errors.ts';
import { requireWritable } from '../core/rounds.ts';
import { currentBinding } from '../core/associations.ts';
import { runLocation } from '../core/actions.ts';
import { currentRun, scanRunNumbers } from './runs.ts';
import { currentDeliveryRun } from './delivery-runs.ts';
import { managedPath } from './paths.ts';
import { readWorkspace } from './workspace.ts';

export const digest = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
export interface AftercareActor {
  runRef: string;
  role: string;
  actor: string;
}
export function aftercareTarget(root: string, input: AftercareActor, ownLock = false) {
  const workspace = readWorkspace(root, ownLock);
  if (!workspace) throw new MendiError('delivery-not-open', '目标尚未 Open。');
  requireWritable(workspace);
  if (workspace.state !== 'open')
    throw new MendiError('delivery-not-open', '仅当前 open Delivery 可操作。');
  const binding = currentBinding(workspace);
  let run;
  if (workspace.activeChangeId) {
    if (
      !binding ||
      binding.state === 'archived' ||
      binding.state === 'archiving' ||
      binding.latestRunRef !== input.runRef ||
      workspace.manifest.deliveryRunRef !== undefined ||
      !workspace.scope.plannedChanges.some((p) => p.slot === binding.planningSlot)
    )
      throw new MendiError('run-not-current', '必须指定活动 Change 的当前 Run。');
    run = currentRun(root, workspace);
    if (
      run &&
      runLocation(run.ref, workspace.id, binding.changeId).batchId !==
        workspace.manifest.currentBatchId
    )
      throw new MendiError('round-not-current', 'Change 批次不属于当前轮。');
  } else {
    if (workspace.manifest.deliveryRunRef !== input.runRef)
      throw new MendiError(
        'run-not-current',
        '必须指定真实当前 Delivery 进展，不能使用 archived Change。',
      );
    run = currentDeliveryRun(root, workspace);
    if (
      !run ||
      !['delivery-repair', 'revise-delivery-repair', 'review-delivery-repair'].includes(
        run.record.actionType,
      ) ||
      run.record.outcome !== 'complete'
    )
      throw new MendiError(
        'aftercare-target-forbidden',
        '正式执行、验收和生命周期 Run 不接受提交后修改。',
      );
  }
  text(input.actor, 'actor');
  if (
    !run ||
    run.ref !== input.runRef ||
    run.record.status !== 'submitted' ||
    run.record.role !== input.role ||
    run.record.actorId !== input.actor
  )
    throw new MendiError(
      'aftercare-role-or-state',
      '仅原 role/actor 的当前 submitted Run 可操作。',
    );
  const allocation = scanRunNumbers(root, workspace.id);
  if (
    allocation.reservations.some((r) => r.number > run.record.runNumber) ||
    allocation.incompleteReservations.length ||
    !allocation.reservations.some((r) => r.ref === run.ref)
  )
    throw new MendiError(
      'downstream-run-exists',
      '存在下游 Run、占号或不完整现场，停止提交后修改。',
    );
  return {
    workspace,
    run,
    basis: {
      project: digest(fs.readFileSync(managedPath(root, '.mendi/project.json'))),
      manifestRef: workspace.manifestRef,
      manifest: digest(fs.readFileSync(managedPath(root, workspace.manifestRef))),
      run: digest(fs.readFileSync(managedPath(root, run.ref))),
    },
  };
}

/** Read twice around direct capture; identity and bytes must both remain stable. */
export function sourceFile(root: string, ref: string) {
  const file = managedPath(root, ref),
    canonical = fs.realpathSync(file);
  const before = fs.statSync(file, { bigint: true });
  if (!before.isFile()) throw new MendiError('invalid-aftercare-source', '来源必须是普通文件。');
  const bytes = fs.readFileSync(file);
  const after = fs.statSync(managedPath(root, ref), { bigint: true });
  const identity = (s: typeof before) => `${s.dev}:${s.ino}:${s.birthtimeNs}`;
  if (
    identity(before) !== identity(after) ||
    before.mtimeNs !== after.mtimeNs ||
    fs.realpathSync(managedPath(root, ref)) !== canonical ||
    !bytes.equals(fs.readFileSync(file))
  )
    throw new MendiError('aftercare-input-changed', '来源读取期间变化，保留现场。');
  return { ref, bytes, identity: identity(before), digest: digest(bytes) };
}
