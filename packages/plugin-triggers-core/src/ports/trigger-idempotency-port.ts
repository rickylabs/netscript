import type { TriggerEvent } from '../domain/mod.ts';

/** Idempotency key resolution input. */
export type TriggerIdempotencyKeyInput = Readonly<{
  event: TriggerEvent;
  requestHeaders?: Readonly<Record<string, string>>;
}>;

/** Idempotency claim result. */
export type TriggerIdempotencyClaim = Readonly<{
  claimed: boolean;
  key: string;
  source: 'caller' | 'request-header' | 'payload-hash';
}>;

/** Event-boundary idempotency store with a TTL window. */
export interface TriggerIdempotencyPort {
  /** Resolve and claim an idempotency key for a trigger event. */
  resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim>;
  /** Mark a claimed idempotency key as completed for the TTL window. */
  markCompleted(key: string, ttlMs: number): Promise<void>;
  /** Release a claimed idempotency key after a failed attempt. */
  release(key: string): Promise<void>;
}
