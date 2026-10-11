/** KV-backed quota reservations. @module */
import type { KvKey, KvStore } from '@netscript/kv';
import {
  type RateLimitDecision,
  type RateLimitRequest,
  rateLimitWindow,
} from '../domain/rate-limit.ts';
import type { RateLimitStore } from '../ports/rate-limit-store.ts';

/** Configuration for an isolated KV quota namespace. */
export interface KvRateLimitStoreOptions {
  /** Dedicated namespace; separate independent limiters with different prefixes. */
  readonly prefix: KvKey;
  /** Maximum read/CAS attempts per reservation. Default 8, maximum 32. */
  readonly maxAttempts?: number;
}

/**
 * Creates a fixed-window store using `@netscript/kv` version checks and `expireIn`.
 * The caller owns the KV connection. Failed CAS attempts are retried within a
 * fixed budget, then rejected conservatively. Missing atomic support fails at construction.
 *
 * @param kv - KV store with atomic compare-and-set support.
 * @param options - Dedicated key prefix and bounded retry budget.
 * @returns Atomic quota store; it never closes the supplied KV connection.
 * @example
 * ```ts
 * import { getKv } from '@netscript/kv';
 * import { createKvRateLimitStore } from '@netscript/service/rate-limit';
 * const kv = await getKv();
 * const store = createKvRateLimitStore(kv, { prefix: ['device', 'throttle'] });
 * await store.consume({ key: '192.0.2.1', limit: 5, windowMs: 60_000, now: Date.now() });
 * ```
 */
export function createKvRateLimitStore(
  kv: KvStore,
  options: KvRateLimitStoreOptions,
): RateLimitStore {
  if (!kv.atomic) throw new TypeError('Rate limiting requires KV atomic compare-and-set support');
  if (!options.prefix.length) throw new RangeError('Rate-limit KV prefix must not be empty');
  const prefix = [...options.prefix];
  const maxAttempts = options.maxAttempts ?? 8;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 32) {
    throw new RangeError('Rate-limit maxAttempts must be an integer from 1 to 32');
  }
  const atomic = kv.atomic.bind(kv);
  return {
    async consume(request: RateLimitRequest): Promise<RateLimitDecision> {
      const resetAt = rateLimitWindow(request);
      const key: KvKey = [...prefix, request.key, request.windowMs, resetAt];
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        request.signal?.throwIfAborted();
        const entry = await kv.get<number>(key);
        request.signal?.throwIfAborted();
        const count = entry?.value ?? 0;
        if (!Number.isSafeInteger(count) || count < 0) {
          throw new TypeError('Invalid rate-limit counter in KV');
        }
        if (count >= request.limit) return { allowed: false, resetAt };
        const result = await atomic(
          [{ key, versionstamp: entry?.versionstamp ?? null }],
          [{ type: 'set', key, value: count + 1, expireIn: resetAt - request.now }],
        );
        if (result.ok) return { allowed: true, resetAt };
      }
      return { allowed: false, resetAt };
    },
  };
}
