import type {
  CascadedMessage,
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

type SyncQueryResult<TResult> = TResult extends PromiseLike<unknown> ? never : TResult;

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
    initialState: TNextState,
  ): TPhase extends 'initial' ? SagaBuilder<TId, 'state-set', TNextState, TMessage> : never;
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
    eventType: TType,
    handler: SagaHandler<TState & SagaState, SagaEvent<TType, TPayload>>,
  ): TPhase extends 'state-set' | 'handler-set'
    ? SagaBuilder<TId, 'handler-set', TState, TMessage | SagaEvent<TType, TPayload>>
    : never;
  /** Register a compensation handler for a failed event type. */
  compensate<TType extends string, TPayload = unknown>(
    eventType: TType,
    handler: SagaHandler<TState & SagaState, SagaEvent<TType, TPayload>>,
  ): TPhase extends 'state-set' | 'handler-set'
    ? SagaBuilder<TId, TPhase, TState, TMessage | SagaEvent<TType, TPayload>>
    : never;
  /** Register a reserved signal handler. Runtime dispatch is deferred. */
  onSignal<TPayload>(
    signal: SignalDefinition<TPayload>,
    handler: SagaSignalHandler<TState & SagaState, TPayload>,
  ): TPhase extends 'state-set' | 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage>
    : never;
  /** Register a reserved synchronous query handler. Runtime dispatch is deferred. */
  onQuery<TResult>(
    query: QueryDefinition<TResult>,
    handler: (saga: Readonly<{ state: TState & SagaState }>) => SyncQueryResult<TResult>,
  ): TPhase extends 'state-set' | 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage>
    : never;
  /** Build a frozen saga definition after at least one handler exists. */
  build(): TPhase extends 'handler-set' ? SagaDefinition<TId, TState & SagaState, TMessage> : never;
}

class SagaBuilderImpl<
  TId extends string,
  TPhase extends SagaBuilderPhase,
  TState,
  TMessage extends SagaMessage,
> implements SagaBuilder<TId, TPhase, TState, TMessage> {
  readonly #id: TId;
  #durability: SagaDurabilityTier = DEFAULT_SAGA_DURABILITY_TIER;
  #initialState?: SagaState;
  #correlations: SagaCorrelationRule[] = [];
  #handlers = new Map<string, SagaHandler<SagaState, SagaMessage>>();
  #compensations = new Map<string, SagaHandler<SagaState, SagaMessage>>();
  #signalHandlers = new Map<string, SagaSignalHandler<SagaState>>();
  #queryHandlers = new Map<string, SagaQueryHandler<SagaState>>();
  #concurrency?: SagaConcurrencyPolicy;
  #schedule?: string;

  constructor(id: TId) {
    assertNonEmpty(id, 'Saga ID is required.');
    this.#id = id.trim() as TId;
  }

  durability(tier: SagaDurabilityTier): SagaBuilder<TId, TPhase, TState, TMessage> {
    this.#durability = tier;
    return this;
  }

  state<TNextState extends SagaState>(
    initialState: TNextState,
  ): TPhase extends 'initial' ? SagaBuilder<TId, 'state-set', TNextState, TMessage> : never {
    if (this.#initialState) {
      throw SagasError.validationFailed(`Saga "${this.#id}" already has initial state.`);
    }
    this.#initialState = Object.freeze({ ...initialState });
    return this as unknown as TPhase extends 'initial'
      ? SagaBuilder<TId, 'state-set', TNextState, TMessage>
      : never;
  }

  correlate<TNextMessage extends SagaMessage = TMessage>(
    correlate: SagaCorrelation<TNextMessage>,
  ): SagaBuilder<TId, TPhase, TState, TMessage> {
    this.#correlations = [
      ...this.#correlations,
      Object.freeze({
        eventType: '*',
        canStart: true,
        correlate: correlate as SagaCorrelation<SagaMessage>,
      }),
    ];
    return this;
  }

  concurrency<TNextMessage extends SagaMessage = TMessage>(
    options: SagaConcurrencyOptions<TNextMessage>,
  ): SagaBuilder<TId, TPhase, TState, TMessage> {
    if (!Number.isInteger(options.limit) || options.limit < 1) {
      throw SagasError.validationFailed('Saga concurrency limit must be a positive integer.');
    }
    this.#concurrency = Object.freeze({
      limit: options.limit,
      key: options.key as ((message: SagaMessage) => string) | undefined,
    });
    return this;
  }

  schedule(cron: string): SagaBuilder<TId, TPhase, TState, TMessage> {
    assertNonEmpty(cron, 'Saga schedule must not be empty.');
    this.#schedule = cron.trim();
    return this;
  }

  on<TType extends string, TPayload = unknown>(
    eventType: TType,
    handler: SagaHandler<TState & SagaState, SagaEvent<TType, TPayload>>,
  ): TPhase extends 'state-set' | 'handler-set'
    ? SagaBuilder<TId, 'handler-set', TState, TMessage | SagaEvent<TType, TPayload>>
    : never {
    this.#requireState();
    assertNonEmpty(eventType, 'Saga event type must not be empty.');
    this.#handlers.set(eventType, handler as SagaHandler<SagaState, SagaMessage>);
    return this as unknown as TPhase extends 'state-set' | 'handler-set'
      ? SagaBuilder<TId, 'handler-set', TState, TMessage | SagaEvent<TType, TPayload>>
      : never;
  }

  compensate<TType extends string, TPayload = unknown>(
    eventType: TType,
    handler: SagaHandler<TState & SagaState, SagaEvent<TType, TPayload>>,
  ): TPhase extends 'state-set' | 'handler-set'
    ? SagaBuilder<TId, TPhase, TState, TMessage | SagaEvent<TType, TPayload>>
    : never {
    this.#requireState();
    assertNonEmpty(eventType, 'Saga compensation event type must not be empty.');
    this.#compensations.set(eventType, handler as SagaHandler<SagaState, SagaMessage>);
    return this as unknown as TPhase extends 'state-set' | 'handler-set'
      ? SagaBuilder<TId, TPhase, TState, TMessage | SagaEvent<TType, TPayload>>
      : never;
  }

  onSignal<TPayload>(
    signal: SignalDefinition<TPayload>,
    handler: SagaSignalHandler<TState & SagaState, TPayload>,
  ): TPhase extends 'state-set' | 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage>
    : never {
    this.#requireState();
    assertNonEmpty(signal.name, 'Saga signal name must not be empty.');
    this.#signalHandlers.set(signal.name, handler as SagaSignalHandler<SagaState>);
    return this as unknown as TPhase extends 'state-set' | 'handler-set'
      ? SagaBuilder<TId, TPhase, TState, TMessage>
      : never;
  }

  onQuery<TResult>(
    query: QueryDefinition<TResult>,
    handler: (saga: Readonly<{ state: TState & SagaState }>) => SyncQueryResult<TResult>,
  ): TPhase extends 'state-set' | 'handler-set' ? SagaBuilder<TId, TPhase, TState, TMessage>
    : never {
    this.#requireState();
    assertNonEmpty(query.name, 'Saga query name must not be empty.');
    this.#queryHandlers.set(query.name, handler as SagaQueryHandler<SagaState>);
    return this as unknown as TPhase extends 'state-set' | 'handler-set'
      ? SagaBuilder<TId, TPhase, TState, TMessage>
      : never;
  }

  build(): TPhase extends 'handler-set' ? SagaDefinition<TId, TState & SagaState, TMessage>
    : never {
    this.#requireState();
    if (this.#handlers.size === 0) {
      throw SagasError.validationFailed(`Saga "${this.#id}" requires at least one handler.`);
    }

    return createSagaDefinition({
      id: this.#id as SagaId<TId>,
      durability: this.#durability,
      initialState: this.#initialState as TState & SagaState,
      correlations: Object.freeze([...this.#correlations]),
      handlers: new Map(this.#handlers) as ReadonlyMap<
        TMessage['type'],
        SagaHandler<TState & SagaState, TMessage>
      >,
      compensations: new Map(this.#compensations) as ReadonlyMap<
        TMessage['type'],
        SagaHandler<TState & SagaState, TMessage>
      >,
      signalHandlers: new Map(this.#signalHandlers) as ReadonlyMap<
        string,
        SagaSignalHandler<TState & SagaState>
      >,
      queryHandlers: new Map(this.#queryHandlers) as ReadonlyMap<
        string,
        SagaQueryHandler<TState & SagaState>
      >,
      concurrency: this.#concurrency as SagaConcurrencyPolicy<TMessage> | undefined,
      schedule: this.#schedule,
    }) as TPhase extends 'handler-set' ? SagaDefinition<TId, TState & SagaState, TMessage> : never;
  }

  #requireState(): void {
    if (!this.#initialState) {
      throw SagasError.validationFailed(`Saga "${this.#id}" requires state() before handlers.`);
    }
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
  return new SagaBuilderImpl<TId, 'initial', never, never>(id);
}

function assertNonEmpty(value: string, message: string): void {
  if (value.trim().length === 0) {
    throw SagasError.validationFailed(message);
  }
}
