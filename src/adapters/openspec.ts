import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { MendiError, errorInfo, identifier, object, text } from '../core/errors.ts';
import { managedPath } from './paths.ts';

export const planningArtifacts = ['proposal', 'specs', 'design', 'tasks'] as const;
export type PlanningArtifact = (typeof planningArtifacts)[number];
export interface ArtifactInstructions {
  root: UpstreamRoot;
  changeName: string;
  artifactId: PlanningArtifact;
  schemaName: 'spec-driven';
  instruction: string;
  template: string;
  outputPath: string;
  resolvedOutputPath: string;
  dependencies: { id: PlanningArtifact; done: boolean; path: string; description?: string }[];
  context?: string;
  rules?: string[];
}

export const selectedEntry =
  'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
export interface ProcessResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  error?: Error;
}
export type ProcessRunner = (entry: string, args: string[], cwd: string) => ProcessResult;
export const runProcess: ProcessRunner = (entry, args, cwd) =>
  spawnSync(process.execPath, [entry, ...args], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30_000,
    env: { ...process.env, OPENSPEC_TELEMETRY: '0' },
  });

export interface UpstreamRoot {
  path: string;
  source: 'nearest';
}
export interface ChangeStatus {
  schemaName: 'spec-driven';
  mode: 'repo-local';
  isPlanningComplete: boolean;
  artifacts: { id: string; status: string }[];
}

export class OpenSpec {
  entry: string;
  projectRoot: string;
  runner: ProcessRunner;
  root: UpstreamRoot;
  changes: string[];
  lastCommand?: { args: string[]; cwd: string; stdout: string; stderr: string };

  constructor(projectRoot: string, entry = selectedEntry, runner: ProcessRunner = runProcess) {
    this.projectRoot = projectRoot;
    this.runner = runner;
    if (!path.isAbsolute(entry))
      throw new MendiError('invalid-tool-entry', 'OpenSpec 入口必须是绝对路径。', { entry });
    try {
      this.entry = fs.realpathSync(entry);
      if (!fs.statSync(this.entry).isFile()) throw new Error('入口不是文件');
    } catch (error) {
      throw new MendiError(
        'invalid-tool-entry',
        '选定的 OpenSpec 入口不可用。',
        { entry, ...errorInfo(error) },
        '指定稳定安装的 OpenSpec 1.14.1 入口；不会从 PATH 切换或自动安装。',
      );
    }
    const version = this.execute(['--version']).trim();
    if (version !== '1.14.1')
      throw new MendiError('openspec-version-mismatch', 'OpenSpec 版本不匹配。', {
        entry: this.entry,
        actual: version,
        expected: '1.14.1',
      });
    const list = this.json(['list', '--json']);
    this.root = this.readRoot(list.root);
    if (!Array.isArray(list.changes)) throw this.protocol('list.changes 必须是数组。');
    try {
      this.changes = list.changes.map((value) =>
        identifier(object(value, 'Change').name, 'Change ID'),
      );
    } catch (error) {
      throw this.protocol('list 的 Change 名称不合法。', errorInfo(error));
    }
    if (new Set(this.changes).size !== this.changes.length)
      throw this.protocol('list 包含重复 Change。');
  }

  execute(args: string[]): string {
    const result = this.runner(this.entry, args, this.projectRoot);
    this.lastCommand = {
      args,
      cwd: this.projectRoot,
      stdout: result.stdout,
      stderr: result.stderr,
    };
    if (result.error || result.signal || result.status !== 0) {
      throw new MendiError(
        'upstream-execution-failed',
        'OpenSpec 命令执行失败。',
        {
          entry: this.entry,
          args,
          cwd: this.projectRoot,
          exitCode: result.status,
          signal: result.signal,
          stdout: result.stdout,
          stderr: result.stderr,
          ...(result.error ? { error: errorInfo(result.error) } : {}),
        },
        '核对选定入口、目标配置和实际进程错误后重试。',
      );
    }
    return result.stdout;
  }

  json(args: string[]): Record<string, unknown> {
    const stdout = this.execute(args);
    try {
      return object(JSON.parse(stdout) as unknown, 'OpenSpec JSON');
    } catch (error) {
      throw this.protocol('OpenSpec 没有返回有效的 JSON 对象。', {
        args,
        stdout,
        ...errorInfo(error),
      });
    }
  }

  protocol(message: string, details: unknown = {}): MendiError {
    return new MendiError('upstream-protocol-error', message, {
      entry: this.entry,
      command: this.lastCommand,
      details,
    });
  }

  readRoot(value: unknown): UpstreamRoot {
    let root: Record<string, unknown>;
    try {
      root = object(value, '上游 root');
      text(root.path, 'root.path');
      text(root.source, 'root.source');
      if (!path.isAbsolute(root.path as string)) throw new Error('root.path 不是绝对路径');
    } catch (error) {
      throw this.protocol('上游 root 缺少必要字段。', errorInfo(error));
    }
    if (root.source !== 'nearest')
      throw new MendiError('unsupported-root-source', '上游未使用目标本地 root。', { root });
    let canonical: string;
    try {
      canonical = fs.realpathSync(root.path as string);
    } catch (error) {
      throw this.protocol('上游 root 路径无法解析。', { root, ...errorInfo(error) });
    }
    if (path.relative(this.projectRoot, canonical) !== '') {
      throw new MendiError('upstream-root-mismatch', '上游 root 与显式目标不一致。', {
        projectRoot: this.projectRoot,
        root,
      });
    }
    return { path: canonical, source: 'nearest' };
  }

  status(changeId: string): ChangeStatus {
    identifier(changeId, 'Change ID');
    if (!this.changes.includes(changeId))
      throw new MendiError(
        'change-not-found',
        '目标中不存在指定 Change。',
        { changeId, projectRoot: this.projectRoot },
        '选择该目标 list 中的既有 Change；此命令不创建 Change。',
      );
    const value = this.json(['status', '--change', changeId, '--json']);
    this.readRoot(value.root);
    let action: Record<string, unknown>;
    try {
      action = object(value.actionContext, 'actionContext');
      text(action.mode, 'actionContext.mode');
      text(value.schemaName, 'schemaName');
    } catch (error) {
      throw this.protocol('status 缺少 schema 或 actionContext。', errorInfo(error));
    }
    if (value.changeName !== changeId)
      throw this.protocol('status 的 Change 身份与请求不一致。', {
        changeId,
        actual: value.changeName,
      });
    if (value.schemaName !== 'spec-driven' || action.mode !== 'repo-local') {
      throw new MendiError('unsupported-change-context', 'Change 必须是 repo-local spec-driven。', {
        changeId,
        schema: value.schemaName,
        mode: action.mode,
      });
    }
    if (typeof value.isPlanningComplete !== 'boolean' || !Array.isArray(value.artifacts))
      throw this.protocol('status 缺少规划状态或产物数组。');
    let artifacts: { id: string; status: string }[];
    try {
      artifacts = value.artifacts.map((item) => {
        const artifact = object(item, 'artifact');
        const id = text(artifact.id, 'artifact.id');
        const status = text(artifact.status, 'artifact.status');
        if (!['ready', 'blocked', 'done', 'skipped'].includes(status))
          throw this.protocol('未知产物状态。', { id, status });
        return { id, status };
      });
      if (new Set(artifacts.map((item) => item.id)).size !== artifacts.length)
        throw new Error('产物 ID 重复');
    } catch (error) {
      throw this.protocol('status 的产物结构不合法。', errorInfo(error));
    }
    return {
      schemaName: 'spec-driven',
      mode: 'repo-local',
      isPlanningComplete: value.isPlanningComplete,
      artifacts,
    };
  }

  instructions(changeId: string, artifact: string = 'proposal'): ArtifactInstructions {
    if (!(planningArtifacts as readonly string[]).includes(artifact))
      throw new MendiError('invalid-artifact', '不支持该规划 artifact。', { artifact });
    this.status(changeId);
    const value = this.json(['instructions', artifact, '--change', changeId, '--json']);
    const root = this.readRoot(value.root);
    if (
      value.changeName !== changeId ||
      value.artifactId !== artifact ||
      (value.schemaName !== undefined && value.schemaName !== 'spec-driven')
    )
      throw this.protocol('instructions 身份与请求不一致。');
    let instruction: string, template: string, outputPath: string, resolvedOutputPath: string;
    let dependencies: ArtifactInstructions['dependencies'];
    try {
      instruction = text(value.instruction, 'instruction');
      template = text(value.template, 'template');
      outputPath = text(value.outputPath, 'outputPath');
      resolvedOutputPath = text(value.resolvedOutputPath, 'resolvedOutputPath');
      const changeRoot = managedPath(this.projectRoot, `openspec/changes/${changeId}`);
      const checkedPattern = (pattern: string) => {
        const parts = pattern.split(/[\\/]/);
        // Only the public specs output pattern is a glob; validate its static prefix.
        if (pattern.includes('*') && pattern !== 'specs/**/*.md')
          throw new Error('不支持的输出 pattern');
        const prefix = parts.slice(
          0,
          parts.findIndex((p) => p.includes('*')),
        );
        managedPath(changeRoot, pattern.includes('*') ? prefix.join('/') : pattern);
        return path.resolve(changeRoot, pattern);
      };
      const expected = checkedPattern(outputPath);
      if (
        !path.isAbsolute(resolvedOutputPath) ||
        path.relative(expected, resolvedOutputPath) !== ''
      )
        throw new Error('resolvedOutputPath 与输出不一致');
      if (!Array.isArray(value.dependencies)) throw new Error('dependencies 必须是数组');
      dependencies = value.dependencies.map((item) => {
        const dep = object(item, 'dependency');
        if (
          !(planningArtifacts as readonly unknown[]).includes(dep.id) ||
          typeof dep.done !== 'boolean'
        )
          throw new Error('dependency 身份或 done 不合法');
        const depPath = text(dep.path, 'dependency.path');
        checkedPattern(depPath);
        if (dep.description !== undefined && typeof dep.description !== 'string')
          throw new Error('dependency.description 必须是字符串');
        return {
          id: dep.id as PlanningArtifact,
          done: dep.done,
          path: depPath,
          ...(typeof dep.description === 'string' ? { description: dep.description } : {}),
        };
      });
      if (new Set(dependencies.map((d) => d.id)).size !== dependencies.length)
        throw new Error('dependency ID 重复');
    } catch (error) {
      throw this.protocol('instructions 必要内容或路径不合法。', errorInfo(error));
    }
    if (value.context !== undefined && typeof value.context !== 'string')
      throw this.protocol('instructions.context 必须是字符串。');
    if (
      value.rules !== undefined &&
      (!Array.isArray(value.rules) || !value.rules.every((item) => typeof item === 'string'))
    )
      throw this.protocol('instructions.rules 必须是字符串数组。');
    return {
      root,
      changeName: changeId,
      artifactId: artifact as PlanningArtifact,
      schemaName: 'spec-driven',
      instruction,
      template,
      outputPath,
      resolvedOutputPath,
      dependencies,
      ...(typeof value.context === 'string' ? { context: value.context } : {}),
      ...(Array.isArray(value.rules) ? { rules: value.rules as string[] } : {}),
    };
  }

  info(): { entry: string; version: string; root: UpstreamRoot } {
    return { entry: this.entry, version: '1.14.1', root: this.root };
  }
}
