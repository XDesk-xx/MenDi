import fs from 'node:fs';
import { MendiError, object } from '../core/errors.ts';
import { parseProject } from '../core/records.ts';
import { convertLegacy, type LegacyBoundary } from '../core/legacy-conversion.ts';
import type { DeliveryRunRecord } from '../core/delivery-runs.ts';
import { archivedCount } from '../core/archive.ts';
import { parseExecution } from '../core/test-execution.ts';
import { managedPath, present } from './paths.ts';
import { readWorkspace } from './workspace.ts';
import { readDeliveryRun, currentDeliveryRun } from './delivery-runs.ts';
import { currentRun, readRun, scanRunNumbers, isProductRunReservation } from './runs.ts';
import {
  captureArchiveInputs,
  loadArchiveInputs,
  observeArchiveEffects,
} from './archive-effects.ts';

import type { MigrationPlan } from '../core/migration-plan.ts';
export type { MigrationPlan } from '../core/migration-plan.ts';

const restore = (message: string): never => {
  throw new MendiError(
    'legacy-recovery-required',
    message,
    {},
    '必须在另行授权下使用兼容旧版恢复完成，再由新版重新预览迁移；不会清锁或恢复旧操作。',
  );
};

export function migrationPreview(root: string, ownLock = false): MigrationPlan {
  const entry = parseProject(
    JSON.parse(fs.readFileSync(managedPath(root, '.mendi/project.json'), 'utf8')),
  );
  if (entry.project.pendingDeliveryRunRef !== undefined)
    restore('旧 pending 必须先由兼容旧版恢复。');
  const workspace = readWorkspace(root, ownLock);
  if (!workspace || workspace.mode !== 'product' || workspace.manifest.formatVersion !== 1)
    throw new MendiError(
      'migration-not-legacy',
      '迁移预览只接受当前选定旧 product，不迁移人工记录。',
    );
  const inputs = new Map<string, string | null>();
  const capture = (ref: string, expected?: string) => {
    const content = fs.readFileSync(managedPath(root, ref), 'utf8');
    if (
      (inputs.has(ref) && inputs.get(ref) !== content) ||
      (expected !== undefined && expected !== content)
    )
      throw new MendiError('migration-input-changed', '直接输入读取期间变化。', { ref });
    inputs.set(ref, content);
    return content;
  };
  if (
    JSON.stringify(JSON.parse(capture('.mendi/project.json'))) !==
      JSON.stringify(workspace.project) ||
    JSON.stringify(JSON.parse(capture(workspace.manifestRef))) !==
      JSON.stringify(workspace.manifest)
  )
    throw new MendiError('migration-input-changed', '项目入口或选定 manifest 读取期间变化。');
  const boundaries: LegacyBoundary[] = [];
  const records = new Map<string, DeliveryRunRecord>();
  const consume = (ref: string) => {
    capture(ref);
    const run = readDeliveryRun(root, ref, workspace.id);
    capture(ref);
    records.set(ref, run.record);
    if (run.record.lifecycle && run.record.status !== 'submitted') restore('旧生命周期尚未提交。');
    if (
      run.record.fullTest &&
      (run.record.status !== 'submitted' ||
        run.record.fullTest.phase !== 'finished' ||
        run.record.fullTest.outcome === 'unknown')
    )
      restore('旧正式执行尚未确认。');
    return run;
  };
  const base = `.mendi/runs/${workspace.id}`;
  const directory = managedPath(root, base);
  if (present(directory))
    for (const name of fs.readdirSync(directory).sort()) {
      if (!/^\d{3,}-delivery-(open|reopen)$/.test(name)) continue;
      const ref = `${base}/${name}/run.md`;
      if (!present(managedPath(root, ref))) restore('旧 Open / Reopen 占号缺少完整 intent。');
      const run = consume(ref);
      let before: Record<string, unknown> | undefined, beforeRef: string | undefined;
      if (run.record.actionType === 'delivery-reopen') {
        beforeRef = `${base}/${name}/artifacts/before-manifest.json`;
        const stored: unknown = JSON.parse(capture(beforeRef));
        before = object(typeof stored === 'string' ? JSON.parse(stored) : stored, '真实旧前态');
      }
      boundaries.push({ ref, record: run.record, before, beforeRef });
    }
  const snapshots = [
    ...boundaries.filter((b) => b.before).map((b) => b.before!),
    workspace.manifest,
  ];
  for (const snapshot of snapshots)
    for (const key of ['deliveryRunRef', 'fullTestRunRef', 'closeRunRef']) {
      if (snapshot[key] !== undefined) consume(String(snapshot[key]));
    }
  const currentChangeRef = workspace.bindings.find(
    (b) => b.changeId === workspace.activeChangeId,
  )?.latestRunRef;
  if (currentChangeRef) capture(currentChangeRef);
  const active = currentDeliveryRun(root, workspace);
  if (active?.record.repair && active.record.authorRunRef) consume(active.record.authorRunRef);
  const change = active ? null : currentRun(root, workspace);
  if (change) {
    capture(change.ref);
    if (change.record.authorRunRef) {
      const author = readRun(
        root,
        change.record.authorRunRef,
        workspace.id,
        change.record.changeId,
      );
      if (
        author.record.role !== 'author' ||
        author.record.status !== 'submitted' ||
        author.record.outcome !== 'complete' ||
        author.record.actorId === change.record.actorId
      )
        throw new MendiError('migration-source-conflict', '活动 Reviewer 的固定 Author 不完整。');
      capture(author.ref);
    }
    const archive = change.record.archive;
    if (archive && workspace.activeChangeId) {
      if (
        !['prepared', 'none'].includes(archive.phase) ||
        change.record.status !== 'draft' ||
        archivedCount(workspace.project) !== archive.countBasis
      )
        restore('旧归档存在未确认效果或部分提交。');
      const author = readRun(root, archive.authorRunRef, workspace.id, change.record.changeId);
      const review = readRun(root, archive.reviewRunRef, workspace.id, change.record.changeId);
      if (
        review.record.actionType !== 'review-apply' ||
        review.record.status !== 'submitted' ||
        review.record.outcome !== 'complete' ||
        review.record.verdict !== 'approved' ||
        review.record.authorRunRef !== author.ref ||
        !review.body.trim() ||
        !['apply', 'revise-apply'].includes(author.record.actionType) ||
        author.record.status !== 'submitted' ||
        author.record.outcome !== 'complete' ||
        !author.body.trim() ||
        author.record.actorId === review.record.actorId ||
        author.record.runNumber >= review.record.runNumber
      )
        throw new MendiError('migration-source-conflict', '当前 Archive 的必要直接批准不完整。');
      const source =
        archive.phase === 'prepared'
          ? captureArchiveInputs(root, workspace, change, { author, review })
          : loadArchiveInputs(root, workspace, change);
      if (observeArchiveEffects(root, archive, source).phase !== 'none')
        restore('旧归档现场不能确认无原生效果。');
      capture(author.ref, source.author.content);
      capture(review.ref, source.review.content);
      for (const [name, content] of Object.entries(source.source))
        capture(`openspec/changes/${change.record.changeId}/${name}`, content);
      for (const [ref, content] of Object.entries(source.main)) {
        if (content !== null) capture(ref, content);
        else {
          if (present(managedPath(root, ref)))
            throw new MendiError('migration-input-changed', '归档直接输入的缺省状态变化。');
          inputs.set(ref, null);
        }
      }
      if (archive.attemptRef) capture(`${archive.attemptRef}/inputs.json`);
    }
  }
  // Ordinary executions do not have a manifest pointer. Inspect result headers, never historical logs.
  const tests = `.mendi/delivery-groups/${workspace.id}/tests`;
  const executionEntries = present(managedPath(root, tests))
    ? fs
        .readdirSync(managedPath(root, tests))
        .filter((name) => /^\d{3,}-(focused|fast|full)$/.test(name))
        .sort()
    : [];
  if (present(managedPath(root, tests)))
    for (const name of fs.readdirSync(managedPath(root, tests))) {
      if (!/^\d{3,}-(focused|fast|full)$/.test(name)) continue;
      const ref = `${tests}/${name}/result.json`;
      if (!present(managedPath(root, ref))) restore('旧测试占号缺少结果，须先恢复。');
      const record = parseExecution(JSON.parse(capture(ref)), root, workspace.id, name);
      if (record.executionState !== 'finished' || record.outcome === 'unknown')
        restore('旧测试执行尚未确认。');
    }
  const allocation = scanRunNumbers(root, workspace.id);
  const registered = new Set([
    ...workspace.bindings.flatMap((b) => (b.latestRunRef ? [b.latestRunRef] : [])),
    ...['openRunRef', 'deliveryRunRef', 'fullTestRunRef', 'closeRunRef'].flatMap((key) =>
      typeof workspace.manifest[key] === 'string' ? [String(workspace.manifest[key])] : [],
    ),
    ...records.keys(),
    ...boundaries.map((b) => b.ref),
  ]);
  // Old holes and unknown explanatory directories remain reservations, not current work.
  const latest = allocation.reservations.filter((r) => isProductRunReservation(r.ref)).at(-1);
  if (latest && !registered.has(latest.ref)) {
    if (latest.ref.endsWith('-delivery-migrate/run.md')) {
      if (!latest.incomplete) readDeliveryRun(root, latest.ref, workspace.id);
      throw new MendiError(
        'migration-commit-pending',
        '发现未完成的新迁移收据，停止新的转换计划。',
        { runRef: latest.ref },
        '核对原写者、锁与原始 intent；完整时由原 actor 显式 delivery migrate resume。缺 intent 只诊断，不用旧版恢复新迁移。',
      );
    }
    restore('最新旧操作占号尚未登记为实际交接，须先由旧版处理当前半提交。');
  }
  const ref = `${base}/${String(allocation.number).padStart(3, '0')}-delivery-migrate/run.md`;
  const converted = convertLegacy({ workspace, boundaries, records, migrationRunRef: ref });
  for (const [ref, content] of inputs) {
    if (content !== null) capture(ref, content);
    else if (present(managedPath(root, ref)))
      throw new MendiError('migration-input-changed', '原缺省文件出现。', { ref });
  }
  if (!ownLock && present(managedPath(root, '.mendi/write.lock')))
    restore('预览读取期间出现写者。');
  return {
    kind: 'delivery-migration-preview',
    projectRoot: root,
    deliveryId: workspace.id,
    sourceVersion: 1,
    expectedNumber: allocation.number,
    executionEntries,
    migrationRunRef: ref,
    inputs: [...inputs].map(([ref, content]) => ({ ref, content })),
    project: converted.project,
    manifest: converted.manifest,
    progress: {
      activeChangeId: workspace.activeChangeId,
      deliveryRunRef: workspace.manifest.deliveryRunRef ?? null,
      bindings: workspace.manifest.changeBindings,
    },
    differences: [
      '项目入口升级至 version 2；仅转换当前选定 manifest。',
      '范围归属 rounds；顶层为当前投影；原进展与其他 Delivery 保持。',
    ],
    limitations: [
      '仅使用可直接核对的已知范围；旧来源不补造 Open，不宣称新验收。',
      '预览不预留编号；apply 重新计算和核对全部实际直接输入。',
    ],
  };
}
