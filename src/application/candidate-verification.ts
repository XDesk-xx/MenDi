import { inspectProject } from '../adapters/project.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { readDeliveryRun } from '../adapters/delivery-runs.ts';
import { inspectCandidate } from '../adapters/group-store.ts';
import { deliveryLocation } from '../core/delivery-runs.ts';
import { deliveryNext } from '../core/delivery-next.ts';
import { MendiError } from '../core/errors.ts';
import { state } from './project.ts';
import type { ActionOptions } from './action-context.ts';
export interface VerificationInput {
  project: string;
  inputFile: string;
  role: string;
  actor: string;
}
export function createVerification(_input: VerificationInput, _options: ActionOptions = {}): never {
  throw new MendiError(
    'historical-verification-read-only',
    '新的正式 PASS 由本次完整 v2 Full Test 直接产生；verification create 仅保留历史 status，不再新建。',
  );
}
export function verificationStatus(input: { project: string; runRef: string }) {
  const { root } = inspectProject(input.project);
  const id = input.runRef.split('/')[2];
  deliveryLocation(input.runRef, id);
  const workspace = readWorkspace(root, false, id);
  if (!workspace || workspace.mode !== 'product')
    throw new MendiError('invalid-run', '需要登记 product。');
  const run = readDeliveryRun(root, input.runRef, workspace.id);
  const facts = inspectCandidate(root, workspace, run);
  return {
    ok: facts.stable,
    operation: 'delivery-verification-status',
    projectRoot: root,
    openspec: null,
    local: state(workspace),
    run: { ref: run.ref, ...run.record },
    candidateVerification: facts,
    next: deliveryNext(run.record, run.ref, facts.stable ? undefined : 'unknown'),
  };
}
