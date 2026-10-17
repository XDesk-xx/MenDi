import type { Arguments } from './arguments.ts';
import type { dispatch } from './dispatch.ts';
import type { loadMethods } from '../adapters/methods.ts';

// 面向人的呈现不访问项目，也不执行推荐的下一步。
export function display(result: Awaited<ReturnType<typeof dispatch>>, parsed: Arguments) {
  console.log(
    `项目：${result.projectRoot}\n${result.openspec ? `OpenSpec：${result.openspec.version} (${result.openspec.entry})` : '执行：local-only；上游未访问。'}`,
  );
  if (result.local) {
    console.log(
      `Delivery：${result.local.deliveryId} ${result.local.title} (${result.local.state})\n目标：${result.local.goal}\n槽位：${result.local.plannedChanges.map((slot) => slot.slot).join(', ')}\nChange：${result.local.activeChangeId ?? (result.local.changeBindings.some((binding) => binding.state === 'archived') ? '已归档、当前无活动 Change' : '尚未关联')}`,
    );
    if ('rounds' in result.local && result.local.rounds)
      console.log(
        `当前轮：${result.local.currentRoundId}；历轮：${result.local.rounds.map((r) => `${r.id}(${r.state})`).join(', ')}`,
      );
    if ('compatibility' in result.local)
      console.log(
        result.local.compatibility === 'legacy-product-read-only'
          ? '格式：旧 product，只读；写入前先预览并显式迁移，旧中断先用兼容旧版恢复。'
          : '来源：manual-bootstrap，人工记录只读。',
      );
  } else if ('pending' in result) console.log('生命周期提交未确认，停止并核对现场。');
  else if (!result.operation.startsWith('test-')) console.log('MenDi 尚未 Open。');
  if ('historicalRound' in result) {
    const round = result.historicalRound;
    console.log(
      `轮次：${round.id} (${round.state})；只读保存摘要\n目标：${round.scope.goal}\n槽位：${round.scope.plannedChanges.map((p) => p.slot).join(', ')}\n来源：${JSON.stringify(round.origin)}\n批次：${round.currentBatchId ?? '未开始'}\n收口：${round.closeRunRef ?? '尚未收口'}`,
    );
  }
  if ('plan' in result && result.plan) console.log(JSON.stringify(result.plan, null, 2));
  if (result.operation.startsWith('delivery-migrate-') && 'result' in result)
    console.log(`迁移：${result.result}`);
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
  if ('run' in result && result.run && 'lifecycle' in result.run && result.run.lifecycle) {
    const value = result.run.lifecycle;
    console.log(`生命周期：${value.operation}；本次持久事实。`);
    if (value.applicability)
      console.log(
        `材料：${value.applicability.materials}\n差异：${value.applicability.changes}\n适用性：${value.applicability.conclusion}；${value.applicability.reason}`,
      );
    console.log('持久收口不自动重验；显式结果读取仍检查直接执行和日志。后续操作等待 Owner 授权。');
  }
  if ('verification' in result && result.verification) {
    const facts = result.verification;
    console.log(
      `正式 Full Test：${facts.outcome}；scope:delivery\n完整集合：${facts.collection.join(' / ')}\n材料声明：${JSON.stringify(facts.basis)}\n范围 / 命令匹配：${facts.scopeMatch} / ${facts.commandMatch}\nmaterialApplicability:${facts.materialApplicability}`,
    );
    console.log(
      `结果所属轮：${'roundId' in facts ? facts.roundId : '旧格式未结构化'}；原 outcome 与当前适用性分别解释。`,
    );
    if (facts.child)
      console.log(
        `实际命令：${JSON.stringify(facts.child.command)}\ncwd：${facts.child.cwd}\n日志：${facts.child.stdoutRef} / ${facts.child.stderrRef}`,
      );
    console.log(
      '通过仅证明本次声明下的完整执行；当前材料适用性与 Close 仍需阶段判断和 Owner 指令。',
    );
  }
  if ('error' in result && result.operation.startsWith('delivery-'))
    console.log(JSON.stringify(result.error));
  if (
    result.operation.startsWith('delivery-') &&
    'outcome' in result &&
    !('verification' in result)
  )
    console.log(`正式结果：${result.outcome}；当前现场未作为通过发布。`);
  if ('methods' in result) {
    const methods = result.methods as ReturnType<typeof loadMethods>;
    for (const method of [methods.stage, ...methods.guidance])
      console.log(`\n方法：${method.ref}\n${method.content}`);
  }
  if ('incompleteReservations' in result) {
    const reservations = result.incompleteReservations as { ref: string }[];
    if (reservations.length)
      console.log(`不完整编号占位：${reservations.map((item) => item.ref).join(', ')}`);
  }
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
