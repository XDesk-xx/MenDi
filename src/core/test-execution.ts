import { identifier, MendiError, object, text } from './errors.ts';

export const testKinds = ['focused', 'fast', 'full'] as const;
export type TestKind = (typeof testKinds)[number];
export type TestOutcome = 'not-run' | 'passed' | 'failed' | 'interrupted' | 'unknown';
export interface TestExecution {
  formatVersion: 1;
  executionId: string;
  kind: TestKind;
  projectRoot: string;
  cwd: string;
  deliveryId: string;
  changeId: string | null;
  actorId: string;
  scope: 'command';
  formalDeliveryTest: false;
  command: { executable: string; args: string[]; dependencyPolicy: 'warn' };
  dependencyCheck: { executable: string; args: string[]; dependencyPolicy: 'error'; exitCode: 0 };
  scriptName: string;
  scriptText: string;
  startedAt: string;
  finishedAt: string | null;
  executionState: 'prepared' | 'running' | 'finished';
  outcome: TestOutcome;
  exitCode: number | null;
  signal: string | null;
  pid: number | null;
  stdoutRef: string;
  stderrRef: string;
  reason?: string;
  stop?: { confirmed: boolean; exitCode: number | null; stdout: string; stderr: string };
}

export function testKind(value: unknown): TestKind {
  if (!testKinds.includes(value as TestKind))
    throw new MendiError('invalid-test-kind', '集合必须是 focused / fast / full。');
  return value as TestKind;
}
export function executionLocation(id: string, deliveryId: string) {
  const match = /^(\d{3,})-(focused|fast|full)$/.exec(id);
  if (
    !match ||
    !Number.isSafeInteger(Number(match[1])) ||
    Number(match[1]) < 1 ||
    String(Number(match[1])).padStart(3, '0') !== match[1]
  )
    throw new MendiError('invalid-test-execution', '执行 ID 不符合编号和集合约定。');
  return {
    number: Number(match[1]),
    kind: testKind(match[2]),
    ref: `.mendi/delivery-groups/${identifier(deliveryId, 'Delivery ID')}/tests/${id}`,
  };
}
function positiveOrNull(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value > 0);
}
function date(value: unknown): boolean {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
export function parseExecution(
  value: unknown,
  root: string,
  deliveryId: string,
  id: string,
): TestExecution {
  const data = object(value, '执行结果');
  const location = executionLocation(id, deliveryId);
  const command = object(data.command, '执行命令');
  const check = object(data.dependencyCheck, '依赖预检');
  text(command.executable, 'Node 入口');
  text(data.scriptName, 'script 名');
  text(data.scriptText, 'script 文本');
  text(data.actorId, 'actor');
  const args = command.args;
  if (
    data.formatVersion !== 1 ||
    data.executionId !== id ||
    data.deliveryId !== deliveryId ||
    data.projectRoot !== root ||
    data.cwd !== root ||
    data.kind !== location.kind ||
    data.scope !== 'command' ||
    data.formalDeliveryTest !== false ||
    (data.changeId !== null && identifier(data.changeId, 'Change 快照') !== data.changeId) ||
    !/^[A-Za-z0-9][A-Za-z0-9:_-]*$/.test(String(data.scriptName)) ||
    !Array.isArray(args) ||
    args.length !== 3 ||
    typeof args[0] !== 'string' ||
    !args[0] ||
    args[1] !== 'run' ||
    args[2] !== data.scriptName ||
    command.dependencyPolicy !== 'warn' ||
    check.executable !== command.executable ||
    JSON.stringify(check.args) !== JSON.stringify(args.slice(0, 2)) ||
    check.dependencyPolicy !== 'error' ||
    check.exitCode !== 0 ||
    data.stdoutRef !== `${location.ref}/stdout.log` ||
    data.stderrRef !== `${location.ref}/stderr.log` ||
    !date(data.startedAt) ||
    (data.finishedAt !== null && !date(data.finishedAt)) ||
    !positiveOrNull(data.pid) ||
    !(
      data.exitCode === null ||
      (typeof data.exitCode === 'number' &&
        Number.isSafeInteger(data.exitCode) &&
        data.exitCode >= 0)
    ) ||
    !(data.signal === null || typeof data.signal === 'string') ||
    !['prepared', 'running', 'finished'].includes(String(data.executionState)) ||
    !['not-run', 'passed', 'failed', 'interrupted', 'unknown'].includes(String(data.outcome))
  )
    throw new MendiError('invalid-test-execution', '执行身份、命令或必要字段不一致。');
  if (data.executionState === 'finished') {
    if (
      !date(data.finishedAt) ||
      (data.outcome === 'passed' &&
        (data.exitCode !== 0 || data.signal !== null || data.pid === null)) ||
      (data.outcome === 'failed' &&
        (data.exitCode === null ||
          data.exitCode === 0 ||
          data.signal !== null ||
          data.pid === null)) ||
      (data.outcome === 'not-run' &&
        (data.pid !== null || data.exitCode !== null || data.signal !== null)) ||
      (data.outcome === 'interrupted' &&
        (object(data.stop, '停止依据').confirmed !== true || data.pid === null))
    )
      throw new MendiError('invalid-test-execution', '终态不能认证当前退出事实。');
  } else if (
    data.finishedAt !== null ||
    data.exitCode !== null ||
    data.signal !== null ||
    (data.executionState === 'prepared'
      ? data.outcome !== 'not-run' || data.pid !== null
      : data.outcome !== 'unknown')
  )
    throw new MendiError('invalid-test-execution', '未完成记录不能包含测试终态。');
  return data as unknown as TestExecution;
}
