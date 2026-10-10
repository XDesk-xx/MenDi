import { selected } from './project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { currentRun, readRun } from '../adapters/runs.ts';
import { createRun, writeAction } from '../adapters/action-store.ts';
import { loadMethods } from '../adapters/methods.ts';
import { archivedCount } from '../core/archive.ts';
import { assertActionStart } from '../core/actions.ts';
import { MendiError, text } from '../core/errors.ts';
import { checkWorkspace, output, type ActionOptions } from './action-context.ts';
import type { StartInput } from './actions.ts';
import type { OpenSpec } from '../adapters/openspec.ts';
import type { Workspace } from '../core/records.ts';

export function archiveApproval(
  root: string,
  workspace: Workspace,
  reviewRef?: string,
  authorRef?: string,
) {
  const review = reviewRef
    ? readRun(root, reviewRef, workspace.id, workspace.activeChangeId!)
    : currentRun(root, workspace);
  if (
    !review ||
    review.record.actionType !== 'review-apply' ||
    review.record.status !== 'submitted' ||
    review.record.outcome !== 'complete' ||
    review.record.verdict !== 'approved' ||
    !review.body.trim()
  )
    throw new MendiError(
      'archive-approval-invalid',
      'Archive 需要当前完整 approved Review Apply。',
    );
  const author = readRun(
    root,
    review.record.authorRunRef!,
    workspace.id,
    workspace.activeChangeId!,
  );
  if (
    (authorRef !== undefined && author.ref !== authorRef) ||
    !['apply', 'revise-apply'].includes(author.record.actionType) ||
    author.record.role !== 'author' ||
    author.record.status !== 'submitted' ||
    author.record.outcome !== 'complete' ||
    !author.body.trim() ||
    review.record.actorId === author.record.actorId ||
    author.record.runNumber >= review.record.runNumber
  )
    throw new MendiError(
      'archive-approval-invalid',
      'Archive 直接 Author / Review 独立性或完整性无效。',
    );
  return { review, author };
}
export function archiveReady(upstream: OpenSpec, change: string) {
  const inputs = upstream.operationInstructions(change, 'apply');
  if (
    inputs.state !== 'all_done' ||
    inputs.progress.remaining !== 0 ||
    !inputs.taskTrackingConfigured
  )
    throw new MendiError(
      'archive-tasks-incomplete',
      'Archive 需要真实 Apply all_done / remaining=0。',
    );
  if (['proposal', 'design', 'specs', 'tasks'].some((key) => !inputs.contextFiles[key]?.length))
    throw new MendiError('archive-planning-incomplete', 'Archive 缺当前必要规划输入。');
  return inputs;
}
export function prepareArchive(input: StartInput, options: ActionOptions = {}) {
  if (
    input.role !== 'author' ||
    input.authorRunRef !== undefined ||
    input.revisesRunRef !== undefined
  )
    throw new MendiError(
      'action-role-mismatch',
      'Archive 准备仅允许 Author，不接受 Review / revise 对象参数。',
    );
  text(input.actor, '操作者标识');
  const { root, upstream } = selected(input, options);
  const workspace = readWorkspace(root);
  function check(current: Workspace | null) {
    checkWorkspace(current);
    if (
      current.activeChangeId !== input.changeId ||
      current.bindings.some((b) => b.state === 'archiving')
    )
      throw new MendiError('action-state-conflict', 'Archive 必须针对当前 approved Apply 交接。');
    assertActionStart(currentRun(root, current), 'archive');
    const approval = archiveApproval(root, current);
    archiveReady(upstream, input.changeId);
    const countBasis = archivedCount(current.project);
    if (!Number.isSafeInteger(countBasis + 1))
      throw new MendiError('archive-count-conflict', '累计编号越界。');
    return { ...approval, countBasis };
  }
  const prior = check(workspace);
  const tools = input.tool ? [input.tool] : [];
  const methods = loadMethods('archive', tools, options.methodsRoot);
  const result = writeAction(
    root,
    'archive-prepare',
    (current, written) => {
      const verified = check(current);
      if (JSON.stringify(verified) !== JSON.stringify(prior))
        throw new MendiError('archive-input-changed', '锁内直接输入已变化。');
      return createRun(
        root,
        current,
        {
          formatVersion: 1,
          recordingMode: 'product',
          deliveryId: current.id,
          changeId: input.changeId,
          actionType: 'archive',
          role: 'author',
          actorId: input.actor,
          status: 'draft',
          stageSkill: 'archive',
          toolGuidance: tools,
          archive: {
            reviewRunRef: verified.review.ref,
            authorRunRef: verified.author.ref,
            countBasis: verified.countBasis,
            ordinal: verified.countBasis + 1,
            phase: 'prepared',
            attempt: 0,
          },
        },
        written,
        options.observeWrite,
      );
    },
    options.observeWrite,
  );
  return {
    ...output(root, upstream, 'action-start', result.workspace, result.run),
    methods,
    incompleteReservations: result.incompleteReservations,
  };
}
