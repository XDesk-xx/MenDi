// 旧 command 历史夹具的固定 admission；产品仅保留 formalWorkspace。
import fs from 'node:fs';
import { managedPath } from '../../src/adapters/paths.ts';
import { readWorkspace } from '../../src/adapters/workspace.ts';
import {
  currentDeliveryRun,
  readDeliveryRun,
  type DeliveryDocument,
} from '../../src/adapters/delivery-runs.ts';
import { selectedTest } from '../../src/adapters/test-entries.ts';
import {
  firstApprovals,
  inspectFullTest,
  same,
  reviewRepairInputs,
} from '../../src/adapters/delivery-verification.ts';
import {
  declaration,
  verificationScope,
  type FullTest,
} from '../../src/core/delivery-verification.ts';
import { MendiError, text } from '../../src/core/errors.ts';
import { projectProgress, requireWritable } from '../../src/core/rounds.ts';
import { deliveredBaselines } from '../../src/adapters/baselines.ts';
import { comparableRepair, requireCurrentRound } from '../../src/core/round-records.ts';

export interface FullTestInput {
  project: string;
  inputFile: string;
  role: string;
  actor: string;
  pnpmBin: string;
}
export function formalWorkspace(root: string, input: FullTestInput, ownLock: boolean) {
  if (input.role !== 'author')
    throw new MendiError('action-role-mismatch', '正式 Full Test 要求 Author。');
  text(input.actor, 'actor');
  text(input.pnpmBin, 'pnpm-bin');
  const workspace = readWorkspace(root, ownLock);
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', '正式执行只支持 open product。');
  requireWritable(workspace);
  const scope = verificationScope(workspace);
  return { workspace, scope };
}
export function admission(root: string, input: FullTestInput, ownLock: boolean) {
  const { workspace, scope } = formalWorkspace(root, input, ownLock);
  const baselines = deliveredBaselines(root, workspace, workspace.scope);
  const inputPath = managedPath(root, input.inputFile);
  const inputBytes = fs.readFileSync(inputPath);
  const declared = declaration(JSON.parse(inputBytes.toString()));
  const script = selectedTest(root, 'full');
  const entry = {
    scriptName: script.scriptName,
    scriptText: script.scriptText,
    ...(script.packageManager === undefined
      ? {}
      : { packageManager: String(script.packageManager) }),
    pnpmBin: input.pnpmBin,
  };
  const current = currentDeliveryRun(root, workspace);
  if (current?.record.attempt || current?.record.verification)
    throw new MendiError('delivery-state-conflict', '组模式进展不能静默降级旧 command。');
  let approvals: FullTest['approvals'];
  let repairApproval: FullTest['repairApproval'];
  const refs: string[] = [];
  if (current && !current.record.lifecycle) {
    if (current.record.status !== 'submitted' || current.record.outcome !== 'complete')
      throw new MendiError('delivery-state-conflict', '当前 Delivery 进展尚未完成。');
    let previous = current;
    if (current.record.repair) {
      if (
        current.record.role !== 'reviewer' ||
        current.record.verdict !== 'approved' ||
        !current.body.trim()
      )
        throw new MendiError(
          'delivery-state-conflict',
          '重新完整执行需要当前定向 Review approved。',
        );
      const { author, failure } = reviewRepairInputs(root, workspace, current, ownLock);
      previous = failure;
      refs.push(current.ref, author.ref, failure.ref);
      repairApproval = {
        reviewRunRef: current.ref,
        authorRunRef: author.ref,
        authorActor: author.record.actorId,
        reviewerActor: current.record.actorId,
      };
    } else {
      const facts = inspectFullTest(root, workspace, current, ownLock);
      if (!facts.stable || facts.outcome === 'unknown' || facts.outcome === 'failed')
        throw new MendiError(
          'delivery-state-conflict',
          'failed 需要先修复 / 独立审核，unknown 停 Owner。',
        );
      if (facts.commandMatch !== 'match')
        throw new MendiError('delivery-state-conflict', '未经定向审核的执行配置变化，停 Owner。');
      refs.push(current.ref);
      repairApproval = current.record.fullTest!.repairApproval;
      // 失败后批准的修复仍是本次重试的直接必要对象，不追读更旧失败。
      if (repairApproval) {
        const review = readDeliveryRun(root, repairApproval.reviewRunRef, workspace.id);
        const author = readDeliveryRun(root, repairApproval.authorRunRef, workspace.id);
        requireCurrentRound(workspace, review.record);
        requireCurrentRound(workspace, author.record);
        if (
          review.record.status !== 'submitted' ||
          review.record.verdict !== 'approved' ||
          review.record.outcome !== 'complete' ||
          review.record.authorRunRef !== author.ref ||
          !review.body.trim() ||
          author.record.status !== 'submitted' ||
          author.record.outcome !== 'complete' ||
          !author.body.trim() ||
          author.record.actorId !== repairApproval.authorActor ||
          review.record.actorId !== repairApproval.reviewerActor ||
          !same(comparableRepair(review.record.repair), comparableRepair(author.record.repair)) ||
          !same(author.record.repair?.scope, scope) ||
          !same(author.record.repair?.collection, declared.collection)
        )
          throw new MendiError('review-input-invalid', '当前必要修复批准不可用。');
        refs.push(review.ref, author.ref);
      }
    }
    const full = previous.record.fullTest!;
    if (!same(full.scope, scope) || !same(full.collection, declared.collection))
      throw new MendiError('delivery-state-conflict', '范围或原完整集合变化，停 Owner。');
    approvals = full.approvals;
  } else {
    const first = firstApprovals(root, workspace);
    approvals = first.approvals;
    refs.push(...first.refs);
  }
  const bytes = new Map<string, Buffer>(
    refs.map((ref) => [ref, fs.readFileSync(managedPath(root, ref))]),
  );
  for (const [ref, content] of baselines.bytes) bytes.set(ref, content);
  return {
    workspace,
    inputBytes,
    bytes,
    fullTest: {
      roundId: workspace.currentRoundId!,
      baselineFacts: baselines.facts,
      ...declared,
      scope,
      approvals,
      entry,
      phase: 'prepared' as const,
      executionId: null,
      outcome: 'not-run' as const,
      ...(repairApproval ? { repairApproval } : {}),
    },
  };
}
export function confirmInputs(
  root: string,
  input: FullTestInput,
  admitted: ReturnType<typeof admission>,
  run: DeliveryDocument,
) {
  const workspace = readWorkspace(root, true)!;
  requireWritable(workspace);
  const script = selectedTest(root, 'full');
  if (
    workspace.manifest.deliveryRunRef !== run.ref ||
    workspace.manifest.fullTestRunRef !== run.ref ||
    !same(verificationScope(workspace), admitted.fullTest.scope) ||
    !fs.readFileSync(managedPath(root, input.inputFile)).equals(admitted.inputBytes) ||
    script.scriptName !== admitted.fullTest.entry.scriptName ||
    script.scriptText !== admitted.fullTest.entry.scriptText ||
    script.packageManager !== admitted.fullTest.entry.packageManager ||
    [...admitted.bytes].some(([ref, bytes]) =>
      ref === workspace.manifestRef
        ? !same(
            workspace.manifest,
            projectProgress(admitted.workspace, {
              ...admitted.workspace.manifest,
              deliveryRunRef: run.ref,
              fullTestRunRef: run.ref,
            }),
          )
        : !fs.readFileSync(managedPath(root, ref)).equals(bytes),
    )
  )
    throw new MendiError(
      'delivery-input-changed',
      '本次必要输入、声明、范围或入口变化；保留现场。',
    );
  return workspace;
}
