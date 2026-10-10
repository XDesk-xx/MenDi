import { MendiError, text } from '../core/errors.ts';

export interface Arguments {
  command:
    | 'help'
    | 'delivery-open'
    | 'change-bind'
    | 'status'
    | 'next'
    | 'action-start'
    | 'action-continue'
    | 'action-instructions'
    | 'action-resolve'
    | 'action-archive'
    | 'workspace-diagnose'
    | 'run-save'
    | 'run-submit';
  json: boolean;
  values: Record<string, string>;
}

export function parseArguments(args: string[]): Arguments {
  if (args.length === 0 || (args.length === 1 && ['--help', '-h', 'help'].includes(args[0])))
    return { command: 'help', json: false, values: {} };
  let command: Arguments['command'];
  let consumed: number;
  if (args[0] === 'delivery' && args[1] === 'open') {
    command = 'delivery-open';
    consumed = 2;
  } else if (args[0] === 'change' && args[1] === 'bind') {
    command = 'change-bind';
    consumed = 2;
  } else if (args[0] === 'workspace' && args[1] === 'diagnose') {
    command = 'workspace-diagnose';
    consumed = 2;
  } else if (
    args[0] === 'action' &&
    ['start', 'continue', 'instructions', 'resolve', 'archive'].includes(args[1])
  ) {
    command = `action-${args[1]}` as Arguments['command'];
    consumed = 2;
  } else if (args[0] === 'run' && (args[1] === 'save' || args[1] === 'submit')) {
    command = args[1] === 'save' ? 'run-save' : 'run-submit';
    consumed = 2;
  } else if (args[0] === 'status' || args[0] === 'next') {
    command = args[0];
    consumed = 1;
  } else throw usage('未知命令。');
  const allowed = new Set([
    'project',
    ...(command === 'action-archive' ? ['run', 'role', 'actor', 'mode'] : []),
    ...(command === 'workspace-diagnose' ? [] : ['openspec-bin']),
    ...(command === 'workspace-diagnose' ? ['run'] : []),
    ...(command === 'action-resolve'
      ? ['run', 'role', 'actor', 'resolution', 'to-role', 'to-actor', 'reason', 'phase', 'revises']
      : []),
    ...(command === 'delivery-open'
      ? ['id', 'title', 'scope', 'change', 'slot']
      : command === 'change-bind'
        ? ['change', 'slot']
        : command === 'action-start'
          ? ['change', 'type', 'role', 'actor', 'author-run', 'revises', 'tool']
          : command === 'action-continue'
            ? ['action', 'role', 'actor']
            : command === 'action-instructions'
              ? ['action', 'artifact', 'operation']
              : command === 'run-save'
                ? ['run', 'role', 'actor', 'body']
                : command === 'run-submit'
                  ? ['run', 'role', 'actor', 'outcome', 'result', 'verdict']
                  : []),
  ]);
  const values: Record<string, string> = {};
  let json = false;
  for (let i = consumed; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--json') {
      if (json) throw usage('--json 重复。');
      json = true;
      continue;
    }
    const key = flag.startsWith('--') ? flag.slice(2) : '';
    if (!allowed.has(key) || Object.hasOwn(values, key)) throw usage(`未知或重复参数：${flag}`);
    const value = args[++i];
    if (value === undefined || value.startsWith('--') || !value.trim())
      throw usage(`${flag} 需要非空值。`);
    values[key] = value;
  }
  const required = [
    'project',
    ...(command === 'action-archive' ? ['run', 'role', 'actor', 'mode'] : []),
    ...(command === 'action-resolve'
      ? ['run', 'role', 'actor', 'resolution', 'to-role', 'to-actor', 'reason']
      : []),
    ...(command === 'delivery-open'
      ? ['id', 'title', 'scope']
      : command === 'change-bind'
        ? ['change', 'slot']
        : command === 'action-start'
          ? ['change', 'type', 'role', 'actor']
          : command === 'action-continue'
            ? ['action', 'role', 'actor']
            : command === 'action-instructions'
              ? ['action']
              : command === 'run-save'
                ? ['run', 'role', 'actor', 'body']
                : command === 'run-submit'
                  ? ['run', 'role', 'actor', 'outcome', 'result']
                  : []),
  ];
  for (const key of required) if (!values[key]) throw usage(`缺少 --${key}。`);
  if (command === 'action-instructions' && Boolean(values.artifact) === Boolean(values.operation))
    throw usage('--artifact 与 --operation 必须二选一。');
  if (command === 'delivery-open' && Boolean(values.change) !== Boolean(values.slot))
    throw usage('--change 与 --slot 必须成对出现。');
  for (const value of Object.values(values)) text(value, '参数');
  return { command, json, values };
}

function usage(message: string): MendiError {
  return new MendiError('invalid-arguments', message, {}, '执行 mendi --help 查看用法。', 2);
}

export const help = `MenDi：项目入口与最小 Delivery 协作

mendi delivery open --project <项目根> --id <Delivery ID> --title <标题> --scope <JSON 路径> [--change <既有 Change> --slot <槽位>]
mendi change bind --project <项目根> --change <既有 Change> --slot <槽位>
mendi status --project <项目根>
mendi next --project <项目根>
mendi action start --project <项目根> --change <当前 Change> --type <阶段> --role <author|reviewer> --actor <标识> [--author-run <Run 引用>] [--revises <Run 引用>] [--tool openspec]
mendi action continue --project <项目根> --action <当前 Action ID> --role <角色> --actor <标识>
mendi action instructions --project <项目根> --action <当前 Action ID> (--artifact <proposal|specs|design|tasks> | --operation <apply|archive>)
mendi action resolve --project <项目根> --run <当前 Run> --role owner --actor <Owner 标识> --resolution <handoff|revise|rollback> --to-role <author|reviewer> --to-actor <接收标识> --reason <原因> [--phase <较早阶段> --revises <完整 Author Run>]
mendi action archive --project <项目根> --run <当前 Archive Run> --role author --actor <当前标识> --mode <execute|finish>
mendi workspace diagnose --project <项目根> [--run <同 Change 占号 Run>]
mendi run save --project <项目根> --run <当前 draft 引用> --role <角色> --actor <标识> --body <UTF-8 Markdown 文件>
mendi run submit --project <项目根> --run <当前 draft 引用> --role <角色> --actor <标识> --outcome <continuing|complete> --result <摘要> [--verdict <approved|changes-requested|rejected>]

项目命令支持 --json；除本地 diagnose 外支持 --openspec-bin <稳定 OpenSpec 1.14.1 绝对入口>，save 忽略该兼容参数且不访问上游。
--project 相对于调用目录；--scope / --body 相对于目标项目根，也支持绝对路径。
首次 Open 要求目标无 .mendi；首版只关联第一个既有 Change。
阶段：explore / propose / apply，review-<阶段>，revise-<阶段>；archive 仅 Author，准备与 execute / finish 分开。
Review 须明确 --author-run；修订须明确 --revises；--tool 仅显式选择时读取 OpenSpec 指导。
start / continue 返回实际读取的方法正文；Agent 完成工作后 save / submit，命令不自动执行下一阶段。
submitted Run 不可修改；continuing 后用 continue 新建 Run；完整 Review 才填写 verdict。
actor 是显式责任标识，独立性由 Owner / 会话承担。人工 bootstrap 仅查询；Close / Reopen 未实现。
Archive start 只准备；execute 显式调用原生，finish local-only 观察 / 收口，不自动重试或解除锁。none 观察仍 pending。
操作仍须遵守 Owner 授权；命令成功不产生审核批准。`;
