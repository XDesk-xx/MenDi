import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { MendiError, object, text } from '../core/errors.ts';
import { migrationIntent } from '../core/migration-intent.ts';
import { parseDeliveryRun } from '../core/delivery-runs.ts';
import { managedPath, present } from './paths.ts';
import { lockedWrite, readWorkspace, type WriteObserver } from './workspace.ts';
import { renderRun, scanRunNumbers, isProductRunReservation } from './runs.ts';
import { readDeliveryRun, type DeliveryDocument } from './delivery-runs.ts';
import { replaceManagedFile } from './action-store.ts';
import { migrationPreview, type MigrationPlan } from './migration-preview.ts';

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
interface Request {
  ref: string;
  content: string;
}
function checkInputs(root: string, plan: MigrationPlan, request: Request, allowTargets = false) {
  if (fs.readFileSync(managedPath(root, request.ref), 'utf8') !== request.content)
    throw new MendiError('migration-input-changed', '原预览输入已变化。');
  const pending = json({ ...plan.project, pendingDeliveryRunRef: plan.migrationRunRef });
  const manifestRef = `.mendi/delivery-groups/${plan.deliveryId}/manifest.json`;
  const testsRef = `.mendi/delivery-groups/${plan.deliveryId}/tests`;
  const tests = managedPath(root, testsRef);
  const executionEntries = present(tests)
    ? fs
        .readdirSync(tests)
        .filter((name) => /^\d{3,}-(focused|fast|full)$/.test(name))
        .sort()
    : [];
  if (!isDeepStrictEqual(executionEntries, plan.executionEntries))
    throw new MendiError('migration-input-changed', '执行现场列表已变化。');
  for (const { ref, content } of plan.inputs) {
    const file = managedPath(root, ref);
    const actual = present(file) ? fs.readFileSync(file, 'utf8') : null;
    const targets =
      ref === '.mendi/project.json'
        ? [pending, json(plan.project)]
        : ref === manifestRef
          ? [json(plan.manifest)]
          : [];
    if (actual !== content && !(allowTargets && actual !== null && targets.includes(actual)))
      throw new MendiError('migration-input-changed', '文件不符合本次迁移前后直接基准。', { ref });
  }
  return { pending, manifestRef };
}
function savedIntent(root: string, run: DeliveryDocument) {
  const value = object(
    JSON.parse(fs.readFileSync(managedPath(root, run.record.migration!.planRef), 'utf8')),
    '保存 intent',
  );
  const plan = migrationIntent(value.plan, root),
    request = object(value.request, '原预览输入');
  if (plan.migrationRunRef !== run.ref)
    throw new MendiError('invalid-migration-intent', 'intent 与 receipt 不符。');
  return {
    plan,
    request: { ref: text(request.ref, '输入 ref'), content: text(request.content, '输入 content') },
  };
}
function finish(
  root: string,
  run: DeliveryDocument,
  plan: MigrationPlan,
  request: Request,
  written: string[],
  observe?: WriteObserver,
) {
  const { pending, manifestRef } = checkInputs(root, plan, request, true);
  const entryRef = '.mendi/project.json';
  const entry = fs.readFileSync(managedPath(root, entryRef), 'utf8');
  const before = plan.inputs.find((i) => i.ref === entryRef)!.content;
  if (entry === before) {
    replaceManagedFile(root, entryRef, pending, written, 'before-entry-commit', observe);
    observe?.('pending-written', managedPath(root, entryRef));
  } else if (entry !== pending && entry !== json(plan.project))
    throw new MendiError('migration-input-changed', '项目入口不是本次 pending 或最终目标。');
  checkInputs(root, plan, request, true);
  if (run.record.status === 'draft') {
    const header = { ...run.header, status: 'submitted', outcome: 'complete', result: 'migrated' };
    parseDeliveryRun(header, run.ref, plan.deliveryId);
    replaceManagedFile(
      root,
      run.ref,
      renderRun(header, run.body),
      written,
      'before-run-commit',
      observe,
    );
    run = readDeliveryRun(root, run.ref, plan.deliveryId);
    observe?.('terminal-written', managedPath(root, run.ref));
  }
  const terminal = fs.readFileSync(managedPath(root, run.ref));
  checkInputs(root, plan, request, true);
  if (fs.readFileSync(managedPath(root, manifestRef), 'utf8') !== json(plan.manifest))
    replaceManagedFile(
      root,
      manifestRef,
      json(plan.manifest),
      written,
      'before-manifest-commit',
      observe,
    );
  observe?.('lifecycle-manifest-written', managedPath(root, manifestRef));
  checkInputs(root, plan, request, true);
  if (fs.readFileSync(managedPath(root, entryRef), 'utf8') !== json(plan.project))
    replaceManagedFile(root, entryRef, json(plan.project), written, 'before-entry-commit', observe);
  observe?.('index-written', managedPath(root, entryRef));
  observe?.('before-readback', managedPath(root, manifestRef));
  checkInputs(root, plan, request, true);
  const workspace = readWorkspace(root, true)!;
  if (
    !isDeepStrictEqual(workspace.manifest, plan.manifest) ||
    !isDeepStrictEqual(workspace.project, plan.project) ||
    !fs.readFileSync(managedPath(root, run.ref)).equals(terminal)
  )
    throw new MendiError('migration-readback-failed', '转换结果或原交接读回不一致。');
  return { workspace, run };
}

export function applyMigration(
  root: string,
  inputRef: string,
  actor: string,
  observe?: WriteObserver,
) {
  const request = { ref: inputRef, content: fs.readFileSync(managedPath(root, inputRef), 'utf8') };
  const raw = object(JSON.parse(request.content), '预览 JSON');
  const requested = migrationIntent(
    raw.kind === 'delivery-migration-preview' ? raw : raw.plan,
    root,
  );
  const before = migrationPreview(root);
  if (!isDeepStrictEqual(requested, before))
    throw new MendiError('migration-preview-stale', '预览被修改或已陈旧，未写入。');
  return lockedWrite(
    root,
    'delivery-migrate',
    (written) => {
      const plan = migrationPreview(root, true);
      if (!isDeepStrictEqual(plan, before))
        throw new MendiError('migration-preview-stale', '持锁后预览或编号变化。');
      checkInputs(root, plan, request);
      const ref = plan.migrationRunRef,
        planRef = ref.replace('run.md', 'artifacts/intent.json');
      const header = {
        formatVersion: 1,
        recordingMode: 'product',
        scope: 'delivery',
        deliveryId: plan.deliveryId,
        changeId: null,
        runNumber: plan.expectedNumber,
        actionId: `${plan.deliveryId}-${String(plan.expectedNumber).padStart(3, '0')}-delivery-migrate`,
        actionType: 'delivery-migrate',
        role: 'author',
        actorId: actor,
        status: 'draft',
        stageSkill: 'delivery-migrate',
        toolGuidance: [],
        migration: {
          sourceVersion: 1,
          targetVersion: 2,
          manifestRef: `.mendi/delivery-groups/${plan.deliveryId}/manifest.json`,
          planRef,
        },
      };
      const record = parseDeliveryRun(header, ref, plan.deliveryId);
      const directory = path.dirname(managedPath(root, ref));
      fs.mkdirSync(path.dirname(directory), { recursive: true });
      fs.mkdirSync(directory);
      written.push(directory);
      fs.writeFileSync(managedPath(root, ref), renderRun(header, ''), { flag: 'wx' });
      written.push(managedPath(root, ref));
      fs.mkdirSync(path.dirname(managedPath(root, planRef)));
      fs.writeFileSync(managedPath(root, planRef), json({ plan, request }), { flag: 'wx' });
      written.push(managedPath(root, planRef));
      observe?.('intent-written', managedPath(root, ref));
      return finish(root, { ref, header, record, body: '' }, plan, request, written, observe);
    },
    observe,
    true,
  );
}

export function resumeMigration(root: string, ref: string, actor: string, observe?: WriteObserver) {
  if (present(managedPath(root, '.mendi/write.lock')))
    throw new MendiError('write-conflict', '仍有项目锁，须先核对原写者及 Owner 锁处置。');
  const check = () => {
    const run = readDeliveryRun(root, ref, ref.split('/')[2]);
    if (!run.record.migration || run.record.actorId !== actor)
      throw new MendiError('action-role-mismatch', '仅原迁移 Author / actor 可显式继续。');
    const { plan, request } = savedIntent(root, run);
    checkInputs(root, plan, request, true);
    if (
      scanRunNumbers(root, plan.deliveryId).reservations.some(
        (r) => r.number > plan.expectedNumber && isProductRunReservation(r.ref),
      )
    )
      throw new MendiError('run-not-current', '迁移后已有其他 Run，旧恢复已陈旧。');
    const complete =
      run.record.status === 'submitted' &&
      fs.readFileSync(managedPath(root, '.mendi/project.json'), 'utf8') === json(plan.project) &&
      fs.readFileSync(managedPath(root, run.record.migration.manifestRef), 'utf8') ===
        json(plan.manifest);
    return { run, plan, request, complete };
  };
  const before = check();
  if (before.complete)
    return { workspace: readWorkspace(root)!, run: before.run, alreadyCompleted: true };
  return lockedWrite(
    root,
    'delivery-migrate-resume',
    (written) => {
      const current = check();
      if (!isDeepStrictEqual(before, current))
        throw new MendiError('migration-input-changed', '持锁后迁移 intent 变化。');
      return {
        ...finish(root, current.run, current.plan, current.request, written, observe),
        alreadyCompleted: false,
      };
    },
    observe,
    true,
  );
}
