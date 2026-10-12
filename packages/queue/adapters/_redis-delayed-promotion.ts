import type { Redis } from 'ioredis';

const DELAYED_PROMOTION_BATCH_SIZE = 100;

interface DelayedQueueEntry {
  readonly queueKey: string;
  readonly envelope: string;
}

/**
 * Commit a bounded delayed batch while watching membership and target types.
 *
 * @param client - Dedicated promotion connection, not shared with other commands.
 * @param delayedKey - Sorted-set key containing the recorded target/envelope pairs.
 * @param onCleanupError - Reports a cleanup failure without hiding the original error.
 * @returns False if WATCH aborted the transaction; true if no retry is needed.
 */
export async function tryPromoteDelayedBatch(
  client: Redis,
  delayedKey: string,
  onCleanupError: (error: unknown) => void,
): Promise<boolean> {
  await client.watch(delayedKey);
  let failed = false;
  try {
    const entries = await client.zrangebyscore(
      delayedKey,
      '-inf',
      Date.now(),
      'LIMIT',
      0,
      DELAYED_PROMOTION_BATCH_SIZE,
    );
    if (entries.length === 0) return true;

    const parsedEntries = entries.map((entry) => ({
      entry,
      parsed: JSON.parse(entry) as DelayedQueueEntry,
    }));
    const targetKeys = [...new Set(parsedEntries.map(({ parsed }) => parsed.queueKey))];
    await client.watch(...targetKeys);
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

    const transaction = client.multi();
    let mutations = 0;
    for (const { entry, parsed } of parsedEntries) {
      if (!validTargets.has(parsed.queueKey)) continue;
      // Membership was read under WATCH. A competing removal aborts the entire
      // EXEC, so only the transaction that still owns each member can push it.
      transaction.zrem(delayedKey, entry).lpush(parsed.queueKey, parsed.envelope);
      mutations++;
    }
    if (mutations === 0) return true;
    const results = await transaction.exec();
    // A lost WATCH writes nothing; retry within this poll's bounded budget.
    for (const [error] of results ?? []) {
      if (error) throw error;
    }
    return results !== null;
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    try {
      await client.unwatch();
    } catch (error) {
      if (!failed) throw error;
      onCleanupError(error);
    }
  }
}
