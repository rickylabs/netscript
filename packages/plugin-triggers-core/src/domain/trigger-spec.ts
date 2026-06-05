import type { TriggerBackfillPolicy } from './constants.ts';
import type { TriggerEvent } from './trigger-event.ts';

/** Retry policy applied by the trigger processor before DLQ handoff. */
export type TriggerRetryPolicy = Readonly<{
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
  nonRetryableErrors?: readonly string[];
}>;

/** Bounded dispatch concurrency for a trigger definition. */
export type TriggerConcurrencySpec<TEvent extends TriggerEvent = TriggerEvent> = Readonly<{
  limit: number;
  key?: (event: TEvent) => string;
}>;

/** Circuit breaker policy for repeated trigger dispatch failures. */
export type TriggerCircuitBreakerSpec = Readonly<{
  failureThreshold: number;
  cooldownMs: number;
  probeIntervalMs: number;
}>;

/** Event-boundary deduplication policy. */
export type TriggerDeduplicationSpec<TEvent extends TriggerEvent = TriggerEvent> = Readonly<{
  ttlMs: number;
  key?: (event: TEvent) => string | undefined;
  payloadHashFallback: boolean;
}>;

/** Quartz-style misfire handling for scheduled trigger backfill. */
export type TriggerBackfillSpec = Readonly<{
  enabled: boolean;
  windowMs: number;
  policy: TriggerBackfillPolicy;
  maxMissedFires?: number;
}>;
