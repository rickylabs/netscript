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
  /** Stable adapter identifier used by runtime diagnostics and plugin registration. */
  readonly id: string;
  /** Start the bus and allocate any underlying resources. */
  start(): Promise<void>;
  /** Stop the bus and release resources, optionally recording a shutdown reason. */
  stop(reason?: string): Promise<void>;
  /** Register saga definitions that the bus may route and execute. */
  register(definitions: readonly SagaDefinition[]): Promise<void>;
  /** Publish a message into saga dispatch with optional idempotency and tracing metadata. */
  publish(message: SagaMessage, options?: SagaPublishOptions): Promise<void>;
  /** Dispatch cascaded messages produced by saga handlers. */
  dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void>;
  /** Deliver a signal to a running saga instance. */
  signal<TPayload, TName extends string>(
    dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void>;
  /** Resolve a query against a running saga instance. */
  query<TResult, TName extends string>(
    dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult>;
}
