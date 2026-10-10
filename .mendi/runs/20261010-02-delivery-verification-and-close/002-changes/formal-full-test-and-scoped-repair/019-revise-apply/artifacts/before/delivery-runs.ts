import { MendiError, object, text } from './errors.ts';
import type { Role, Verdict } from './actions.ts';
import {
  declaration,
  parseVerificationScope,
  type FullTest,
  type Repair,
} from './delivery-verification.ts';
import { runLocation } from './actions.ts';
import { executionLocation } from './test-execution.ts';

export const deliveryTypes = [
  'delivery-full-test',
  'delivery-repair',
  'revise-delivery-repair',
  'review-delivery-repair',
] as const;
export type DeliveryType = (typeof deliveryTypes)[number];
export function deliveryDefinition(value: unknown) {
  if (!deliveryTypes.includes(value as DeliveryType))
    throw new MendiError('invalid-action', '不支持 Delivery Action。');
  const type = value as DeliveryType;
  const review = type === 'review-delivery-repair';
  const phase = type === 'delivery-full-test' ? type : 'delivery-repair';
  return {
    type,
    phase,
    role: (review ? 'reviewer' : 'author') as Role,
    skill: review ? type : phase,
  };
}
export function deliveryLocation(ref: string, id: string) {
  const match =
    /^\.mendi\/runs\/([a-z0-9-]+)\/(\d{3,})-(delivery-full-test|delivery-repair|revise-delivery-repair|review-delivery-repair)\/run\.md$/.exec(
      ref,
    );
  if (
    !match ||
    match[1] !== id ||
    !Number.isSafeInteger(Number(match[2])) ||
    Number(match[2]) < 1 ||
    String(Number(match[2])).padStart(3, '0') !== match[2]
  )
    throw new MendiError('invalid-run', 'Delivery Run 路径身份不一致。', { ref });
  return { number: Number(match[2]), ...deliveryDefinition(match[3]) };
}
export interface DeliveryRunRecord {
  formatVersion: 1;
  recordingMode: 'product';
  scope: 'delivery';
  deliveryId: string;
  changeId: null;
  runNumber: number;
  actionId: string;
  actionType: DeliveryType;
  role: Role;
  actorId: string;
  status: 'draft' | 'submitted';
  stageSkill: string;
  toolGuidance: string[];
  outcome?: 'continuing' | 'complete';
  result?: string;
  verdict?: Verdict;
  authorRunRef?: string;
  revisesRunRef?: string;
  fullTest?: FullTest;
  repair?: Repair;
  ownerDecision?: never;
}
export function parseDeliveryRun(value: unknown, ref: string, id: string): DeliveryRunRecord {
  const data = object(value, 'Delivery Run');
  const record = { ...data } as unknown as DeliveryRunRecord;
  const location = deliveryLocation(ref, id);
  const first = new RegExp(`^${id}-(\\d{3,})-${location.type}$`).exec(String(data.actionId));
  if (
    data.formatVersion !== 1 ||
    data.recordingMode !== 'product' ||
    data.scope !== 'delivery' ||
    data.deliveryId !== id ||
    data.changeId !== null ||
    data.runNumber !== location.number ||
    data.actionType !== location.type ||
    data.role !== location.role ||
    data.stageSkill !== location.skill ||
    !first ||
    Number(first[1]) < 1 ||
    Number(first[1]) > location.number ||
    String(Number(first[1])).padStart(3, '0') !== first[1] ||
    !Array.isArray(data.toolGuidance) ||
    data.toolGuidance.length ||
    !['draft', 'submitted'].includes(String(data.status))
  )
    throw new MendiError('invalid-run', 'Delivery Run 头部、方法或 Action 身份不一致。');
  text(data.actorId, 'actor');
  if (location.type === 'delivery-full-test' && Number(first![1]) !== location.number)
    throw new MendiError('invalid-run', '正式 Full Test 不沿旧 Action 继续。');
  if (data.ownerDecision !== undefined || data.archive !== undefined)
    throw new MendiError('invalid-run', 'Delivery Run 不支持 Owner resolve / Archive。');
  if (data.status === 'submitted') {
    if (!['continuing', 'complete'].includes(String(data.outcome)))
      throw new MendiError('invalid-run', '提交缺少 outcome。');
    text(data.result, 'result');
    if (location.role === 'reviewer' && data.outcome === 'complete') {
      if (!['approved', 'changes-requested', 'rejected'].includes(String(data.verdict)))
        throw new MendiError('invalid-run', '审核缺少 verdict。');
    } else if (data.verdict !== undefined)
      throw new MendiError('invalid-run', 'Author / 未完成审核不能给 verdict。');
  } else if (data.outcome !== undefined || data.result !== undefined || data.verdict !== undefined)
    throw new MendiError('invalid-run', 'draft 不能携带提交结论。');
  for (const [key, needed] of [
    ['authorRunRef', location.role === 'reviewer'],
    ['revisesRunRef', location.type === 'revise-delivery-repair'],
  ] as const) {
    if (needed) {
      const target = deliveryLocation(text(data[key], key), id);
      if (
        target.number >= location.number ||
        !['delivery-repair', 'revise-delivery-repair'].includes(target.type)
      )
        throw new MendiError('invalid-run', '直接 Author 身份无效。');
    } else if (data[key] !== undefined)
      throw new MendiError('invalid-run', '多余的直接 Author 字段。');
  }
  if (location.type === 'delivery-full-test') {
    if (data.repair !== undefined)
      throw new MendiError('invalid-run', 'Full Test 不能携带 repair。');
    const full = object(data.fullTest, '正式测试');
    declaration(full);
    const scope = parseVerificationScope(full.scope);
    if (!Array.isArray(full.approvals) || full.approvals.length !== scope.completed.length)
      throw new MendiError('invalid-run', '缺少已核对批准快照。');
    for (const [i, v] of full.approvals.entries()) {
      const fact = object(v, '批准事实');
      if (
        fact.changeId !== scope.completed[i].changeId ||
        text(fact.authorActor, 'Author') === text(fact.reviewerActor, 'Reviewer')
      )
        throw new MendiError('invalid-run', '批准快照身份矛盾。');
      for (const key of ['archiveRunRef', 'reviewRunRef', 'authorRunRef']) {
        const target = runLocation(text(fact[key], key), id, String(fact.changeId));
        if (
          target.number >= location.number ||
          (key === 'archiveRunRef'
            ? target.type !== 'archive'
            : key === 'reviewRunRef'
              ? target.type !== 'review-apply'
              : !['apply', 'revise-apply'].includes(target.type))
        )
          throw new MendiError('invalid-run', '批准快照路径身份无效。');
      }
    }
    if (full.repairApproval !== undefined) {
      const approval = object(full.repairApproval, '修复批准');
      if (
        deliveryLocation(text(approval.reviewRunRef, 'Review'), id).number >= location.number ||
        deliveryLocation(text(approval.authorRunRef, 'Author'), id).number >= location.number ||
        deliveryLocation(text(approval.reviewRunRef, 'Review'), id).type !==
          'review-delivery-repair' ||
        !['delivery-repair', 'revise-delivery-repair'].includes(
          deliveryLocation(text(approval.authorRunRef, 'Author'), id).type,
        ) ||
        text(approval.authorActor, 'Author') === text(approval.reviewerActor, 'Reviewer')
      )
        throw new MendiError('invalid-run', '修复批准身份错误。');
    }
    const entry = object(full.entry, '实际入口');
    for (const k of ['scriptName', 'scriptText', 'pnpmBin']) text(entry[k], k);
    if (full.executionId !== null) executionLocation(String(full.executionId), id);
    if (full.phase === 'finished' && full.executionId === null) text(full.reason, '未启动原因');
    if (
      !['prepared', 'running', 'finished'].includes(String(full.phase)) ||
      !['not-run', 'passed', 'failed', 'interrupted', 'unknown'].includes(String(full.outcome)) ||
      !(full.executionId === null || /^\d{3,}-full$/.test(String(full.executionId))) ||
      (full.phase === 'prepared' && (full.executionId !== null || full.outcome !== 'not-run')) ||
      (full.phase === 'running' && (full.executionId === null || full.outcome !== 'unknown')) ||
      (full.phase === 'finished'
        ? data.status !== 'submitted' ||
          data.outcome !== 'complete' ||
          data.result !== full.outcome ||
          (full.executionId === null && full.outcome !== 'not-run')
        : data.status !== 'draft')
    )
      throw new MendiError('invalid-run', '正式执行终态或意图不一致。');
    record.fullTest = { ...(full as unknown as FullTest), ...declaration(full), scope };
  } else {
    if (data.fullTest !== undefined) throw new MendiError('invalid-run', '修复不能携带 fullTest。');
    const repair = object(data.repair, '局部修复');
    const source = deliveryLocation(text(repair.failedFullTestRunRef, '直接失败'), id);
    if (source.type !== 'delivery-full-test' || source.number >= location.number)
      throw new MendiError('invalid-run', '失败来源必须是正式 Run。');
    const scope = parseVerificationScope(repair.scope);
    declaration({
      collection: repair.collection,
      basis: { materials: text(repair.reason, '修复原因'), changes: '' },
    });
    record.repair = {
      failedFullTestRunRef: String(repair.failedFullTestRunRef),
      scope,
      collection: repair.collection as string[],
      reason: String(repair.reason),
    };
  }
  return record;
}
export function deliveryNext(run: DeliveryRunRecord, ref: string) {
  const base = { source: 'local-state', executable: false, currentRunRef: ref };
  if (run.fullTest) {
    const outcome = run.status === 'submitted' ? run.fullTest.outcome : 'unknown';
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
