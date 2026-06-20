import type { TracedMessageContext } from '@netscript/telemetry/instrumentation';
import type { WorkerIdempotencyClaim } from '@netscript/plugin-workers-core/runtime';
import type { WorkerDispatchContext } from './worker-options.ts';

/** Record a duplicate delivery skip for worker idempotency telemetry. */
export function recordIdempotentSkip(
  context: WorkerDispatchContext,
  concept: 'job' | 'task',
  targetId: string,
  claim: WorkerIdempotencyClaim,
  tracedContext?: TracedMessageContext,
): void {
  const eventName = `worker.${concept}.idempotent_skip`;
  const attributes = {
    'worker.idempotency.key': claim.key,
    'worker.idempotency.source': claim.source,
    'worker.idempotency.already_applied': claim.alreadyApplied,
    'worker.idempotency.target_id': targetId,
  };
  tracedContext?.span?.addEvent(eventName, attributes);
  context.workerSpan?.addEvent(eventName, attributes);
  context.workerSpan?.setAttribute('worker.idempotency.skipped', true);
  console.log(
    `[Worker ${context.workerId}] Skipping duplicate ${concept} '${targetId}' (idempotency=${claim.key}, alreadyApplied=${claim.alreadyApplied})`,
  );
}
