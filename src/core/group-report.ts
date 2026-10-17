import { MendiError, object, text } from './errors.ts';
import { groupProtocol, strings, type GroupPlan, type Candidate } from './group-plan.ts';
import type { TestExecution } from './test-execution.ts';

export type GroupState = 'passed' | 'failed' | 'blocked' | 'not-run' | 'interrupted' | 'unknown';
export interface GroupFact {
  id: string;
  state: GroupState;
  reason: string;
}
export interface Progress extends GroupFact {
  sourceRunRef: string | null;
  candidate: Candidate;
}
export interface GroupRequest {
  protocol: typeof groupProtocol;
  projectRoot: string;
  deliveryId: string;
  roundId: string;
  runRef: string;
  executionId: string;
  candidate: Candidate;
  plan: GroupPlan;
  selection: string[];
  prerequisites: Progress[];
  reportRef: string;
  eventsRef: string;
}
export interface ProtocolObservation {
  notRun?: true;
  cancelled?: true;
  protocolState: 'valid' | 'invalid' | 'unconfirmed';
  groups: GroupFact[];
  reasons: string[];
  timing: StageTiming[];
}
export interface StageTiming {
  id: string;
  parent?: string;
  clock: string;
  utc: string;
  startMs: number;
  durationMs: number;
  phase: string;
}
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function stageTimings(value: unknown): StageTiming[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new MendiError('invalid-group-report', 'timing 必须是数组。');
  const result: StageTiming[] = [];
  for (const v of value) {
    const t = object(v, '阶段');
    const stage: StageTiming = {
      id: text(t.id, '阶段 id'),
      clock: text(t.clock, '时钟基准'),
      utc: text(t.utc, 'UTC'),
      startMs: Number(t.startMs),
      durationMs: Number(t.durationMs),
      phase: text(t.phase, '阶段名'),
      ...(t.parent === undefined ? {} : { parent: text(t.parent, '父阶段') }),
    };
    if (
      !Number.isFinite(Date.parse(stage.utc)) ||
      !Number.isFinite(stage.startMs) ||
      stage.startMs < 0 ||
      !Number.isFinite(stage.durationMs) ||
      stage.durationMs < 0 ||
      result.some((s) => s.id === stage.id)
    )
      throw new MendiError('invalid-group-report', '阶段计时无效。');
    if (stage.parent) {
      const parent = result.find((s) => s.id === stage.parent);
      if (
        !parent ||
        parent.clock !== stage.clock ||
        stage.startMs < parent.startMs ||
        stage.startMs + stage.durationMs > parent.startMs + parent.durationMs
      )
        throw new MendiError('invalid-group-report', '父子计时基准或包含关系无效。');
    }
    result.push(stage);
  }
  return result;
}
export function interpretReport(
  value: unknown,
  request: GroupRequest,
  child: TestExecution,
): ProtocolObservation {
  const reasons: string[] = [];
  const groups: GroupFact[] = [];
  let timing: StageTiming[] = [];
  const resources = request.plan.groups.some(
    (g) => request.selection.includes(g.id) && g.resources.length > 0,
  );
  let safeCleanup = false;
  if (child.outcome === 'unknown' || child.executionState !== 'finished')
    return { protocolState: 'unconfirmed', groups, reasons: ['真实执行未确认。'], timing };
  if (child.outcome === 'not-run')
    return {
      protocolState: 'unconfirmed',
      notRun: true,
      groups: [],
      reasons: ['实际子程序未启动，没有可复用组事实。'],
      timing: [],
    };
  if (child.outcome === 'interrupted')
    return {
      protocolState: 'unconfirmed',
      groups: request.selection.map((id) => ({
        id,
        state: 'interrupted',
        reason: '本轮已取消，部分结果不可复用。',
      })),
      reasons: ['取消不作为续测来源。'],
      timing,
      cancelled: true,
    };
  try {
    const report = object(value, '最终报告');
    safeCleanup =
      report.cleanup === 'confirmed' && report.complete === true && equal(report.request, request);
    if (report.cleanup !== 'confirmed')
      return { protocolState: 'unconfirmed', groups, reasons: ['清理未确认。'], timing };
    if (
      report.protocol !== groupProtocol ||
      !equal(report.request, request) ||
      report.complete !== true ||
      !Array.isArray(report.groups) ||
      !equal(
        report.groups.map((v) => object(v, '组').id),
        request.selection,
      )
    )
      throw new Error('最终报告身份、完整性或组选择矛盾。');
    timing = stageTimings(report.timing);
    for (const v of report.groups) {
      const r = object(v, '组回执');
      const g = request.plan.groups.find((g) => g.id === r.id)!;
      if (
        !['passed', 'failed', 'blocked', 'not-run', 'interrupted', 'unknown'].includes(
          String(r.state),
        )
      )
        throw new Error('未知组终态。');
      if (r.cleanup !== 'confirmed' || r.state === 'unknown')
        return {
          protocolState: 'unconfirmed',
          groups,
          reasons: [`组 ${g.id} 资源未确认。`],
          timing,
        };
      let state = r.state as GroupState;
      let aborted = state === 'interrupted';
      let reason = typeof r.reason === 'string' ? r.reason : '';
      if (state === 'passed' || state === 'failed') {
        if (
          !equal(strings(r.selection, '实际选择'), g.selection) ||
          r.enumerated !== true ||
          r.finished !== true ||
          !Number.isInteger(r.exitCode)
        )
          throw new Error('实际选择、枚举或结束缺失。');
        if (
          !equal(
            strings(r.exclusions, '实际排除'),
            g.exclusions.map((e) => e.id),
          )
        )
          throw new Error('排除与执行前计划不一致。');
        const failures: string[] = [];
        if (r.exitCode !== 0 || r.lateError === true) failures.push('实际退出或晚期错误');
        if (g.kind === 'tests') {
          const c = object(r.counts, '必需测试计数');
          const keys = ['passed', 'failed', 'cancelled', 'skipped', 'todo', 'pending'];
          if (
            [...keys, 'total'].some((k) => !Number.isSafeInteger(c[k]) || Number(c[k]) < 0) ||
            Number(c.total) !== keys.reduce((sum, k) => sum + Number(c[k]), 0)
          )
            throw new Error('必需计数不完整或不一致。');
          if (Number(c.passed) === 0 || keys.slice(1).some((k) => Number(c[k]) !== 0))
            failures.push('必需业务覆盖缺口');
          aborted = Number(c.cancelled) > 0;
        } else {
          if (
            r.command !== g.command ||
            !equal(
              r.artifacts,
              (g.artifacts ?? []).map((path) => ({ path, exists: true })),
            )
          )
            failures.push('命令或产物条件未满足');
        }
        if (failures.length) {
          state = 'failed';
          reason = failures.join('；');
        }
        if (aborted) {
          state = 'interrupted';
          reason = '测试已取消 / aborted，不作为普通业务失败或通过来源。';
        }
      } else if (!reason.trim()) throw new Error('未执行 / 阻断 / 取消必须说明原因。');
      const prerequisites = g.dependsOn.map(
        (id) => groups.find((f) => f.id === id) ?? request.prerequisites.find((f) => f.id === id),
      );
      if (state === 'passed' && prerequisites.some((f) => f?.state !== 'passed'))
        throw new Error('通过组的必要前置未满足。');
      groups.push({ id: g.id, state, reason });
    }
    const successful = groups
      .filter((g) => request.plan.groups.find((p) => p.id === g.id)!.required)
      .every((g) => g.state === 'passed');
    if ((child.exitCode === 0) !== successful) reasons.push('原命令退出与必需组终态矛盾。');
    const cancelled = groups.some((g) => g.state === 'interrupted');
    return {
      protocolState: reasons.length ? 'invalid' : cancelled ? 'unconfirmed' : 'valid',
      groups,
      reasons:
        cancelled && !reasons.length ? ['本次已取消；执行与清理已结束，局部事实不复用。'] : reasons,
      timing,
      ...(cancelled ? { cancelled: true as const } : {}),
    };
  } catch (error) {
    return {
      protocolState: resources && !safeCleanup ? 'unconfirmed' : 'invalid',
      groups: [],
      reasons: [error instanceof Error ? error.message : String(error)],
      timing: [],
    };
  }
}
