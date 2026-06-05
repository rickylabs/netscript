import type { SagaDurabilityTier } from './constants.ts';
import type { SagaId } from './ids.ts';
import type { RetryPolicy } from './retry-policy.ts';
import type { SagaCorrelationRule } from './saga-correlation.ts';
import type { SagaHandler } from './saga-context.ts';
import type { SagaMessage } from './saga-message.ts';
import type { SagaState } from './saga-state.ts';
import type { CascadedMessage } from './cascaded-message.ts';

/** Concurrency policy for a saga definition. */
export type SagaConcurrencyPolicy<TMessage extends SagaMessage = SagaMessage> = Readonly<{
  limit: number;
  key?: (message: TMessage) => string;
}>;

/** Signal definition reserved by the public DSL. */
export type SignalDefinition<TPayload = unknown, TName extends string = string> = Readonly<{
  name: TName;
  payload?: TPayload;
}>;

/** Query definition reserved by the public DSL. */
export type QueryDefinition<TResult = unknown, TName extends string = string> = Readonly<{
  name: TName;
  result?: TResult;
}>;

/** Signal handler reserved by the userland saga DSL. */
export type SagaSignalHandler<TState extends SagaState = SagaState, TPayload = unknown> = (
  saga: { state: TState },
  payload: TPayload,
) => readonly CascadedMessage[] | Promise<readonly CascadedMessage[]>;

/** Synchronous query handler reserved by the userland saga DSL. */
export type SagaQueryHandler<TState extends SagaState = SagaState, TResult = unknown> = (
  saga: Readonly<{ state: TState }>,
) => TResult;

/** Frozen saga definition produced by the fluent DSL. */
export type SagaDefinition<
  TId extends string = string,
  TState extends SagaState = SagaState,
  TMessage extends SagaMessage = SagaMessage,
> = Readonly<{
  id: SagaId<TId>;
  durability: SagaDurabilityTier;
  initialState: TState;
  handledMessageTypes: readonly TMessage['type'][];
  correlations: readonly SagaCorrelationRule<TMessage>[];
  handlers: ReadonlyMap<TMessage['type'], SagaHandler<TState, TMessage>>;
  compensations: ReadonlyMap<TMessage['type'], SagaHandler<TState, TMessage>>;
  signalHandlers: ReadonlyMap<string, SagaSignalHandler<TState>>;
  queryHandlers: ReadonlyMap<string, SagaQueryHandler<TState>>;
  retry?: RetryPolicy;
  concurrency?: SagaConcurrencyPolicy<TMessage>;
  schedule?: string;
}>;
