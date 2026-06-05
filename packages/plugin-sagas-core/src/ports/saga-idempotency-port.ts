import type {
  SagaIdempotencyReservation,
  SagaIdempotencyTarget,
} from '../runtime/saga-idempotency.ts';

/** Durable idempotency boundary for saga publish and cascade deduplication. */
export interface SagaIdempotencyPort {
  reserve(
    target: SagaIdempotencyTarget,
    idempotencyKey: string,
  ): Promise<SagaIdempotencyReservation>;
}
