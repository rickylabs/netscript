import type { CascadedMessageKind } from './constants.ts';
import type { SagaId, SagaInstanceId } from './ids.ts';
import type { RetryPolicy } from './retry-policy.ts';
import type { SagaMessage } from './saga-message.ts';

/** Common options accepted by cascaded message constructors. */
export type CascadedMessageOptions = Readonly<{
  idempotencyKey?: string;
  concurrencyKey?: string;
  retry?: RetryPolicy;
  queue?: string;
}>;

/** Cascaded message target for jobs, sagas, or arbitrary runtime adapters. */
export type CascadedMessageTarget<TKind extends string = string, TId extends string = string> =
  Readonly<{
    kind: TKind;
    id: TId;
  }>;

/** Message emitted by a saga handler as its only side-effect ledger. */
export type CascadedMessage<TKind extends CascadedMessageKind = CascadedMessageKind> = Readonly<
  & {
    kind: TKind;
    idempotencyKey?: string;
    concurrencyKey?: string;
    retry?: RetryPolicy;
  }
  & (
    | {
      kind: 'send';
      target: CascadedMessageTarget;
      payload: unknown;
      queue?: string;
    }
    | {
      kind: 'scheduled';
      message: SagaMessage | CascadedMessage;
      scheduledFor: Date;
    }
    | {
      kind: 'spawn';
      sagaId: SagaId;
      input: unknown;
    }
    | {
      kind: 'complete';
      result?: unknown;
    }
    | {
      kind: 'fail';
      reason: string;
    }
    | {
      kind: 'compensate';
      message: SagaMessage | CascadedMessage;
      reason?: string;
    }
  )
>;

/** External signal delivered to a running saga instance. */
export type SagaSignal<TPayload = unknown> = Readonly<{
  target: SagaInstanceId;
  name: string;
  payload: TPayload;
}>;
