/** @module @netscript/plugin-workers-core/stores */

export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvSetOptions,
} from '@netscript/kv';
export { KvWorkerIdempotencyStore } from './kv-worker-idempotency-store.ts';
export type {
  KvWorkerIdempotencyStoreOptions,
  WorkerIdempotencyKvStore,
} from './kv-worker-idempotency-store.ts';
export type {
  WorkerIdempotencyClaim,
  WorkerIdempotencyInput,
  WorkerIdempotencyPort,
  WorkerIdempotencySource,
  WorkerResolvedIdempotencyKey,
} from '../runtime/mod.ts';
