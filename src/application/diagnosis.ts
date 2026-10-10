import {
  currentProgress,
  readDeliveryRun,
  type DeliveryDocument,
} from '../adapters/delivery-runs.ts';
import { deliveryLocation } from '../core/delivery-runs.ts';
import { currentBinding } from '../core/associations.ts';
import fs from 'node:fs';
import path from 'node:path';
import { inspectProject } from '../adapters/project.ts';
import { managedPath, present } from '../adapters/paths.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { readRun, type RunDocument } from '../adapters/runs.ts';
import { parseProject } from '../core/records.ts';
import { runLocation } from '../core/actions.ts';
import { MendiError, errorInfo, object, text } from '../core/errors.ts';
import { state } from './project.ts';

export type Liveness = 'alive' | 'not-found' | 'unknown';
export interface DiagnosisOptions {
  probe?: (pid: number) => Liveness;
  observeRead?: () => void;
}
export function probeProcess(pid: number): Liveness {
  try {
    process.kill(pid, 0);
    return 'alive';
  } catch (error) {
    return errorInfo(error).code === 'ESRCH' ? 'not-found' : 'unknown';
  }
}
export function diagnoseWorkspace(
  input: { project: string; runRef?: string },
  options: DiagnosisOptions = {},
) {
  const { root } = inspectProject(input.project);
  const errors: { code: string; message: string; details: unknown }[] = [];
  const before = new Map<string, Buffer | null>();
  const temporaries = new Set<string>();
  const report = (error: unknown) =>
    errors.push(
      error instanceof MendiError
        ? { code: error.code, message: error.message, details: error.details }
        : {
            code: 'diagnostic-input-error',
            message: '无法读取必要现场。',
            details: errorInfo(error),
          },
    );
  const attempt = <T>(read: () => T): T | null => {
    try {
      return read();
    } catch (error) {
      report(error);
      return null;
    }
  };
  function track(ref: string) {
    const file = managedPath(root, ref);
    if (!before.has(ref)) before.set(ref, present(file) ? fs.readFileSync(file) : null);
    return file;
  }
  function temporaryPaths(ref: string) {
    const file = managedPath(root, ref);
    const dir = path.dirname(file);
    if (present(dir))
      for (const name of fs.readdirSync(dir)) {
        if (name.startsWith(path.basename(file) + '.') && name.endsWith('.tmp')) {
          const relative = path.relative(root, path.join(dir, name)).replaceAll('\\', '/');
          managedPath(root, relative);
          temporaries.add(relative);
        }
      }
  }
  const lockFile = attempt(() => track('.mendi/write.lock'));
  const lockPresent = lockFile !== null && before.get('.mendi/write.lock') !== null;
  const lock = lockPresent
    ? attempt(() => {
        const data = object(
          JSON.parse(before.get('.mendi/write.lock')!.toString('utf8')),
          '写入锁',
        );
        const token = text(data.token, '锁 token');
        const operation = text(data.operation, '锁 operation');
        if (!Number.isSafeInteger(data.pid) || Number(data.pid) <= 0)
          throw new MendiError('invalid-write-lock', '锁 pid 必须是正整数。');
        const pid = Number(data.pid);
        let liveness: Liveness = 'unknown';
        try {
          liveness = (options.probe ?? probeProcess)(pid);
        } catch {
          /* no proof of liveness */
        }
        return { token, operation, pid, liveness };
      })
    : null;
  const index = attempt(() => {
    track('.mendi/project.json');
    temporaryPaths('.mendi/project.json');
    return parseProject(JSON.parse(before.get('.mendi/project.json')!.toString('utf8')));
  });
  if (index)
    attempt(() => {
      track(index.manifestRef);
      temporaryPaths(index.manifestRef);
    });
  // This lock bypass is confined to diagnosis; it never exposes a writer/query option.
  const workspace = index ? attempt(() => readWorkspace(root, true)) : null;
  if (index && !workspace && !errors.length)
    report(new MendiError('incomplete-mendi-state', '缺少 workspace。'));
  let current: RunDocument | DeliveryDocument | null = null;
  let reservation: RunDocument | DeliveryDocument | null = null;
  if (index?.project.pendingDeliveryRunRef !== undefined) {
    current = attempt(() => {
      const ref = text(index.project.pendingDeliveryRunRef, 'pending Run');
      const id = ref.split('/')[2];
      track(ref);
      temporaryPaths(ref);
      track(`.mendi/delivery-groups/${id}/manifest.json`);
      for (const name of ['input', 'before-project', 'before-manifest'])
        track(ref.replace(/run\.md$/, `artifacts/${name}.json`));
      return readDeliveryRun(root, ref, id);
    });
  }
  if (workspace?.mode === 'product') {
    current = attempt(() => {
      const ref =
        (workspace.manifest.deliveryRunRef as string | undefined) ??
        currentBinding(workspace)?.latestRunRef;
      if (ref) {
        track(ref);
        temporaryPaths(ref);
      }
      return currentProgress(root, workspace);
    });
    if (input.runRef !== undefined)
      reservation = attempt(() => {
        if (
          /^\.mendi\/runs\/[^/]+\/\d{3,}-(?:delivery-open|delivery-close|delivery-reopen|delivery-full-test|delivery-repair|revise-delivery-repair|review-delivery-repair)\/run\.md$/.test(
            input.runRef!,
          )
        ) {
          const owner = input.runRef!.split('/')[2];
          const location = deliveryLocation(input.runRef!, owner);
          track(input.runRef!);
          temporaryPaths(input.runRef!);
          const run = readDeliveryRun(root, input.runRef!, owner);
          if (
            owner !== workspace.id &&
            !(
              location.type === 'delivery-open' &&
              run.record.lifecycle?.sourceDeliveryId === workspace.id &&
              run.record.lifecycle.priorCloseRef === workspace.manifest.closeRunRef
            )
          )
            throw new MendiError('invalid-run', '占号与当前 Delivery 来源不符。');
          return run;
        }
        if (!workspace.activeChangeId)
          throw new MendiError('invalid-run', '显式占号需要当前 Change。');
        runLocation(input.runRef!, workspace.id, workspace.activeChangeId);
        track(input.runRef!);
        temporaryPaths(input.runRef!);
        return readRun(root, input.runRef!, workspace.id, workspace.activeChangeId);
      });
  } else if (
    input.runRef !== undefined &&
    /^\.mendi\/runs\/[^/]+\/\d{3,}-delivery-(open|close|reopen)\/run\.md$/.test(input.runRef)
  ) {
    reservation = attempt(() => {
      const ref = input.runRef!;
      const id = ref.split('/')[2];
      deliveryLocation(ref, id);
      track(ref);
      temporaryPaths(ref);
      const run = readDeliveryRun(root, ref, id);
      const pending = index?.project.pendingDeliveryRunRef;
      if (
        pending !== ref &&
        !(
          index === null &&
          run.record.lifecycle?.sourceDeliveryId === null &&
          run.record.actionType === 'delivery-open'
        )
      )
        throw new MendiError('run-not-current', '该占号不是已登记 pending 或无入口的首次 Open。');
      for (const name of ['input', 'before-project', 'before-manifest'])
        track(ref.replace(/run\.md$/, `artifacts/${name}.json`));
      return run;
    });
  } else if (input.runRef !== undefined)
    report(
      new MendiError('unsupported-diagnostic-run', '人工或无 workspace 不支持 product --run。'),
    );
  attempt(() => options.observeRead?.());
  let changed = false;
  for (const [ref, bytes] of before)
    attempt(() => {
      const file = managedPath(root, ref);
      const after = present(file) ? fs.readFileSync(file) : null;
      if (bytes === null ? after !== null : after === null || !bytes.equals(after)) changed = true;
    });
  if (changed)
    report(new MendiError('changed-during-read', '现场在读取期间发生变化；不能视为稳定快照。'));
  const runOutput = (run: RunDocument | DeliveryDocument | null) =>
    run ? { ref: run.ref, ...run.record } : null;
  const classification = errors.length
    ? 'unknown'
    : !lockPresent
      ? 'no-lock-observed'
      : reservation && reservation.ref !== current?.ref
        ? 'unreferenced-run-observed'
        : current?.record.status === 'submitted'
          ? 'current-submitted-observed'
          : current
            ? 'draft-observed'
            : 'unknown';
  return {
    ok: errors.length === 0,
    operation: 'workspace-diagnose',
    projectRoot: root,
    executionMode: 'local-only' as const,
    openspec: null,
    upstreamAccess: 'not-required',
    local: workspace ? state(workspace) : null,
    blockedByLock: lockFile === null ? null : lockPresent,
    lock,
    classification,
    observation: changed
      ? 'changed-during-read'
      : errors.length
        ? 'incomplete'
        : 'readback-unchanged',
    current: runOutput(current),
    pendingDeliveryRunRef: index?.project.pendingDeliveryRunRef ?? null,
    reservation: reservation
      ? { ...runOutput(reservation)!, isCurrent: reservation.ref === current?.ref }
      : null,
    temporaryPaths: [...temporaries],
    errors,
    disposition: '只读观察不证明写入完整、不构成解除锁许可；没有自动处置。',
  };
}
