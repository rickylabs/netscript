/** Atomic quota reservation port. @module */
import type { RateLimitDecision, RateLimitRequest } from '../domain/rate-limit.ts';

/**
 * Atomically reserves at most `limit` slots per key and epoch-aligned window.
 * Stores may reject conservatively under contention or capacity pressure;
 * they must never allow a request without reserving its slot. IO failures throw.
 *
 * @example
 * ```ts
 * import { createMemoryRateLimitStore, type RateLimitStore } from '@netscript/service/rate-limit';
 * const store: RateLimitStore = createMemoryRateLimitStore();
 * const decision = await store.consume({ key: 'client', limit: 5, windowMs: 1000, now: 0 });
 * console.log(decision.allowed);
 * ```
 */
export interface RateLimitStore {
  /** Reserves one slot or returns a rejection with the window end. */
  consume(request: RateLimitRequest): Promise<RateLimitDecision>;
}
