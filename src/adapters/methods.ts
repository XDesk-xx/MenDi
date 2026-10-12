import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { actionDefinition, type ActionType } from '../core/actions.ts';
import { deliveryDefinition, deliveryTypes, type DeliveryType } from '../core/delivery-runs.ts';
import { errorInfo, MendiError, object } from '../core/errors.ts';
import { managedPath } from './paths.ts';

function methodFile(file: string) {
  if (!fs.statSync(file).isFile()) throw new Error('方法不是普通文件');
  const content = fs.readFileSync(file, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(content);
  if (!match || !match[2].trim()) throw new Error('方法缺少头部或正文');
  return { content, header: object(parse(match[1]), '方法头部') };
}

export const bundledRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function loadMethods(type: ActionType | DeliveryType, tools: string[], root = bundledRoot) {
  const definition = deliveryTypes.includes(type as DeliveryType)
    ? deliveryDefinition(type)
    : actionDefinition(type);
  if (
    tools.some((tool) => tool !== 'openspec' && tool !== 'storybook') ||
    new Set(tools).size !== tools.length
  )
    throw new MendiError('skill-unavailable', '不支持或重复的工具指导。');
  function read(ref: string, expected: Record<string, string>) {
    const file = path.join(root, ref);
    try {
      const { content, header } = methodFile(file);
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

export function targetMethodName(type: ActionType): string | undefined {
  const definition = actionDefinition(type);
  if (definition.review) return undefined;
  switch (definition.phase) {
    case 'explore':
      return 'openspec-explore';
    case 'propose':
      return definition.revision ? 'openspec-update-change' : 'openspec-propose';
    case 'apply':
      return 'openspec-apply-change';
    case 'archive':
      return 'openspec-archive-change';
  }
}

export function readTargetMethod(projectRoot: string, name: string) {
  const root = fs.realpathSync(projectRoot);
  const ref = `.agents/skills/${name}/SKILL.md`;
  const checked = managedPath(root, ref);
  let observed: unknown;
  try {
    const file = fs.realpathSync(checked);
    managedPath(root, path.relative(root, file).split(path.sep).join('/'));
    const { content, header } = methodFile(file);
    const metadata = object(header.metadata, '方法 metadata');
    observed = { name: header.name, generatedBy: metadata.generatedBy };
    if (header.name !== name || metadata.generatedBy !== '1.14.1')
      throw new Error('方法名称或生成基线不匹配');
    return { name, projectRoot: root, ref, file, generatedBy: '1.14.1', content };
  } catch (error) {
    if (error instanceof MendiError && error.code === 'unsafe-reference') throw error;
    throw new MendiError(
      'skill-unavailable',
      '当前目标的必要 OpenSpec 方法不可用。',
      {
        file: checked,
        expected: { name, generatedBy: '1.14.1' },
        observed,
        ...errorInfo(error),
      },
      '在当前目标明确准备 OpenSpec 1.14.1 方法；不会自动安装或切换来源。',
    );
  }
}

export function loadChangeMethods(
  type: ActionType,
  tools: string[],
  projectRoot: string,
  methodsRoot = bundledRoot,
) {
  const methods = loadMethods(type, tools, methodsRoot);
  const name = targetMethodName(type);
  return { ...methods, upstream: name ? [readTargetMethod(projectRoot, name)] : [] };
}
