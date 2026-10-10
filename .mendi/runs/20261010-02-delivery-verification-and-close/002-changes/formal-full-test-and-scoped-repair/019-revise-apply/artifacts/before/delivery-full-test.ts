import fs from 'node:fs';
import path from 'node:path';
import { inspectProject } from '../adapters/project.ts';
import { managedPath } from '../adapters/paths.ts';
import {
  acquireProjectLock,
  releaseProjectLock,
  readWorkspace,
  type WriteObserver,
} from '../adapters/workspace.ts';
import {
  createDeliveryRun,
  currentDeliveryRun,
  readDeliveryRun,
  replaceDeliveryDraft,
  type DeliveryDocument,
} from '../adapters/delivery-runs.ts';
import { selectedTest, validatePnpm } from '../adapters/test-entries.ts';
import { loadMethods } from '../adapters/methods.ts';
import {
  firstApprovals,
  inspectFullTest,
  same,
  reviewRepairInputs,
} from '../adapters/delivery-verification.ts';
import { declaration, verificationScope, type FullTest } from '../core/delivery-verification.ts';
import { deliveryNext } from '../core/delivery-runs.ts';
import { MendiError, errorInfo, text } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';
import type { ExecutionProcessOptions } from '../adapters/test-process.ts';
import { executionState, executeTestUnderLease } from './test-execution.ts';
import { state } from './project.ts';

export interface FullTestInput {
  project: string;
  inputFile: string;
  role: string;
  actor: string;
  pnpmBin: string;
}
export interface FullTestOptions extends ExecutionProcessOptions {
  observeWrite?: WriteObserver;
  methodsRoot?: string;
}
function admission(root: string, input: FullTestInput, ownLock: boolean) {
  if (input.role !== 'author')
    throw new MendiError('action-role-mismatch', '正式 Full Test 要求 Author。');
  text(input.actor, 'actor');
  text(input.pnpmBin, 'pnpm-bin');
  const workspace = readWorkspace(root, ownLock);
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', '正式执行只支持 open product。');
  const scope = verificationScope(workspace);
  const inputPath = managedPath(root, input.inputFile);
  const inputBytes = fs.readFileSync(inputPath);
  const declared = declaration(JSON.parse(inputBytes.toString()));
  const script = selectedTest(root, 'full');
  const entry = {
    scriptName: script.scriptName,
    scriptText: script.scriptText,
    ...(script.packageManager === undefined
      ? {}
      : { packageManager: String(script.packageManager) }),
    pnpmBin: input.pnpmBin,
  };
  const current = currentDeliveryRun(root, workspace);
  let approvals: FullTest['approvals'];
  let repairApproval: FullTest['repairApproval'];
  const refs: string[] = [];
  if (current) {
    if (current.record.status !== 'submitted' || current.record.outcome !== 'complete')
      throw new MendiError('delivery-state-conflict', '当前 Delivery 进展尚未完成。');
    let previous = current;
    if (current.record.repair) {
      if (current.record.role !== 'reviewer' || current.record.verdict !== 'approved')
        throw new MendiError(
          'delivery-state-conflict',
          '重新完整执行需要当前定向 Review approved。',
        );
      const { author, failure } = reviewRepairInputs(root, workspace, current, ownLock);
      previous = failure;
      refs.push(current.ref, author.ref, failure.ref);
      repairApproval = {
        reviewRunRef: current.ref,
        authorRunRef: author.ref,
        authorActor: author.record.actorId,
        reviewerActor: current.record.actorId,
      };
    } else {
      const facts = inspectFullTest(root, workspace, current, ownLock);
      if (!facts.stable || facts.outcome === 'unknown' || facts.outcome === 'failed')
        throw new MendiError(
          'delivery-state-conflict',
          'failed 需要先修复 / 独立审核，unknown 停 Owner。',
        );
      if (facts.commandMatch !== 'match')
        throw new MendiError('delivery-state-conflict', '未经定向审核的执行配置变化，停 Owner。');
      refs.push(current.ref);
      repairApproval = current.record.fullTest!.repairApproval;
      // 失败后批准的修复仍是本次重试的直接必要对象，不追读更旧失败。
      if (repairApproval) {
        const review = readDeliveryRun(root, repairApproval.reviewRunRef, workspace.id);
        const author = readDeliveryRun(root, repairApproval.authorRunRef, workspace.id);
        if (
          review.record.status !== 'submitted' ||
          review.record.verdict !== 'approved' ||
          review.record.outcome !== 'complete' ||
          review.record.authorRunRef !== author.ref ||
          !review.body.trim() ||
          author.record.status !== 'submitted' ||
          author.record.outcome !== 'complete' ||
          !author.body.trim() ||
          author.record.actorId !== repairApproval.authorActor ||
          review.record.actorId !== repairApproval.reviewerActor ||
          !same(review.record.repair, author.record.repair) ||
          !same(author.record.repair?.scope, scope) ||
          !same(author.record.repair?.collection, declared.collection)
        )
          throw new MendiError('review-input-invalid', '当前必要修复批准不可用。');
        refs.push(review.ref, author.ref);
      }
    }
    const full = previous.record.fullTest!;
    if (!same(full.scope, scope) || !same(full.collection, declared.collection))
      throw new MendiError('delivery-state-conflict', '范围或原完整集合变化，停 Owner。');
    approvals = full.approvals;
  } else {
    const first = firstApprovals(root, workspace);
    approvals = first.approvals;
    refs.push(...first.refs);
  }
  const bytes = new Map(refs.map((ref) => [ref, fs.readFileSync(managedPath(root, ref))]));
  return {
    workspace,
    inputBytes,
    bytes,
    fullTest: {
      ...declared,
      scope,
      approvals,
      entry,
      phase: 'prepared' as const,
      executionId: null,
      outcome: 'not-run' as const,
      ...(repairApproval ? { repairApproval } : {}),
    },
  };
}
function confirmInputs(
  root: string,
  input: FullTestInput,
  admitted: ReturnType<typeof admission>,
  run: DeliveryDocument,
) {
  const workspace = readWorkspace(root, true)!;
  const script = selectedTest(root, 'full');
  if (
    workspace.manifest.deliveryRunRef !== run.ref ||
    workspace.manifest.fullTestRunRef !== run.ref ||
    !same(verificationScope(workspace), admitted.fullTest.scope) ||
    !fs.readFileSync(managedPath(root, input.inputFile)).equals(admitted.inputBytes) ||
    script.scriptName !== admitted.fullTest.entry.scriptName ||
    script.scriptText !== admitted.fullTest.entry.scriptText ||
    script.packageManager !== admitted.fullTest.entry.packageManager ||
    [...admitted.bytes].some(
      ([ref, bytes]) => !fs.readFileSync(managedPath(root, ref)).equals(bytes),
    )
  )
    throw new MendiError(
      'delivery-input-changed',
      '本次必要输入、声明、范围或入口变化；保留现场。',
    );
  return workspace;
}
const local = {
  openspec: null,
  executionMode: 'local-only' as const,
  upstreamAccess: 'not-required',
};
export async function runFullTest(input: FullTestInput, options: FullTestOptions = {}) {
  const { root } = inspectProject(input.project);
  let lease: ReturnType<typeof acquireProjectLock> | undefined;
  const written: string[] = [];
  let run: DeliveryDocument | undefined;
  const execution = executionState();
  let workspace: Workspace | undefined;
  try {
    const before = admission(root, input, false);
    const methods = loadMethods('delivery-full-test', [], options.methodsRoot);
    lease = acquireProjectLock(root, 'delivery-full-test');
    options.observeWrite?.('lock-acquired', lease.lock);
    const admitted = admission(root, input, true);
    if (
      !same(before.fullTest, admitted.fullTest) ||
      !before.inputBytes.equals(admitted.inputBytes) ||
      [...before.bytes].some(([ref, bytes]) => !admitted.bytes.get(ref)?.equals(bytes))
    )
      throw new MendiError('delivery-input-changed', '持锁复核输入变化，未分配 Run。');
    const created = createDeliveryRun(
      root,
      admitted.workspace,
      {
        formatVersion: 1,
        recordingMode: 'product',
        scope: 'delivery',
        deliveryId: admitted.workspace.id,
        changeId: null,
        actionType: 'delivery-full-test',
        role: 'author',
        actorId: input.actor,
        status: 'draft',
        stageSkill: 'delivery-full-test',
        toolGuidance: [],
        fullTest: admitted.fullTest,
      },
      written,
      options.observeWrite,
    );
    run = created.run;
    workspace = created.workspace;
    let precheckError: unknown;
    let preparingTool = true;
    try {
      const pnpm = validatePnpm(root, input.pnpmBin, selectedTest(root, 'full').packageManager);
      preparingTool = false;
      // 实际子命令使用校验后的既有真实入口。
      run = replaceDeliveryDraft(
        root,
        run,
        {
          ...run.header,
          fullTest: {
            ...run.record.fullTest!,
            entry: { ...run.record.fullTest!.entry, pnpmBin: pnpm },
          },
        },
        run.body,
        written,
        options.observeWrite,
      );
      admitted.fullTest.entry.pnpmBin = pnpm;
      confirmInputs(root, input, admitted, run);
      await executeTestUnderLease(
        root,
        workspace,
        lease,
        'full',
        input.actor,
        pnpm,
        execution,
        options,
        (child) => {
          confirmInputs(root, input, admitted, run!);
          run = replaceDeliveryDraft(
            root,
            run!,
            {
              ...run!.header,
              fullTest: {
                ...run!.record.fullTest!,
                phase: 'running',
                executionId: child.executionId,
                outcome: 'unknown',
              },
            },
            run!.body,
            written,
            options.observeWrite,
          );
        },
      );
    } catch (error) {
      if (
        execution.preserve ||
        (!preparingTool &&
          !(
            error instanceof MendiError &&
            ['test-dependencies-unavailable', 'test-cancelled-before-launch'].includes(error.code)
          ))
      )
        throw error;
      precheckError = error;
      const artifacts = path.dirname(managedPath(root, run.ref)) + '/artifacts';
      fs.mkdirSync(artifacts);
      fs.writeFileSync(
        path.join(artifacts, 'precheck.json'),
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
      written.push(artifacts);
    }
    const outcome = precheckError ? 'not-run' : execution.outcome;
    if (outcome === 'unknown')
      throw new MendiError('test-execution-unknown', '子执行未确认，保留现场与锁。');
    workspace = confirmInputs(root, input, admitted, run);
    const fullTest = {
      ...run.record.fullTest!,
      phase: 'finished',
      outcome,
      executionId: execution.executionId,
      ...(precheckError ? { reason: JSON.stringify(errorInfo(precheckError)) } : {}),
    };
    run = replaceDeliveryDraft(
      root,
      run,
      { ...run.header, fullTest, status: 'submitted', outcome: 'complete', result: outcome },
      run.body,
      written,
      options.observeWrite,
    );
    const facts = inspectFullTest(root, workspace, run, true);
    confirmInputs(root, input, admitted, run);
    if (
      !facts.stable ||
      facts.outcome !== outcome ||
      facts.scopeMatch !== 'match' ||
      facts.commandMatch !== 'match'
    )
      throw new MendiError('delivery-readback-failed', '正式两层结果读回未确认。');
    options.observeWrite?.('before-lock-release', lease.lock);
    releaseProjectLock(root, lease);
    lease = undefined;
    return {
      ...local,
      ok: outcome === 'passed',
      operation: 'delivery-full-test-run',
      projectRoot: root,
      local: state(workspace),
      run: { ref: run.ref, ...run.record },
      verification: facts,
      methods,
      next: deliveryNext(run.record, run.ref),
    };
  } catch (error) {
    let releaseError: unknown;
    if (lease && !written.length && !execution.preserve) {
      try {
        releaseProjectLock(root, lease);
        lease = undefined;
      } catch (failure) {
        releaseError = errorInfo(failure);
      }
    }
    return {
      ...local,
      ok: false,
      operation: 'delivery-full-test-run',
      projectRoot: root,
      local: workspace ? state(workspace) : null,
      outcome: written.length ? 'unknown' : 'not-run',
      ...(run ? { run: { ref: run.ref, ...run.record } } : {}),
      error: {
        ...errorInfo(error),
        ...(error instanceof MendiError ? { details: error.details } : {}),
        ...(releaseError ? { releaseError } : {}),
      },
      committedPaths: written,
      ...(lease ? { retainedLock: lease.lock } : {}),
    };
  }
}
export function fullTestStatus(input: { project: string; runRef: string }) {
  const { root } = inspectProject(input.project);
  const workspace = readWorkspace(root);
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('invalid-run', '需要当前 product Delivery。');
  const run = readDeliveryRun(root, input.runRef, workspace.id);
  const verification = inspectFullTest(root, workspace, run);
  return {
    ...local,
    ok: verification.stable && verification.outcome !== 'unknown',
    operation: 'delivery-full-test-status',
    projectRoot: root,
    local: state(workspace),
    run: { ref: run.ref, ...run.record },
    verification,
    next: deliveryNext(run.record, run.ref),
  };
}
