import type { SagaInstanceStatus } from './constants.ts';
import type { CascadedMessage } from './cascaded-message.ts';
import type { SagaMessage } from './saga-message.ts';
import type { SagaState } from './saga-state.ts';

/** Result produced by executing a saga handler. */
export type SagaHandlerResult<TState extends SagaState = SagaState> = Readonly<{
  state: TState;
  cascaded: readonly CascadedMessage[];
  completed: boolean;
}>;

/** Result returned by deterministic saga test helpers. */
export type RunSagaResult<TState extends SagaState = SagaState> = Readonly<{
  state: TState;
  cascaded: readonly CascadedMessage[];
}>;

/** Persisted transition between two saga state snapshots. */
export type SagaTransition<TState extends SagaState = SagaState> = Readonly<{
  from: TState;
  to: TState;
  status: SagaInstanceStatus;
  message: SagaMessage;
  occurredAt: Date;
}>;

/** State transition recorded by a saga store. */
export type SagaTransitionRecord<TState extends SagaState = SagaState> = Readonly<{
  transition: SagaTransition<TState>;
  version: number;
}>;
