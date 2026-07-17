import type {
  QueryDefinition,
  SagaConcurrencyPolicy,
  SagaCorrelation,
  SagaCorrelationRule,
  SagaDefinition,
  SagaDurabilityTier,
  SagaHandler,
  SagaId,
  SagaMessage,
  SagaQueryHandler,
  SagaSignalHandler,
  SagaState,
  SignalDefinition,
} from '../domain/mod.ts';
import { DEFAULT_SAGA_DURABILITY_TIER, SagasError } from '../domain/mod.ts';

/** Typestate phase for the userland saga builder. */
export type SagaBuilderPhase = 'initial' | 'state-set' | 'handler-set';

/** Event shape inferred by `defineSaga().on(type, handler)`. */
export type SagaEvent<TType extends string, TPayload = unknown> = SagaMessage<TType, TPayload>;

/** Concurrency options accepted by the saga builder. */
export type SagaConcurrencyOptions<TMessage extends SagaMessage = SagaMessage> = Readonly<{
  limit: number;
  key?: (message: TMessage) => string;
}>;

/** Synchronous query result accepted by `onQuery`; promises are rejected at type level. */
export type SyncQueryResult<TResult> = TResult extends PromiseLike<unknown> ? never : TResult;

/** Userland fluent saga builder. */
export interface SagaBuilder<
  TId extends string,
  TPhase extends SagaBuilderPhase,
  TState,
  TMessage extends SagaMessage,
> {
  /** Set the durability tier for this saga. Defaults to T1. */
  durability(tier: SagaDurabilityTier): SagaBuilder<TId, TPhase, TState, TMessage>;
  /** Set the initial state. This must happen before registering handlers. */
  state<TNextState extends SagaState>(
    this: TPhase extends 'initial' ? SagaBuilder<TId, TPhase, TState, TMessage> : never,
    initialState: TNextState,
  ): SagaBuilder<TId, 'state-set', TNextState, TMessage>;
  /** Set a correlation extractor for incoming messages. */
  correlate<TNextMessage extends SagaMessage = TMessage>(
    correlate: SagaCorrelation<TNextMessage>,
  ): SagaBuilder<TId, TPhase, TState, TMessage>;
  /** Set bounded concurrency, optionally per message key. */
  concurrency<TNextMessage extends SagaMessage = TMessage>(
    options: SagaConcurrencyOptions<TNextMessage>,
  ): SagaBuilder<TId, TPhase, TState, TMessage>;
  /** Set a cron schedule for this saga definition. */
  schedule(cron: string): SagaBuilder<TId, TPhase, TState, TMessage>;
  /** Register an event handler. Requires `.state()` first. */
  on<TType extends string, TPayload = unknown>(
    this: TPhase extends 'state-set' | 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage>
      : never,
    eventType: TType,
    handler: SagaHandler<TState & SagaState, SagaEvent<TType, TPayload>>,
  ): SagaBuilder<TId, 'handler-set', TState, TMessage | SagaEvent<TType, TPayload>>;
  /** Register a compensation handler for a failed event type. */
  compensate<TType extends string, TPayload = unknown>(
    this: TPhase extends 'state-set' | 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage>
      : never,
    eventType: TType,
    handler: SagaHandler<TState & SagaState, SagaEvent<TType, TPayload>>,
  ): SagaBuilder<TId, TPhase, TState, TMessage | SagaEvent<TType, TPayload>>;
  /** Register a reserved signal handler. Runtime dispatch is deferred. */
  onSignal<TPayload>(
    this: TPhase extends 'state-set' | 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage>
      : never,
    signal: SignalDefinition<TPayload>,
    handler: SagaSignalHandler<TState & SagaState, TPayload>,
  ): SagaBuilder<TId, TPhase, TState, TMessage>;
  /** Register a reserved synchronous query handler. Runtime dispatch is deferred. */
  onQuery<TResult>(
    this: TPhase extends 'state-set' | 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage>
      : never,
    query: QueryDefinition<TResult>,
    handler: (saga: Readonly<{ state: TState & SagaState }>) => SyncQueryResult<TResult>,
  ): SagaBuilder<TId, TPhase, TState, TMessage>;
  /** Build a frozen saga definition after at least one handler exists. */
  build(
    this: TPhase extends 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage> : never,
  ): SagaDefinition<TId, TState & SagaState, TMessage>;
}

type SagaBuilderData<TId extends string> = Readonly<{
  id: TId;
  durability: SagaDurabilityTier;
  initialState?: SagaState;
  correlations: readonly SagaCorrelationRule[];
  handlers: ReadonlyMap<string, SagaHandler<SagaState, SagaMessage>>;
  compensations: ReadonlyMap<string, SagaHandler<SagaState, SagaMessage>>;
  signalHandlers: ReadonlyMap<string, SagaSignalHandler<SagaState>>;
  queryHandlers: ReadonlyMap<string, SagaQueryHandler<SagaState>>;
  concurrency?: SagaConcurrencyPolicy;
  schedule?: string;
}>;

class SagaBuilderImpl<
  TId extends string,
  TPhase extends SagaBuilderPhase,
  TState,
  TMessage extends SagaMessage,
> {
  readonly #data: SagaBuilderData<TId>;

  constructor(data: SagaBuilderData<TId>) {
    this.#data = data;
  }

  durability(tier: SagaDurabilityTier): SagaBuilder<TId, TPhase, TState, TMessage> {
    return new SagaBuilderImpl({ ...this.#data, durability: tier });
  }

  state<TNextState extends SagaState>(
    this: TPhase extends 'initial' ? SagaBuilderImpl<TId, TPhase, TState, TMessage> : never,
    initialState: TNextState,
  ): SagaBuilder<TId, 'state-set', TNextState, TMessage> {
    return new SagaBuilderImpl<TId, 'state-set', TNextState, TMessage>({
      ...this.#data,
      initialState: Object.freeze({ ...initialState }),
    });
  }

  correlate<TNextMessage extends SagaMessage = TMessage>(
    correlate: SagaCorrelation<TNextMessage>,
  ): SagaBuilder<TId, TPhase, TState, TMessage> {
    return new SagaBuilderImpl({
      ...this.#data,
      correlations: [
        ...this.#data.correlations,
        Object.freeze({
          eventType: '*',
          canStart: true,
          correlate: correlate as SagaCorrelation<SagaMessage>,
        }),
      ],
    });
  }

  concurrency<TNextMessage extends SagaMessage = TMessage>(
    options: SagaConcurrencyOptions<TNextMessage>,
  ): SagaBuilder<TId, TPhase, TState, TMessage> {
    if (!Number.isInteger(options.limit) || options.limit < 1) {
      throw SagasError.validationFailed('Saga concurrency limit must be a positive integer.');
    }
    return new SagaBuilderImpl({
      ...this.#data,
      concurrency: Object.freeze({
        limit: options.limit,
        key: options.key as ((message: SagaMessage) => string) | undefined,
      }),
    });
  }

  schedule(cron: string): SagaBuilder<TId, TPhase, TState, TMessage> {
    assertNonEmpty(cron, 'Saga schedule must not be empty.');
    return new SagaBuilderImpl({ ...this.#data, schedule: cron.trim() });
  }

  on<TType extends string, TPayload = unknown>(
    this: TPhase extends 'state-set' | 'handler-set'
      ? SagaBuilderImpl<TId, TPhase, TState, TMessage>
      : never,
    eventType: TType,
    handler: SagaHandler<TState & SagaState, SagaEvent<TType, TPayload>>,
  ): SagaBuilder<TId, 'handler-set', TState, TMessage | SagaEvent<TType, TPayload>> {
    assertNonEmpty(eventType, 'Saga event type must not be empty.');
    return new SagaBuilderImpl<TId, 'handler-set', TState, TMessage | SagaEvent<TType, TPayload>>({
      ...this.#data,
      handlers: new Map(this.#data.handlers).set(
        eventType,
        handler as SagaHandler<SagaState, SagaMessage>,
      ),
    });
  }

  compensate<TType extends string, TPayload = unknown>(
    this: TPhase extends 'state-set' | 'handler-set'
      ? SagaBuilderImpl<TId, TPhase, TState, TMessage>
      : never,
    eventType: TType,
    handler: SagaHandler<TState & SagaState, SagaEvent<TType, TPayload>>,
  ): SagaBuilder<TId, TPhase, TState, TMessage | SagaEvent<TType, TPayload>> {
    assertNonEmpty(eventType, 'Saga compensation event type must not be empty.');
    return new SagaBuilderImpl<TId, TPhase, TState, TMessage | SagaEvent<TType, TPayload>>({
      ...this.#data,
      compensations: new Map(this.#data.compensations).set(
        eventType,
        handler as SagaHandler<SagaState, SagaMessage>,
      ),
    });
  }

  onSignal<TPayload>(
    this: TPhase extends 'state-set' | 'handler-set'
      ? SagaBuilderImpl<TId, TPhase, TState, TMessage>
      : never,
    signal: SignalDefinition<TPayload>,
    handler: SagaSignalHandler<TState & SagaState, TPayload>,
  ): SagaBuilder<TId, TPhase, TState, TMessage> {
    assertNonEmpty(signal.name, 'Saga signal name must not be empty.');
    return new SagaBuilderImpl({
      ...this.#data,
      signalHandlers: new Map(this.#data.signalHandlers).set(
        signal.name,
        handler as SagaSignalHandler<SagaState>,
      ),
    });
  }

  onQuery<TResult>(
    this: TPhase extends 'state-set' | 'handler-set'
      ? SagaBuilderImpl<TId, TPhase, TState, TMessage>
      : never,
    query: QueryDefinition<TResult>,
    handler: (saga: Readonly<{ state: TState & SagaState }>) => SyncQueryResult<TResult>,
  ): SagaBuilder<TId, TPhase, TState, TMessage> {
    assertNonEmpty(query.name, 'Saga query name must not be empty.');
    return new SagaBuilderImpl({
      ...this.#data,
      queryHandlers: new Map(this.#data.queryHandlers).set(
        query.name,
        handler as SagaQueryHandler<SagaState>,
      ),
    });
  }

  build(
    this: TPhase extends 'handler-set' ? SagaBuilderImpl<TId, TPhase, TState, TMessage>
      : never,
  ): SagaDefinition<TId, TState & SagaState, TMessage> {
    const initialState = this.#data.initialState;
    if (!initialState) throw SagasError.validationFailed('Saga initial state is missing.');

    return createSagaDefinition({
      id: this.#data.id as SagaId<TId>,
      durability: this.#data.durability,
      initialState: initialState as TState & SagaState,
      correlations: Object.freeze([...this.#data.correlations]),
      handlers: new Map(this.#data.handlers) as ReadonlyMap<
        TMessage['type'],
        SagaHandler<TState & SagaState, TMessage>
      >,
      compensations: new Map(this.#data.compensations) as ReadonlyMap<
        TMessage['type'],
        SagaHandler<TState & SagaState, TMessage>
      >,
      signalHandlers: new Map(this.#data.signalHandlers) as ReadonlyMap<
        string,
        SagaSignalHandler<TState & SagaState>
      >,
      queryHandlers: new Map(this.#data.queryHandlers) as ReadonlyMap<
        string,
        SagaQueryHandler<TState & SagaState>
      >,
      concurrency: this.#data.concurrency as SagaConcurrencyPolicy<TMessage> | undefined,
      schedule: this.#data.schedule,
    });
  }
}

type InternalSagaDefinitionSpec<
  TId extends string,
  TState extends SagaState,
  TMessage extends SagaMessage,
> = Readonly<{
  id: SagaId<TId>;
  durability: SagaDurabilityTier;
  initialState: TState;
  correlations: readonly SagaCorrelationRule<TMessage>[];
  handlers: ReadonlyMap<TMessage['type'], SagaHandler<TState, TMessage>>;
  compensations: ReadonlyMap<TMessage['type'], SagaHandler<TState, TMessage>>;
  signalHandlers: ReadonlyMap<string, SagaSignalHandler<TState>>;
  queryHandlers: ReadonlyMap<string, SagaQueryHandler<TState>>;
  concurrency?: SagaConcurrencyPolicy<TMessage>;
  schedule?: string;
}>;

function createSagaDefinition<
  TId extends string,
  TState extends SagaState,
  TMessage extends SagaMessage,
>(spec: InternalSagaDefinitionSpec<TId, TState, TMessage>): SagaDefinition<TId, TState, TMessage> {
  return Object.freeze({
    ...spec,
    handledMessageTypes: Object.freeze([...spec.handlers.keys()]),
  });
}

/** Start a userland saga definition chain. */
export function defineSaga<TId extends string>(
  id: TId,
): SagaBuilder<TId, 'initial', never, never> {
  assertNonEmpty(id, 'Saga ID is required.');
  return new SagaBuilderImpl<TId, 'initial', never, never>({
    id: id.trim() as TId,
    durability: DEFAULT_SAGA_DURABILITY_TIER,
    correlations: [],
    handlers: new Map(),
    compensations: new Map(),
    signalHandlers: new Map(),
    queryHandlers: new Map(),
  });
}

function assertNonEmpty(value: string, message: string): void {
  if (value.trim().length === 0) {
    throw SagasError.validationFailed(message);
  }
}
