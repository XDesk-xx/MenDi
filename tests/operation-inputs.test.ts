import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { OpenSpec } from '../src/adapters/openspec.ts';
import { stageTarget } from './delivery-stage-support.ts';
import { runner } from './action-support.ts';

test('真实 Apply blocked / ready / all_done 和 Archive 指引保留各自协议', () => {
  const { root, change } = stageTarget();
  const tool = new OpenSpec(root);
  const ready = tool.operationInstructions('proof-entry', 'apply');
  assert.equal(ready.state, 'ready');
  assert.equal(ready.tasks[0].done, false);
  assert.equal(ready.tasks[0].sourcePath, path.join(change, 'tasks.md'));
  fs.writeFileSync(path.join(change, 'tasks.md'), '# Tasks\n\n- [x] 1.1 验证受控行为\n');
  assert.equal(tool.operationInstructions('proof-entry', 'apply').state, 'all_done');
  fs.unlinkSync(path.join(change, 'tasks.md'));
  assert.equal(tool.operationInstructions('proof-entry', 'apply').state, 'blocked');
  const archive = tool.operationInstructions('proof-entry', 'archive');
  assert.equal(archive.changeName, 'proof-entry');
  assert.equal(archive.schemaName, 'spec-driven');
  assert.equal('template' in archive, false);
  assert.equal('outputPath' in archive, false);
});

test('操作必要字段、进度、身份、路径、guidance 校验；未知 Ref 不读取', () => {
  const { root, change } = stageTarget();
  const task = {
    id: '1',
    description: '受控',
    done: false,
    sourcePath: path.join(change, 'tasks.md'),
    line: 3,
  };
  const valid = {
    changeName: 'proof-entry',
    schemaName: 'spec-driven',
    changeDir: change,
    contextFiles: { tasks: [task.sourcePath] },
    tasks: [task],
    progress: { total: 1, complete: 0, remaining: 1 },
    state: 'ready',
    taskTrackingConfigured: true,
    instruction: '实施受控任务',
    root: { path: root, source: 'nearest' },
    context: '上下文',
    operationGuidance: ['指导'],
    unknownRef: '../not-readable',
    historyRef: 'lost.md',
  };
  const tool = (patch: Record<string, unknown>) =>
    new OpenSpec(root, undefined, (entry, args, cwd) =>
      args[0] === 'instructions'
        ? { status: 0, signal: null, stderr: '', stdout: JSON.stringify({ ...valid, ...patch }) }
        : runner(entry, args, cwd),
    );
  assert.equal(tool({}).operationInstructions('proof-entry', 'apply').context, '上下文');
  for (const patch of [
    { tasks: undefined },
    { progress: { total: 2, complete: 0, remaining: 2 } },
    { changeName: 'other' },
    { schemaName: 'other' },
    { changeDir: root },
    { operationGuidance: [42] },
    { state: 'other' },
    { tasks: [{ ...task, line: 0 }] },
    { contextFiles: { tasks: [path.join(root, 'README.md')] } },
    { contextFiles: { tasks: [path.join(change, 'missing.md')] } },
    { context: 42 },
  ])
    assert.throws(() => tool(patch).operationInstructions('proof-entry', 'apply'));
  const external = fs.mkdtempSync(path.join(path.dirname(root), 'external-input-'));
  fs.writeFileSync(path.join(external, 'input.md'), 'external');
  fs.symlinkSync(external, path.join(change, 'link'), 'junction');
  assert.throws(() =>
    tool({ contextFiles: { tasks: [path.join(change, 'link/input.md')] } }).operationInstructions(
      'proof-entry',
      'apply',
    ),
  );
  assert.throws(() => tool({}).operationInstructions('proof-entry', 'other'));
});
