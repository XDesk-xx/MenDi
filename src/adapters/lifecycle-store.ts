import fs from 'node:fs';
import path from 'node:path';
import { MendiError, object, text } from '../core/errors.ts';
import { parseProject, type Workspace } from '../core/records.ts';
import { deliveryLocation, parseDeliveryRun } from '../core/delivery-runs.ts';
import type { Lifecycle } from '../core/delivery-lifecycle.ts';
import { basisWorkspace, lifecycleTargets } from '../core/lifecycle-transition.ts';
import { managedPath, present } from './paths.ts';
import { readJson, lockedWrite, readWorkspace, type WriteObserver } from './workspace.ts';
import { renderRun, scanRunNumbers } from './runs.ts';
import { readDeliveryRun, type DeliveryDocument } from './delivery-runs.ts';
import { replaceManagedFile } from './action-store.ts';

export interface LifecycleBasis {
  project: string | null;
  manifest: string | null;
  input: { ref: string; content: string };
}
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const result = {
  'delivery-open': 'opened',
  'delivery-close': 'closed',
  'delivery-reopen': 'reopened',
};
export function pendingLifecycle(root: string) {
  const file = managedPath(root, '.mendi/project.json');
  if (!present(file)) return null;
  const index = parseProject(readJson(file));
  return index.project.pendingDeliveryRunRef === undefined
    ? null
    : {
        index,
        ref: text(index.project.pendingDeliveryRunRef, 'pending Run'),
      };
}
function readBasis(root: string, run: DeliveryDocument): LifecycleBasis {
  const base = path.posix.dirname(run.ref) + '/artifacts';
  const raw = object(readJson(managedPath(root, `${base}/input.json`)), '实际输入');
  const project = readJson(managedPath(root, `${base}/before-project.json`));
  const manifest = readJson(managedPath(root, `${base}/before-manifest.json`));
  if (
    !(project === null || typeof project === 'string') ||
    !(manifest === null || typeof manifest === 'string')
  )
    throw new MendiError('invalid-lifecycle-basis', '原输入必须保留实际字节文本或空基准。');
  return {
    project,
    manifest,
    input: { ref: text(raw.ref, '输入路径'), content: text(raw.content, '输入内容') },
  };
}
function checkFile(root: string, ref: string, expected: string | null, alternate?: string) {
  const file = managedPath(root, ref);
  const actual = present(file) ? fs.readFileSync(file, 'utf8') : null;
  if (actual !== expected && (alternate === undefined || actual !== alternate))
    throw new MendiError('lifecycle-input-changed', '文件不符合本次提交前后基准。', { ref });
  return actual;
}
function checkBasis(root: string, run: DeliveryDocument, basis: LifecycleBasis) {
  const targets = lifecycleTargets(run, basis);
  checkFile(root, basis.input.ref, basis.input.content);
  checkFile(root, '.mendi/project.json', json(targets.pending), json(targets.project));
  checkFile(
    root,
    targets.ref,
    run.record.lifecycle!.operation === 'delivery-open' ? null : basis.manifest,
    json(targets.manifest),
  );
  if (targets.before && run.record.lifecycle!.operation === 'delivery-open')
    checkFile(root, targets.before.manifestRef, basis.manifest);
  if (run.record.lifecycle!.operation === 'delivery-open') {
    const directory = managedPath(root, path.posix.dirname(targets.ref));
    if (present(directory) && fs.readdirSync(directory).some((name) => name !== 'manifest.json'))
      throw new MendiError(
        'lifecycle-target-occupied',
        '新 Open 目标包含本次 before / after 之外的占用。',
        { directory },
      );
  }
  return targets;
}
type Confirm = (before: Workspace | null, lifecycle: Lifecycle) => void;
function finish(
  root: string,
  run: DeliveryDocument,
  basis: LifecycleBasis,
  written: string[],
  observe: WriteObserver | undefined,
  confirm: Confirm,
) {
  const targets = checkBasis(root, run, basis);
  confirm(targets.before, run.record.lifecycle!);
  if (run.record.status === 'draft') {
    const header = {
      ...run.header,
      status: 'submitted',
      outcome: 'complete',
      result: result[run.record.lifecycle!.operation],
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
  checkBasis(root, run, basis);
  confirm(targets.before, run.record.lifecycle!);
  const content = json(targets.manifest);
  const file = managedPath(root, targets.ref);
  if (!present(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    observe?.('before-manifest-commit', file);
    fs.writeFileSync(file, content, { flag: 'wx' });
    written.push(file);
  } else if (fs.readFileSync(file, 'utf8') !== content)
    replaceManagedFile(root, targets.ref, content, written, 'before-manifest-commit', observe);
  observe?.('lifecycle-manifest-written', file);
  checkBasis(root, run, basis);
  confirm(targets.before, run.record.lifecycle!);
  if (fs.readFileSync(managedPath(root, '.mendi/project.json'), 'utf8') !== json(targets.project))
    replaceManagedFile(
      root,
      '.mendi/project.json',
      json(targets.project),
      written,
      'before-entry-commit',
      observe,
    );
  observe?.('index-written', managedPath(root, '.mendi/project.json'));
  observe?.('before-readback', file);
  const workspace = readWorkspace(root, true)!;
  if (
    workspace.id !== run.record.deliveryId ||
    fs.readFileSync(file, 'utf8') !== content ||
    fs.readFileSync(managedPath(root, '.mendi/project.json'), 'utf8') !== json(targets.project) ||
    !fs.readFileSync(managedPath(root, run.ref)).equals(terminal)
  )
    throw new MendiError('lifecycle-readback-failed', '生命周期读回未确认。');
  return { workspace, run };
}
export function commitLifecycle(
  root: string,
  id: string,
  lifecycle: Lifecycle,
  actor: string,
  basis: LifecycleBasis,
  confirm: Confirm,
  observe?: WriteObserver,
) {
  if (basis.project === null) {
    confirm(basisWorkspace(basis), lifecycle);
    fs.mkdirSync(managedPath(root, '.mendi'));
  }
  return lockedWrite(
    root,
    lifecycle.operation,
    (written) => {
      checkFile(root, '.mendi/project.json', basis.project);
      if (basis.project !== null)
        checkFile(root, parseProject(JSON.parse(basis.project)).manifestRef, basis.manifest);
      checkFile(root, basis.input.ref, basis.input.content);
      const before = basisWorkspace(basis);
      confirm(before, lifecycle);
      if (lifecycle.operation === 'delivery-open')
        for (const ref of [`.mendi/delivery-groups/${id}`, `.mendi/runs/${id}`])
          if (present(managedPath(root, ref)))
            throw new MendiError('existing-mendi-state', '持锁后新 Delivery 目标已被占用。', {
              ref,
            });
      const allocation = scanRunNumbers(root, id);
      const number = String(allocation.number).padStart(3, '0');
      const ref = `.mendi/runs/${id}/${number}-${lifecycle.operation}/run.md`;
      const header: Record<string, unknown> = {
        formatVersion: 1,
        recordingMode: 'product',
        scope: 'delivery',
        deliveryId: id,
        changeId: null,
        runNumber: allocation.number,
        actionId: `${id}-${number}-${lifecycle.operation}`,
        actionType: lifecycle.operation,
        role: 'author',
        actorId: actor,
        status: 'draft',
        stageSkill: lifecycle.operation,
        toolGuidance: [],
        lifecycle,
        ...(before ? {} : { projectName: path.basename(root) }),
      };
      const run: DeliveryDocument = {
        ref,
        header,
        body: '',
        record: parseDeliveryRun(header, ref, id),
      };
      const targets = lifecycleTargets(run, basis);
      const directory = path.dirname(managedPath(root, ref));
      fs.mkdirSync(path.dirname(directory), { recursive: true });
      fs.mkdirSync(directory);
      written.push(directory);
      fs.writeFileSync(managedPath(root, ref), renderRun(header, ''), { flag: 'wx' });
      written.push(managedPath(root, ref));
      const artifacts = path.join(directory, 'artifacts');
      fs.mkdirSync(artifacts);
      written.push(artifacts);
      for (const [name, value] of Object.entries({
        'before-project': basis.project,
        'before-manifest': basis.manifest,
        input: basis.input,
      }))
        fs.writeFileSync(path.join(artifacts, `${name}.json`), json(value), { flag: 'wx' });
      observe?.('intent-written', managedPath(root, ref));
      checkFile(root, '.mendi/project.json', basis.project);
      if (before) checkFile(root, before.manifestRef, basis.manifest);
      confirm(before, lifecycle);
      replaceManagedFile(
        root,
        '.mendi/project.json',
        json(targets.pending),
        written,
        'before-entry-commit',
        observe,
      );
      observe?.('pending-written', managedPath(root, '.mendi/project.json'));
      return finish(root, run, basis, written, observe, confirm);
    },
    observe,
    true,
  );
}
export function resumeLifecycle(
  root: string,
  ref: string,
  type: string,
  actor: string,
  confirm: Confirm,
  observe?: WriteObserver,
) {
  const id = ref.split('/')[2];
  if (deliveryLocation(ref, id).type !== type)
    throw new MendiError('invalid-run', 'resume 操作与 Run 不符。');
  const check = () => {
    const index = parseProject(readJson(managedPath(root, '.mendi/project.json')));
    const run = readDeliveryRun(root, ref, id);
    if (!run.record.lifecycle || run.record.actorId !== actor)
      throw new MendiError('action-role-mismatch', 'resume 需要原 Author / actor。');
    const basis = readBasis(root, run);
    const targets = checkBasis(root, run, basis);
    if (index.project.pendingDeliveryRunRef === undefined) {
      if (
        run.record.status !== 'submitted' ||
        JSON.stringify(index.project) !== JSON.stringify(targets.project) ||
        fs.readFileSync(managedPath(root, targets.ref), 'utf8') !== json(targets.manifest)
      )
        throw new MendiError('run-not-current', '该生命周期不是当前待继续或已完成对象。');
      return { run, basis, completed: true };
    }
    if (index.project.pendingDeliveryRunRef !== ref)
      throw new MendiError('run-not-current', 'resume 必须指定当前 pending。');
    return { run, basis, completed: false };
  };
  if (present(managedPath(root, '.mendi/write.lock')))
    throw new MendiError('write-conflict', '仍有项目锁，先核对并由 Owner 处置。');
  const before = check();
  return lockedWrite(
    root,
    type + '-resume',
    (written) => {
      const current = check();
      if (
        JSON.stringify(current.run.header) !== JSON.stringify(before.run.header) ||
        current.run.body !== before.run.body
      )
        throw new MendiError('lifecycle-input-changed', '持锁后 Run 变化。');
      if (current.completed)
        return { workspace: readWorkspace(root, true)!, run: current.run, alreadyCompleted: true };
      return {
        ...finish(root, current.run, current.basis, written, observe, confirm),
        alreadyCompleted: false,
      };
    },
    observe,
    true,
  );
}
export function saveLifecycleNote(
  root: string,
  ref: string,
  actor: string,
  body: string,
  observe?: WriteObserver,
) {
  return lockedWrite(
    root,
    'lifecycle-note',
    (written) => {
      const pending = pendingLifecycle(root);
      if (!pending || pending.ref !== ref)
        throw new MendiError('run-not-current', '只能保存当前 pending draft 说明。');
      const run = readDeliveryRun(root, ref, ref.split('/')[2]);
      if (run.record.actorId !== actor || run.record.status !== 'draft' || !run.record.lifecycle)
        throw new MendiError('action-role-mismatch', '需要原 Author 的生命周期 draft。');
      checkBasis(root, run, readBasis(root, run));
      replaceManagedFile(
        root,
        ref,
        renderRun(run.header, body),
        written,
        'before-run-commit',
        observe,
      );
      const saved = readDeliveryRun(root, ref, run.record.deliveryId);
      if (saved.body !== body)
        throw new MendiError('lifecycle-readback-failed', '说明读回不一致。');
      return {
        ok: true,
        operation: 'run-save',
        projectRoot: root,
        run: { ref, ...saved.record },
        local: null,
        openspec: null,
        executionMode: 'local-only',
        upstreamAccess: 'not-required',
      };
    },
    observe,
    true,
  );
}
