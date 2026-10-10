import { completeArchive } from '../adapters/archive-commit.ts';
import fs from 'node:fs';
import path from 'node:path';
import { inspectProject } from '../adapters/project.ts';
import { managedPath, present } from '../adapters/paths.ts';
import { currentRun, type RunDocument } from '../adapters/runs.ts';
import { replaceDraft, writeAction } from '../adapters/action-store.ts';
import { readWorkspace, type WriteObserver } from '../adapters/workspace.ts';
import {
  captureArchiveInputs,
  loadArchiveInputs,
  observeArchiveEffects,
} from '../adapters/archive-effects.ts';
import { archiveName, archivedCount, type ArchiveRecord } from '../core/archive.ts';
import { actionNext } from '../core/actions.ts';
import { MendiError, errorInfo, object, text } from '../core/errors.ts';
import { type Workspace } from '../core/records.ts';
import { archiveApproval, archiveReady } from './archive-prepare.ts';
import { matchingActor, type ActorInput, type ActionOptions } from './action-context.ts';
import { selected, state } from './project.ts';
import { probeProcess, type Liveness } from './diagnosis.ts';
import type { OpenSpec, ProcessResult } from '../adapters/openspec.ts';

export interface ArchiveInput extends ActorInput {
  runRef: string;
  mode: string;
}
export interface ArchiveOptions extends ActionOptions {
  probe?: (pid: number) => Liveness;
}
function archiveCurrent(root: string, workspace: Workspace | null, input: ArchiveInput) {
  if (!workspace || workspace.mode !== 'product' || workspace.state !== 'open')
    throw new MendiError('invalid-action', 'Archive 仅支持 open 的 product 交接。');
  const run = currentRun(root, workspace);
  if (!run || run.ref !== input.runRef || !run.record.archive)
    throw new MendiError('run-not-current', '需要当前 Archive Run。');
  matchingActor(run, input);
  const binding = workspace.bindings[0];
  if (!['archiving', 'archived'].includes(binding.state))
    throw new MendiError('archive-state-conflict', 'Archive binding 不匹配。');
  return run;
}
function writeJson(root: string, ref: string, value: unknown, written: string[]) {
  const file = managedPath(root, ref);
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  written.push(file);
}
function updateArchive(
  root: string,
  run: RunDocument,
  archive: ArchiveRecord,
  written: string[],
  observe?: WriteObserver,
) {
  return replaceDraft(root, run, { ...run.header, archive }, run.body, written, observe);
}
function readAttempt(root: string, ref: string) {
  return object(JSON.parse(fs.readFileSync(managedPath(root, ref), 'utf8')), '调用见证');
}
function stoppedInvocation(root: string, run: RunDocument, probe = probeProcess) {
  const base = run.record.archive!.attemptRef!;
  const marker = readAttempt(root, `${base}/invocation.json`);
  if (
    marker.runRef !== run.ref ||
    marker.attempt !== run.record.archive!.attempt ||
    !Number.isSafeInteger(marker.writerPid) ||
    Number(marker.writerPid) < 1 ||
    probe(Number(marker.writerPid)) !== 'not-found'
  )
    throw new MendiError('archive-writer-not-stopped', '原写者活跃、unknown 或调用标记无效。');
  const launch = managedPath(root, `${base}/launch.json`);
  if (!present(launch)) return; // Marker was committed before the possible launch point.
  const exit = readAttempt(root, `${base}/native-exit.json`);
  if (
    exit.runRef !== run.ref ||
    exit.attempt !== run.record.archive!.attempt ||
    exit.exited !== true ||
    !Number.isSafeInteger(exit.status) ||
    exit.signal !== null ||
    (exit.pid !== null &&
      (!Number.isSafeInteger(exit.pid) ||
        Number(exit.pid) < 1 ||
        probe(Number(exit.pid)) !== 'not-found'))
  )
    throw new MendiError('archive-writer-not-stopped', '可能启动的原生调用未证实停止。');
}
function nativeResponse(upstream: OpenSpec, change: string, result: ProcessResult) {
  if (result.status !== 0 || result.signal !== null || result.error)
    throw new MendiError('native-archive-failed', '原生归档未成功返回。', {
      status: result.status,
      signal: result.signal,
    });
  const response = object(JSON.parse(result.stdout), '公开 Archive 响应');
  const root = upstream.readRoot(response.root);
  const archive = object(response.archive, 'archive');
  const name = text(archive.archivedAs, 'archivedAs');
  const ref = `openspec/changes/archive/${name}`;
  archiveName(ref, change);
  const resolved = managedPath(upstream.projectRoot, ref);
  if (
    archive.change !== change ||
    typeof archive.specsUpdated !== 'boolean' ||
    typeof archive.path !== 'string' ||
    !path.isAbsolute(archive.path) ||
    path.resolve(archive.path) !== path.resolve(resolved) ||
    root.path !== upstream.root.path
  )
    throw new MendiError('native-archive-protocol', '原生 Archive 身份 / 路径无效。');
  const totals = object(archive.totals, '规格变动计数');
  for (const key of ['added', 'modified', 'removed', 'renamed'])
    if (
      typeof totals[key] !== 'number' ||
      !Number.isSafeInteger(totals[key]) ||
      Number(totals[key]) < 0
    )
      throw new MendiError('native-archive-protocol', '原生规格变动计数无效。');
  return ref;
}
export function archiveAction(input: ArchiveInput, options: ArchiveOptions = {}) {
  if (!['execute', 'finish'].includes(input.mode))
    throw new MendiError(
      'invalid-arguments',
      'Archive mode 必须显式 execute / finish。',
      {},
      '',
      2,
    );
  if (input.role !== 'author')
    throw new MendiError('action-role-mismatch', 'Archive 仅允许当前 Author。');
  text(input.actor, '操作者标识');
  const { root } = inspectProject(input.project);
  const before = readWorkspace(root);
  const prior = archiveCurrent(root, before, input);
  if (
    input.mode === 'execute' &&
    (prior.record.status !== 'draft' || !['prepared', 'none'].includes(prior.record.archive!.phase))
  )
    throw new MendiError(
      'archive-state-conflict',
      'execute 只接受 prepared / 已保存 none；invoking 先显式 finish。',
    );
  // Finish never constructs OpenSpec, including already-completed and interrupted cases.
  const upstream = input.mode === 'execute' ? selected(input, options).upstream : null;
  const expectedInputs = upstream
    ? (() => {
        const archive = prior.record.archive!;
        const approval = archiveApproval(root, before!, archive.reviewRunRef, archive.authorRunRef);
        archiveReady(upstream, prior.record.changeId);
        if (archivedCount(before!.project) !== archive.countBasis)
          throw new MendiError('archive-count-conflict', '执行前计数变化。');
        if (
          archive.phase === 'none' &&
          observeArchiveEffects(root, archive, loadArchiveInputs(root, before!, prior)).phase !==
            'none'
        )
          throw new MendiError('archive-state-conflict', '已保存 none 的现场不再允许执行。');
        const inputs = captureArchiveInputs(root, before!, prior, approval);
        if (observeArchiveEffects(root, archive, inputs).phase !== 'none')
          throw new MendiError('archive-effects-unconfirmed', '执行前现场不可靠。');
        return inputs;
      })()
    : null;
  const result = writeAction(
    root,
    `archive-${input.mode}`,
    (workspace, written) => {
      let run = archiveCurrent(root, workspace, input);
      if (
        JSON.stringify(run) !== JSON.stringify(prior) ||
        JSON.stringify(workspace) !== JSON.stringify(before)
      )
        throw new MendiError('archive-input-changed', '锁内 Archive 输入已变化。');
      let archive = run.record.archive!;
      if (workspace.bindings[0].state === 'archived')
        return { workspace, run, result: 'already-completed' as const };
      if (input.mode === 'finish') {
        if (archive.phase === 'prepared')
          throw new MendiError(
            'archive-state-conflict',
            'prepared 需要显式 execute 或 Owner rollback。',
          );
        stoppedInvocation(root, run, options.probe);
        const inputs = loadArchiveInputs(root, workspace, run);
        const effect = observeArchiveEffects(root, archive, inputs);
        if (effect.phase === 'none') {
          if (
            archive.phase === 'confirmed' ||
            run.record.status !== 'draft' ||
            archivedCount(workspace.project) !== archive.countBasis
          )
            throw new MendiError(
              'archive-state-conflict',
              '已确认效果、终态或计数变化不能降为 none。',
            );
          if (archive.phase !== 'none') {
            options.observeWrite?.('before-none-observation', managedPath(root, run.ref));
            // Append observation, preserving invocation, source copies and raw errors.
            const directory = managedPath(root, archive.attemptRef!);
            const number =
              fs.readdirSync(directory).filter((name) => /^observation-\d+\.json$/.test(name))
                .length + 1;
            writeJson(
              root,
              `${archive.attemptRef}/observation-${number}.json`,
              { runRef: run.ref, phase: 'none', observedAt: new Date().toISOString() },
              written,
            );
            run = updateArchive(
              root,
              run,
              { ...archive, phase: 'none' },
              written,
              options.observeWrite,
            );
          }
          return { workspace, run, result: 'observed-none' as const };
        }
        return completeArchive(root, workspace, run, written, options.observeWrite);
      }
      if (archive.phase === 'none') {
        const old = loadArchiveInputs(root, workspace, run);
        if (observeArchiveEffects(root, archive, old).phase !== 'none')
          throw new MendiError('archive-state-conflict', '已有实际效果，不可重试。');
      }
      const approval = archiveApproval(root, workspace, archive.reviewRunRef, archive.authorRunRef);
      archiveReady(upstream!, run.record.changeId);
      if (archivedCount(workspace.project) !== archive.countBasis)
        throw new MendiError('archive-count-conflict', '执行前计数变化。');
      const inputs = captureArchiveInputs(root, workspace, run, approval);
      if (JSON.stringify(inputs) !== JSON.stringify(expectedInputs))
        throw new MendiError('archive-input-changed', '锁内直接批准或 Change / 主规格输入已变化。');
      if (observeArchiveEffects(root, archive, inputs).phase !== 'none')
        throw new MendiError('archive-effects-unconfirmed', '执行前现场不是无效果。');
      const attempt = archive.attempt + 1;
      const attemptRef = `${run.ref.slice(0, -'run.md'.length)}artifacts/attempt-${String(attempt).padStart(3, '0')}`;
      const parent = managedPath(root, path.posix.dirname(attemptRef));
      if (!present(parent)) {
        fs.mkdirSync(parent);
        written.push(parent);
      }
      fs.mkdirSync(managedPath(root, attemptRef));
      written.push(managedPath(root, attemptRef));
      writeJson(root, `${attemptRef}/inputs.json`, inputs, written);
      writeJson(
        root,
        `${attemptRef}/invocation.json`,
        { runRef: run.ref, attempt, writerPid: process.pid, markedAt: new Date().toISOString() },
        written,
      );
      archive = { ...archive, phase: 'invoking', attempt, attemptRef };
      run = updateArchive(root, run, archive, written, options.observeWrite);
      options.observeWrite?.('after-invoking', managedPath(root, run.ref));
      writeJson(
        root,
        `${attemptRef}/launch.json`,
        {
          runRef: run.ref,
          attempt,
          entry: upstream!.entry,
          args: ['archive', run.record.changeId, '--json', '--yes'],
          cwd: root,
        },
        written,
      );
      options.observeWrite?.('before-native-call', managedPath(root, run.ref));
      const raw = upstream!.nativeArchive(run.record.changeId);
      // A killed / timed-out child is uncertain: never claim it stopped from status=null.
      writeJson(
        root,
        `${attemptRef}/native-exit.json`,
        {
          runRef: run.ref,
          attempt,
          exited: raw.status !== null && !raw.error,
          status: raw.status,
          signal: raw.signal,
          pid: raw.pid ?? null,
        },
        written,
      );
      writeJson(
        root,
        `${attemptRef}/native-result.json`,
        {
          status: raw.status,
          signal: raw.signal,
          stdout: raw.stdout,
          stderr: raw.stderr,
          ...(raw.error ? { error: errorInfo(raw.error) } : {}),
        },
        written,
      );
      options.observeWrite?.('native-returned', managedPath(root, run.ref));
      let responseRef: string | undefined;
      let responseError: unknown;
      try {
        responseRef = nativeResponse(upstream!, run.record.changeId, raw);
      } catch (error) {
        responseError = error;
      }
      const effect = observeArchiveEffects(root, archive, inputs);
      if (effect.phase === 'none') {
        options.observeWrite?.('before-none-observation', managedPath(root, run.ref));
        run = updateArchive(
          root,
          run,
          { ...archive, phase: 'none' },
          written,
          options.observeWrite,
        );
      } else {
        run = updateArchive(root, run, { ...archive, ...effect }, written, options.observeWrite);
      }
      if (responseError) throw responseError;
      if (effect.phase !== 'confirmed' || responseRef !== effect.archiveRef)
        throw new MendiError('archive-effects-unconfirmed', '响应与实际效果未共同确认。');
      return completeArchive(root, workspace, run, written, options.observeWrite);
    },
    options.observeWrite,
  );
  return {
    ok: true as const,
    operation: 'action-archive',
    projectRoot: root,
    openspec: upstream?.info() ?? null,
    ...(upstream
      ? {}
      : { executionMode: 'local-only' as const, upstreamAccess: 'not-required' as const }),
    result: result.result,
    archiveStatus:
      result.run.record.status === 'submitted' && result.workspace.bindings[0].state === 'archived'
        ? 'completed'
        : 'pending',
    local: state(result.workspace),
    run: { ref: result.run.ref, ...result.run.record },
    next: actionNext(result.run.record, result.run.ref),
  };
}
