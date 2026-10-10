import { runFullTest, fullTestStatus } from '../application/delivery-full-test.ts';
import { startDeliveryRepair, startDeliveryReview } from '../application/delivery-repair.ts';
import { actionInstructions } from '../application/action-instructions.ts';
import { resolveAction } from '../application/action-resolution.ts';
import { archiveAction } from '../application/archive.ts';
import { deliveryLifecycle } from '../application/delivery-lifecycle.ts';

import { bindChange, openDelivery, query } from '../application/project.ts';
import { startAction, continueAction, saveRun, submitRun } from '../application/actions.ts';
import { diagnoseWorkspace } from '../application/diagnosis.ts';
import type { Arguments } from './arguments.ts';
import { listTests, runTest, testStatus } from '../application/tests.ts';

// 参数解析之后只负责调用应用操作；呈现由 output.ts 维护。
export async function dispatch(parsed: Arguments) {
  const target = { project: parsed.values.project };
  if (parsed.command === 'test-list') return listTests(target);
  if (parsed.command === 'test-run')
    return runTest({
      ...target,
      kind: parsed.values.kind,
      actor: parsed.values.actor,
      pnpmBin: parsed.values['pnpm-bin'],
    });
  if (parsed.command === 'test-status')
    return testStatus({
      ...target,
      execution: parsed.values.execution,
      deliveryId: parsed.values.delivery,
    });
  const input = { project: parsed.values.project, openspecBin: parsed.values['openspec-bin'] };
  const actor = { ...input, role: parsed.values.role, actor: parsed.values.actor };
  switch (parsed.command) {
    case 'delivery-close':
    case 'delivery-reopen':
      return deliveryLifecycle(parsed.command, {
        ...actor,
        inputFile: parsed.values.input,
        scopePath: parsed.values.scope,
        reason: parsed.values.reason,
        resumeRef: parsed.values.resume,
      });
    case 'delivery-full-test-run':
      return runFullTest({
        ...actor,
        inputFile: parsed.values.input,
        pnpmBin: parsed.values['pnpm-bin'],
      });
    case 'delivery-full-test-status':
      return fullTestStatus({ ...target, runRef: parsed.values.run });
    case 'delivery-repair-start':
      return startDeliveryRepair({
        ...actor,
        from: parsed.values.from,
        reason: parsed.values.reason,
        revisesRunRef: parsed.values.revises,
      });
    case 'delivery-repair-review':
      return startDeliveryReview({ ...actor, authorRunRef: parsed.values['author-run'] });
    case 'action-archive':
      return archiveAction({ ...actor, runRef: parsed.values.run, mode: parsed.values.mode });
    case 'workspace-diagnose':
      return diagnoseWorkspace({ ...target, runRef: parsed.values.run });
    case 'action-resolve':
      return resolveAction({
        ...actor,
        runRef: parsed.values.run,
        resolution: parsed.values.resolution,
        toRole: parsed.values['to-role'],
        toActor: parsed.values['to-actor'],
        reason: parsed.values.reason,
        phase: parsed.values.phase,
        revisesRunRef: parsed.values.revises,
      });
    case 'delivery-open':
      return openDelivery({
        ...actor,
        resumeRef: parsed.values.resume,
        id: parsed.values.id,
        title: parsed.values.title,
        scopePath: parsed.values.scope,
        changeId: parsed.values.change,
        slot: parsed.values.slot,
      });
    case 'change-bind':
      return bindChange({ ...input, changeId: parsed.values.change, slot: parsed.values.slot });
    case 'action-start':
      return startAction({
        ...actor,
        changeId: parsed.values.change,
        type: parsed.values.type,
        authorRunRef: parsed.values['author-run'],
        revisesRunRef: parsed.values.revises,
        tool: parsed.values.tool,
      });
    case 'action-continue':
      return continueAction({ ...actor, actionId: parsed.values.action });
    case 'action-instructions':
      return actionInstructions({
        ...input,
        actionId: parsed.values.action,
        artifact: parsed.values.artifact,
        operation: parsed.values.operation,
      });
    case 'run-save':
      return saveRun({ ...actor, runRef: parsed.values.run, bodyFile: parsed.values.body });
    case 'run-submit':
      return submitRun({
        ...actor,
        runRef: parsed.values.run,
        outcome: parsed.values.outcome,
        result: parsed.values.result,
        verdict: parsed.values.verdict,
      });
    default:
      return query({ ...input, deliveryId: parsed.values.delivery });
  }
}
