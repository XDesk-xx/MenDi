import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { verificationTarget, fullInput } from './delivery-support.ts';
import { writePackage } from './test-support.ts';
import { repository } from './helpers.ts';
import { runFullTest, type FullTestOptions } from '../src/application/delivery-full-test.ts';
import { groupPlan } from '../src/core/group-plan.ts';

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
  const a = result.run.attempt;
  const group = 'groupExecution' in result ? result.groupExecution : undefined;
  const read = (ref: string) => fs.readFileSync(path.join(root, ref), 'utf8');
  fs.writeFileSync(
    path.join(evidence, `${label}-${process.pid}.json`),
    JSON.stringify(
      {
        label,
        authority: '隔离产品场景；actor / verdict 为夹具，不认证 MenDi 根审核',
        result: {
          ok: result.ok,
          run: result.run,
          groupExecution: group,
          next: 'next' in result ? result.next : null,
        },
        extra,
        report: a?.request ? JSON.parse(read(a.request.reportRef)) : null,
        stdout: group?.child ? read(group.child.stdoutRef) : null,
        stderr: group?.child ? read(group.child.stderrRef) : null,
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  );
}
export async function groupRun(root: string, options: FullTestOptions = {}) {
  const result = await runFullTest({ ...fullInput(root), inputFile: 'group-input.json' }, options);
  const dir = process.env.MENDI_TEST_EVIDENCE_DIR;
  if (dir) {
    fs.appendFileSync(
      path.join(dir, `group-scenes-${process.pid}.jsonl`),
      JSON.stringify({ root, result }) + '\n',
    );
    if (result.run) {
      const id = result.run.attempt?.executionId;
      const folder = path.join(
        dir,
        'groups',
        `${process.pid}-${path.basename(path.dirname(root))}`,
        id ?? 'not-run',
      );
      fs.mkdirSync(folder, { recursive: true });
      const parent = path.join(root, result.run.ref);
      if (fs.existsSync(parent) && !fs.existsSync(path.join(folder, 'run.md')))
        fs.copyFileSync(parent, path.join(folder, 'run.md'));
      if (id) {
        const base = path.join(root, `.mendi/delivery-groups/d01/tests/${id}`);
        for (const name of fs.readdirSync(base))
          if (
            [
              'result.json',
              'stdout.log',
              'stderr.log',
              'group-request.json',
              'group-report.json',
              'group-events.jsonl',
            ].includes(name) ||
            name.endsWith('.tmp')
          ) {
            const output = path.join(folder, name);
            if (!fs.existsSync(output)) fs.copyFileSync(path.join(base, name), output);
          }
      }
    }
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
