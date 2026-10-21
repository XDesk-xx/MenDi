import type { GroupPlan } from './group-plan.ts';
import type { GroupState, ProtocolObservation } from './group-report.ts';

export type FormalOutcome = GroupState | 'invalid';

/** v2 的本次正式终态；不消费旧来源或增量事件。 */
export function formalOutcome(plan: GroupPlan, observation: ProtocolObservation): FormalOutcome {
  if (observation.protocolState === 'invalid') return 'invalid';
  if (observation.cancelled) return 'interrupted';
  if (observation.notRun) return 'not-run';
  if (observation.protocolState === 'unconfirmed') return 'unknown';
  const states = plan.groups
    .filter((g) => g.required)
    .map((g) => observation.groups.find((f) => f.id === g.id)?.state ?? 'not-run');
  for (const state of ['unknown', 'interrupted', 'failed', 'blocked', 'not-run'] as const)
    if (states.includes(state)) return state;
  return 'passed';
}
