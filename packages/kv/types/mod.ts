/**
 * Public types for `@netscript/kv`.
 *
 * @module
 */

export type {
  AtomicCheck,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  WatchEvent,
  WatchOptions,
  WatchPrefixOptions,
  WatchStream,
} from './common.ts';

export type { AtomicMutation, KvStore } from './kv-store.ts';
export type { WatchableKv } from './watchable-kv.ts';
export { isWatchable } from './watchable-kv.ts';
