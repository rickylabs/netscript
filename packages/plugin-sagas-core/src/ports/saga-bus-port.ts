import type {
  CascadedMessage,
  QueryDefinition,
  SagaDefinition,
  SagaInstanceId,
  SagaMessage,
  SagaSignal,
  SignalDefinition,
} from '../domain/mod.ts';

/** Options applied when publishing a message into the saga bus. */
export type SagaPublishOptions = Readonly<{
  idempotencyKey?: string;
  concurrencyKey?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Signal dispatch request reserved for Phase 7d runtime support. */
export type SagaSignalDispatch<TPayload = unknown, TName extends string = string> = Readonly<{
  instanceId: SagaInstanceId;
  signal: SignalDefinition<TPayload, TName> | SagaSignal<TPayload>;
  payload: TPayload;
}>;

/** Query dispatch request reserved for Phase 7d runtime support. */
export type SagaQueryDispatch<TResult = unknown, TName extends string = string> = Readonly<{
  instanceId: SagaInstanceId;
  query: QueryDefinition<TResult, TName>;
}>;

/** Replaceable bus contract implemented by native and legacy saga adapters. */
export interface SagaBusPort {
  readonly id: string;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  register(definitions: readonly SagaDefinition[]): Promise<void>;
  publish(message: SagaMessage, options?: SagaPublishOptions): Promise<void>;
  dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void>;
  signal<TPayload, TName extends string>(
    dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void>;
  query<TResult, TName extends string>(
    dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult>;
}
