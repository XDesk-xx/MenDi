import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { sequentialTarget, associateSecond, approvedArchive } from './sequential-support.ts';
import { archiveAction } from '../src/application/archive.ts';
import { archiveInput } from './archive-support.ts';
import { pnpmEntry } from './test-support.ts';
import { repository, sandbox, command, isolatedEnv } from './helpers.ts';
import { runFullTest, type FullTestOptions } from '../src/application/delivery-full-test.ts';
import { saveRun, submitRun } from '../src/application/actions.ts';

export const authorActor = 'delivery-author';
export const reviewActor = 'independent-fixture-reviewer';
export function fullInput(project: string) {
  return {
    project,
    inputFile: 'full-test.json',
    role: 'author',
    actor: authorActor,
    pnpmBin: pnpmEntry,
  };
}
export function declarationFile(root: string) {
  fs.writeFileSync(
    path.join(root, 'full-test.json'),
    JSON.stringify(
      {
        collection: ['单元场景', '跨 Change 接线场景'],
        basis: {
          materials:
            '受控 producer / consumer、真实 node:test、pnpm 配置与无外部依赖；阶段批准仅为记录夹具。',
          changes: '',
        },
      },
      null,
      2,
    ) + '\n',
  );
}
export function completedTarget(realWiring = false) {
  const target = sequentialTarget();
  associateSecond(target.root);
  const second = approvedArchive(target.root, 'second-entry');
  assert.equal(archiveAction(archiveInput(target.root, second.run.ref)).result, 'archived');
  declarationFile(target.root);
  if (realWiring) {
    fs.cpSync(
      path.join(repository, 'tests/fixtures/full-test-project'),
      path.join(target.root, 'checks'),
      { recursive: true },
    );
    const pkgFile = path.join(target.root, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    pkg.scripts['test:full'] = 'node --test checks/unit.test.ts checks/integration.test.ts';
    pkg.scripts['test:focused'] = 'node --test checks/integration.test.ts';
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
  }
  return target.root;
}
// 每个测试文件的种子从当前受控输入实际原生归档；隔离副本只复用此构建结果，
// 不读取仓库历史、旧临时环境或任何正式审批作为夹具。
let seed: string | undefined;
export function verificationTarget() {
  seed ??= completedTarget();
  const base = sandbox();
  const root = path.join(base, 'project');
  fs.cpSync(seed, root, { recursive: true });
  const prepared = command(pnpmEntry, ['install', '--offline', '--ignore-scripts'], root, {
    ...isolatedEnv(root),
    COREPACK_ENABLE_NETWORK: '0',
  });
  assert.equal(prepared.status, 0, prepared.stdout + prepared.stderr);
  return root;
}
export async function formal(root: string, options: FullTestOptions = {}) {
  const result = await runFullTest(fullInput(root), options);
  const evidence = process.env.MENDI_TEST_EVIDENCE_DIR;
  if (evidence) {
    const logs: Record<string, string> = {};
    if ('verification' in result && result.verification.child)
      for (const ref of [result.verification.child.stdoutRef, result.verification.child.stderrRef])
        logs[ref] = fs.readFileSync(path.join(root, ref), 'utf8');
    fs.appendFileSync(
      path.join(evidence, `delivery-scenes-${process.pid}.jsonl`),
      JSON.stringify({ root, result, logs }) + '\n',
    );
  }
  return result;
}
export function finishRepair(
  root: string,
  ref: string,
  role = 'author',
  outcome = 'complete',
  verdict?: string,
  body = '受控记录夹具：核对实际局部材料、差异与定向验证；actor / verdict 不认证真实阶段独立性。\n',
) {
  const actor = role === 'author' ? authorActor : reviewActor;
  const bodyFile = path.join(root, 'repair-body.md');
  fs.writeFileSync(bodyFile, body);
  saveRun({ project: root, runRef: ref, role, actor, bodyFile });
  return submitRun({
    project: root,
    runRef: ref,
    role,
    actor,
    outcome,
    result: '受控定向记录',
    ...(verdict ? { verdict } : {}),
  });
}
export function manifest(root: string) {
  return JSON.parse(
    fs.readFileSync(path.join(root, '.mendi/delivery-groups/d01/manifest.json'), 'utf8'),
  );
}
export function writeManifest(root: string, data: unknown) {
  fs.writeFileSync(
    path.join(root, '.mendi/delivery-groups/d01/manifest.json'),
    JSON.stringify(data, null, 2) + '\n',
  );
}
