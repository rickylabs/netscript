/** Bounded volatile quota reservations. @module */
import {
  evaluateGcra,
  gcraCapacityFallback,
  isGcraEntryEvictable,
  prepareGcraRequest,
  validateGcraPolicy,
} from '../domain/gcra.ts';
import {
  normalizeRateLimitPolicy,
  type RateLimitDecision,
  type RateLimitPolicy,
  type RateLimitRequest,
  rateLimitWindow,
  validateRateLimitBounds,
} from '../domain/rate-limit.ts';
import type { RateLimitPolicyConfig, RateLimitStore } from '../ports/rate-limit-store.ts';

/** Configuration for a bounded development store. */
export interface MemoryRateLimitStoreOptions {
  /** Maximum retained client keys, including expired keys awaiting eviction. Default 10,000. */
  readonly maxKeys?: number;
  /** Quota policy. Defaults to `{ kind: 'fixed-window' }`. */
  readonly policy?: RateLimitPolicy;
}

type Counter = { count: number; resetAt: number };
type MemoryGcraEntry = { tatMs: number; tatRem: number; resetAt: number };

/**
 * Creates an in-process quota store for tests and development.
 * Defaults to epoch-aligned fixed windows; pass `policy: { kind: 'gcra', burst? }`
 * for alignment-independent rolling quotas with O(1) per-key memory.
 * Reservations execute synchronously, so concurrent callers cannot over-admit.
 * Each reservation evicts at most 32 expired keys through a rotating scan.
 * New keys at capacity are rejected until room is available; live quotas are never evicted.
 * No timers or shutdown lifecycle are required.
 *
 * @param options - Memory capacity bound and optional quota policy.
 * @returns Volatile quota store, isolated from other created stores.
 * @example
 * ```ts
 * import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';
 * const store = createMemoryRateLimitStore({ maxKeys: 1000, policy: { kind: 'gcra' } });
 * store.validate?.({ limit: 2, windowMs: 1000 });
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
  const policy = normalizeRateLimitPolicy(options.policy);

  if (policy.kind === 'fixed-window') {
    const counters = new Map<string, Counter>();
    return {
      validate(config: RateLimitPolicyConfig): void {
        validateRateLimitBounds(config.limit, config.windowMs);
      },
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

  const entries = new Map<string, MemoryGcraEntry>();
  return {
    validate(config: RateLimitPolicyConfig): void {
      validateGcraPolicy(config.limit, config.windowMs, policy.burst);
    },
    consume(request: RateLimitRequest): Promise<RateLimitDecision> {
      try {
        const prepared = prepareGcraRequest(request, policy.burst);
        const scanCount = Math.min(32, entries.size);
        for (let i = 0; i < scanCount; i++) {
          const oldest = entries.entries().next().value;
          if (!oldest) break;
          const [entryKey, entry] = oldest;
          entries.delete(entryKey);
          if (!isGcraEntryEvictable(entry.resetAt, prepared.now)) {
            entries.set(entryKey, entry);
          }
        }
        const key = JSON.stringify([
          request.key,
          request.windowMs,
          request.limit,
          prepared.effectiveBurst,
        ]);
        const existing = entries.get(key);
        if (!existing && entries.size >= maxKeys) {
          return Promise.resolve(gcraCapacityFallback(prepared));
        }
        const stored = existing === undefined
          ? undefined
          : { v: 1 as const, p: 'gcra' as const, tatMs: existing.tatMs, tatRem: existing.tatRem };
        const evaluation = evaluateGcra(prepared, stored);
        if (evaluation.allowed) {
          entries.set(key, {
            tatMs: evaluation.nextState.tatMs,
            tatRem: evaluation.nextState.tatRem,
            resetAt: evaluation.decision.resetAt,
          });
        }
        return Promise.resolve(evaluation.decision);
      } catch (error: unknown) {
        return Promise.reject(error);
      }
    },
  };
}
