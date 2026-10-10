import { selected, state, type Selection, type OperationOptions } from './project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { currentRun, readRun, type RunDocument } from '../adapters/runs.ts';
import { actionDefinition, actionNext } from '../core/actions.ts';
import { MendiError, text } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';

export interface ActorInput extends Selection {
  role: string;
  actor: string;
}
export interface ActionOptions extends OperationOptions {
  methodsRoot?: string;
}
export function context(input: ActorInput, options: ActionOptions) {
  text(input.actor, '操作者标识');
  if (input.role !== 'author' && input.role !== 'reviewer')
    throw new MendiError('action-role-mismatch', '必须声明 author 或 reviewer。');
  const selectedProject = selected(input, options);
  const workspace = readWorkspace(selectedProject.root);
  checkWorkspace(workspace);
  if (workspace.bindings.some((b) => b.state === 'archiving'))
    throw new MendiError(
      'archive-pending',
      'Archive 过渡期间仅允许明确的 Archive 命令、笔记和合法 Owner rollback。',
    );
  selectedProject.upstream.status(workspace.activeChangeId!);
  return { ...selectedProject, workspace };
}
export function checkWorkspace(workspace: Workspace | null): asserts workspace is Workspace {
  if (!workspace) throw new MendiError('delivery-not-open', '目标尚未 Open。');
  if (workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', '人工 bootstrap 不通过 Action / Run 命令修改。');
  if (workspace.state !== 'open' || !workspace.activeChangeId)
    throw new MendiError('invalid-action', 'Action 要求 open Delivery 的活动 Change。');
}
export function matchingActor(run: RunDocument, input: ActorInput) {
  if (run.record.role !== input.role || run.record.actorId !== input.actor)
    throw new MendiError('action-role-mismatch', '当前 Run 的角色或操作者不匹配。');
}
export function authorInput(
  root: string,
  workspace: Workspace,
  ref: string,
  type: string,
  actor: string,
  review: boolean,
) {
  const author = readRun(root, ref, workspace.id, workspace.activeChangeId!);
  if (
    author.record.role !== 'author' ||
    author.record.status !== 'submitted' ||
    author.record.outcome !== 'complete' ||
    !author.body.trim() ||
    actionDefinition(author.record.actionType).phase !== actionDefinition(type).phase
  )
    throw new MendiError('review-input-invalid', '需要匹配阶段、已完成且有正文的 Author 提交。', {
      ref,
    });
  if (review && author.record.actorId === actor)
    throw new MendiError('self-review', 'Reviewer 不能与 Author 使用同一操作者标识。', { ref });
  return author;
}
export function draft(root: string, workspace: Workspace, input: ActorInput & { runRef: string }) {
  checkWorkspace(workspace);
  const run = currentRun(root, workspace);
  if (!run || run.ref !== input.runRef)
    throw new MendiError('run-not-current', '指定 Run 不是当前 draft。');
  matchingActor(run, input);
  if (run.record.status !== 'draft')
    throw new MendiError('run-already-submitted', '已提交 Run 不能保存或重新提交。');
  return run;
}
export function output(
  root: string,
  upstream: ReturnType<typeof selected>['upstream'],
  operation: string,
  workspace: Workspace,
  run: RunDocument,
) {
  return {
    ok: true as const,
    operation,
    projectRoot: root,
    openspec: upstream.info(),
    local: state(workspace),
    run: { ref: run.ref, ...run.record },
    next: actionNext(run.record, run.ref),
  };
}
