import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import type { DeadLetterRecord, DeadLetterStorePort, MessageContext } from '@netscript/queue';
import type { JobMessage } from '@netscript/plugin-workers-core/runtime';

/** Durable terminal job record using the queue's canonical dead-letter shape. */
export type JobDeadLetterRecord = DeadLetterRecord<JobMessage>;
/** Job specialization of the queue's append/list/reprocess/depth storage port. */
export type JobDeadLetterStorePort = DeadLetterStorePort<JobMessage>;
/** Namespace separating handler exhaustion from transport-level dead letters. */
export const JOB_DEAD_LETTER_NAMESPACE = 'workers:job-dlq';

/** Compose the canonical KV job failure store in its own queue namespace. */
export function createDefaultJobDeadLetterStore(queueName = 'jobs'): JobDeadLetterStorePort {
  return new KvDeadLetterStore<JobMessage>({
    queueName: `${JOB_DEAD_LETTER_NAMESPACE}:${queueName}`,
  });
}

/** Persist one exhausted job idempotently before its transport may acknowledge it. */
export async function recordJobDeadLetter(
  store: JobDeadLetterStorePort,
  message: JobMessage,
  options: Readonly<{
    queueName: string;
    executionId?: string;
    attempts: number;
    error: string;
    errorCode?: string;
    queueContext?: MessageContext;
  }>,
): Promise<void> {
  const failedAt = new Date().toISOString();
  await store.append({
    messageId: options.queueContext?.messageId ?? message.idempotencyKey ?? options.executionId ??
      crypto.randomUUID(),
    queueName: options.queueName,
    payload: message,
    headers: {
      ...options.queueContext?.headers,
      ...(message.traceparent ? { traceparent: message.traceparent } : {}),
      ...(message.tracestate ? { tracestate: message.tracestate } : {}),
    },
    deliveryCount: options.attempts,
    enqueuedAt: options.queueContext?.enqueuedAt.toISOString() ?? message.triggeredAt ?? failedAt,
    failedAt,
    reason: options.attempts === 0 ? 'unroutable' : 'max_attempts_exceeded',
    errorCode: options.errorCode,
    errorMessage: options.error,
  });
}
