import { selected, type Selection } from './project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { currentRun } from '../adapters/runs.ts';
import { actionDefinition } from '../core/actions.ts';
import { MendiError } from '../core/errors.ts';
import { checkWorkspace, output, type ActionOptions } from './action-context.ts';
import type { ArtifactInstructions } from '../adapters/openspec.ts';
import type { OperationInstructions, ApplyInstructions } from '../adapters/openspec-operations.ts';

type InstructionInput = Selection & { actionId: string; artifact?: string; operation?: string };
export function actionInstructions(
  input: Selection & { actionId: string; operation: 'apply'; artifact?: never },
  options?: ActionOptions,
): ReturnType<typeof output> & { instructions: ApplyInstructions };
export function actionInstructions(
  input: Selection & { actionId: string; operation: 'archive'; artifact?: never },
  options?: ActionOptions,
): ReturnType<typeof output> & { instructions: OperationInstructions };
export function actionInstructions(
  input: Selection & { actionId: string; artifact: string; operation?: never },
  options?: ActionOptions,
): ReturnType<typeof output> & { instructions: ArtifactInstructions };
export function actionInstructions(
  input: InstructionInput,
  options?: ActionOptions,
): ReturnType<typeof output> & { instructions: OperationInstructions | ArtifactInstructions };

export function actionInstructions(input: InstructionInput, options: ActionOptions = {}) {
  const { root, upstream } = selected(input, options);
  const workspace = readWorkspace(root);
  checkWorkspace(workspace);
  const run = currentRun(root, workspace);
  if (!run || run.record.actionId !== input.actionId)
    throw new MendiError('action-state-conflict', '需要当前 Action ID。');
  const phase = actionDefinition(run.record.actionType).phase;
  if ((input.artifact === undefined) === (input.operation === undefined))
    throw new MendiError('invalid-arguments', 'artifact / operation 必须二选一。');
  if (input.operation !== undefined) {
    if (input.operation !== phase || !['apply', 'archive'].includes(input.operation))
      throw new MendiError(
        'unsupported-action-instructions',
        'operation 必须匹配当前 Apply / Archive。',
      );
    const instructions = upstream.operationInstructions(workspace.activeChangeId!, input.operation);
    return { ...output(root, upstream, 'action-instructions', workspace, run), instructions };
  }
  if (phase === 'apply' || (phase === 'explore' && input.artifact !== 'proposal'))
    throw new MendiError('unsupported-action-instructions', '本阶段不支持该 artifact 指引。');
  const instructions = upstream.instructions(workspace.activeChangeId!, input.artifact!);
  return { ...output(root, upstream, 'action-instructions', workspace, run), instructions };
}
