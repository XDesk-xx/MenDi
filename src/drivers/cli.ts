#!/usr/bin/env node

import { bindChange, openDelivery, query } from '../application/project.ts';
import { startAction, continueAction, saveRun, submitRun } from '../application/actions.ts';
import { MendiError, errorInfo } from '../core/errors.ts';
import { help, parseArguments } from './arguments.ts';

const args = process.argv.slice(2);
try {
  const parsed = parseArguments(args);
  if (parsed.command === 'help') console.log(help);
  else {
    const input = { project: parsed.values.project, openspecBin: parsed.values['openspec-bin'] };
    const actor = { ...input, role: parsed.values.role, actor: parsed.values.actor };
    const result =
      parsed.command === 'delivery-open'
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
              : parsed.command === 'run-save'
                ? saveRun({ ...actor, runRef: parsed.values.run, bodyFile: parsed.values.body })
                : parsed.command === 'run-submit'
                  ? submitRun({
                      ...actor,
                      runRef: parsed.values.run,
                      outcome: parsed.values.outcome,
                      result: parsed.values.result,
                      verdict: parsed.values.verdict,
                    })
                  : query(input);
    if (parsed.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(
        `项目：${result.projectRoot}\nOpenSpec：${result.openspec.version} (${result.openspec.entry})`,
      );
      if (result.local) {
        console.log(
          `Delivery：${result.local.deliveryId} ${result.local.title} (${result.local.state})\n目标：${result.local.goal}\n槽位：${result.local.plannedChanges.map((slot) => slot.slot).join(', ')}\nChange：${result.local.activeChangeId ?? (result.local.changeBindings.some((binding) => binding.state === 'archived') ? '已归档、当前无活动 Change' : '尚未关联')}`,
        );
      } else console.log('MenDi 尚未 Open。');
      if ('run' in result && result.run)
        console.log(
          `Action：${result.run.actionId}\nRun：${result.run.ref} (${result.run.status})`,
        );
      const recorded =
        parsed.command === 'action-start' || parsed.command === 'action-continue'
          ? (result as ReturnType<typeof startAction>)
          : undefined;
      if (recorded)
        for (const method of [recorded.methods.stage, ...recorded.methods.guidance])
          console.log(`\n方法：${method.ref}\n${method.content}`);
      if (recorded?.incompleteReservations.length)
        console.log(
          `不完整编号占位：${recorded.incompleteReservations.map((item) => item.ref).join(', ')}`,
        );
      if ('next' in result) {
        console.log(`下一步：${String(result.next.action)}，来源：${result.next.source}`);
        if ('reason' in result.next) console.log(String(result.next.reason));
        if ('upstream' in result && result.upstream)
          console.log(
            `上游产物：${result.upstream.artifacts.map((a) => `${a.id}=${a.status}`).join(', ')}；这是产物事实，批准以独立审核记录为准。`,
          );
      }
    }
  }
} catch (error) {
  const failure =
    error instanceof MendiError
      ? error
      : new MendiError('operation-failed', '操作失败。', errorInfo(error));
  const result = {
    ok: false,
    error: {
      code: failure.code,
      message: failure.message,
      details: failure.details,
      fix: failure.fix,
    },
  };
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else
    console.error(
      `${failure.code}：${failure.message}\n${failure.fix}\n${JSON.stringify(failure.details)}`,
    );
  process.exitCode = failure.exitCode;
}
