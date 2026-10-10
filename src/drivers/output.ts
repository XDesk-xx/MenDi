import type { Arguments } from './arguments.ts';
import type { dispatch } from './dispatch.ts';
import type { startAction } from '../application/actions.ts';

// 面向人的呈现不访问项目，也不执行推荐的下一步。
export function display(result: Awaited<ReturnType<typeof dispatch>>, parsed: Arguments) {
  console.log(
    `项目：${result.projectRoot}\n${result.openspec ? `OpenSpec：${result.openspec.version} (${result.openspec.entry})` : '执行：local-only；上游未访问。'}`,
  );
  if (result.local) {
    console.log(
      `Delivery：${result.local.deliveryId} ${result.local.title} (${result.local.state})\n目标：${result.local.goal}\n槽位：${result.local.plannedChanges.map((slot) => slot.slot).join(', ')}\nChange：${result.local.activeChangeId ?? (result.local.changeBindings.some((binding) => binding.state === 'archived') ? '已归档、当前无活动 Change' : '尚未关联')}`,
    );
  } else if (!result.operation.startsWith('test-')) console.log('MenDi 尚未 Open。');
  if ('entries' in result)
    for (const entry of result.entries)
      console.log(
        `${entry.kind}：${String(entry.scriptName)}；${entry.available ? String(entry.scriptText) : entry.reason}`,
      );
  if ('executionId' in result) {
    console.log(`执行：${result.executionId ?? '未分配'}；结果：${result.outcome}`);
    const record =
      'record' in result ? result.record : 'observed' in result ? result.observed : undefined;
    if (record)
      console.log(
        `观察命令：${JSON.stringify(record.command)}\ncwd：${record.cwd}\n依赖预检：${JSON.stringify(record.dependencyCheck)}\n日志：${record.stdoutRef} / ${record.stderrRef}`,
      );
    if (record?.reason) console.log(`原因：${record.reason}`);
    if ('error' in result) console.log(JSON.stringify(result.error));
    console.log('scope:command；不是正式 Delivery Full Test。');
  }
  if ('run' in result && result.run)
    console.log(`Action：${result.run.actionId}\nRun：${result.run.ref} (${result.run.status})`);
  const recorded =
    parsed.command === 'action-start' ||
    parsed.command === 'action-continue' ||
    parsed.command === 'action-resolve'
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
  if ('instructions' in result) console.log(JSON.stringify(result.instructions, null, 2));
  if ('classification' in result)
    console.log(
      JSON.stringify(
        {
          classification: result.classification,
          lock: result.lock,
          blockedByLock: result.blockedByLock,
          current: result.current,
          reservation: result.reservation,
          temporaryPaths: result.temporaryPaths,
          errors: result.errors,
          disposition: result.disposition,
        },
        null,
        2,
      ),
    );
}
