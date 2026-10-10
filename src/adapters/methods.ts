import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { actionDefinition, type ActionType } from '../core/actions.ts';
import { errorInfo, MendiError, object } from '../core/errors.ts';

export const bundledRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function loadMethods(type: ActionType, tools: string[], root = bundledRoot) {
  const definition = actionDefinition(type);
  if (tools.some((tool) => tool !== 'openspec') || new Set(tools).size !== tools.length)
    throw new MendiError('skill-unavailable', '不支持或重复的工具指导。');
  function read(ref: string, expected: Record<string, string>) {
    const file = path.join(root, ref);
    try {
      const content = fs.readFileSync(file, 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(content);
      if (!match || !match[2].trim()) throw new Error('方法缺少头部或正文');
      const header = object(parse(match[1]), '方法头部');
      for (const [key, value] of Object.entries(expected))
        if (header[key] !== value) throw new Error(`方法 ${key} 不匹配`);
      return { ref, file, content };
    } catch (error) {
      throw new MendiError('skill-unavailable', '必要阶段方法或工具指导不可用。', {
        file,
        ...errorInfo(error),
      });
    }
  }
  const stage = read(`skills/actions/${definition.skill}/SKILL.md`, {
    name: `mendi-${definition.skill}`,
    phase: definition.phase,
    role: definition.role,
  });
  const guidance = tools.map((tool) =>
    read(`skills/tools/${tool}/SKILL.md`, { name: `mendi-${tool}`, tool }),
  );
  return { stage, guidance };
}
