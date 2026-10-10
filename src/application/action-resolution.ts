import { selected } from './project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { currentRun, type RunDocument } from '../adapters/runs.ts';
import { createRun, writeAction } from '../adapters/action-store.ts';
import { loadMethods } from '../adapters/methods.ts';
import { actionDefinition, type OwnerDecision } from '../core/actions.ts';
import { MendiError, text } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';
import { archiveApproval } from './archive-prepare.ts';
import {
  captureArchiveInputs,
  loadArchiveInputs,
  observeArchiveEffects,
} from '../adapters/archive-effects.ts';
import { archivedCount } from '../core/archive.ts';
import {
  checkWorkspace,
  authorInput,
  output,
  type ActorInput,
  type ActionOptions,
} from './action-context.ts';

export interface ResolveInput extends ActorInput {
  runRef: string;
  resolution: string;
  toRole: string;
  toActor: string;
  reason: string;
  phase?: string;
  revisesRunRef?: string;
}
export function resolveAction(input: ResolveInput, options: ActionOptions = {}) {
  if (input.role !== 'owner')
    throw new MendiError('owner-declaration-required', '处置须明确声明 Owner。');
  text(input.actor, 'Owner 标识');
  text(input.reason, 'Owner 原因');
  text(input.toActor, '接收标识');
  const { root, upstream } = selected(input, options);
  const workspace = readWorkspace(root);
  checkWorkspace(workspace);
  function check(current: Workspace) {
    checkWorkspace(current);
    const run = currentRun(root, current);
    if (!run || run.ref !== input.runRef)
      throw new MendiError('run-not-current', '处置对象不是当前 Run。');
    const definition = actionDefinition(run.record.actionType);
    if (run.record.archive) {
      const archive = run.record.archive;
      if (
        input.resolution !== 'rollback' ||
        run.record.status !== 'draft' ||
        !['prepared', 'none'].includes(archive.phase) ||
        archivedCount(current.project) !== archive.countBasis
      )
        throw new MendiError(
          'archive-state-conflict',
          'Archive 只允许 prepared / 已保存 none 的独立 Owner rollback。',
        );
      const inputs =
        archive.phase === 'none'
          ? loadArchiveInputs(root, current, run)
          : captureArchiveInputs(
              root,
              current,
              run,
              archiveApproval(root, current, archive.reviewRunRef, archive.authorRunRef),
            );
      if (observeArchiveEffects(root, archive, inputs).phase !== 'none')
        throw new MendiError('archive-state-conflict', 'Archive 实际效果不允许回退。');
    }
    if (
      input.resolution !== 'rollback' &&
      (input.phase !== undefined || input.revisesRunRef !== undefined)
    )
      throw new MendiError('resolution-state-conflict', 'phase / revises 仅用于 rollback。');
    if (input.resolution === 'rollback') {
      const phases = ['explore', 'propose', 'apply', 'archive'];
      if (
        input.toRole !== 'author' ||
        !input.phase ||
        !phases.includes(input.phase) ||
        input.phase === 'archive' ||
        phases.indexOf(input.phase) >= phases.indexOf(definition.phase) ||
        !input.revisesRunRef
      )
        throw new MendiError(
          'resolution-state-conflict',
          'rollback 需要较早阶段和完整直接 Author。',
        );
      const target = actionDefinition(`revise-${input.phase}`);
      const author = authorInput(
        root,
        current,
        input.revisesRunRef,
        target.type,
        input.toActor,
        false,
      );
      if (author.record.runNumber >= run.record.runNumber)
        throw new MendiError('resolution-state-conflict', '回退目标不是较早直接提交。');
      return { run, definition: target, author, fixed: author };
    }
    if (input.resolution === 'handoff') {
      if (
        input.toRole !== run.record.role ||
        input.toActor === run.record.actorId ||
        (run.record.status !== 'draft' && run.record.outcome !== 'continuing')
      )
        throw new MendiError('resolution-state-conflict', '交接要求未完成、同角色、不同操作者。');
      let fixed: RunDocument | null = null;
      if (definition.review)
        fixed = authorInput(
          root,
          current,
          run.record.authorRunRef!,
          run.record.actionType,
          input.toActor,
          true,
        );
      if (definition.revision)
        fixed = authorInput(
          root,
          current,
          run.record.revisesRunRef!,
          run.record.actionType,
          input.toActor,
          false,
        );
      return { run, definition, author: null, fixed };
    }
    if (
      input.resolution !== 'revise' ||
      input.toRole !== 'author' ||
      !definition.review ||
      run.record.status !== 'submitted' ||
      run.record.outcome !== 'complete' ||
      run.record.verdict !== 'rejected'
    )
      throw new MendiError(
        'resolution-state-conflict',
        'revise 仅处理当前 rejected 的同阶段 Author 修订。',
      );
    const author = authorInput(
      root,
      current,
      run.record.authorRunRef!,
      run.record.actionType,
      input.toActor,
      false,
    );
    return {
      run,
      definition: actionDefinition(`revise-${definition.phase}`),
      author,
      fixed: author,
    };
  }
  const prior = check(workspace);
  upstream.status(workspace.activeChangeId!);
  const tools = prior.author?.record.toolGuidance ?? prior.run.record.toolGuidance;
  const methods = loadMethods(prior.definition.type, tools, options.methodsRoot);
  const result = writeAction(
    root,
    'action-resolve',
    (current, written) => {
      const { run, definition, author, fixed } = check(current);
      const ownerDecision: OwnerDecision = {
        resolution: input.resolution as OwnerDecision['resolution'],
        role: 'owner',
        actorId: input.actor,
        reason: input.reason,
        sourceRunRef: run.ref,
        targetRole: definition.role,
        targetActorId: input.toActor,
        phase: definition.phase,
      };
      // Fixed inputs and method selection must still be the same when the lock is acquired.
      if (
        definition.type !== prior.definition.type ||
        JSON.stringify(author?.record ?? run.record) !==
          JSON.stringify(prior.author?.record ?? prior.run.record) ||
        run.body !== prior.run.body ||
        author?.body !== prior.author?.body ||
        JSON.stringify(fixed) !== JSON.stringify(prior.fixed)
      )
        throw new MendiError('resolution-state-conflict', '写前处置对象已变化。');
      const {
        runNumber: _number,
        outcome: _outcome,
        result: _result,
        verdict: _verdict,
        ...continuing
      } = run.record;
      const seed = author
        ? {
            formatVersion: 1 as const,
            recordingMode: 'product' as const,
            deliveryId: current.id,
            changeId: current.activeChangeId!,
            actionType: definition.type,
            role: definition.role,
            actorId: input.toActor,
            status: 'draft' as const,
            stageSkill: definition.skill,
            toolGuidance: author.record.toolGuidance,
            revisesRunRef: author.ref,
            ownerDecision,
          }
        : { ...continuing, actorId: input.toActor, status: 'draft' as const, ownerDecision };
      return createRun(root, current, seed, written, options.observeWrite, author ? '' : run.body);
    },
    options.observeWrite,
  );
  return {
    ...output(root, upstream, 'action-resolve', result.workspace, result.run),
    methods,
    incompleteReservations: result.incompleteReservations,
  };
}
