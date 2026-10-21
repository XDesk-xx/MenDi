import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual as equal } from 'node:util';
import { MendiError, errorInfo } from '../core/errors.ts';
import type { AftercareIntent, AftercareRequest } from '../core/run-aftercare.ts';
import {
  aftercareDirectory,
  aftercareSlots,
  receipt,
  aftercarePath as managedPath,
} from './aftercare-reader.ts';
import { aftercareTarget, digest, sourceFile, type AftercareActor } from './aftercare-target.ts';
import { present } from './paths.ts';
import { acquireProjectLock, releaseProjectLock, type ProjectLock } from './workspace.ts';

export type AftercarePhase =
  | 'lock-acquired'
  | 'intent-written'
  | 'original-written'
  | 'before-confirm'
  | 'confirmed-written'
  | 'before-readback'
  | 'before-lock-release';
export interface AftercareOptions {
  observe?: (phase: AftercarePhase, file: string) => void;
}
export interface AftercareContent {
  request: AftercareRequest;
  files: { name: string; bytes: Buffer; sourceRef?: string; identity?: string }[];
}
const json = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
export function storeAftercare(
  root: string,
  actor: AftercareActor,
  content: AftercareContent,
  resume: boolean,
  options: AftercareOptions = {},
) {
  const request = content.request;
  const directory = `${aftercareDirectory(actor.runRef)}/${request.operation === 'amend' ? 'amend' : `supplements/${request.requestId}`}`;
  const descriptors = content.files.map(({ name, bytes, ...source }) => ({
    name,
    ...source,
    digest: digest(bytes),
  }));
  const matches = (i: AftercareIntent) =>
    equal(i.request, request) &&
    equal(i.files.slice(1), descriptors) &&
    i.targetRef === actor.runRef &&
    i.role === actor.role &&
    i.actorId === actor.actor;
  const confirmedRef = `${directory}/confirmed.json`;
  if (present(managedPath(root, '.mendi/write.lock')))
    throw new MendiError(
      'write-conflict',
      '仍有写入锁；须 Owner 核对停止写者并显式处置，不自动清锁。',
    );
  if (present(managedPath(root, confirmedRef))) {
    const saved = receipt(root, directory, actor.runRef);
    if (!matches(saved.intent))
      throw new MendiError(
        'aftercare-request-conflict',
        '同请求输入/模式/身份已变化，或 amend 槽位已占用。',
      );
    return { ...saved, alreadyConfirmed: true };
  }
  // A residual real lock always needs explicit Owner disposition; never auto-unlock.
  const initial = aftercareTarget(root, actor);
  const pending = present(managedPath(root, directory));
  const slotBasis = aftercareSlots(root, actor.runRef).sort();
  if (pending && !resume)
    throw new MendiError(
      'aftercare-pending',
      '本请求未确认，保留现场；核对锁并显式 --resume finish。',
    );
  if (!pending && resume)
    throw new MendiError('aftercare-resume-missing', '没有本请求意图可恢复。');
  for (const slot of aftercareSlots(root, actor.runRef)) {
    if (slot === directory) continue;
    const previous = receipt(root, slot, actor.runRef).intent;
    if (
      request.operation === 'supplement' &&
      previous.request.operation === 'supplement' &&
      descriptors
        .filter((f) => f.name.startsWith('evidence-'))
        .some((f) =>
          previous.files
            .filter((p) => p.name.startsWith('evidence-'))
            .some((p) => p.sourceRef === f.sourceRef || (f.identity && p.identity === f.identity)),
        )
    )
      throw new MendiError('duplicate-evidence', '该原件已经补证；不能确认是不同真实证据。');
  }
  let lease: ProjectLock | undefined,
    changed = pending;
  try {
    lease = acquireProjectLock(root, `run-${request.operation}`);
    options.observe?.('lock-acquired', lease.lock);
    const current = aftercareTarget(root, actor, true);
    if (
      !equal(slotBasis, aftercareSlots(root, actor.runRef).sort()) ||
      pending !== present(managedPath(root, directory))
    )
      throw new MendiError('aftercare-input-changed', '附属槽位在持锁前已变化，须重新读取请求。');
    if (!equal(initial.basis, current.basis))
      throw new MendiError('aftercare-input-changed', '加锁期间当前 Run/入口/范围发生变化。');
    const checkSources = () => {
      for (const f of descriptors)
        if (f.sourceRef) {
          const actual = sourceFile(root, f.sourceRef);
          if (actual.digest !== f.digest || actual.identity !== f.identity)
            throw new MendiError('aftercare-input-changed', '必要来源身份或内容已变化。');
        }
      if (!equal(initial.basis, aftercareTarget(root, actor, true).basis))
        throw new MendiError('aftercare-input-changed', '直接基线变化。');
    };
    checkSources();
    let intent: AftercareIntent;
    const intentRef = `${directory}/intent.json`;
    if (pending) {
      intent = JSON.parse(fs.readFileSync(managedPath(root, intentRef), 'utf8')) as AftercareIntent;
      if (
        !matches(intent) ||
        !equal(intent.basis, initial.basis) ||
        intent.roundId !== current.workspace.currentRoundId ||
        !intent.lockOwner ||
        JSON.parse(intent.lockOwner).operation !== `run-${request.operation}`
      )
        throw new MendiError('aftercare-resume-conflict', '恢复意图、原锁来源或当前目标不一致。');
      const originalOwner = JSON.parse(intent.lockOwner) as { pid?: number; token?: string };
      let stopped = false;
      if (
        Number.isSafeInteger(originalOwner.pid) &&
        originalOwner.pid! > 0 &&
        typeof originalOwner.token === 'string' &&
        /^[a-f0-9-]{36}$/.test(originalOwner.token)
      ) {
        try {
          process.kill(originalOwner.pid!, 0);
        } catch (error) {
          stopped = errorInfo(error).code === 'ESRCH';
        }
      }
      if (!stopped)
        throw new MendiError('aftercare-writer-unknown', '不能确认原写者已经停止，不恢复或抢占。');
    } else {
      intent = {
        formatVersion: 1,
        authoritative: false,
        targetRef: actor.runRef,
        deliveryId: current.workspace.id,
        roundId: current.workspace.currentRoundId!,
        role: actor.role,
        actorId: actor.actor,
        recordedAt: new Date().toISOString(),
        request,
        basis: initial.basis,
        files: [{ name: 'baseline.md', digest: initial.basis.run }, ...descriptors],
        lockOwner: lease.owner,
      };
      fs.mkdirSync(managedPath(root, path.posix.dirname(directory)), { recursive: true });
      fs.mkdirSync(managedPath(root, directory));
      changed = true;
      fs.writeFileSync(managedPath(root, intentRef), json(intent), { flag: 'wx' });
      options.observe?.('intent-written', intentRef);
    }
    const files = [
      { name: 'baseline.md', bytes: fs.readFileSync(managedPath(root, actor.runRef)) },
      ...content.files,
    ];
    for (const f of files) {
      const file = managedPath(root, `${directory}/${f.name}`);
      if (present(file)) {
        if (!fs.readFileSync(file).equals(f.bytes))
          throw new MendiError('aftercare-resume-conflict', '已有原件与本请求不符；不覆盖。');
      } else fs.writeFileSync(file, f.bytes, { flag: 'wx' });
      if (!fs.readFileSync(file).equals(f.bytes))
        throw new MendiError('aftercare-readback-failed', '原件读回不一致。');
      options.observe?.('original-written', file);
      checkSources();
    }
    options.observe?.('before-confirm', confirmedRef);
    checkSources();
    const temporary = managedPath(root, `${confirmedRef}.${randomUUID()}.tmp`);
    const confirmed = json({
      formatVersion: 1,
      intentDigest: digest(fs.readFileSync(managedPath(root, intentRef))),
    });
    fs.writeFileSync(temporary, confirmed, { flag: 'wx' });
    fs.renameSync(temporary, managedPath(root, confirmedRef));
    options.observe?.('confirmed-written', confirmedRef);
    options.observe?.('before-readback', confirmedRef);
    const result = receipt(root, directory, actor.runRef);
    checkSources();
    options.observe?.('before-lock-release', lease.lock);
    releaseProjectLock(root, lease);
    lease = undefined;
    return { ...result, alreadyConfirmed: false };
  } catch (error) {
    if (lease && !changed) releaseProjectLock(root, lease);
    throw new MendiError(
      'aftercare-unconfirmed',
      '提交后操作未完整确认；核对实际现场和锁。',
      {
        outcome: 'unknown',
        directory,
        ...errorInfo(error),
        retainedLock: Boolean(lease && changed),
      },
      '保留现场；Owner 核对停止写者并处置锁后，仅同请求可显式 --resume finish。',
    );
  }
}
