import { identifier, MendiError, object, text } from './errors.ts';

export const actionTypes = [
  'explore',
  'propose',
  'apply',
  'review-explore',
  'review-propose',
  'review-apply',
  'revise-explore',
  'revise-propose',
  'revise-apply',
] as const;
export type ActionType = (typeof actionTypes)[number];
export type Role = 'author' | 'reviewer';
export type Phase = 'explore' | 'propose' | 'apply';
export type Verdict = 'approved' | 'changes-requested' | 'rejected';
export interface RunRecord {
  formatVersion: 1;
  recordingMode: 'product';
  deliveryId: string;
  changeId: string;
  runNumber: number;
  actionId: string;
  actionType: ActionType;
  role: Role;
  actorId: string;
  status: 'draft' | 'submitted';
  stageSkill: string;
  toolGuidance: string[];
  outcome?: 'continuing' | 'complete';
  result?: string;
  authorRunRef?: string;
  revisesRunRef?: string;
  verdict?: Verdict;
}
export function actionDefinition(value: unknown) {
  if (!(actionTypes as readonly unknown[]).includes(value))
    throw new MendiError('invalid-action', '不支持该 Action 类型。', { type: value });
  const type = value as ActionType;
  const review = type.startsWith('review-');
  const revision = type.startsWith('revise-');
  const phase = type.replace(/^(review|revise)-/, '') as Phase;
  return {
    type,
    phase,
    review,
    revision,
    role: (review ? 'reviewer' : 'author') as Role,
    skill: review ? type : phase,
  };
}
export function runLocation(ref: string, deliveryId: string, changeId: string) {
  const match =
    /^\.mendi\/runs\/([a-z0-9-]+)\/(\d{3,}-changes)\/([a-z0-9-]+)\/(\d{3,})-([a-z-]+)\/run\.md$/.exec(
      ref,
    );
  if (
    !match ||
    match[1] !== deliveryId ||
    match[3] !== changeId ||
    !Number.isSafeInteger(Number(match[4])) ||
    Number(match[4]) < 1 ||
    String(Number(match[4])).padStart(3, '0') !== match[4]
  )
    throw new MendiError('invalid-run', 'Run 路径与当前身份不一致。', { ref });
  const definition = actionDefinition(match[5]);
  return { number: Number(match[4]), batchId: match[2], ...definition };
}
export function parseRun(
  value: unknown,
  ref: string,
  deliveryId: string,
  changeId: string,
): RunRecord {
  const data = object(value, 'Run 头部');
  const location = runLocation(ref, deliveryId, changeId);
  const definition = actionDefinition(data.actionType);
  const actionId = identifier(data.actionId, 'Action ID');
  const first = new RegExp(`^${changeId}-(\\d{3,})-${definition.type}$`).exec(actionId);
  if (
    data.formatVersion !== 1 ||
    data.recordingMode !== 'product' ||
    data.deliveryId !== deliveryId ||
    data.changeId !== changeId ||
    data.runNumber !== location.number ||
    data.actionType !== location.type ||
    data.role !== definition.role ||
    data.stageSkill !== definition.skill ||
    !first ||
    Number(first[1]) < 1 ||
    Number(first[1]) > location.number ||
    String(Number(first[1])).padStart(3, '0') !== first[1]
  )
    throw new MendiError('invalid-run', 'Run 头部、路径、方法或 Action 身份不一致。', { ref });
  if (
    !Array.isArray(data.toolGuidance) ||
    data.toolGuidance.some((v) => v !== 'openspec') ||
    new Set(data.toolGuidance).size !== data.toolGuidance.length
  )
    throw new MendiError('invalid-run', '工具指导标识不符合支持范围。', { ref });
  if (data.status !== 'draft' && data.status !== 'submitted')
    throw new MendiError('invalid-run', 'Run 状态无效。', { ref });
  const record: RunRecord = {
    formatVersion: 1,
    recordingMode: 'product',
    deliveryId,
    changeId,
    runNumber: location.number,
    actionId,
    actionType: definition.type,
    role: definition.role,
    actorId: text(data.actorId, '操作者标识'),
    status: data.status,
    stageSkill: definition.skill,
    toolGuidance: data.toolGuidance as string[],
  };
  if (definition.review) {
    record.authorRunRef = text(data.authorRunRef, '审核 Author Run');
    runLocation(record.authorRunRef, deliveryId, changeId);
  } else if (data.authorRunRef !== undefined)
    throw new MendiError('invalid-run', 'Author Run 不能携带审核对象。', { ref });
  if (definition.revision) {
    record.revisesRunRef = text(data.revisesRunRef, '修订 Author Run');
    runLocation(record.revisesRunRef, deliveryId, changeId);
  } else if (data.revisesRunRef !== undefined)
    throw new MendiError('invalid-run', '非修订 Action 不能携带修订对象。', { ref });
  if (record.status === 'submitted') {
    if (data.outcome !== 'continuing' && data.outcome !== 'complete')
      throw new MendiError('invalid-run', '已提交 Run 缺少有效进展结果。', { ref });
    record.outcome = data.outcome;
    record.result = text(data.result, '提交结果');
    if (definition.review && data.outcome === 'complete') {
      if (!['approved', 'changes-requested', 'rejected'].includes(String(data.verdict)))
        throw new MendiError('invalid-run', '完成审核必须有合法 verdict。', { ref });
      record.verdict = data.verdict as Verdict;
    } else if (data.verdict !== undefined)
      throw new MendiError('invalid-run', 'Author 或未完成审核不能给 verdict。', { ref });
  } else if (data.outcome !== undefined || data.result !== undefined || data.verdict !== undefined)
    throw new MendiError('invalid-run', 'draft 不携带正式提交结果。', { ref });
  return record;
}
export function actionNext(record: RunRecord, ref: string) {
  const definition = actionDefinition(record.actionType);
  const base = { source: 'local-state', executable: false, role: record.role };
  if (record.status === 'draft')
    return {
      ...base,
      action: 'run-save-or-submit',
      status: 'working',
      reason: '当前 draft 可保存并提交；记录命令不自动执行阶段工作。',
      currentRunRef: ref,
    };
  if (record.outcome === 'continuing')
    return {
      ...base,
      action: 'action-continue',
      status: 'awaiting-instruction',
      reason: '已保存进展，当前 Action 尚未完成。',
      currentRunRef: ref,
    };
  if (!definition.review)
    return {
      ...base,
      role: 'reviewer',
      action: `review-${definition.phase}`,
      status: 'awaiting-review',
      reason: 'Author 已完成提交，等待独立 Reviewer。',
      authorRunRef: ref,
    };
  if (record.verdict === 'rejected')
    return {
      ...base,
      role: 'owner',
      action: 'owner-decision',
      status: 'stopped',
      reason: 'Reviewer rejected，停在 Owner 决策。',
      authorRunRef: record.authorRunRef,
    };
  if (record.verdict === 'changes-requested')
    return {
      ...base,
      role: 'author',
      action: `revise-${definition.phase}`,
      status: 'awaiting-instruction',
      reason: 'Reviewer 要求修改；新建修订 Action 保留原记录。',
      revisesRunRef: record.authorRunRef,
    };
  return {
    ...base,
    role: 'author',
    action:
      definition.phase === 'explore'
        ? 'propose'
        : definition.phase === 'propose'
          ? 'apply'
          : 'archive',
    status: 'awaiting-instruction',
    reason: 'Reviewer approved；下一步需显式触发，Archive 能力属于后续 Change。',
  };
}
export function assertActionStart(
  current: { ref: string; record: RunRecord } | null,
  type: ActionType,
  authorRef?: string,
  revisesRef?: string,
) {
  const requested = actionDefinition(type);
  const invalid = () => {
    throw new MendiError('action-state-conflict', '请求与当前阶段或直接提交对象不一致。', { type });
  };
  if (
    requested.review
      ? !authorRef || revisesRef !== undefined
      : requested.revision
        ? !revisesRef || authorRef !== undefined
        : authorRef !== undefined || revisesRef !== undefined
  )
    invalid();
  if (!current) {
    if (type !== 'explore') invalid();
    return;
  }
  const previous = actionDefinition(current.record.actionType);
  if (
    current.record.status !== 'submitted' ||
    current.record.outcome !== 'complete' ||
    current.record.verdict === 'rejected'
  )
    invalid();
  if (requested.revision) {
    const target = previous.review ? current.record.authorRunRef : current.ref;
    if (requested.phase !== previous.phase || revisesRef !== target) invalid();
  } else if (requested.review) {
    if (previous.review || requested.phase !== previous.phase || authorRef !== current.ref)
      invalid();
  } else if (
    !previous.review ||
    current.record.verdict !== 'approved' ||
    actionNext(current.record, current.ref).action !== type
  )
    invalid();
}
