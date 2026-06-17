/**
 * Testing utilities for `@netscript/kv`.
 *
 * Import this subpath from adapter tests to run the shared KV port contract
 * against a custom backend.
 *
 * @example
 * ```ts
 * import { createMemoryKvAdapter, runKvStoreContract } from "@netscript/kv/testing";
 *
 * runKvStoreContract({
 *   name: "memory",
 *   make: () => createMemoryKvAdapter(),
 * });
 * ```
 *
 * @module
 */

export {
  createMemoryKvAdapter,
  type KvStoreContractOptions,
  runKvStoreContract,
} from './memory-kv.ts';
export { MemoryKvAdapter } from '../../adapters/memory.adapter.ts';
export type { KvStore } from '../../types/kv-store.ts';
export type { WatchableKv } from '../../types/watchable-kv.ts';
