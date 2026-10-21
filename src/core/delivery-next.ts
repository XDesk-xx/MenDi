import type { DeliveryRunRecord } from './delivery-runs.ts';
import type { FullTest } from './delivery-verification.ts';

export function deliveryNext(
  run: DeliveryRunRecord,
  ref: string,
  observedOutcome?: FullTest['outcome'],
) {
  const base = { source: 'local-state', executable: false, currentRunRef: ref };
  if (run.attempt?.version === 2) {
    const outcome =
      run.status === 'submitted' && observedOutcome !== 'unknown'
        ? run.attempt.formalOutcome
        : 'unknown';
    const unknown = outcome === 'unknown';
    const passed = outcome === 'passed';
    const environment =
      run.attempt.observation?.protocolState === 'valid' &&
      !!run.attempt.observation.environmentFailure;
    const failed = (outcome === 'failed' || outcome === 'invalid') && !environment;
    return {
      ...base,
      role: unknown || passed ? 'owner' : 'author',
      action: unknown
        ? 'owner-decision'
        : passed
          ? 'delivery-close'
          : failed
            ? 'delivery-repair'
            : 'delivery-full-test',
      status: unknown ? 'stopped' : 'awaiting-owner-instruction',
      reason: unknown
        ? '本次执行 / 清理 / 持久读回未确认，保留现场并核对。'
        : passed
          ? '本次完整正式 Full Test passed；核对材料适用性并等待 Owner 另行授权 Close。'
          : failed
            ? '保留真实失败；实质修复须独立 Review，安全确认的纯环境准备处置可申请完整重跑。'
            : '按真实阻断 / 未执行 / 取消事实处置，确认安全后显式重新完整执行。',
    };
  }
  if (run.attempt || run.verification) {
    const plan = run.attempt?.plan ?? run.verification!.plan;
    const progress = run.attempt?.progress ?? run.verification!.progress;
    const knownStopped =
      run.attempt?.phase === 'finished' &&
      (run.attempt.executionId === null ||
        run.attempt.observation?.cancelled === true ||
        run.attempt.observation?.notRun === true);
    const unknown =
      run.status !== 'submitted' ||
      (run.attempt?.observation?.protocolState === 'unconfirmed' && !knownStopped) ||
      observedOutcome === 'unknown';
    const failed =
      run.attempt?.observation?.protocolState === 'invalid' ||
      progress.some(
        (f) => f.state === 'failed' && plan.groups.find((g) => g.id === f.id)?.required,
      );
    return {
      ...base,
      role: unknown || run.verification?.conclusion === 'verified' ? 'owner' : 'author',
      action: unknown
        ? 'owner-decision'
        : run.verification?.conclusion === 'verified'
          ? 'delivery-next'
          : failed
            ? 'delivery-repair'
            : progress.some(
                  (f) => f.state !== 'passed' && plan.groups.find((g) => g.id === f.id)?.required,
                )
              ? 'delivery-full-test'
              : 'delivery-verification',
      status: unknown ? 'stopped' : 'awaiting-owner-instruction',
      reason: unknown
        ? '本次终态 / 资源未确认，核对现场。'
        : '按完整计划、直接组来源及必要审核显式继续；选中范围成功不等于完整候选。',
    };
  }
  if (run.lifecycle)
    return {
      ...base,
      role:
        run.status === 'draft' ? 'owner' : run.actionType === 'delivery-close' ? 'owner' : 'author',
      action:
        run.status === 'draft'
          ? 'owner-decision'
          : run.actionType === 'delivery-close'
            ? 'delivery-next'
            : 'change-bind',
      status: run.status === 'draft' ? 'stopped' : 'awaiting-owner-instruction',
      reason:
        run.status === 'draft'
          ? '生命周期提交未确认，核对现场后显式继续。'
          : '仅保存本次生命周期事实；后续工作需要实际 Owner 授权。',
    };
  if (run.fullTest) {
    const outcome =
      run.status === 'submitted' ? (observedOutcome ?? run.fullTest.outcome) : 'unknown';
    return {
      ...base,
      role: outcome === 'passed' || outcome === 'unknown' ? 'owner' : 'author',
      action:
        outcome === 'passed'
          ? 'delivery-next'
          : outcome === 'failed'
            ? 'delivery-repair'
            : outcome === 'unknown'
              ? 'owner-decision'
              : 'delivery-full-test',
      status: outcome === 'unknown' ? 'stopped' : 'awaiting-owner-instruction',
      reason:
        outcome === 'passed'
          ? '完整执行已通过；当前材料适用性仍须阶段判断，等待 Owner 收口。'
          : '按当前真实结果显式处理，不自动重试或清理。',
    };
  }
  if (run.status === 'draft')
    return {
      ...base,
      role: run.role,
      action: 'run-save-or-submit',
      status: 'working',
      reason: '准备实际工作及正文。',
    };
  if (run.outcome === 'continuing')
    return {
      ...base,
      role: run.role,
      action: 'action-continue',
      status: 'awaiting-instruction',
      reason: '沿当前 Action 显式继续。',
    };
  if (run.role === 'author')
    return {
      ...base,
      role: 'reviewer',
      action: 'review-delivery-repair',
      status: 'awaiting-review',
      authorRunRef: ref,
      reason: '等待独立定向审核。',
    };
  return {
    ...base,
    role: run.verdict === 'rejected' ? 'owner' : 'author',
    action:
      run.verdict === 'approved'
        ? 'delivery-full-test'
        : run.verdict === 'changes-requested'
          ? 'revise-delivery-repair'
          : 'owner-decision',
    status: run.verdict === 'rejected' ? 'stopped' : 'awaiting-instruction',
    reason: '按当前独立 verdict 交接；批准不代替完整执行。',
  };
}
