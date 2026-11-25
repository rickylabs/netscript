/**
 * Process-wide dispatcher registry keyed by KV database path or caller-owned instance.
 *
 * @module
 */

import { createKvQueueConnection, type KvDatabaseTarget } from './connection.ts';
import { KvQueueDispatcher } from './dispatcher.ts';

/** A counted claim on the dispatcher for one KV database. */
export interface KvQueueDispatcherLease {
  /** Dispatcher shared by every claim on the same database. */
  readonly dispatcher: KvQueueDispatcher;
  /** Drop the claim; the last claim closes the dispatcher. */
  release(): Promise<void>;
}

interface DispatcherEntry {
  readonly dispatcher: KvQueueDispatcher;
  /** Caller-owned handles keep their entry: the loop lives as long as the caller's handle. */
  readonly retained: boolean;
  leases: number;
}

interface DispatcherRegistry<K> {
  get(key: K): DispatcherEntry | undefined;
  set(key: K, entry: DispatcherEntry): unknown;
  delete(key: K): boolean;
}

const dispatchersByPath = new Map<string, DispatcherEntry>();
const dispatchersByInstance = new WeakMap<Deno.Kv, DispatcherEntry>();

/**
 * Claim the process-wide dispatcher for a KV database, creating it on first claim.
 *
 * Databases are identified by caller-owned instance, or by the configured path string (an
 * omitted path is Deno's default location). A dispatcher on a caller-owned handle stays
 * registered after its last claim, so a later claim reuses its loop. Any other dispatcher leaves
 * the registry when its last claim is released, before it closes, so a concurrent claim starts a
 * fresh one; an in-memory database therefore does not outlive its last claim.
 *
 * @param target - Caller-owned instance or path to open.
 * @returns Lease that must be released when the caller stops using the queue.
 */
export function acquireKvQueueDispatcher(target: KvDatabaseTarget): KvQueueDispatcherLease {
  return 'kv' in target
    ? acquire(dispatchersByInstance, target.kv, target)
    : acquire(dispatchersByPath, target.path ?? '', target);
}

function acquire<K>(
  registry: DispatcherRegistry<K>,
  key: K,
  target: KvDatabaseTarget,
): KvQueueDispatcherLease {
  let entry = registry.get(key);
  if (!entry) {
    entry = {
      dispatcher: new KvQueueDispatcher(createKvQueueConnection(target)),
      retained: 'kv' in target,
      leases: 0,
    };
    registry.set(key, entry);
  }
  entry.leases += 1;
  const claimed = entry;
  let released = false;
  return {
    dispatcher: claimed.dispatcher,
    async release() {
      if (released) {
        return;
      }
      released = true;
      claimed.leases -= 1;
      if (claimed.leases > 0 || claimed.retained) {
        return;
      }
      // Leave the registry before closing, so a concurrent claim gets a fresh dispatcher
      // instead of one whose connections this close is about to invalidate.
      if (registry.get(key) === claimed) {
        registry.delete(key);
      }
      await claimed.dispatcher.close();
    },
  };
}
