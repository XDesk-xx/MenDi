import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { verificationTarget, fullInput } from './delivery-support.ts';
import { writePackage } from './test-support.ts';
import { repository } from './helpers.ts';
import { runFullTest, type FullTestOptions } from '../src/application/delivery-full-test.ts';
import { groupPlan } from '../src/core/group-plan.ts';
import { groupEvidence } from './evidence-scenes.ts';
import { evidenceSession } from './evidence-support.ts';

export const groupCandidate = {
  id: 'c1',
  basis: {
    materials: '隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具',
    changes: '',
  },
};
export function groupTarget() {
  const root = verificationTarget();
  fs.copyFileSync(
    path.join(repository, 'tests/fixtures/group-node-runner.ts'),
    path.join(root, 'group-runner.ts'),
  );
  for (const id of ['prefix', 'middle', 'tail'])
    fs.writeFileSync(
      path.join(root, `${id}.test.ts`),
      `import test from 'node:test';import assert from 'node:assert/strict';test('${id}',()=>assert.equal(1,1));\n`,
    );
  const plan = groupPlan({
    protocol: 'mendi-group-tests/1',
    groups: ['prefix', 'middle', 'tail'].map((id) => ({
      id,
      title: id,
      kind: 'tests',
      required: true,
      dependsOn: [],
      resources: [],
      selection: [`${id}.test.ts`],
      completion: '业务断言、Node容器及根汇总均完成',
      preparation: '隔离本次目标，无共享服务',
      exclusions: [],
    })),
  });
  fs.writeFileSync(path.join(root, 'group-plan.json'), JSON.stringify(plan, null, 2));
  writePackage(root, (p) => {
    (p.scripts as Record<string, string>)['test:full'] = 'node group-runner.ts';
  });
  const declaration = {
    mode: 'groups-v1',
    planRef: 'group-plan.json',
    candidate: groupCandidate,
    purpose: 'initial',
    selection: ['prefix', 'middle', 'tail'],
  };
  fs.writeFileSync(path.join(root, 'group-input.json'), JSON.stringify(declaration, null, 2));
  return { root, plan, declaration };
}
export function writeGroupInput(root: string, value: unknown) {
  fs.writeFileSync(path.join(root, 'group-input.json'), JSON.stringify(value, null, 2));
}
/** Apply 的少量指定场景快照；输入仍由受控 tests 重建，不复制历史树。 */
export function recordApplyScene(
  label: string,
  root: string,
  result: Awaited<ReturnType<typeof groupRun>>,
  extra: unknown = null,
) {
  const evidence = process.env.MENDI_APPLY_EVIDENCE;
  if (!evidence || !result.run) return;
  const { scene, compact } = groupEvidence(
    process.env.MENDI_TEST_EVIDENCE_DIR ?? evidence,
    root,
    result,
  );
  evidenceSession(evidence).record(
    `${label}-${process.pid}.json`,
    {
      label,
      authority: '隔离产品场景；actor / verdict 为夹具，不认证 MenDi 根审核',
      ...scene,
      extra: compact(extra),
    },
    false,
  );
}
export async function groupRun(root: string, options: FullTestOptions = {}) {
  const result = await runFullTest({ ...fullInput(root), inputFile: 'group-input.json' }, options);
  const dir = process.env.MENDI_TEST_EVIDENCE_DIR ?? process.env.MENDI_APPLY_EVIDENCE;
  if (dir) {
    evidenceSession(dir).record(
      `group-scenes-${process.pid}.jsonl`,
      groupEvidence(dir, root, result).scene,
    );
  }
  return result;
}
export function attemptResult(result: Awaited<ReturnType<typeof groupRun>>) {
  assert.ok(
    'groupExecution' in result && result.groupExecution && result.run && result.next,
    JSON.stringify(result),
  );
  return { ...result, groupExecution: result.groupExecution, run: result.run, next: result.next };
}
