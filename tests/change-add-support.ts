import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { cli, isolatedEnv } from './helpers.ts';
import { authorActor } from './delivery-support.ts';

export const input = (root: string) => ({
  project: root,
  inputFile: 'append.json',
  role: 'author',
  actor: authorActor,
});
export const additions = [
  { slot: 'C', title: '新增 C', dependsOn: ['B'] },
  { slot: 'D', title: '新增 D', dependsOn: ['C'] },
];
export function write(root: string, patch: Record<string, unknown> = {}) {
  const value = {
    requestId: 'owner-append-01',
    ownerDecision: 'Owner 场景夹具：明确授权 C/D 范围，非仓库授权',
    reason: '增加后续交付',
    additions,
    ...patch,
  };
  fs.writeFileSync(path.join(root, 'append.json'), JSON.stringify(value, null, 2) + '\n');
  return value;
}
export function execute(root: string, args: string[], exit = 0) {
  const result = cli([...args, '--project', root, '--json'], root, isolatedEnv(root));
  assert.equal(result.status, exit, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
export function evidence(label: string, root: string, data: unknown) {
  const directory = process.env.MENDI_APPLY_EVIDENCE;
  if (directory)
    fs.writeFileSync(
      path.join(directory, `${label}.json`),
      JSON.stringify(
        {
          label,
          root,
          authority: '隔离 product-v2 实际操作；阶段批准为受控记录夹具，不认证仓库独立 Review',
          data,
        },
        null,
        2,
      ) + '\n',
    );
}
