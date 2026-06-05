/**
 * Reactive key-value storage for NetScript.
 *
 * The root entrypoint exposes the stable shared lifecycle API, public types, and
 * the lightweight Deno KV and in-memory adapters. Import `@netscript/kv/redis`
 * only when you need direct access to the Redis-backed adapter.
 *
 * @module
 */

export {
  closeKv,
  getActiveProvider,
  getKv,
  getKvPath,
  getRawKv,
  getRedisConnectionFromEnv,
  isKvInitialized,
  type KvProvider,
  resetKv,
  type SharedKvConfig,
} from './core/mod.ts';

export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  KvStore,
  WatchableKv,
  WatchEvent,
  WatchOptions,
  WatchPrefixOptions,
} from './types/mod.ts';

export { isWatchable } from './types/mod.ts';

export { DenoKvAdapter } from './adapters/deno-kv.adapter.ts';
export { MemoryKvAdapter } from './adapters/memory.adapter.ts';
