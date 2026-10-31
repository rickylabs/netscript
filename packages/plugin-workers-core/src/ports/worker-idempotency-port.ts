/** How a worker delivery idempotency key was resolved. */
export type WorkerIdempotencySource = 'caller' | 'message-id' | 'payload-hash';

/** Input used to resolve and claim an applied key for one worker delivery. */
export type WorkerIdempotencyInput = Readonly<{
  /** Runtime concept being applied. */
  concept: 'job' | 'task';
  /** Job or task identifier. */
  targetId: string;
  /** Explicit caller-supplied idempotency key, if present. */
  idempotencyKey?: string;
  /** Queue message identifier, stable across redelivery for durable queue adapters. */
  messageId?: string;
  /** Broker delivery generation, increasing only after the previous visibility lease is lost. */
  deliveryCount?: number;
  /** Payload used for the hash fallback when no explicit key exists. */
  payload?: unknown;
}>;

/** Result returned when a worker delivery attempts to claim an applied key. */
export type WorkerIdempotencyClaim = Readonly<{
  /** Whether this delivery reserved the key and may run effects. */
  claimed: boolean;
  /** Namespaced key stored by the applied-keys backend. */
  key: string;
  /** Resolution source used before namespacing. */
  source: WorkerIdempotencySource;
  /** True only when a completed applied marker already exists. */
  alreadyApplied: boolean;
  /** Opaque owner token used to fence completion and release after queue redelivery. */
  token?: string;
}>;

/**
 * At-least-once worker delivery with an applied-key guard window.
 * A crash after a remote effect and before markApplied can repeat that effect;
 * one effective application requires independently idempotent downstream persistence.
 */
export interface WorkerIdempotencyPort {
  /** Atomically claim this delivery before running effects. */
  claim(input: WorkerIdempotencyInput): Promise<WorkerIdempotencyClaim>;
  /** Mark a claimed key as applied after effects complete successfully. */
  markApplied(key: string, ttlMs?: number, token?: string): Promise<void>;
  /** Release an active claim after failed effects so retry can re-run. */
  release(key: string, token?: string): Promise<void>;
}
