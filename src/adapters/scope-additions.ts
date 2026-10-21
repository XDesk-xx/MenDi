import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual as equal } from 'node:util';
import { MendiError, object, text } from '../core/errors.ts';
import { parseProject, parseWorkspace, type Workspace } from '../core/records.ts';
import {
  additionEvidenceRefs,
  requireAdditionEvidence,
  scopePointers,
} from '../core/scope-addition.ts';
import { readDeliveryRun } from './delivery-runs.ts';
import { managedPath } from './paths.ts';

/** Only the explicitly stored finite milestones are inputs, never the explanatory Run history. */
export function scopeAdditionReceipts(root: string, workspace: Workspace) {
  const bytes = new Map<string, Buffer>();
  for (const round of workspace.rounds ?? []) {
    for (const milestone of round.scopeAdditions ?? []) {
      const file = managedPath(root, milestone.runRef);
      const content = fs.readFileSync(file);
      const run = readDeliveryRun(root, milestone.runRef, workspace.id);
      const receipt = run.record.changeAdd;
      if (
        !receipt ||
        run.record.status !== 'submitted' ||
        receipt.roundId !== round.id ||
        !equal(milestone, {
          requestId: receipt.requestId,
          runRef: run.ref,
          beforeScope: receipt.beforeScope,
          addedSlots: receipt.addedSlots,
          afterScope: receipt.afterScope,
        }) ||
        !fs.readFileSync(file).equals(content)
      )
        throw new MendiError(
          'invalid-scope-addition',
          '追加快照缺少一致、已提交、同轮 Author 收据。',
          { ref: milestone.runRef },
        );
      const intentRef = milestone.runRef.replace('run.md', 'artifacts/intent.json');
      const intentBytes = fs.readFileSync(managedPath(root, intentRef));
      const basis = object(JSON.parse(intentBytes.toString()), '原范围依据');
      const direct = basis.direct;
      const digests = basis.directDigests;
      if (
        !Array.isArray(direct) ||
        direct.some(
          (row) =>
            !Array.isArray(row) ||
            row.length !== 2 ||
            typeof row[0] !== 'string' ||
            typeof row[1] !== 'string',
        ) ||
        (digests !== undefined &&
          (!Array.isArray(digests) ||
            digests.some(
              (row) =>
                !Array.isArray(row) ||
                row.length !== 2 ||
                typeof row[0] !== 'string' ||
                typeof row[1] !== 'string' ||
                !/^[0-9a-f]{64}$/.test(row[1]),
            )))
      )
        throw new MendiError('invalid-scope-addition', '历史追加依据的直接输入格式不合法。');
      const before = parseWorkspace(
        parseProject(JSON.parse(text(basis.project, '原项目'))),
        JSON.parse(text(basis.manifest, '原 manifest')),
      );
      const oldDirect = direct as [string, string][];
      const oldDigests = (digests ?? []) as [string, string][];
      requireAdditionEvidence(
        before,
        oldDirect.map(([ref]) => ref),
        oldDigests.map(([ref]) => ref),
      );
      const required = new Set(additionEvidenceRefs(before));
      // Existing legacy inline byte evidence is still valid, but it must
      // match the immutable referenced receipt/intent when reading history.
      for (const [ref, data] of oldDirect) {
        if (!required.has(ref)) continue;
        if (!fs.readFileSync(managedPath(root, ref)).equals(Buffer.from(data, 'base64')))
          throw new MendiError('delivery-input-changed', '历史追加直接原文与已保存依据不同。', {
            ref,
          });
      }
      for (const [ref, digest] of oldDigests) {
        const actual = createHash('sha256')
          .update(fs.readFileSync(managedPath(root, ref)))
          .digest('hex');
        if (actual !== digest)
          throw new MendiError('delivery-input-changed', '历史追加直接输入与已提交摘要不同。', {
            ref,
          });
      }
      if (
        before.id !== workspace.id ||
        before.currentRoundId !== round.id ||
        !equal(before.scope, receipt.beforeScope) ||
        !equal(receipt.priorPointers, scopePointers(before))
      )
        throw new MendiError(
          'invalid-scope-addition',
          '追加收据的原指针、范围或轮次与实际依据不符。',
        );
      managedPath(root, receipt.inputRef);
      for (const pointer of Object.values(receipt.priorPointers))
        if (pointer?.startsWith('.mendi/')) managedPath(root, pointer);
      bytes.set(milestone.runRef, content);
      bytes.set(intentRef, intentBytes);
    }
  }
  return bytes;
}
