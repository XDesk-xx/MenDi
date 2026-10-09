#!/usr/bin/env node

import { bindChange, openDelivery, query } from '../application/project.ts';
import { MendiError, errorInfo } from '../core/errors.ts';
import { help, parseArguments } from './arguments.ts';

const args = process.argv.slice(2);
try {
  const parsed = parseArguments(args);
  if (parsed.command === 'help') console.log(help);
  else {
    const input = { project: parsed.values.project, openspecBin: parsed.values['openspec-bin'] };
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
          : query(input);
    if (parsed.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(
        `项目：${result.projectRoot}\nOpenSpec：${result.openspec.version} (${result.openspec.entry})`,
      );
      if (result.local) {
        console.log(
          `Delivery：${result.local.deliveryId} ${result.local.title} (${result.local.state})\n目标：${result.local.goal}\n槽位：${result.local.plannedChanges.map((slot) => slot.slot).join(', ')}\nChange：${result.local.activeChangeId ?? '尚未关联'}`,
        );
      } else console.log('MenDi 尚未 Open。');
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
