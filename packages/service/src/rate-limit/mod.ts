/**
 * Route-scoped service rate limits, atomic stores, and client-address policy.
 * @module
 */
export type { RateLimitDecision, RateLimitRequest } from './domain/rate-limit.ts';
export type { RateLimitStore } from './ports/rate-limit-store.ts';
export type { ServiceProxyTrust, ServiceRateLimitOptions } from './middleware/options.ts';
export { resolveServiceClientAddress } from './middleware/client-address.ts';
export { createRateLimitMiddleware } from './middleware/rate-limit-middleware.ts';
export {
  createMemoryRateLimitStore,
  type MemoryRateLimitStoreOptions,
} from './adapters/memory-rate-limit-store.ts';
export {
  createKvRateLimitStore,
  type KvRateLimitStoreOptions,
} from './adapters/kv-rate-limit-store.ts';
export type { ServiceContext, ServiceEnvironment, ServiceMiddleware } from '../types.ts';
export type { KvKey, KvStore } from '@netscript/kv';
export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvListOptions,
  KvSetOptions,
} from '@netscript/kv';
