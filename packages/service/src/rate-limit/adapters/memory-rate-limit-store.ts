/** Bounded volatile quota reservations. @module */
import {
  type RateLimitDecision,
  type RateLimitRequest,
  rateLimitWindow,
} from '../domain/rate-limit.ts';
import type { RateLimitStore } from '../ports/rate-limit-store.ts';

/** Configuration for a bounded development store. */
export interface MemoryRateLimitStoreOptions {
  /** Maximum retained client keys, including expired keys awaiting eviction. Default 10,000. */
  readonly maxKeys?: number;
}

type Counter = { count: number; resetAt: number };

/**
 * Creates an in-process fixed-window store for tests and development.
 * Reservations execute synchronously, so concurrent callers cannot over-admit.
 * Each reservation evicts at most 32 expired keys through a rotating scan.
 * New keys at capacity are rejected until room is available; live quotas are never evicted.
 * No timers or shutdown lifecycle are required.
 *
 * @param options - Memory capacity bound.
 * @returns Volatile quota store, isolated from other created stores.
 * @example
 * ```ts
 * import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';
 * const store = createMemoryRateLimitStore({ maxKeys: 1000 });
 * await store.consume({ key: 'client', limit: 2, windowMs: 1000, now: 0 });
 * ```
 */
export function createMemoryRateLimitStore(
  options: MemoryRateLimitStoreOptions = {},
): RateLimitStore {
  const maxKeys = options.maxKeys ?? 10_000;
  if (!Number.isSafeInteger(maxKeys) || maxKeys < 1) {
    throw new RangeError('Rate-limit maxKeys must be a positive safe integer');
  }
  const counters = new Map<string, Counter>();
  return {
    consume(request: RateLimitRequest): Promise<RateLimitDecision> {
      const resetAt = rateLimitWindow(request);
      const scanCount = Math.min(32, counters.size);
      for (let i = 0; i < scanCount; i++) {
        const oldest = counters.entries().next().value;
        if (!oldest) break;
        const [key, counter] = oldest;
        counters.delete(key);
        if (counter.resetAt > request.now) counters.set(key, counter);
      }
      const key = JSON.stringify([request.key, request.windowMs]);
      let counter = counters.get(key);
      if (counter && counter.resetAt <= request.now) {
        counters.delete(key);
        counter = undefined;
      }
      if (!counter) {
        if (counters.size >= maxKeys) return Promise.resolve({ allowed: false, resetAt });
        counter = { count: 0, resetAt };
        counters.set(key, counter);
      }
      const allowed = counter.count < request.limit;
      if (allowed) counter.count++;
      return Promise.resolve({ allowed, resetAt: counter.resetAt });
    },
  };
}
