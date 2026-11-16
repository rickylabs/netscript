/** Fixed-key Redis watch snapshots, change delivery and recovery bookkeeping.
 * @module
 */
import { abortable } from '@std/async';
import { generateVersionstamp, keyToString } from '../../application/keys.ts';
import type { KvEntry, KvKey, WatchEvent, WatchOptions } from '../../types/common.ts';
import type { WatchMessage } from './codec.ts';
import { WatchBatchQueue } from './watch-batch-queue.ts';
import type { WatchSubscriptions } from './watch-subscriptions.ts';

interface FixedKeyWatchContext<T> {
  readonly channel: string;
  readonly subscriptions: WatchSubscriptions<WatchMessage>;
  readonly getMany: (keys: KvKey[]) => Promise<(KvEntry<T> | null)[]>;
}

/** Subscribe before loading state and reread after each acknowledged recovery. */
export async function* watchFixedKeys<T>(
  keys: KvKey[],
  options: WatchOptions | undefined,
  ready: () => void,
  context: FixedKeyWatchContext<T>,
): AsyncIterable<WatchEvent<T>[]> {
  if (options?.signal?.aborted) return;
  const previousValues = new Map<string, T | null>();
  const knownVersions = new Map<string, string | null>();
  const watchedKeys = new Set(keys.map(keyToString));
  const queue = new WatchBatchQueue<WatchEvent<T>>();
  let snapshotTouches: Set<string> | null = null;
  const messageHandler = (data: WatchMessage): void => {
    const keyStr = keyToString(data.key);
    if (!watchedKeys.has(keyStr)) {
      return;
    }
    const versionstamp = data.versionstamp ?? generateVersionstamp();
    if (knownVersions.get(keyStr) === versionstamp) return;
    snapshotTouches?.add(keyStr);
    knownVersions.set(keyStr, versionstamp);
    queue.push({
      key: data.key,
      previousValue: previousValues.get(keyStr) ?? null,
      timestamp: new Date(data.timestamp),
      type: data.type,
      value: data.value as T | null,
      versionstamp,
    });
    previousValues.set(keyStr, data.value as T | null);
  };
  const reconnect = async (recoverySignal: AbortSignal): Promise<void> => {
    const signal = options?.signal
      ? AbortSignal.any([options.signal, recoverySignal])
      : recoverySignal;
    const touched = new Set<string>();
    snapshotTouches = touched;
    try {
      const entries = await abortable(context.getMany(keys), signal);
      signal.throwIfAborted();
      for (const [index, key] of keys.entries()) {
        const keyStr = keyToString(key);
        // A subscribed write arriving during the read owns this key's
        // history. Its queued message must not be followed by a stale read.
        if (touched.has(keyStr)) continue;
        const entry = entries[index];
        queue.push({
          key,
          timestamp: new Date(),
          type: entry ? 'set' : 'delete',
          value: entry?.value ?? null,
          versionstamp: entry?.versionstamp ?? null,
          previousValue: previousValues.get(keyStr) ?? null,
        });
        previousValues.set(keyStr, entry?.value ?? null);
        knownVersions.set(keyStr, entry?.versionstamp ?? null);
      }
    } catch (error) {
      if (!options?.signal?.aborted) throw error;
    } finally {
      if (snapshotTouches === touched) snapshotTouches = null;
    }
  };
  let release: () => Promise<void>;
  try {
    release = await context.subscriptions.acquire(context.channel, messageHandler, {
      reconnect,
      error: (error) => queue.fail(error),
      signal: options?.signal,
    });
  } catch (error) {
    if (options?.signal?.aborted) return;
    throw error;
  }
  try {
    if (options?.signal?.aborted) return;
    ready();
    // Messages received during these reads remain queued. A read must not
    // overwrite the previous value already advanced by a startup message.
    // Its first previousValue is null: the baseline may already contain that
    // write (or a newer write), so it cannot establish the preceding value.
    const entries = await context.getMany(keys);
    for (const [index, key] of keys.entries()) {
      const entry = entries[index];
      const keyStr = keyToString(key);
      if (!knownVersions.has(keyStr)) previousValues.set(keyStr, entry?.value ?? null);
    }
    if (options?.initial && !options.signal?.aborted) {
      yield keys.map((key, index) => {
        const entry = entries[index];
        return {
          key,
          timestamp: new Date(),
          type: entry ? 'set' : 'delete',
          value: entry?.value ?? null,
          versionstamp: entry?.versionstamp ?? null,
          initial: true,
        };
      });
    }
    while (!options?.signal?.aborted) {
      const events = await queue.next(options?.debounce, options?.signal);
      if (events.length > 0 && !options?.signal?.aborted) {
        yield events;
      }
    }
  } finally {
    await release();
  }
}
