/**
 * Route-scoped service rate limits, atomic stores, and client-address policy.
 * @module
 */
export {
  RATE_LIMIT_POLICY_KINDS,
  type RateLimitDecision,
  type RateLimitPolicy,
  type RateLimitPolicyKind,
  type RateLimitRequest,
} from './domain/rate-limit.ts';
export type { RateLimitPolicyConfig, RateLimitStore } from './ports/rate-limit-store.ts';
export type {
  ProcedureRateLimitKeyContext,
  ServiceProcedureRateLimitOptions,
  ServiceProxyTrust,
  ServiceRateLimitOptions,
} from './middleware/options.ts';
export type { Principal } from '../auth/types.ts';
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
// KvStore's public methods reference these six types transitively. Keep that port intact
// instead of duplicating it; named re-exports make its signature deno doc --lint clean.
export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvListOptions,
  KvSetOptions,
} from '@netscript/kv';
