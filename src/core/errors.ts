export class MendiError extends Error {
  code: string;
  details: unknown;
  fix: string;
  exitCode: number;

  constructor(
    code: string,
    message: string,
    details: unknown = {},
    fix = '核对输入与相关路径后重试。',
    exitCode = 1,
  ) {
    super(message);
    this.name = 'MendiError';
    this.code = code;
    this.details = details;
    this.fix = fix;
    this.exitCode = exitCode;
  }
}

export function errorInfo(error: unknown): { message: string; code?: string } {
  return {
    message: error instanceof Error ? error.message : String(error),
    ...(error instanceof Error && 'code' in error && typeof error.code === 'string'
      ? { code: error.code }
      : {}),
  };
}

export function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MendiError('invalid-data', `${label} 必须是对象。`);
  }
  return value as Record<string, unknown>;
}

export function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new MendiError('invalid-data', `${label} 必须是非空字符串。`);
  return value;
}

export function identifier(value: unknown, label: string): string {
  const result = text(value, label);
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(result)
  ) {
    throw new MendiError(
      'invalid-id',
      `${label} 必须由小写字母、数字与连字符组成，且不能是 Windows 保留名称。`,
      { value },
    );
  }
  return result;
}
