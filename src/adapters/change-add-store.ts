import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { isDeepStrictEqual as equal } from 'node:util';
import { MendiError, object, text } from '../core/errors.ts';
import { parseProject, parseWorkspace, type Workspace } from '../core/records.ts';
import { projectRound } from '../core/rounds.ts';
import { parseDeliveryRun } from '../core/delivery-runs.ts';
import { requireAdditionEvidence, type ChangeAddReceipt } from '../core/scope-addition.ts';
import { managedPath, present } from './paths.ts';
import { lockedWrite, readJson, readWorkspace, type WriteObserver } from './workspace.ts';
import { renderRun, scanRunNumbers } from './runs.ts';
import { readDeliveryRun, type DeliveryDocument } from './delivery-runs.ts';
import { replaceManagedFile } from './action-store.ts';
import { confirmBytes } from './group-store.ts';

const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
interface Basis {
  project: string;
  manifest: string;
  direct: [string, string][];
  /** Immutable previous scope-addition evidence is referenced, never embedded recursively. */
  directDigests?: [string, string][];
}
type Confirm = (before: Workspace, receipt: ChangeAddReceipt) => void;
function beforeWorkspace(basis: Basis) {
  return parseWorkspace(parseProject(JSON.parse(basis.project)), JSON.parse(basis.manifest));
}
function targets(run: DeliveryDocument, basis: Basis) {
  const before = beforeWorkspace(basis),
    receipt = run.record.changeAdd!;
  const rounds = before.rounds!.map((r) =>
    r.id !== before.currentRoundId
      ? r
      : {
          ...r,
          scope: receipt.afterScope,
          deliveryRunRef: undefined,
          scopeAddRunRef: run.ref,
          scopeAdditions: [
            ...(r.scopeAdditions ?? []),
            {
              requestId: receipt.requestId,
              runRef: run.ref,
              beforeScope: receipt.beforeScope,
              addedSlots: receipt.addedSlots,
              afterScope: receipt.afterScope,
            },
          ],
        },
  );
  const manifest = projectRound(before.manifest, rounds, before.currentRoundId!);
  const pending = { ...before.project, pendingDeliveryRunRef: run.ref };
  parseWorkspace(parseProject(before.project), manifest);
  return { before, manifest, pending };
}
function check(root: string, ref: string, choices: string[]) {
  const actual = fs.readFileSync(managedPath(root, ref), 'utf8');
  if (!choices.includes(actual))
    throw new MendiError('delivery-input-changed', '追加提交的直接对象不符合本次前后基准。', {
      ref,
    });
  return actual;
}
function confirmBasis(root: string, run: DeliveryDocument, basis: Basis, confirm: Confirm) {
  const t = targets(run, basis);
  requireAdditionEvidence(
    t.before,
    basis.direct.map(([ref]) => ref),
    (basis.directDigests ?? []).map(([ref]) => ref),
  );
  check(root, '.mendi/project.json', [basis.project, json(t.pending)]);
  check(root, t.before.manifestRef, [basis.manifest, json(t.manifest)]);
  const receipt = run.record.changeAdd!;
  check(root, receipt.inputRef, [receipt.inputContent]);
  confirmBytes(
    root,
    new Map(basis.direct.map(([ref, data]) => [ref, Buffer.from(data, 'base64')])),
  );
  for (const [ref, digest] of basis.directDigests ?? []) {
    const actual = createHash('sha256')
      .update(fs.readFileSync(managedPath(root, ref)))
      .digest('hex');
    if (actual !== digest)
      throw new MendiError('delivery-input-changed', '旧追加依据在提交或恢复期间变化。', { ref });
  }
  confirm(t.before, receipt);
  return t;
}
function finish(
  root: string,
  run: DeliveryDocument,
  basis: Basis,
  written: string[],
  confirm: Confirm,
  observe?: WriteObserver,
) {
  const t = confirmBasis(root, run, basis, confirm);
  if (run.record.status === 'draft') {
    const header = {
      ...run.header,
      status: 'submitted',
      outcome: 'complete',
      result: 'scope-added',
    };
    parseDeliveryRun(header, run.ref, run.record.deliveryId);
    replaceManagedFile(
      root,
      run.ref,
      renderRun(header, run.body),
      written,
      'before-run-commit',
      observe,
    );
    run = readDeliveryRun(root, run.ref, run.record.deliveryId);
    observe?.('terminal-written', managedPath(root, run.ref));
  }
  const terminal = fs.readFileSync(managedPath(root, run.ref));
  confirmBasis(root, run, basis, confirm);
  if (check(root, t.before.manifestRef, [basis.manifest, json(t.manifest)]) !== json(t.manifest))
    replaceManagedFile(
      root,
      t.before.manifestRef,
      json(t.manifest),
      written,
      'before-manifest-commit',
      observe,
    );
  observe?.('lifecycle-manifest-written', managedPath(root, t.before.manifestRef));
  confirmBasis(root, run, basis, confirm);
  if (check(root, '.mendi/project.json', [basis.project, json(t.pending)]) !== basis.project)
    replaceManagedFile(
      root,
      '.mendi/project.json',
      basis.project,
      written,
      'before-entry-commit',
      observe,
    );
  observe?.('index-written', managedPath(root, '.mendi/project.json'));
  observe?.('before-readback', managedPath(root, run.ref));
  const workspace = readWorkspace(root, true)!;
  check(root, t.before.manifestRef, [json(t.manifest)]);
  check(root, '.mendi/project.json', [basis.project]);
  if (!fs.readFileSync(managedPath(root, run.ref)).equals(terminal))
    throw new MendiError('delivery-input-changed', '追加收据在读回时变化。');
  confirmBasis(root, run, basis, confirm);
  return { workspace, run };
}
export function commitChangeAdd(
  root: string,
  workspace: Workspace,
  receipt: ChangeAddReceipt,
  actor: string,
  direct: Map<string, Buffer>,
  confirm: Confirm,
  observe?: WriteObserver,
) {
  const previous = new Set(
    workspace.rounds?.flatMap((round) =>
      (round.scopeAdditions ?? []).flatMap((addition) => [
        addition.runRef,
        addition.runRef.replace('run.md', 'artifacts/intent.json'),
      ]),
    ) ?? [],
  );
  const included = [...direct].filter(
    ([ref]) => ref !== '.mendi/project.json' && ref !== workspace.manifestRef,
  );
  const basis: Basis = {
    project: fs.readFileSync(managedPath(root, '.mendi/project.json'), 'utf8'),
    manifest: fs.readFileSync(managedPath(root, workspace.manifestRef), 'utf8'),
    direct: included
      .filter(([ref]) => !previous.has(ref))
      .map(([ref, data]) => [ref, data.toString('base64')]),
    ...(previous.size
      ? {
          directDigests: included
            .filter(([ref]) => previous.has(ref))
            .map(
              ([ref, data]) =>
                [ref, createHash('sha256').update(data).digest('hex')] as [string, string],
            ),
        }
      : {}),
  };
  if (!equal(beforeWorkspace(basis), workspace))
    throw new MendiError('delivery-input-changed', '写前工作区已变化。');
  return lockedWrite(
    root,
    'delivery-change-add',
    (written) => {
      check(root, '.mendi/project.json', [basis.project]);
      check(root, workspace.manifestRef, [basis.manifest]);
      confirmBytes(root, direct);
      confirm(workspace, receipt);
      const allocation = scanRunNumbers(root, workspace.id),
        number = String(allocation.number).padStart(3, '0');
      const ref = `.mendi/runs/${workspace.id}/${number}-delivery-change-add/run.md`;
      const header = {
        formatVersion: 1,
        recordingMode: 'product',
        scope: 'delivery',
        deliveryId: workspace.id,
        changeId: null,
        runNumber: allocation.number,
        actionId: `${workspace.id}-${number}-delivery-change-add`,
        actionType: 'delivery-change-add',
        role: 'author',
        actorId: actor,
        status: 'draft',
        stageSkill: 'delivery-change-add',
        toolGuidance: [],
        changeAdd: receipt,
      };
      const run: DeliveryDocument = {
        ref,
        header,
        body: '',
        record: parseDeliveryRun(header, ref, workspace.id),
      };
      const directory = path.dirname(managedPath(root, ref));
      fs.mkdirSync(path.dirname(directory), { recursive: true });
      fs.mkdirSync(directory);
      written.push(directory);
      fs.writeFileSync(managedPath(root, ref), renderRun(header, ''), { flag: 'wx' });
      fs.mkdirSync(path.join(directory, 'artifacts'));
      fs.writeFileSync(path.join(directory, 'artifacts/intent.json'), json(basis), { flag: 'wx' });
      observe?.('intent-written', managedPath(root, ref));
      confirmBasis(root, run, basis, confirm);
      replaceManagedFile(
        root,
        '.mendi/project.json',
        json(targets(run, basis).pending),
        written,
        'before-entry-commit',
        observe,
      );
      observe?.('pending-written', managedPath(root, '.mendi/project.json'));
      return finish(root, run, basis, written, confirm, observe);
    },
    observe,
    true,
  );
}
export function resumeChangeAdd(
  root: string,
  ref: string,
  actor: string,
  confirm: Confirm,
  observe?: WriteObserver,
) {
  if (present(managedPath(root, '.mendi/write.lock')))
    throw new MendiError('write-conflict', '仍有写入锁，须 Owner 先核对停止写者并处置。');
  const load = () => {
    const index = parseProject(readJson(managedPath(root, '.mendi/project.json')));
    const run = readDeliveryRun(root, ref, index.id);
    if (!run.record.changeAdd || run.record.actorId !== actor)
      throw new MendiError('action-role-mismatch', '恢复需要同次收据与原 Author actor。');
    const raw = object(
      readJson(managedPath(root, ref.replace('run.md', 'artifacts/intent.json'))),
      '追加意图',
    );
    if (
      !Array.isArray(raw.direct) ||
      raw.direct.some(
        (v) => !Array.isArray(v) || v.length !== 2 || v.some((x) => typeof x !== 'string'),
      )
    )
      throw new MendiError('invalid-scope-addition', '恢复缺少实际直接输入。');
    if (
      raw.directDigests !== undefined &&
      (!Array.isArray(raw.directDigests) ||
        raw.directDigests.some(
          (v) =>
            !Array.isArray(v) ||
            v.length !== 2 ||
            typeof v[0] !== 'string' ||
            typeof v[1] !== 'string' ||
            !/^[0-9a-f]{64}$/.test(v[1]),
        ))
    )
      throw new MendiError('invalid-scope-addition', '恢复的旧追加摘要格式不合法。');
    const basis: Basis = {
      project: text(raw.project, '原项目'),
      manifest: text(raw.manifest, '原范围'),
      direct: raw.direct as [string, string][],
      ...(raw.directDigests !== undefined
        ? { directDigests: raw.directDigests as [string, string][] }
        : {}),
    };
    const t = confirmBasis(root, run, basis, confirm);
    if (
      index.id !== t.before.id ||
      ![undefined, ref].includes(index.project.pendingDeliveryRunRef as string | undefined)
    )
      throw new MendiError('run-not-current', '当前入口属于另一提交。');
    const alreadyCompleted =
      run.record.status === 'submitted' &&
      index.project.pendingDeliveryRunRef === undefined &&
      fs.readFileSync(managedPath(root, t.before.manifestRef), 'utf8') === json(t.manifest);
    return { run, basis, alreadyCompleted };
  };
  const initial = load();
  return lockedWrite(
    root,
    'delivery-change-add-resume',
    (written) => {
      const current = load();
      if (!equal(initial, current))
        throw new MendiError('delivery-input-changed', '恢复对象在持锁前变化。');
      return {
        ...finish(root, current.run, current.basis, written, confirm, observe),
        alreadyCompleted: current.alreadyCompleted,
      };
    },
    observe,
    true,
  );
}
