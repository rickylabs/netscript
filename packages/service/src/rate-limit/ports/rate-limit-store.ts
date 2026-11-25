/** Atomic quota reservation port. @module */
import type { RateLimitDecision, RateLimitRequest } from '../domain/rate-limit.ts';

/** Static quota parameters validated against a store's policy at startup. */
export interface RateLimitPolicyConfig {
  /** Quota budget per `windowMs`; a positive safe integer. */
  readonly limit: number;
  /** Quota window duration in milliseconds; a positive safe integer. */
  readonly windowMs: number;
}

/**
 * Atomically reserves quota slots per key under the store's configured policy
 * (epoch-aligned fixed windows by default, or opt-in rolling GCRA).
 * Stores may reject conservatively under contention or capacity pressure;
 * they must never allow a request without reserving its slot. IO failures throw.
 *
 * @example
 * ```ts
 * import { createMemoryRateLimitStore, type RateLimitStore } from '@netscript/service/rate-limit';
 * const store: RateLimitStore = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });
 * store.validate?.({ limit: 5, windowMs: 1000 });
 * const decision = await store.consume({ key: 'client', limit: 5, windowMs: 1000, now: 0 });
 * console.log(decision.allowed);
 * ```
 */
export interface RateLimitStore {
  /** Atomically consumes one quota slot for `request.key`, or denies without consuming. */
  consume(request: RateLimitRequest): Promise<RateLimitDecision>;
  /**
   * Optional synchronous startup validation hook invoked by
   * `createRateLimitMiddleware()` (and callable directly at startup by
   * non-middleware callers) to validate `(limit, windowMs)` against this
   * store's configured policy — including the GCRA retention ceiling and
   * `(burst, limit, windowMs)` combination — before any request arrives.
   * Performs no I/O. Existing custom stores omitting `validate` stay source-
   * and runtime-compatible.
   */
  readonly validate?: (config: RateLimitPolicyConfig) => void;
}
