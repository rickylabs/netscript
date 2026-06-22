/** Durability tiers supported by saga definitions. */
export const SAGA_DURABILITY_TIERS: readonly ['t1', 't2', 't3'] = ['t1', 't2', 't3'];

/** Runtime adapter kinds supported by `createSagaRuntime`. */
export const SAGA_ADAPTER_KINDS: readonly ['native'] = ['native'];

/** Cascaded message kinds emitted by saga handlers. */
export const CASCADED_MESSAGE_KINDS: readonly [
  'send',
  'scheduled',
  'spawn',
  'complete',
  'fail',
  'compensate',
] = ['send', 'scheduled', 'spawn', 'complete', 'fail', 'compensate'];

/** Saga instance lifecycle statuses. */
export const SAGA_INSTANCE_STATUSES: readonly [
  'pending',
  'running',
  'completed',
  'failed',
  'compensating',
  'cancelled',
] = ['pending', 'running', 'completed', 'failed', 'compensating', 'cancelled'];

/** Default durability tier for Group E saga definitions. */
export const DEFAULT_SAGA_DURABILITY_TIER: SagaDurabilityTier = 't1';

/** Default idempotency deduplication window in milliseconds. */
export const DEFAULT_IDEMPOTENCY_WINDOW_MS: number = 24 * 60 * 60 * 1000;

/** Default maximum retry attempts for cascaded messages. */
export const DEFAULT_RETRY_MAX_ATTEMPTS: number = 5;

/** Error codes produced by `SagasError`. */
export const SAGAS_ERROR_CODES: readonly [
  'SAGA_NOT_FOUND',
  'SAGA_INSTANCE_NOT_FOUND',
  'SAGA_VALIDATION_FAILED',
  'SAGA_RETRYABLE',
  'SAGA_NON_RETRYABLE',
  'SAGA_NOT_IMPLEMENTED',
] = [
  'SAGA_NOT_FOUND',
  'SAGA_INSTANCE_NOT_FOUND',
  'SAGA_VALIDATION_FAILED',
  'SAGA_RETRYABLE',
  'SAGA_NON_RETRYABLE',
  'SAGA_NOT_IMPLEMENTED',
];

/** Saga durability tier. */
export type SagaDurabilityTier = (typeof SAGA_DURABILITY_TIERS)[number];

/** Saga runtime adapter kind. */
export type SagaAdapterKind = (typeof SAGA_ADAPTER_KINDS)[number];

/** Cascaded message discriminator. */
export type CascadedMessageKind = (typeof CASCADED_MESSAGE_KINDS)[number];

/** Saga instance lifecycle status. */
export type SagaInstanceStatus = (typeof SAGA_INSTANCE_STATUSES)[number];

/** Sagas error code. */
export type SagasErrorCode = (typeof SAGAS_ERROR_CODES)[number];
