/** Receipt-fenced settlement for polling queues. @module */
import type { AtomicMutation, KvEntry, KvKey, WatchableKv } from '@netscript/kv';
import {
  type DeadLetterStorePort,
  type NackOptions,
  QueueError,
  QueueErrorCode,
} from '../../ports/mod.ts';
import { toDeadLetterRecord } from '../_envelope.ts';
import { pollingPendingKey, pollingProcessingKey, type QueueMessage } from './message.ts';

async function owned<T>(
  kv: WatchableKv,
  queue: string,
  message: QueueMessage<T>,
  recovering = false,
): Promise<KvEntry<QueueMessage<T>> | undefined> {
  const entry = await kv.get<QueueMessage<T>>(pollingProcessingKey(queue, message.id));
  if (
    !entry || entry.value.claimReceipt !== message.claimReceipt ||
    entry.value.claimedBy !== message.claimedBy || entry.value.claimedAt !== message.claimedAt
  ) return;
  if (entry.value.visibilityTimeout) {
    const expired = Date.parse(entry.value.visibilityTimeout) <= Date.now();
    if (recovering !== expired) return;
  }
  return entry;
}

async function transition(
  kv: WatchableKv,
  entry: KvEntry,
  mutations: AtomicMutation[],
): Promise<void> {
  if (kv.atomic) {
    const result = await kv.atomic(
      [{ key: entry.key, versionstamp: entry.versionstamp }],
      mutations,
    );
    if (!result.ok && (await kv.get(entry.key))?.versionstamp === entry.versionstamp) {
      throw new QueueError(
        'Polling receipt settlement was refused.',
        QueueErrorCode.DEQUEUE_FAILED,
      );
    }
    return;
  }
  // Caller-provided non-atomic stores retain the documented single-consumer fallback.
  // Publish before deletion so a failed handback cannot lose the original claim.
  for (const mutation of mutations) {
    if (mutation.type === 'set') await kv.set(mutation.key, mutation.value);
    else if (mutation.type === 'delete') {
      const current = await kv.get(entry.key);
      if (current?.versionstamp === entry.versionstamp) await kv.delete(mutation.key);
    }
  }
}

/** A stale or replaced context cannot delete another claim. */
export async function acknowledgePollingMessage<T>(
  kv: WatchableKv,
  queue: string,
  message: QueueMessage<T>,
): Promise<void> {
  const entry = await owned(kv, queue, message);
  if (entry) await transition(kv, entry, [{ type: 'delete', key: entry.key }]);
}

/** Refund and move the live receipt atomically; crash recovery always remains charged. */
export async function rejectPollingMessage<T>(
  kv: WatchableKv,
  queue: string,
  message: QueueMessage<T>,
  options: NackOptions,
  policy: Readonly<{ retryBaseDelay: number; retryMaxDelay: number }>,
  store: () => Promise<DeadLetterStorePort>,
  recovering = false,
): Promise<void> {
  const entry = await owned(kv, queue, message, recovering);
  if (!entry) return;
  const requeue = options.requeue ?? true;
  const preserve = requeue && options.preserveDeliveryCount === true && !recovering;
  if (!requeue || !preserve && message.attempts >= message.maxAttempts) {
    await (await store()).append(toDeadLetterRecord(
      {
        messageId: message.id,
        queueName: queue,
        payload: message.payload,
        headers: message.headers,
        deliveryCount: message.attempts,
        enqueuedAt: message.enqueuedAt,
      },
      message.attempts >= message.maxAttempts
        ? 'max_attempts_exceeded'
        : options.reason ?? 'nack_without_requeue',
      options,
    ));
    await transition(kv, entry, [{ type: 'delete', key: entry.key }]);
    return;
  }
  const delay = preserve
    ? 0
    : Math.min(policy.retryBaseDelay * 2 ** (message.attempts - 1), policy.retryMaxDelay);
  const availableAt = new Date(Date.now() + delay).toISOString();
  const value: QueueMessage<T> = {
    ...message,
    availableAt,
    attempts: preserve ? Math.max(0, message.attempts - 1) : message.attempts,
    claimedAt: undefined,
    claimedBy: undefined,
    claimReceipt: undefined,
    visibilityTimeout: undefined,
  };
  const key: KvKey = pollingPendingKey(queue, message.priority, availableAt, message.id);
  await transition(kv, entry, [{ type: 'set', key, value }, { type: 'delete', key: entry.key }]);
}
