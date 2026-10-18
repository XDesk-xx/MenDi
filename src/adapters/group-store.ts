import fs from 'node:fs';
import { managedPath, present } from './paths.ts';
import { readDeliveryRun, type DeliveryDocument } from './delivery-runs.ts';
import { readExecution } from './test-store.ts';
import { MendiError } from '../core/errors.ts';
import { interpretReport } from '../core/group-report.ts';
import { requireCurrentRound, recordRound } from '../core/round-records.ts';
import type { Workspace } from '../core/records.ts';

export const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function rememberBytes(ref: string, value: Buffer, bytes: Map<string, Buffer>) {
  const first = bytes.get(ref);
  if (first && !first.equals(value))
    throw new MendiError('delivery-input-changed', '重复读取的直接输入变化，保留首次快照。', {
      ref,
    });
  if (!first) bytes.set(ref, value);
  return value;
}
export function captureBytes(root: string, ref: string, bytes: Map<string, Buffer>) {
  return rememberBytes(ref, fs.readFileSync(managedPath(root, ref)), bytes);
}
export function capturedJson(root: string, ref: string, bytes: Map<string, Buffer>) {
  const value = captureBytes(root, ref, bytes);
  return JSON.parse(value.toString()) as unknown;
}
export function confirmBytes(root: string, bytes: Map<string, Buffer>) {
  for (const [ref, old] of bytes)
    if (!fs.readFileSync(managedPath(root, ref)).equals(old))
      throw new MendiError('delivery-input-changed', '本次直接输入变化。', { ref });
}
export function inspectAttempt(
  root: string,
  workspace: Workspace,
  run: DeliveryDocument,
  ownLock = false,
  bytes = new Map<string, Buffer>(),
) {
  const a = run.record.attempt;
  if (!a) throw new MendiError('invalid-run', '需要结构化尝试。');
  recordRound(workspace, run.record);
  const identity = new Map<string, Buffer>(
    ['.mendi/project.json', workspace.manifestRef].map((ref) => [
      ref,
      fs.readFileSync(managedPath(root, ref)),
    ]),
  );
  if (
    !equal(JSON.parse(identity.get(workspace.manifestRef)!.toString()), workspace.manifest) ||
    !equal(JSON.parse(identity.get('.mendi/project.json')!.toString()), workspace.project)
  )
    throw new MendiError('changed-during-read', '当前身份在解释前变化。');
  captureBytes(root, run.ref, bytes);
  const fresh = readDeliveryRun(root, run.ref, workspace.id);
  if (!equal(fresh.header, run.header) || fresh.body !== run.body)
    throw new MendiError('changed-during-read', '结构化来源在读取期间变化。');
  const lock = managedPath(root, '.mendi/write.lock');
  let stable = ownLock || !present(lock);
  let observation = a.observation;
  let child;
  if (a.executionId) {
    const base = `.mendi/delivery-groups/${workspace.id}/tests/${a.executionId}`;
    capturedJson(root, `${base}/result.json`, bytes);
    child = readExecution(root, a.executionId, workspace.id);
    for (const ref of [child.stdoutRef, child.stderrRef]) captureBytes(root, ref, bytes);
    if (
      child.actorId !== run.record.actorId ||
      child.changeId !== null ||
      child.scriptName !== a.entry.scriptName ||
      child.scriptText !== a.entry.scriptText ||
      child.command.args[0] !== a.entry.pnpmBin ||
      child.kind !== 'full'
    )
      throw new MendiError('invalid-run', '结构化父子身份矛盾。');
    if (a.request) {
      if (
        a.request.projectRoot !== root ||
        a.request.deliveryId !== workspace.id ||
        a.request.runRef !== run.ref ||
        a.request.roundId !== a.roundId ||
        a.request.reportRef !== `${base}/group-report.json` ||
        a.request.eventsRef !== `${base}/group-events.jsonl`
      )
        throw new MendiError('invalid-run', '请求路径 / 身份不一致。');
      const request = capturedJson(root, `${base}/group-request.json`, bytes);
      if (!equal(request, a.request)) throw new MendiError('invalid-run', '持久请求不一致。');
      let report: unknown;
      if (present(managedPath(root, a.request.reportRef))) {
        const raw = captureBytes(root, a.request.reportRef, bytes);
        try {
          report = JSON.parse(raw.toString());
        } catch {
          report = undefined;
        }
      }
      const actual = interpretReport(report, a.request, child);
      if (a.phase === 'finished' && !equal(actual, a.observation))
        throw new MendiError('invalid-run', '协议观察与直接报告矛盾。');
      observation = actual;
    }
  }
  stable =
    stable &&
    run.record.status === 'submitted' &&
    a.phase === 'finished' &&
    (ownLock || !present(lock));
  if (a.phase === 'finished')
    for (const id of a.selection) {
      const p = a.progress.find((f) => f.id === id)!;
      const expected =
        observation?.protocolState === 'invalid'
          ? 'failed'
          : (observation?.groups.find((f) => f.id === id)?.state ?? 'not-run');
      if (p.state !== expected || p.sourceRunRef !== run.ref || !equal(p.candidate, a.candidate))
        throw new MendiError('invalid-run', '当前选择的扁平进展与直接终态矛盾。');
    }
  confirmBytes(root, bytes);
  confirmBytes(root, identity);
  return {
    stable,
    protocolState: stable ? (observation?.protocolState ?? 'unconfirmed') : 'unconfirmed',
    observation,
    child,
    progress: a.progress,
    candidate: a.candidate,
    roundId: a.roundId,
    current:
      a.roundId === workspace.currentRoundId && workspace.manifest.deliveryRunRef === run.ref,
    materialApplicability: 'requires-semantic-check' as const,
    timing: a.timing,
    targetTiming: observation?.timing ?? [],
    unmeasured: ['目标未报告的内部阶段', '跨进程时钟的相对绝对值', '关键路径'],
    scopeMatch:
      equal(a.scope.goal, workspace.scope.goal) && a.roundId === workspace.currentRoundId
        ? 'match'
        : 'changed',
  };
}
export function inspectCandidate(
  root: string,
  workspace: Workspace,
  run: DeliveryDocument,
  ownLock = false,
) {
  const v = run.record.verification;
  if (!v) throw new MendiError('invalid-run', '需要候选结论。');
  recordRound(workspace, run.record);
  const identity = new Map<string, Buffer>(
    ['.mendi/project.json', workspace.manifestRef].map((ref) => [
      ref,
      fs.readFileSync(managedPath(root, ref)),
    ]),
  );
  const before = fs.readFileSync(managedPath(root, run.ref));
  const fresh = readDeliveryRun(root, run.ref, workspace.id);
  const stable =
    (ownLock || !present(managedPath(root, '.mendi/write.lock'))) &&
    run.record.status === 'submitted' &&
    equal(fresh.header, run.header) &&
    fresh.body === run.body &&
    fs.readFileSync(managedPath(root, run.ref)).equals(before);
  confirmBytes(root, identity);
  return {
    stable,
    conclusion: stable ? v.conclusion : 'unknown',
    candidate: v.candidate,
    roundId: v.roundId,
    current:
      v.roundId === workspace.currentRoundId &&
      workspace.manifest.deliveryRunRef === run.ref &&
      workspace.manifest.verificationRunRef === run.ref &&
      workspace.state === 'open',
    materialApplicability: 'requires-semantic-check' as const,
    gaps: v.gaps,
    sources: v.sources,
  };
}
export function currentGroupProgress(root: string, workspace: Workspace, ownLock = false) {
  const ref = workspace.manifest.testAttemptRunRef;
  if (typeof ref !== 'string')
    throw new MendiError('delivery-state-conflict', '缺当前结构化尝试。');
  const run = readDeliveryRun(root, ref, workspace.id);
  requireCurrentRound(workspace, run.record);
  const facts = inspectAttempt(root, workspace, run, ownLock);
  if (!facts.stable || facts.protocolState === 'unconfirmed')
    throw new MendiError('delivery-state-conflict', '当前执行 / 资源未确认。');
  return { run, facts };
}
