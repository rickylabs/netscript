/** Durability tiers supported by trigger definitions. */
export const TRIGGER_DURABILITY_TIERS: readonly ['t1', 't2', 't3'] = ['t1', 't2', 't3'];

/** Trigger kinds implemented by the Group F T1 runtime. */
export const TRIGGER_RUNTIME_KINDS: readonly ['webhook', 'file-watch', 'scheduled'] = [
  'webhook',
  'file-watch',
  'scheduled',
];

/** Trigger kinds reserved on the public surface but deferred at runtime. */
export const TRIGGER_RESERVED_KINDS: readonly ['queue', 'stream', 'manual'] = [
  'queue',
  'stream',
  'manual',
];

/** Canonical trigger kinds known by Group F. */
export const TRIGGER_KINDS: readonly [
  'webhook',
  'file-watch',
  'scheduled',
  'queue',
  'stream',
  'manual',
] = [
  ...TRIGGER_RUNTIME_KINDS,
  ...TRIGGER_RESERVED_KINDS,
];

/** Trigger event lifecycle statuses. */
export const TRIGGER_EVENT_STATUSES: readonly [
  'pending',
  'in-flight',
  'deferred',
  'completed',
  'failed',
  'dlq',
] = ['pending', 'in-flight', 'deferred', 'completed', 'failed', 'dlq'];

/** Scheduled trigger backfill misfire policies. */
export const TRIGGER_BACKFILL_POLICIES: readonly ['fire-now', 'fire-once', 'do-nothing'] = [
  'fire-now',
  'fire-once',
  'do-nothing',
];

/** Default durability tier for Group F trigger definitions. */
export const DEFAULT_TRIGGER_DURABILITY_TIER: TriggerDurabilityTier = 't1';

/** Default idempotency deduplication window in milliseconds. */
export const DEFAULT_TRIGGER_IDEMPOTENCY_TTL_MS: number = 24 * 60 * 60 * 1000;

/** Default maximum trigger dispatch attempts. */
export const DEFAULT_TRIGGER_MAX_ATTEMPTS: number = 3;

/** Default initial retry delay in milliseconds. */
export const DEFAULT_TRIGGER_INITIAL_DELAY_MS: number = 1000;

/** Default maximum retry delay in milliseconds. */
export const DEFAULT_TRIGGER_MAX_DELAY_MS: number = 300_000;

/** Default exponential retry multiplier. */
export const DEFAULT_TRIGGER_BACKOFF_MULTIPLIER: number = 2;

/** Default trigger concurrency limit. */
export const DEFAULT_TRIGGER_CONCURRENCY_LIMIT: number = 10;

/** Default circuit breaker failure threshold. */
export const DEFAULT_TRIGGER_CIRCUIT_BREAKER_FAILURE_THRESHOLD: number = 5;

/** Default circuit breaker cooldown in milliseconds. */
export const DEFAULT_TRIGGER_CIRCUIT_BREAKER_COOLDOWN_MS: number = 60_000;

/** Default circuit breaker probe interval in milliseconds. */
export const DEFAULT_TRIGGER_CIRCUIT_BREAKER_PROBE_INTERVAL_MS: number = 30_000;

/** Maximum allowed synchronous webhook ingress response time. */
export const TRIGGER_INGRESS_MAX_RESPONSE_MS: number = 100;

/** Error codes produced by `TriggersError`. */
export const TRIGGERS_ERROR_CODES: readonly [
  'TRIGGER_NOT_FOUND',
  'TRIGGER_EVENT_NOT_FOUND',
  'TRIGGER_VALIDATION_FAILED',
  'TRIGGER_DEDUPLICATED',
  'TRIGGER_KIND_NOT_IMPLEMENTED',
  'TRIGGER_UNSUPPORTED_OPERATION',
  'TRIGGER_RETRYABLE',
  'TRIGGER_NON_RETRYABLE',
] = [
  'TRIGGER_NOT_FOUND',
  'TRIGGER_EVENT_NOT_FOUND',
  'TRIGGER_VALIDATION_FAILED',
  'TRIGGER_DEDUPLICATED',
  'TRIGGER_KIND_NOT_IMPLEMENTED',
  'TRIGGER_UNSUPPORTED_OPERATION',
  'TRIGGER_RETRYABLE',
  'TRIGGER_NON_RETRYABLE',
];

/** Trigger durability tier. */
export type TriggerDurabilityTier = (typeof TRIGGER_DURABILITY_TIERS)[number];

/** Trigger kind implemented by the Group F T1 runtime. */
export type TriggerRuntimeKind = (typeof TRIGGER_RUNTIME_KINDS)[number];

/** Trigger kind reserved for a later runtime group. */
export type TriggerReservedKind = (typeof TRIGGER_RESERVED_KINDS)[number];

/** Canonical known trigger kind. */
export type TriggerKnownKind = (typeof TRIGGER_KINDS)[number];

/** Open trigger discriminator. */
export type TriggerKind = TriggerKnownKind | (string & { readonly __triggerKind?: never });

/** Trigger event lifecycle status. */
export type TriggerEventStatus = (typeof TRIGGER_EVENT_STATUSES)[number];

/** Scheduled trigger backfill misfire policy. */
export type TriggerBackfillPolicy = (typeof TRIGGER_BACKFILL_POLICIES)[number];

/** Triggers error code. */
export type TriggersErrorCode = (typeof TRIGGERS_ERROR_CODES)[number];
