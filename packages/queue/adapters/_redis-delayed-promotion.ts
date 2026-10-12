import type { Redis } from 'ioredis';

/** Maximum due members read in one promotion batch. */
export const DELAYED_PROMOTION_BATCH_SIZE = 100;

interface DelayedQueueEntry {
  readonly queueKey: string;
  readonly envelope: string;
}

/** A parsed delayed member, preserving its exact sorted-set bytes. */
export interface ParsedDelayedEntry {
  /** Serialized sorted-set member used for conditional removal. */
  readonly entry: string;
  /** Recorded target and encoded envelope, unchanged by promotion. */
  readonly parsed: DelayedQueueEntry;
}

/** Read at most 100 due members from the existing delayed key. */
export async function readDelayedEntries(
  client: Redis,
  delayedKey: string,
): Promise<ParsedDelayedEntry[]> {
  const entries = await client.zrangebyscore(
    delayedKey,
    '-inf',
    Date.now(),
    'LIMIT',
    0,
    DELAYED_PROMOTION_BATCH_SIZE,
  );
  return entries.map((entry) => ({ entry, parsed: JSON.parse(entry) as DelayedQueueEntry }));
}

/**
 * Commit a bounded delayed batch while watching membership on one connection epoch.
 *
 * @param client - Dedicated promotion connection, not shared with other commands.
 * @param delayedKey - Sorted-set key containing the recorded target/envelope pairs.
 * @param onCleanupError - Reports a cleanup failure without hiding the original error.
 * @param connectionEpoch - Current connection generation, changed by close/end/ready.
 * @returns Committed member count, or null when the connection/WATCH requires a retry.
 */
export async function tryPromoteDelayedBatch(
  client: Redis,
  delayedKey: string,
  onCleanupError: (error: unknown) => void,
  connectionEpoch: () => number,
): Promise<number | null> {
  if (client.status !== 'ready') return null;
  const epoch = connectionEpoch();
  await client.watch(delayedKey);
  try {
    const parsedEntries = await readDelayedEntries(client, delayedKey);
    if (parsedEntries.length === 0) return 0;
    const targetKeys = [...new Set(parsedEntries.map(({ parsed }) => parsed.queueKey))];
    const types = await client.pipeline(targetKeys.map((key) => ['type', key])).exec();
    if (!types) throw new Error('Redis did not return target queue types');
    const validTargets = new Set<string>();
    for (const [index, [error, type]] of types.entries()) {
      if (error) throw error;
      if (type === 'none' || type === 'list') {
        validTargets.add(targetKeys[index]);
      } else {
        console.error('[RedisAdapter] Delayed target must be a list; member retained:', {
          queueKey: targetKeys[index],
          type,
        });
      }
    }

    // No await may separate this guard from MULTI/EXEC dispatch. Reconnecting
    // drops WATCH, so a snapshot read on another epoch must never be committed.
    if (epoch !== connectionEpoch() || client.status !== 'ready') return null;
    const transaction = client.multi();
    let mutations = 0;
    for (const { entry, parsed } of parsedEntries) {
      if (!validTargets.has(parsed.queueKey)) continue;
      // Membership was read under WATCH. A competing removal aborts the entire
      // EXEC, so only the transaction that still owns each member can push it.
      transaction.zrem(delayedKey, entry).lpush(parsed.queueKey, parsed.envelope);
      mutations++;
    }
    if (mutations === 0) return 0;
    const results = await transaction.exec();
    // A lost WATCH writes nothing; retry within this poll's bounded budget.
    for (const [error] of results ?? []) {
      if (error) throw error;
    }
    return results === null ? null : mutations;
  } finally {
    if (epoch === connectionEpoch() && client.status === 'ready') {
      await client.unwatch().catch(onCleanupError);
    }
  }
}
