import type {
  SagaIdempotencyReservation,
  SagaIdempotencyTarget,
} from '../runtime/saga-idempotency.ts';

/** Durable idempotency boundary for saga publish and cascade deduplication. */
export interface SagaIdempotencyPort {
  /** Reserve a target/key tuple and report whether it was accepted. */
  reserve(
    target: SagaIdempotencyTarget,
    idempotencyKey: string,
  ): Promise<SagaIdempotencyReservation>;
}
