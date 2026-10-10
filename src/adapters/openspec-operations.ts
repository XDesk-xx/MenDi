import fs from 'node:fs';
import path from 'node:path';
import { object, text } from '../core/errors.ts';
import { managedPath } from './paths.ts';
import type { OpenSpec, UpstreamRoot } from './openspec.ts';

export interface OperationInstructions {
  root: UpstreamRoot;
  changeName: string;
  schemaName: 'spec-driven';
  context?: string;
  operationGuidance?: string[];
}
export interface ApplyInstructions extends OperationInstructions {
  changeDir: string;
  contextFiles: Record<string, string[]>;
  tasks: { id: string; description: string; done: boolean; sourcePath: string; line: number }[];
  progress: { total: number; complete: number; remaining: number };
  state: 'blocked' | 'ready' | 'all_done';
  instruction: string;
  taskTrackingConfigured: boolean;
  missingArtifacts?: string[];
  missingPrerequisites?: string[];
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((s) => typeof s !== 'string'))
    throw new Error('必须是字符串数组');
  return value;
}
export function operationInstructions(tool: OpenSpec, changeId: string, operation: string) {
  if (operation !== 'apply' && operation !== 'archive')
    throw tool.protocol('不支持该 operation。', { operation });
  tool.status(changeId);
  const value = tool.json(['instructions', operation, '--change', changeId, '--json']);
  const root = tool.readRoot(value.root);
  try {
    if (
      value.changeName !== changeId ||
      (value.schemaName !== undefined && value.schemaName !== 'spec-driven')
    )
      throw new Error('操作身份或 schema 不一致');
    if (value.context !== undefined && typeof value.context !== 'string')
      throw new Error('context 必须是字符串');
    if (value.operationGuidance !== undefined) strings(value.operationGuidance);
    const base: OperationInstructions = {
      root,
      changeName: changeId,
      schemaName: 'spec-driven',
      ...(typeof value.context === 'string' ? { context: value.context } : {}),
      ...(value.operationGuidance !== undefined
        ? { operationGuidance: strings(value.operationGuidance) }
        : {}),
    };
    if (operation === 'archive') return base;
    const changeRoot = managedPath(tool.projectRoot, `openspec/changes/${changeId}`);
    const file = (value: unknown) => {
      const absolute = text(value, '操作输入路径');
      if (!path.isAbsolute(absolute)) throw new Error('路径必须是绝对路径');
      const checked = managedPath(
        changeRoot,
        path.relative(changeRoot, absolute).replaceAll('\\', '/'),
      );
      if (valueState !== 'blocked' && (!fs.existsSync(checked) || !fs.statSync(checked).isFile()))
        throw new Error('必要操作文件不存在');
      return checked;
    };
    const valueState = value.state;
    if (!['blocked', 'ready', 'all_done'].includes(String(valueState)))
      throw new Error('state 无效');
    if (
      typeof value.changeDir !== 'string' ||
      !path.isAbsolute(value.changeDir) ||
      path.relative(changeRoot, value.changeDir) !== ''
    )
      throw new Error('changeDir 不一致');
    if (value.schemaName !== 'spec-driven' || typeof value.taskTrackingConfigured !== 'boolean')
      throw new Error('Apply 必要字段缺失');
    const contextFiles = Object.fromEntries(
      Object.entries(object(value.contextFiles, 'contextFiles')).map(([id, paths]) => [
        id,
        strings(paths).map(file),
      ]),
    );
    if (!Array.isArray(value.tasks)) throw new Error('tasks 必须是数组');
    const tasks = value.tasks.map((v) => {
      const t = object(v, 'task');
      if (typeof t.done !== 'boolean' || !Number.isSafeInteger(t.line) || Number(t.line) < 1)
        throw new Error('task done / line 无效');
      return {
        id: text(t.id, 'task.id'),
        description: text(t.description, 'task.description'),
        done: t.done,
        sourcePath: file(t.sourcePath),
        line: Number(t.line),
      };
    });
    if (new Set(tasks.map((t) => t.id)).size !== tasks.length) throw new Error('task id 重复');
    const progress = object(value.progress, 'progress');
    const complete = tasks.filter((t) => t.done).length;
    if (
      progress.total !== tasks.length ||
      progress.complete !== complete ||
      progress.remaining !== tasks.length - complete ||
      (valueState === 'all_done' && progress.remaining !== 0) ||
      (valueState === 'ready' && progress.remaining === 0)
    )
      throw new Error('progress / state 与任务不一致');
    const result: ApplyInstructions = {
      ...base,
      changeDir: changeRoot,
      contextFiles,
      tasks,
      progress: { total: tasks.length, complete, remaining: tasks.length - complete },
      state: valueState as ApplyInstructions['state'],
      instruction: text(value.instruction, 'instruction'),
      taskTrackingConfigured: value.taskTrackingConfigured,
      ...(value.missingArtifacts !== undefined
        ? { missingArtifacts: strings(value.missingArtifacts) }
        : {}),
      ...(value.missingPrerequisites !== undefined
        ? { missingPrerequisites: strings(value.missingPrerequisites) }
        : {}),
    };
    return result;
  } catch (error) {
    throw tool.protocol('操作指引的必要字段、状态或路径无效。', { reason: String(error) });
  }
}
