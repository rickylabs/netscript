import { createCollection } from '@tanstack/db';
import {
  bindStreamEventSourceV1,
  createFetchStreamEventSourceV1,
} from '../../stream-source/mod.ts';
import type {
  StreamCollectionBindingV1,
  StreamCollectionOptionsV1,
  StreamCollectionUtilsV1,
} from '../ports/stream-collection.ts';

/**
 * Materialize committed SSE entity changes into the same TanStack DB used by web live queries.
 *
 * The injected fetch source owns framing, bounded buffering, auth, reconnect and replay.
 * Entity validation and key agreement finish before a batch begins. Invalid entities stop
 * consumption and reject `done`; no batch with invalid data is partially applied. Upserts
 * replace the full entity and deletes of absent keys are harmless. Attach live queries to
 * the stable `collection`; there is no polling or request/response query cache to invalidate.
 * The collection is ready when a control declares `upToDate` or `streamClosed`.
 * A fatal failure rejects pending preloads, cleans up the collection, and remains
 * observable through its error utilities and the React hook. Cleanup is terminal:
 * create a new binding rather than restarting the cancelled source.
 *
 * @example
 * ```ts
 * import { createStreamCollectionV1 } from '@netscript/sdk/streams/collections';
 * interface Task { id: string }
 * const tasks = createStreamCollectionV1({
 *   type: 'tasks',
 *   url: 'https://api.example.com/v1/stream/netscript/tasks?offset=-1',
 *   fetch: (url, init) => fetch(url, init),
 *   parse: (value): Task => {
 *     if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string') {
 *       throw new TypeError('Invalid task');
 *     }
 *     return { id: value.id };
 *   },
 *   getKey: (task) => task.id,
 * });
 * await tasks.dispose();
 * ```
 */
export function createStreamCollectionV1<T extends object>(
  options: StreamCollectionOptionsV1<T>,
): StreamCollectionBindingV1<T> {
  if (!options.type.trim()) throw new TypeError('A stream collection type is required');
  const source = createFetchStreamEventSourceV1(options);
  let binding: ReturnType<typeof bindStreamEventSourceV1>;
  let started = false;
  let failure: Error | undefined;
  const errorListeners = new Set<() => void>();
  const collection = createCollection<T, string, StreamCollectionUtilsV1>({
    id: options.type,
    getKey: options.getKey,
    startSync: true,
    // Keep the stream alive until explicit disposal, even before a screen mounts.
    gcTime: Infinity,
    utils: {
      getError: () => failure,
      subscribeError(listener) {
        errorListeners.add(listener);
        return () => {
          errorListeners.delete(listener);
        };
      },
    },
    sync: {
      rowUpdateMode: 'full',
      sync: ({ collection, begin, write, commit, markReady }) => {
        if (started) throw new Error('Stream collection is closed; create a new binding');
        started = true;
        binding = bindStreamEventSourceV1({
          source,
          onEvent(event) {
            if (event.event === 'error') {
              if (!event.payload.retryable) throw new TypeError(event.payload.message);
              return;
            }
            if (event.event !== 'data') {
              if (event.payload.upToDate || event.payload.streamClosed) markReady();
              return;
            }
            const changes = event.payload.filter((change) => change.type === options.type).map(
              (change) => {
                if (change.headers.operation === 'delete') return { key: change.key };
                const value = options.parse(change.value);
                if (options.getKey(value) !== change.key) {
                  throw new TypeError('Stream entity key mismatch');
                }
                return { key: change.key, value };
              },
            );
            if (!changes.length) return;
            // TanStack commits one final state per key. Reduce repeated wire operations
            // inside this bounded batch before writing to its sync transaction.
            const latest = new Map(changes.map((change) => [change.key, change]));
            begin();
            for (const change of latest.values()) {
              const exists = collection.has(change.key);
              if ('value' in change && change.value !== undefined) {
                write({ type: exists ? 'update' : 'insert', value: change.value });
              } else if (exists) {
                write({ type: 'delete', key: change.key });
              }
            }
            commit();
          },
        });
        return () => binding.dispose();
      },
    },
  });
  const done = source.done.then(
    async () => {
      // Cancellation or HTTP 204 before readiness must also settle pending preload calls.
      if (collection.status === 'loading') await collection.cleanup();
    },
    async (error: unknown) => {
      failure = error instanceof Error
        ? error
        : new Error('Stream consumption failed', { cause: error });
      // Use public cleanup: it settles TanStack's pending readiness callbacks and
      // transitions loading -> cleaned-up. The error utility drives the React error state.
      await collection.cleanup();
      for (const listener of errorListeners) listener();
      throw error;
    },
  );
  void done.catch(() => {});
  // Intentionally wrap upstream preload: readiness alone cannot surface a fatal source failure.
  // Keep the original bound method, and preserve this done/error race across TanStack upgrades.
  const preload = collection.preload.bind(collection);
  collection.preload = async () => {
    if (failure) throw failure;
    await Promise.race([preload(), done]);
    if (failure) throw failure;
  };
  let disposal: Promise<void> | undefined;
  return {
    collection,
    done,
    snapshot: () => binding.snapshot(),
    dispose: () => {
      if (!disposal) {
        binding.dispose();
        disposal = done.finally(() => collection.cleanup());
      }
      return disposal;
    },
  };
}
