import { MendiError, text } from '../core/errors.ts';

export interface Arguments {
  command: 'help' | 'delivery-open' | 'change-bind' | 'status' | 'next';
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
  } else if (args[0] === 'status' || args[0] === 'next') {
    command = args[0];
    consumed = 1;
  } else throw usage('未知命令。');
  const allowed = new Set([
    'project',
    'openspec-bin',
    ...(command === 'delivery-open'
      ? ['id', 'title', 'scope', 'change', 'slot']
      : command === 'change-bind'
        ? ['change', 'slot']
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
    ...(command === 'delivery-open'
      ? ['id', 'title', 'scope']
      : command === 'change-bind'
        ? ['change', 'slot']
        : []),
  ];
  for (const key of required) if (!values[key]) throw usage(`缺少 --${key}。`);
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

项目命令支持 --openspec-bin <稳定 OpenSpec 1.14.1 绝对入口> 和 --json。
--project 相对于调用目录；--scope 相对于目标项目根。
首次 Open 要求目标无 .mendi；首版只关联第一个既有 Change。
人工 bootstrap 仅支持查询。阶段执行、Run 写入及 Close / Reopen 尚未实现。
操作仍须遵守 Owner 授权；命令成功不产生审核批准。`;
