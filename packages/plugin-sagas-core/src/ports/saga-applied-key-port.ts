import type { SagaInstanceId } from '../domain/mod.ts';

/** Result of recording a saga applied idempotency key. */
export type SagaAppliedKeyOutcome = Readonly<{
  /** True when this call recorded the key; false when the key was already applied. */
  applied: boolean;
}>;

/** Durable effect-deduplication boundary for saga handler idempotency. */
export interface SagaAppliedKeyStore {
  /**
   * Atomically record an applied idempotency key for a saga instance.
   *
   * @param instanceId - Saga instance that owns the effect boundary.
   * @param idempotencyKey - Client supplied idempotency key.
   * @returns Whether the key was recorded by this call.
   *
   * @example
   * ```ts
   * const outcome = await appliedKeys.recordApplied(instanceId, "request-1");
   * if (!outcome.applied) {
   *   return;
   * }
   * ```
   */
  recordApplied(
    instanceId: SagaInstanceId,
    idempotencyKey: string,
  ): Promise<SagaAppliedKeyOutcome>;
}
