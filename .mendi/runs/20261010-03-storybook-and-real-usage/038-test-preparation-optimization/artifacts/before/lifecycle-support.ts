import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { completedTarget, formal, authorActor } from './delivery-support.ts';
import { sandbox, command, isolatedEnv, cli, prepareChange } from './helpers.ts';
import { pnpmEntry } from './test-support.ts';
import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { bindChange } from '../src/application/project.ts';
import { approvedArchive } from './sequential-support.ts';
import { archiveAction } from '../src/application/archive.ts';
import { archiveInput } from './archive-support.ts';
import type { TestExecution } from '../src/core/test-execution.ts';

let seed: string | undefined;
export function lifecycleTarget() {
  if (!seed) {
    seed = completedTarget(true);
    const producer = path.join(seed, 'checks/producer.ts');
    fs.writeFileSync(
      producer,
      fs.readFileSync(producer, 'utf8').replace('change-completed', 'change-archived'),
    );
  }
  const root = path.join(sandbox(), 'project');
  fs.cpSync(seed, root, { recursive: true });
  const installed = command(pnpmEntry, ['install', '--offline', '--ignore-scripts'], root, {
    ...isolatedEnv(root),
    COREPACK_ENABLE_NETWORK: '0',
  });
  assert.equal(installed.status, 0, installed.stdout + installed.stderr);
  return root;
}
export function writeJson(root: string, ref: string, value: unknown) {
  fs.writeFileSync(path.join(root, ref), JSON.stringify(value, null, 2) + '\n');
}
export function lifecycleInput(root: string, file = 'close.json') {
  return { project: root, inputFile: file, role: 'author', actor: authorActor };
}
export function closeInput(root: string, ref?: string) {
  const workspace = readWorkspace(root)!;
  writeJson(root, 'close.json', {
    fullTestRunRef: ref ?? workspace.manifest.fullTestRunRef,
    applicability: {
      conclusion: 'applicable',
      materials: '实际 producer / consumer、unit / integration 测试与当前配置。',
      changes: '隔离副本已统一 archived 契约；结果之后没有行为变化。',
      reason: '真实完整集合覆盖本轮两个 Change 接线与必要输入。',
    },
  });
  return lifecycleInput(root);
}
export async function passedTarget() {
  const root = lifecycleTarget();
  const passed = await formal(root);
  assert.equal(passed.ok, true, JSON.stringify(passed));
  assert.ok('verification' in passed && passed.verification.child);
  const groups = fs
    .readFileSync(path.join(root, 'executed-groups.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line).group);
  assert.ok(groups.includes('unit') && groups.includes('integration'));
  return { root, passed, input: closeInput(root) };
}
export async function closedTarget() {
  const target = await passedTarget();
  const close = deliveryLifecycle('delivery-close', target.input);
  assert.equal(close.ok, true);
  return { ...target, close };
}
export function reopenInput(root: string, slot = 'C') {
  writeJson(root, 'reopen.json', {
    goal: '本轮新增受控能力',
    plannedChanges: [{ slot, title: '新的归档与完整验收', dependsOn: [] }],
    reason: 'Owner 明确增加本轮范围，旧验收保留作历史。',
  });
  return {
    project: root,
    scopePath: 'reopen.json',
    reason: 'Owner 明确增加本轮范围，旧验收保留作历史。',
    role: 'author',
    actor: authorActor,
  };
}
export function openInput(root: string, id = 'd02') {
  writeJson(root, 'new-scope.json', {
    goal: '新的 Delivery 验收',
    plannedChanges: [{ slot: 'N', title: '新 Delivery 的工作', dependsOn: [] }],
  });
  return {
    project: root,
    id,
    title: '新 Delivery',
    scopePath: 'new-scope.json',
    role: 'author',
    actor: authorActor,
  };
}
export function prepareLifecycleChange(root: string, changeId: string) {
  prepareChange(root, isolatedEnv(root), changeId);
  const home = path.join(root, 'openspec/changes', changeId);
  fs.writeFileSync(
    path.join(home, 'proposal.md'),
    '# Proposal\n\n隔离生命周期验收的实际受控变化。\n',
  );
  fs.writeFileSync(
    path.join(home, 'design.md'),
    '# Design\n\n使用维护的单元与接线集合进行实际验证。\n',
  );
  fs.writeFileSync(path.join(home, 'tasks.md'), '# Tasks\n\n- [x] 1.1 受控输入与场景准备完成\n');
  fs.mkdirSync(path.join(home, 'specs', changeId), { recursive: true });
  fs.writeFileSync(
    path.join(home, 'specs', changeId, 'spec.md'),
    `# Spec Delta\n\n## ADDED Requirements\n\n### Requirement: Lifecycle operation\n系统 SHALL 保存明确的生命周期工作。\n\n#### Scenario: Explicit completion\n- **WHEN** 明确实施受控变化\n- **THEN** 保存完整结果\n`,
  );
}
export function archiveNew(root: string, changeId: string, slot: string) {
  prepareLifecycleChange(root, changeId);
  bindChange({ project: root, changeId, slot });
  const archive = approvedArchive(root, changeId);
  const result = archiveAction(archiveInput(root, archive.run.ref));
  assert.equal(result.result, 'archived');
  return result;
}
export function queryCli(root: string, args: string[] = [], exit = 0) {
  const result = cli(['status', '--project', root, ...args, '--json'], root, isolatedEnv(root));
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
export function lifecycleCli(root: string, operation: string, args: string[], exit = 0) {
  const result = cli(
    [
      'delivery',
      operation,
      '--project',
      root,
      '--role',
      'author',
      '--actor',
      authorActor,
      ...args,
      '--json',
    ],
    root,
    isolatedEnv(root),
  );
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
export function recordLifecycleScene(
  root: string,
  scenario: string,
  data: unknown,
  executions: TestExecution[],
) {
  const destination = process.env.MENDI_LIFECYCLE_EVIDENCE;
  if (!destination) return;
  const logs = executions.map((record) => ({
    record,
    stdout: fs.readFileSync(path.join(root, record.stdoutRef), 'utf8'),
    stderr: fs.readFileSync(path.join(root, record.stderrRef), 'utf8'),
  }));
  fs.appendFileSync(
    destination,
    JSON.stringify({
      scenario,
      root,
      preparationRoot: seed,
      authority: '阶段批准为明确的记录夹具；执行、原生归档与读回是真实本地操作，不认证本仓库审核。',
      data,
      logs,
      project: readWorkspace(root)!.project,
    }) + '\n',
  );
}
