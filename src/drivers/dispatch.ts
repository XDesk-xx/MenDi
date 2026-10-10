import { actionInstructions } from '../application/action-instructions.ts';
import { resolveAction } from '../application/action-resolution.ts';
import { archiveAction } from '../application/archive.ts';

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
    return testStatus({ ...target, execution: parsed.values.execution });
  const input = { project: parsed.values.project, openspecBin: parsed.values['openspec-bin'] };
  const actor = { ...input, role: parsed.values.role, actor: parsed.values.actor };
  return parsed.command === 'action-archive'
    ? archiveAction({ ...actor, runRef: parsed.values.run, mode: parsed.values.mode })
    : parsed.command === 'workspace-diagnose'
      ? diagnoseWorkspace({ project: input.project, runRef: parsed.values.run })
      : parsed.command === 'action-resolve'
        ? resolveAction({
            ...actor,
            runRef: parsed.values.run,
            resolution: parsed.values.resolution,
            toRole: parsed.values['to-role'],
            toActor: parsed.values['to-actor'],
            reason: parsed.values.reason,
            phase: parsed.values.phase,
            revisesRunRef: parsed.values.revises,
          })
        : parsed.command === 'delivery-open'
          ? openDelivery({
              ...input,
              id: parsed.values.id,
              title: parsed.values.title,
              scopePath: parsed.values.scope,
              changeId: parsed.values.change,
              slot: parsed.values.slot,
            })
          : parsed.command === 'change-bind'
            ? bindChange({ ...input, changeId: parsed.values.change, slot: parsed.values.slot })
            : parsed.command === 'action-start'
              ? startAction({
                  ...actor,
                  changeId: parsed.values.change,
                  type: parsed.values.type,
                  authorRunRef: parsed.values['author-run'],
                  revisesRunRef: parsed.values.revises,
                  tool: parsed.values.tool,
                })
              : parsed.command === 'action-continue'
                ? continueAction({ ...actor, actionId: parsed.values.action })
                : parsed.command === 'action-instructions'
                  ? actionInstructions({
                      ...input,
                      actionId: parsed.values.action,
                      artifact: parsed.values.artifact,
                      operation: parsed.values.operation,
                    })
                  : parsed.command === 'run-save'
                    ? saveRun({
                        ...actor,
                        runRef: parsed.values.run,
                        bodyFile: parsed.values.body,
                      })
                    : parsed.command === 'run-submit'
                      ? submitRun({
                          ...actor,
                          runRef: parsed.values.run,
                          outcome: parsed.values.outcome,
                          result: parsed.values.result,
                          verdict: parsed.values.verdict,
                        })
                      : query(input);
}
