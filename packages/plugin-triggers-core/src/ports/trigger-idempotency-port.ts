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
  resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim>;
  markCompleted(key: string, ttlMs: number): Promise<void>;
  release(key: string): Promise<void>;
}
