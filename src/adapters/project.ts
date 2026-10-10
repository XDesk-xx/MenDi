import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { MendiError, errorInfo, object } from '../core/errors.ts';
import { managedPath, present } from './paths.ts';

export function inspectProject(target: string): { root: string; configPath: string } {
  let root: string;
  try {
    root = fs.realpathSync(path.resolve(target));
    if (!fs.statSync(root).isDirectory()) throw new Error('目标不是目录');
  } catch (error) {
    throw new MendiError(
      'invalid-project',
      '目标项目目录不可用。',
      { target, ...errorInfo(error) },
      '使用 --project 指定存在的项目根目录。',
    );
  }
  const primary = managedPath(root, 'openspec/config.yaml');
  const configPath = present(primary) ? primary : managedPath(root, 'openspec/config.yml');
  if (!present(configPath)) {
    throw new MendiError(
      'local-config-missing',
      '目标没有本地 OpenSpec 配置。',
      { root, expected: primary },
      '先明确并准备该目标的 repo-local OpenSpec 配置；本命令不自动初始化。',
    );
  }
  let settings: Record<string, unknown>;
  try {
    settings = object(parse(fs.readFileSync(configPath, 'utf8')) as unknown, 'OpenSpec 配置');
  } catch (error) {
    throw new MendiError(
      'invalid-local-config',
      '无法读取或解析主 OpenSpec 配置。',
      { configPath, ...errorInfo(error) },
      '修复此配置，不使用其他来源代替。',
    );
  }
  if (Object.hasOwn(settings, 'store')) {
    throw new MendiError(
      'unsupported-store-declaration',
      '当前仅支持 repo-local 配置，不支持 store 声明。',
      { configPath, storeType: typeof settings.store },
      '明确该 store 的接入需求；当前操作保留文件并停止。',
    );
  }
  if (settings.schema !== undefined && settings.schema !== 'spec-driven') {
    throw new MendiError('unsupported-schema', '当前仅支持 spec-driven schema。', {
      configPath,
      schemaType: typeof settings.schema,
    });
  }
  return { root, configPath };
}
