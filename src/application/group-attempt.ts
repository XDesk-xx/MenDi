import fs from 'node:fs';
import path from 'node:path';
import { inspectProject } from '../adapters/project.ts';
import { managedPath, present } from '../adapters/paths.ts';
import { acquireProjectLock, releaseProjectLock } from '../adapters/workspace.ts';
import {
  createDeliveryRun,
  replaceDeliveryDraft,
  type DeliveryDocument,
} from '../adapters/delivery-runs.ts';
import { inspectAttempt, equal, confirmBytes } from '../adapters/group-store.ts';
import { validatePnpm } from '../adapters/test-entries.ts';
import { loadMethods } from '../adapters/methods.ts';
import { groupEventReader } from '../adapters/group-events.ts';
import { groupProtocol } from '../core/group-plan.ts';
import {
  interpretReport,
  type GroupRequest,
  type ProtocolObservation,
} from '../core/group-report.ts';
import { deliveryNext } from '../core/delivery-runs.ts';
import { MendiError, errorInfo } from '../core/errors.ts';
import { groupAdmission, confirmGroupInputs } from './group-admission.ts';
import { executeTestUnderLease, executionState } from './test-execution.ts';
import type { FullTestInput, FullTestOptions } from './delivery-full-test.ts';
import { state } from './project.ts';

export async function runGroupAttempt(
  input: FullTestInput,
  options: FullTestOptions = {},
  dispatchBytes?: Buffer,
) {
  const { root } = inspectProject(input.project);
  const written: string[] = [];
  let lease: ReturnType<typeof acquireProjectLock> | undefined;
  let run: DeliveryDocument | undefined;
  const execution = executionState();
  const start = performance.now();
  const utc = new Date().toISOString();
  let progressTimer: ReturnType<typeof setInterval> | undefined;
  let readProgress: (() => unknown[]) | undefined;
  const progressErrors: string[] = [];
  const stages: {
    id: string;
    clock: string;
    utc: string;
    startMs: number;
    durationMs: number;
    phase: string;
  }[] = [];
  let stageStart = start;
  function stage(phase: string) {
    const now = performance.now();
    stages.push({
      id: `mendi-${stages.length + 1}`,
      clock: 'mendi',
      utc,
      startMs: stageStart - start,
      durationMs: now - stageStart,
      phase,
    });
    stageStart = now;
  }
  try {
    const before = groupAdmission(root, input);
    if (dispatchBytes && !before.bytes.get(input.inputFile)?.equals(dispatchBytes))
      throw new MendiError('delivery-input-changed', '组分流期间正式输入变化。');
    const methods = loadMethods('delivery-test-attempt', [], options.methodsRoot);
    stage('准入 / 直接事实与方法');
    lease = acquireProjectLock(root, 'delivery-test-attempt');
    options.observeWrite?.('lock-acquired', lease.lock);
    const admitted = groupAdmission(root, input, true);
    stage('锁内复核');
    if (
      !equal(before.attempt, admitted.attempt) ||
      [...before.bytes].some(([ref, b]) => !admitted.bytes.get(ref)?.equals(b))
    )
      throw new MendiError('delivery-input-changed', '持锁复核组输入变化。');
    const created = createDeliveryRun(
      root,
      admitted.workspace,
      {
        formatVersion: 1,
        recordingMode: 'product',
        scope: 'delivery',
        deliveryId: admitted.workspace.id,
        changeId: null,
        actionType: 'delivery-test-attempt',
        role: 'author',
        actorId: input.actor,
        status: 'draft',
        stageSkill: 'delivery-full-test',
        toolGuidance: [],
        attempt: admitted.attempt,
      },
      written,
      options.observeWrite,
    );
    run = created.run;
    const processOptions = { ...options };
    let precheckError: unknown;
    let preparing = true;
    const direct = new Map<string, Buffer>();
    try {
      const pnpm = validatePnpm(root, input.pnpmBin, admitted.attempt.entry.packageManager);
      stage('真实工具 / 依赖准备前');
      preparing = false;
      admitted.attempt.entry.pnpmBin = pnpm;
      confirmGroupInputs(root, admitted, run.ref);
      await executeTestUnderLease(
        root,
        created.workspace,
        lease,
        'full',
        input.actor,
        pnpm,
        execution,
        processOptions,
        (child) => {
          confirmGroupInputs(root, admitted, run!.ref);
          const base = `.mendi/delivery-groups/${admitted.workspace.id}/tests/${child.executionId}`;
          const request: GroupRequest = {
            protocol: groupProtocol,
            projectRoot: root,
            deliveryId: admitted.workspace.id,
            roundId: admitted.workspace.currentRoundId!,
            runRef: run!.ref,
            executionId: child.executionId,
            candidate: admitted.attempt.candidate,
            plan: admitted.attempt.plan,
            selection: admitted.attempt.selection,
            prerequisites: admitted.attempt.progress.filter((p) => p.state === 'passed'),
            reportRef: `${base}/group-report.json`,
            eventsRef: `${base}/group-events.jsonl`,
          };
          const ref = `${base}/group-request.json`;
          const content = JSON.stringify(request, null, 2) + '\n';
          fs.writeFileSync(managedPath(root, ref), content, { flag: 'wx' });
          written.push(ref);
          direct.set(ref, Buffer.from(content));
          processOptions.groupEnvironment = {
            MENDI_GROUP_TEST_REQUEST: managedPath(root, ref),
            MENDI_GROUP_TEST_REPORT: managedPath(root, request.reportRef),
          };
          readProgress = groupEventReader(root, request.eventsRef);
          if (options.onGroupProgress)
            progressTimer = setInterval(() => {
              try {
                for (const event of readProgress!()) options.onGroupProgress!(event);
              } catch (error) {
                progressErrors.push(String(error));
                clearInterval(progressTimer);
              }
            }, 100);
          run = replaceDeliveryDraft(
            root,
            run!,
            {
              ...run!.header,
              attempt: {
                ...admitted.attempt,
                phase: 'running',
                executionId: child.executionId,
                request,
              },
            },
            run!.body,
            written,
            options.observeWrite,
          );
        },
      );
      clearInterval(progressTimer);
      if (options.onGroupProgress && readProgress)
        try {
          for (const event of readProgress()) options.onGroupProgress(event);
        } catch (error) {
          progressErrors.push(String(error));
        }
      stage('真实 pnpm / 目标准备执行等待清理与子日志保存');
    } catch (error) {
      if (
        execution.preserve ||
        (!preparing &&
          !(
            error instanceof MendiError &&
            ['test-dependencies-unavailable', 'test-cancelled-before-launch'].includes(error.code)
          ))
      )
        throw error;
      precheckError = error;
      const ref = path.posix.dirname(run.ref) + '/artifacts/precheck.json';
      fs.mkdirSync(managedPath(root, path.posix.dirname(ref)), { recursive: true });
      fs.writeFileSync(
        managedPath(root, ref),
        JSON.stringify(
          {
            ...errorInfo(error),
            ...(error instanceof MendiError ? { details: error.details } : {}),
          },
          null,
          2,
        ) + '\n',
        { flag: 'wx' },
      );
      written.push(ref);
    }
    if (execution.outcome === 'unknown')
      throw new MendiError('test-execution-unknown', '实际执行 / 清理未确认。');
    const workspace = confirmGroupInputs(root, admitted, run.ref);
    confirmBytes(root, direct);
    const a = run.record.attempt!;
    let report: unknown;
    if (a.request && present(managedPath(root, a.request.reportRef))) {
      const bytes = fs.readFileSync(managedPath(root, a.request.reportRef));
      direct.set(a.request.reportRef, bytes);
      try {
        report = JSON.parse(bytes.toString());
      } catch {
        report = undefined;
      }
    }
    const observation: ProtocolObservation = precheckError
      ? {
          protocolState: 'unconfirmed' as const,
          notRun: true,
          groups: [],
          reasons: [JSON.stringify(errorInfo(precheckError))],
          timing: [],
        }
      : interpretReport(report, a.request!, execution.record!);
    if (
      observation.protocolState === 'unconfirmed' &&
      !precheckError &&
      !observation.cancelled &&
      !observation.notRun &&
      execution.outcome !== 'interrupted'
    )
      throw new MendiError('group-execution-unconfirmed', '组执行或资源清理未确认，保留现场。', {
        observation,
      });
    const progress = a.progress.map((p) => {
      if (!a.selection.includes(p.id)) return p;
      if (observation.protocolState === 'invalid')
        return {
          ...p,
          state: 'failed' as const,
          reason: `协议 invalid：${observation.reasons.join('；')}`,
          sourceRunRef: run!.ref,
          candidate: a.candidate,
        };
      const fact = observation.groups.find((g) => g.id === p.id);
      return {
        ...p,
        ...(fact ?? {
          state: 'not-run' as const,
          reason: observation.reasons.join('；'),
        }),
        sourceRunRef: run!.ref,
        candidate: a.candidate,
      };
    });
    const elapsed = performance.now() - start;
    stage('最终报告 / 协议解释');
    const attempt = {
      ...a,
      phase: 'finished',
      executionId: execution.executionId,
      observation,
      progress,
      timing: [
        {
          id: 'mendi',
          clock: 'mendi',
          utc,
          startMs: 0,
          durationMs: Math.max(elapsed, performance.now() - start),
          phase: '保存前包络',
        },
        ...stages.map((s) => ({ ...s, parent: 'mendi' })),
      ],
      ...(precheckError ? { reason: JSON.stringify(errorInfo(precheckError)) } : {}),
    };
    run = replaceDeliveryDraft(
      root,
      run,
      {
        ...run.header,
        attempt,
        status: 'submitted',
        outcome: 'complete',
        result:
          precheckError || observation.notRun
            ? 'not-run'
            : observation.protocolState === 'valid'
              ? execution.outcome
              : execution.outcome === 'interrupted' ||
                  (observation.protocolState === 'unconfirmed' && observation.cancelled)
                ? 'interrupted'
                : 'invalid',
      },
      run.body,
      written,
      options.observeWrite,
    );
    const facts = inspectAttempt(root, workspace, run, true);
    confirmGroupInputs(root, admitted, run.ref);
    confirmBytes(root, direct);
    stage('父终态保存 / 直接读回 / 证据复核');
    const timingRef = run.ref.replace(/run\.md$/, 'timing.json');
    fs.writeFileSync(
      managedPath(root, timingRef),
      JSON.stringify(
        {
          clock: 'mendi',
          utc,
          wallMs: performance.now() - start,
          stages,
          progressErrors,
          unmeasured: ['释放锁后的返回成本', '目标未报告的内部准备 / 等待 / 清理子阶段'],
          targetTiming: observation.timing,
        },
        null,
        2,
      ) + '\n',
      { flag: 'wx' },
    );
    written.push(timingRef);
    if (!facts.stable)
      throw new MendiError('delivery-readback-failed', '结构化父子结果读回未确认。');
    options.observeWrite?.('before-lock-release', lease.lock);
    releaseProjectLock(root, lease);
    lease = undefined;
    return {
      ok: observation.protocolState === 'valid' && execution.outcome === 'passed',
      operation: 'delivery-full-test-run',
      projectRoot: root,
      openspec: null,
      local: state(workspace),
      run: { ref: run.ref, ...run.record },
      groupExecution: facts,
      methods,
      next: deliveryNext(run.record, run.ref),
    };
  } catch (error) {
    clearInterval(progressTimer);
    if (lease && !written.length && !execution.preserve) {
      releaseProjectLock(root, lease);
      lease = undefined;
    }
    return {
      ok: false,
      operation: 'delivery-full-test-run',
      projectRoot: root,
      openspec: null,
      local: null,
      outcome: written.length ? 'unknown' : 'not-run',
      ...(run ? { run: { ref: run.ref, ...run.record } } : {}),
      error: {
        ...errorInfo(error),
        ...(error instanceof MendiError ? { details: error.details } : {}),
      },
      committedPaths: written,
      ...(lease ? { retainedLock: lease.lock } : {}),
    };
  }
}
