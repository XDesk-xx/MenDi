import fs from 'node:fs';
import { MendiError } from '../core/errors.ts';
import { parseProject, parseWorkspace, type Scope, type Workspace } from '../core/records.ts';
import type { BaselineFact } from '../core/delivery-verification.ts';
import { recordRound } from '../core/round-records.ts';
import { readDeliveryRun } from './delivery-runs.ts';
import { managedPath } from './paths.ts';

/** A bounded readset of the explicitly declared sources; never query a source's active work. */
export function deliveredBaselines(
  root: string,
  workspace: Pick<Workspace, 'project' | 'id' | 'currentRoundId'>,
  scope: Scope,
  targetRoundId = workspace.currentRoundId,
) {
  const bytes = new Map<string, Buffer>();
  const read = (ref: string) => {
    const content = fs.readFileSync(managedPath(root, ref));
    const previous = bytes.get(ref);
    if (previous && !previous.equals(content))
      throw new MendiError('baseline-input-changed', '基线输入读取期间变化。', { ref });
    bytes.set(ref, content);
    return JSON.parse(content.toString()) as unknown;
  };
  const facts: BaselineFact[] = [];
  for (const planned of scope.plannedChanges) {
    for (const dependency of planned.baselineDependencies ?? []) {
      const index = parseProject(workspace.project, dependency.deliveryId);
      const source = parseWorkspace(index, read(index.manifestRef));
      if (source.mode !== 'product')
        throw new MendiError(
          'baseline-source-unavailable',
          '人工来源只能说明，不能满足产品硬依赖。',
        );
      const binding = source.bindings.find((b) => b.planningSlot === dependency.planningSlot);
      if (!binding || binding.state !== 'archived' || !binding.archiveOrdinal)
        throw new MendiError('baseline-source-unavailable', '基线槽位没有真实归档绑定。', {
          dependency,
        });
      const ref = dependency.closeRunRef;
      // Snapshot exactly the Close consumed by the parser, not explanatory refs in its header.
      const closeBytes = fs.readFileSync(managedPath(root, ref));
      bytes.set(ref, closeBytes);
      const close = readDeliveryRun(root, ref, source.id);
      if (!fs.readFileSync(managedPath(root, ref)).equals(closeBytes))
        throw new MendiError('baseline-input-changed', 'Close 在直接读取期间变化。', { ref });
      const accepted = close.record.lifecycle?.acceptance;
      if (
        close.record.actionType !== 'delivery-close' ||
        close.record.status !== 'submitted' ||
        close.record.outcome !== 'complete' ||
        !accepted ||
        ('kind' in accepted
          ? accepted.conclusion !== 'verified'
          : 'version' in accepted
            ? accepted.version !== 2 || accepted.formalOutcome !== 'passed'
            : accepted.outcome !== 'passed')
      )
        throw new MendiError('baseline-source-unavailable', '指定来源不是完整 Close。', { ref });
      const completed = accepted.scope.completed.find((c) => c.slot === dependency.planningSlot);
      if (
        !completed ||
        completed.changeId !== binding.changeId ||
        completed.archiveOrdinal !== binding.archiveOrdinal
      )
        throw new MendiError('baseline-source-unavailable', 'Close 完成快照与归档绑定不一致。', {
          dependency,
        });
      const round = recordRound(source, close.record);
      if (round && (round.state !== 'closed' || round.closeRunRef !== ref))
        throw new MendiError('baseline-source-unavailable', '指定 Close 不属于来源已关闭轮次。');
      if (source.id === workspace.id) {
        const owner = round?.id;
        if (!owner || !targetRoundId || Number(owner.slice(1)) >= Number(targetRoundId.slice(1)))
          throw new MendiError(
            'baseline-source-unavailable',
            '同 Delivery 基线必须来自此前已关闭轮次。',
          );
      }
      facts.push({
        targetSlot: planned.slot,
        ...dependency,
        changeId: binding.changeId,
        archiveOrdinal: binding.archiveOrdinal,
      });
    }
  }
  const confirm = () => {
    for (const [ref, content] of bytes)
      if (!fs.readFileSync(managedPath(root, ref)).equals(content))
        throw new MendiError('baseline-input-changed', '实际直接基线输入已变化。', { ref });
  };
  confirm();
  return { facts, bytes, confirm };
}
