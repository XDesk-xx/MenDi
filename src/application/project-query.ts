import { currentBinding } from '../core/associations.ts';
import { actionNext } from '../core/actions.ts';
import { MendiError, object } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { currentRun } from '../adapters/runs.ts';
import { currentDeliveryRun } from '../adapters/delivery-runs.ts';
import { inspectAttempt, inspectCandidate } from '../adapters/group-store.ts';
import { inspectFullTest } from '../adapters/delivery-verification.ts';
import { deliveryNext } from '../core/delivery-next.ts';
import { selected, state, type Selection, type OperationOptions } from './project.ts';
import { readAftercare } from '../adapters/aftercare-reader.ts';

export function query(input: Selection, options: OperationOptions = {}) {
  const { root, upstream } = selected(input, options);
  const base = {
    ok: true as const,
    operation: 'query' as const,
    projectRoot: root,
    openspec: upstream.info(),
  };
  let workspace: Workspace | null;
  try {
    workspace = readWorkspace(root, false, input.deliveryId);
  } catch (error) {
    if (!(error instanceof MendiError) || error.code !== 'delivery-commit-pending') throw error;
    return {
      ...base,
      ok: false,
      local: null,
      upstream: null,
      outcome: 'unknown',
      pending: error.details,
      next: {
        action: 'owner-decision',
        role: 'owner',
        status: 'stopped',
        executable: false,
        reason: error.message,
      },
    };
  }
  if (!workspace)
    return {
      ...base,
      local: null,
      upstream: null,
      next: {
        action: 'delivery-open',
        source: 'local-state',
        executable: true,
        reason: '需明确 Delivery 范围与 Owner 授权。',
      },
    };
  const delivery = currentDeliveryRun(root, workspace);
  if (delivery) {
    if (delivery.record.attempt || delivery.record.verification) {
      const groupExecution = delivery.record.attempt
        ? inspectAttempt(root, workspace, delivery)
        : undefined;
      const candidateVerification = delivery.record.verification
        ? inspectCandidate(root, workspace, delivery)
        : undefined;
      const stable = groupExecution?.stable ?? candidateVerification!.stable;
      return {
        ...base,
        ok: stable,
        local: state(workspace),
        upstream: null,
        run: { ref: delivery.ref, ...delivery.record },
        aftercare: readAftercare(root, delivery.ref),
        ...(groupExecution ? { groupExecution } : {}),
        ...(candidateVerification ? { candidateVerification } : {}),
        next: deliveryNext(delivery.record, delivery.ref, stable ? undefined : 'unknown'),
      };
    }
    const verification = delivery.record.fullTest
      ? inspectFullTest(root, workspace, delivery)
      : undefined;
    return {
      ...base,
      ok: !verification || (verification.stable && verification.outcome !== 'unknown'),
      local: state(workspace),
      upstream: null,
      run: { ref: delivery.ref, ...delivery.record },
      aftercare: readAftercare(root, delivery.ref),
      ...(verification ? { verification } : {}),
      next: deliveryNext(delivery.record, delivery.ref, verification?.outcome),
    };
  }
  const run = currentRun(root, workspace);
  const facts =
    workspace.activeChangeId && !run?.record.archive
      ? upstream.status(workspace.activeChangeId)
      : null;
  const next =
    workspace.mode === 'manual-bootstrap'
      ? {
          ...object(workspace.manifest.next, '人工 next'),
          source: 'manual-bootstrap',
          executable: false,
        }
      : !workspace.activeChangeId &&
          workspace.rounds?.at(-1)?.scopeAdditions &&
          workspace.scope.plannedChanges.some(
            (p) => !workspace.bindings.some((b) => b.planningSlot === p.slot),
          )
        ? {
            action: 'change-bind',
            role: 'author',
            source: 'local-state',
            executable: true,
            reason: '追加范围有未关联槽位，需明确已有 Change、槽位及 Owner 授权。',
          }
        : run
          ? actionNext(run.record, run.ref, currentBinding(workspace)?.state === 'archived')
          : workspace.activeChangeId
            ? {
                action: 'explore',
                source: 'local-state',
                executable: false,
                role: 'author',
                reason: '关联已保存；可显式开始 Explore 记录，阶段语义工作由 Agent 完成。',
              }
            : {
                action: 'change-bind',
                source: 'local-state',
                executable: true,
                reason: '需明确已有 Change、计划槽位及相应 Owner 授权。',
              };
  return {
    ...base,
    local: state(workspace),
    upstream: facts,
    ...(run
      ? { run: { ref: run.ref, ...run.record }, aftercare: readAftercare(root, run.ref) }
      : {}),
    next,
  };
}

export function queryRound(input: Selection & { roundId: string }, options: OperationOptions = {}) {
  const { root, upstream } = selected(input, options);
  const workspace = readWorkspace(root, false, input.deliveryId, true);
  const base = {
    ok: true as const,
    operation: 'query' as const,
    projectRoot: root,
    openspec: upstream.info(),
  };
  if (!workspace?.rounds)
    throw new MendiError('round-query-unsupported', '该记录没有结构化轮次；普通查询仍可用。');
  const round = workspace.rounds.find((r) => r.id === input.roundId);
  if (!round)
    throw new MendiError('round-not-found', '指定轮次不存在。', { roundId: input.roundId });
  return {
    ...base,
    upstream: null,
    local: state(workspace),
    historicalRound: round,
    readOnly: true,
  };
}
