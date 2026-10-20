import { readWorkspace } from '../adapters/workspace.ts';
import { verificationScope } from '../core/delivery-verification.ts';
import { MendiError, text } from '../core/errors.ts';
import { requireWritable } from '../core/rounds.ts';
export interface FullTestInput {
  project: string;
  inputFile: string;
  role: string;
  actor: string;
  pnpmBin: string;
}
export function formalWorkspace(root: string, input: FullTestInput, ownLock: boolean) {
  if (input.role !== 'author')
    throw new MendiError('action-role-mismatch', '正式 Full Test 要求 Author。');
  text(input.actor, 'actor');
  text(input.pnpmBin, 'pnpm-bin');
  const workspace = readWorkspace(root, ownLock);
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('manual-state-read-only', '正式执行只支持 open product。');
  requireWritable(workspace);
  const scope = verificationScope(workspace);
  return { workspace, scope };
}
