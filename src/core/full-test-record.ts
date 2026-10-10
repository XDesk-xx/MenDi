import { MendiError, object, text } from './errors.ts';
import { declaration, parseVerificationScope, type FullTest } from './delivery-verification.ts';
import { runLocation } from './actions.ts';
import { executionLocation } from './test-execution.ts';
import { deliveryLocation } from './delivery-runs.ts';
export function parseFullTest(data: Record<string, unknown>, id: string, number: number): FullTest {
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
        target.number >= number ||
        (key === 'archiveRunRef'
          ? target.type !== 'archive'
          : key === 'reviewRunRef'
            ? target.type !== 'review-apply'
            : !['apply', 'revise-apply'].includes(target.type))
      )
        throw new MendiError('invalid-run', '批准快照路径身份无效。');
    }
    const author = runLocation(String(fact.authorRunRef), id, String(fact.changeId));
    const review = runLocation(String(fact.reviewRunRef), id, String(fact.changeId));
    const archive = runLocation(String(fact.archiveRunRef), id, String(fact.changeId));
    if (
      author.number >= review.number ||
      review.number >= archive.number ||
      author.batchId !== review.batchId ||
      review.batchId !== archive.batchId
    )
      throw new MendiError('invalid-run', '批准快照顺序或批次矛盾。');
  }
  if (full.repairApproval !== undefined) {
    const approval = object(full.repairApproval, '修复批准');
    if (
      deliveryLocation(text(approval.reviewRunRef, 'Review'), id).number >= number ||
      deliveryLocation(text(approval.authorRunRef, 'Author'), id).number >= number ||
      deliveryLocation(text(approval.reviewRunRef, 'Review'), id).type !==
        'review-delivery-repair' ||
      !['delivery-repair', 'revise-delivery-repair'].includes(
        deliveryLocation(text(approval.authorRunRef, 'Author'), id).type,
      ) ||
      text(approval.authorActor, 'Author') === text(approval.reviewerActor, 'Reviewer')
    )
      throw new MendiError('invalid-run', '修复批准身份错误。');
    if (
      deliveryLocation(String(approval.authorRunRef), id).number >=
      deliveryLocation(String(approval.reviewRunRef), id).number
    )
      throw new MendiError('invalid-run', '修复批准顺序矛盾。');
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
  return { ...(full as unknown as FullTest), ...declaration(full), scope };
}
