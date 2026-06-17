/**
 * Redis adapter entrypoint for `@netscript/kv`.
 *
 * Importing this module has two effects:
 *
 * 1. **Re-exports** the {@linkcode RedisKvAdapter} class and related types
 *    for direct usage.
 * 2. **Self-registers** the `'redis'` adapter factory with the shared KV
 *    lifecycle ({@linkcode registerKvAdapter}). This means any subsequent
 *    call to `getKv()` that auto-detects Redis/Garnet will use the adapter
 *    without a dynamic `import()` — keeping `ioredis` out of the module
 *    graph for apps that never import this entrypoint.
 *
 * Backend services that use Garnet/Redis should add this import to their
 * entrypoint (it's a one-liner side-effect import):
 *
 * ```ts
 * import '@netscript/kv/redis';
 * ```
 *
 * Frontend / SSR apps should **not** import this module — they use Deno KV
 * and never need `ioredis` in their bundle.
 *
 * @module
 */

import { RedisKvAdapter } from './adapters/redis.adapter.ts';
import { registerKvAdapter } from './application/shared.ts';

// ---------------------------------------------------------------------------
// Self-registration — runs once on first import of this module.
// ---------------------------------------------------------------------------
registerKvAdapter('redis', ({ url, namespace }) => new RedisKvAdapter({ url, namespace }));

// ---------------------------------------------------------------------------
// Public re-exports
// ---------------------------------------------------------------------------
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
export { RedisKvAdapter, type RedisKvOptions } from './adapters/redis.adapter.ts';
