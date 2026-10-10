#!/usr/bin/env node
import { dispatch } from './dispatch.ts';
import { display } from './output.ts';
import { help, parseArguments } from './arguments.ts';
import { MendiError, errorInfo } from '../core/errors.ts';
const args = process.argv.slice(2);
try {
  const parsed = parseArguments(args);
  if (parsed.command === 'help') console.log(help);
  else {
    const result = await dispatch(parsed);
    if (!result.ok) process.exitCode = 1;
    if (parsed.json) console.log(JSON.stringify(result, null, 2));
    else display(result, parsed);
  }
} catch (error) {
  const failure =
    error instanceof MendiError
      ? error
      : new MendiError('operation-failed', '操作失败。', errorInfo(error));
  const result = {
    ok: false,
    error: {
      code: failure.code,
      message: failure.message,
      details: failure.details,
      fix: failure.fix,
    },
  };
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else
    console.error(
      `${failure.code}：${failure.message}\n${failure.fix}\n${JSON.stringify(failure.details)}`,
    );
  process.exitCode = failure.exitCode;
}
