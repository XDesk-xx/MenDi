import { deliveryLifecycle } from '../src/application/delivery-lifecycle.ts';
import { openDelivery } from '../src/application/project.ts';
import { errorInfo, MendiError } from '../src/core/errors.ts';
const [project, operation, fault] = process.argv.slice(2);
const [targetPhase, targetOccurrence] = fault.split(':');
let occurrence = 0;
const options = {
  observeWrite(phase: string) {
    if (phase === targetPhase && ++occurrence === Number(targetOccurrence ?? 1))
      throw new Error('controlled lifecycle interruption: ' + phase);
  },
};
try {
  const value =
    operation === 'open'
      ? openDelivery(
          {
            project,
            id: 'd02',
            title: '新 Delivery',
            scopePath: 'new-scope.json',
            role: 'author',
            actor: 'delivery-author',
          },
          options,
        )
      : deliveryLifecycle(
          operation === 'close' ? 'delivery-close' : 'delivery-reopen',
          {
            project,
            inputFile: operation + '.json',
            scopePath: 'reopen.json',
            reason: 'Owner 明确增加本轮范围，旧验收保留作历史。',
            role: 'author',
            actor: 'delivery-author',
          },
          options,
        );
  console.log(JSON.stringify(value));
} catch (error) {
  console.log(
    JSON.stringify({
      ok: false,
      error: errorInfo(error),
      ...(error instanceof MendiError ? { details: error.details } : {}),
    }),
  );
  process.exitCode = 1;
}
