import { inspectProject } from '../adapters/project.ts';
import { readWorkspace, acquireProjectLock, releaseProjectLock } from '../adapters/workspace.ts';
import { currentBinding } from '../core/associations.ts';
import { MendiError, errorInfo, text } from '../core/errors.ts';
import { testKind, type TestExecution, type TestOutcome } from '../core/test-execution.ts';
import { readTestEntries, selectedTest, validatePnpm } from '../adapters/test-entries.ts';
import { observeExecution } from '../adapters/test-store.ts';
import { executionState, executeTestUnderLease } from './test-execution.ts';
import { type ExecutionProcessOptions } from '../adapters/test-process.ts';

const local = {
  openspec: null,
  local: null,
  executionMode: 'local-only',
  upstreamAccess: 'not-required',
} as const;
export function listTests(input: { project: string }) {
  const { root } = inspectProject(input.project);
  return {
    ...local,
    ok: true,
    operation: 'test-list',
    projectRoot: root,
    entries: readTestEntries(root).entries,
  };
}
function runnable(root: string, ownLock = false) {
  const workspace = readWorkspace(root, ownLock);
  if (
    !workspace ||
    workspace.mode !== 'product' ||
    workspace.state !== 'open' ||
    currentBinding(workspace)?.state === 'archiving'
  )
    throw new MendiError(
      'test-workspace-unavailable',
      '测试要求无归档过渡的 open product Delivery，未运行。',
    );
  return workspace;
}
export async function runTest(
  input: { project: string; kind: string; actor: string; pnpmBin: string },
  options: ExecutionProcessOptions = {},
) {
  const { root } = inspectProject(input.project);
  let outcome: TestOutcome = 'not-run';
  let record: TestExecution | null = null;
  let lease: ReturnType<typeof acquireProjectLock> | undefined;
  let preserve = false;
  let executionId: string | null = null;
  try {
    const kind = testKind(input.kind);
    const actorId = text(input.actor, 'actor');
    runnable(root);
    const chosen = selectedTest(root, kind);
    const pnpm = validatePnpm(root, input.pnpmBin, chosen.packageManager);
    lease = acquireProjectLock(root, 'test-run');
    const workspace = runnable(root, true);
    const script = selectedTest(root, kind);
    if (pnpm !== validatePnpm(root, input.pnpmBin, script.packageManager))
      throw new MendiError('test-tool-changed', '锁内工具入口变化，未运行。');
    const execution = executionState();
    try {
      await executeTestUnderLease(root, workspace, lease, kind, actorId, pnpm, execution, options);
    } finally {
      preserve = execution.preserve;
      executionId = execution.executionId;
      record = execution.record;
      outcome = execution.outcome;
    }
    if (outcome === 'unknown')
      throw new MendiError('test-execution-unknown', '执行无法确认，保留现场与锁。');
    options.observe?.('before-test-lock-release', lease.lock);
    releaseProjectLock(root, lease);
    lease = undefined;
    preserve = false;
    return {
      ...local,
      ok: outcome === 'passed',
      operation: 'test-run',
      projectRoot: root,
      executionId,
      outcome,
      record: record!,
    };
  } catch (error) {
    let failure: { message: string; code?: string; details?: unknown; releaseError?: unknown } = {
      ...errorInfo(error),
      ...(error instanceof MendiError ? { details: error.details } : {}),
    };
    if (lease && !preserve) {
      try {
        options.observe?.('before-test-lock-release', lease.lock);
        releaseProjectLock(root, lease);
        lease = undefined;
      } catch (releaseError) {
        failure = { ...failure, releaseError: errorInfo(releaseError) };
        outcome = 'unknown';
      }
    } else if (preserve) outcome = 'unknown';
    return {
      ...local,
      ok: false,
      operation: 'test-run',
      projectRoot: root,
      executionId,
      outcome,
      observed: record,
      error: failure,
      ...(lease ? { retainedLock: lease.lock } : {}),
    };
  }
}
export function testStatus(
  input: { project: string; execution: string },
  options: { observeRead?: () => void } = {},
) {
  const { root } = inspectProject(input.project);
  try {
    const observation = observeExecution(root, input.execution, options.observeRead);
    return {
      ...local,
      ok: observation.stable && observation.record.outcome !== 'unknown',
      operation: 'test-status',
      projectRoot: root,
      executionId: input.execution,
      outcome: observation.stable ? observation.record.outcome : 'unknown',
      ...observation,
    };
  } catch (error) {
    return {
      ...local,
      ok: false,
      operation: 'test-status',
      projectRoot: root,
      executionId: input.execution,
      outcome: 'unknown',
      error: errorInfo(error),
    };
  }
}
