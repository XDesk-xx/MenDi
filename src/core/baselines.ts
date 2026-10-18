import { isDeepStrictEqual } from 'node:util';
import { MendiError } from './errors.ts';
import type { Scope } from './records.ts';
import type { BaselineFact } from './delivery-verification.ts';

export function checkBaselineSnapshot(scope: Scope, facts: BaselineFact[] | undefined) {
  const declared = scope.plannedChanges.flatMap((p) =>
    (p.baselineDependencies ?? []).map((d) => ({ targetSlot: p.slot, ...d })),
  );
  if (
    !Array.isArray(facts) ||
    facts.length !== declared.length ||
    facts.some((f, i) => {
      if (!f || typeof f !== 'object') return true;
      const { changeId, archiveOrdinal, ...source } = f;
      if (typeof changeId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(changeId)) return true;
      return (
        !isDeepStrictEqual(source, declared[i]) ||
        typeof changeId !== 'string' ||
        !Number.isSafeInteger(archiveOrdinal) ||
        archiveOrdinal < 1
      );
    })
  )
    throw new MendiError('baseline-snapshot-invalid', '正式基线完成快照与范围声明不一致。');
}
