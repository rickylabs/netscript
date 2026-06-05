import {
  type CascadedMessage,
  DEFAULT_RETRY_POLICY,
  type RetryPolicy,
  type SagaContext,
  type SagaCorrelationKey,
  type SagaDefinition,
  type SagaId,
  type SagaInstanceId,
  type SagaInstanceStatus,
  type SagaMessage,
  SagasError,
  type SagaState,
  type SagaStateEnvelope,
} from '../domain/mod.ts';
import type {
  SagaBusPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
  SagaStorePort,
} from '../ports/mod.ts';

/** Registered handler target stored in the O(1) message dispatch index. */
export type SagaEngineDispatchEntry = Readonly<{
  sagaId: SagaId;
  messageType: string;
  definition: SagaDefinition<string, SagaState, SagaMessage>;
}>;

/** Result produced by native saga engine handler execution. */
export type SagaEngineHandleResult<TState extends SagaState = SagaState> = Readonly<{
  sagaId: SagaId;
  instanceId: SagaInstanceId;
  message: SagaMessage;
  state: TState;
  cascaded: readonly CascadedMessage[];
  completed: boolean;
}>;

/** Retry classification used by the native engine before DLQ handoff. */
export type SagaRetryClassification = Readonly<{
  retryable: boolean;
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  errorType: string;
}>;

/** Options for the native saga engine. */
export type SagaEngineOptions = Readonly<{
  id?: string;
  defaultRetryPolicy?: RetryPolicy;
  store?: SagaStorePort;
}>;

type ConcurrencySlot = Readonly<{
  active: number;
  limit: number;
}>;

/** Native saga engine with indexed dispatch and per-key concurrency throttling. */
export class SagaEngine implements SagaBusPort {
  readonly id: string;
  readonly #retryPolicy: RetryPolicy;
  readonly #store?: SagaStorePort;
  readonly #definitions = new Map<SagaId, SagaDefinition<string, SagaState, SagaMessage>>();
  readonly #dispatchIndex = new Map<string, readonly SagaEngineDispatchEntry[]>();
  readonly #concurrency = new Map<string, ConcurrencySlot>();
  #running = false;

  constructor(options: SagaEngineOptions = {}) {
    this.id = options.id ?? 'saga-engine';
    this.#retryPolicy = options.defaultRetryPolicy ?? DEFAULT_RETRY_POLICY;
    this.#store = options.store;
  }

  start(): Promise<void> {
    this.#running = true;
    return Promise.resolve();
  }

  stop(_reason?: string): Promise<void> {
    this.#running = false;
    this.#concurrency.clear();
    return Promise.resolve();
  }

  register(definitions: readonly SagaDefinition[]): Promise<void> {
    for (const definition of definitions) {
      this.#definitions.set(definition.id, definition);
    }
    this.#rebuildDispatchIndex();
    return Promise.resolve();
  }

  async publish(message: SagaMessage, _options: SagaPublishOptions = {}): Promise<void> {
    await this.handle(message);
  }

  async dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void> {
    for (const message of messages) {
      if (message.kind !== 'send') {
        throw SagasError.notImplemented(
          `Native engine cascaded ${message.kind} dispatch deferred to scheduler/compensator slices.`,
        );
      }
      await this.publish({
        type: message.target.id,
        payload: message.payload,
        idempotencyKey: message.idempotencyKey,
      });
    }
  }

  signal<TPayload, TName extends string>(
    _dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void> {
    return Promise.reject(
      SagasError.notImplemented('signal dispatch deferred to phase 7d'),
    );
  }

  query<TResult, TName extends string>(
    _dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult> {
    return Promise.reject(
      SagasError.notImplemented('query dispatch deferred to phase 7d'),
    );
  }

  /** Execute all handlers registered for a message type. */
  async handle(message: SagaMessage, attempt = 1): Promise<readonly SagaEngineHandleResult[]> {
    if (!this.#running) {
      throw SagasError.validationFailed('SagaEngine must be started before handling messages.');
    }

    const entries = this.#dispatchIndex.get(message.type);
    if (!entries || entries.length === 0) {
      throw SagasError.sagaNotFound(message.type);
    }

    const results: SagaEngineHandleResult[] = [];
    for (const entry of entries) {
      results.push(await this.#handleEntry(entry, message, attempt));
    }
    return Object.freeze(results);
  }

  /** Classify an error against a retry policy without mutating runtime state. */
  classifyRetry(
    error: unknown,
    attempt: number,
    policy: RetryPolicy = this.#retryPolicy,
  ): SagaRetryClassification {
    const errorType = getErrorType(error);
    const explicitlyNonRetryable = error instanceof SagasError && !error.retryable;
    const retryableError = error instanceof SagasError ? error.retryable : true;
    const policyAllows = !policy.nonRetryableErrorTypes.includes(errorType);
    const retryable = retryableError && policyAllows && attempt < policy.maximumAttempts &&
      !explicitlyNonRetryable;

    return Object.freeze({
      retryable,
      attempt,
      maxAttempts: policy.maximumAttempts,
      delayMs: retryable ? computeRetryDelayMs(attempt, policy) : 0,
      errorType,
    });
  }

  #rebuildDispatchIndex(): void {
    const next = new Map<string, SagaEngineDispatchEntry[]>();
    for (const definition of this.#definitions.values()) {
      for (const messageType of definition.handledMessageTypes) {
        const entries = next.get(messageType) ?? [];
        entries.push(Object.freeze({ sagaId: definition.id, messageType, definition }));
        next.set(messageType, entries);
      }
    }

    this.#dispatchIndex.clear();
    for (const [messageType, entries] of next) {
      this.#dispatchIndex.set(messageType, Object.freeze([...entries]));
    }
  }

  async #handleEntry(
    entry: SagaEngineDispatchEntry,
    message: SagaMessage,
    attempt: number,
  ): Promise<SagaEngineHandleResult> {
    return await this.#withConcurrency(entry.definition, message, async () => {
      const handler = entry.definition.handlers.get(message.type);
      if (!handler) {
        throw SagasError.sagaNotFound(`${entry.sagaId}:${message.type}`);
      }

      const correlationKey = resolveCorrelationKey(entry.sagaId, message);
      const instanceId = await this.#resolveInstanceId(entry.sagaId, message, correlationKey);
      const loaded = await this.#store?.load(instanceId);
      const baseState = loaded?.state ?? entry.definition.initialState;
      const previousState = cloneState(baseState);
      const saga = { state: cloneState(baseState) };
      const context: SagaContext<SagaState, SagaMessage> = {
        sagaId: entry.sagaId,
        instanceId,
        correlationKey,
        state: saga.state,
        message,
        attempt,
        now: new Date(),
        traceparent: message.traceparent,
        tracestate: message.tracestate,
      };
      const cascaded = handler(saga, message, context);
      const completed = cascaded.some((item) => item.kind === 'complete');
      const state = cloneState(saga.state);
      const status = resolvePersistedStatus(cascaded, loaded?.metadata.status);

      await this.#persistTransition({
        definition: entry.definition,
        instanceId,
        correlationKey,
        loaded,
        previousState,
        state,
        message,
        completed,
        status,
        now: context.now,
      });

      return Object.freeze({
        sagaId: entry.sagaId,
        instanceId,
        message,
        state,
        cascaded,
        completed,
      });
    });
  }

  async #resolveInstanceId(
    sagaId: SagaId,
    message: SagaMessage,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId> {
    const correlated = await this.#store?.findByCorrelation(sagaId, correlationKey);
    return correlated ?? resolveInstanceId(sagaId, message);
  }

  async #persistTransition(
    input: Readonly<{
      definition: SagaDefinition<string, SagaState, SagaMessage>;
      instanceId: SagaInstanceId;
      correlationKey: SagaCorrelationKey;
      loaded?: SagaStateEnvelope;
      previousState: SagaState;
      state: SagaState;
      message: SagaMessage;
      completed: boolean;
      status: SagaInstanceStatus;
      now: Date;
    }>,
  ): Promise<void> {
    if (!this.#store) return;

    const previousVersion = input.loaded?.metadata.version ?? 0;
    const nextVersion = previousVersion + 1;
    const envelope: SagaStateEnvelope = Object.freeze({
      metadata: Object.freeze({
        instanceId: input.instanceId,
        version: nextVersion,
        status: input.status,
        durability: input.definition.durability,
        createdAt: input.loaded?.metadata.createdAt ?? input.now,
        updatedAt: input.now,
        completedAt: input.completed ? input.now : input.loaded?.metadata.completedAt,
        traceparent: input.message.traceparent ?? input.loaded?.metadata.traceparent,
        tracestate: input.message.tracestate ?? input.loaded?.metadata.tracestate,
      }),
      state: input.state,
    });

    await this.#store.save(envelope, {
      expectedVersion: input.loaded?.metadata.version,
    });
    await this.#store.saveCorrelation({
      sagaId: input.definition.id,
      correlationKey: input.correlationKey,
      instanceId: input.instanceId,
    });
    await this.#store.appendTransition(input.instanceId, {
      version: nextVersion,
      transition: {
        from: input.previousState,
        to: input.state,
        status: input.status,
        message: input.message,
        occurredAt: input.message.occurredAt ?? input.now,
      },
    });
  }

  async #withConcurrency<TResult>(
    definition: SagaDefinition<string, SagaState, SagaMessage>,
    message: SagaMessage,
    run: () => Promise<TResult> | TResult,
  ): Promise<TResult> {
    const policy = definition.concurrency;
    if (!policy) return await run();

    const key = `${definition.id}:${message.concurrencyKey ?? policy.key?.(message) ?? 'global'}`;
    const slot = this.#concurrency.get(key) ?? Object.freeze({ active: 0, limit: policy.limit });
    if (slot.active >= slot.limit) {
      throw SagasError.retryable(`Saga concurrency limit reached for key ${key}.`);
    }

    this.#concurrency.set(key, Object.freeze({ active: slot.active + 1, limit: slot.limit }));
    try {
      return await run();
    } finally {
      const current = this.#concurrency.get(key);
      if (!current || current.active <= 1) {
        this.#concurrency.delete(key);
      } else {
        this.#concurrency.set(
          key,
          Object.freeze({ active: current.active - 1, limit: current.limit }),
        );
      }
    }
  }
}

/** Create a native saga engine instance. */
export function createSagaEngine(options: SagaEngineOptions = {}): SagaEngine {
  return new SagaEngine(options);
}

function computeRetryDelayMs(attempt: number, policy: RetryPolicy): number {
  const exponential = policy.initialIntervalMs *
    policy.backoffCoefficient ** Math.max(0, attempt - 1);
  return Math.min(exponential, policy.maximumIntervalMs);
}

function getErrorType(error: unknown): string {
  if (error instanceof SagasError) return error.code;
  if (error instanceof Error) return error.constructor.name;
  return typeof error;
}

function resolveInstanceId(sagaId: SagaId, message: SagaMessage): SagaInstanceId {
  const key = message.correlationKey ?? message.id ?? `${sagaId}:${message.type}`;
  return `${sagaId}:${key}` as SagaInstanceId;
}

function resolveCorrelationKey(sagaId: SagaId, message: SagaMessage): SagaCorrelationKey {
  return (message.correlationKey ?? message.id ??
    `${sagaId}:${message.type}`) as SagaCorrelationKey;
}

function cloneState<TState extends SagaState>(state: TState): TState {
  return structuredClone(state);
}

function resolvePersistedStatus(
  cascaded: readonly CascadedMessage[],
  previousStatus?: SagaInstanceStatus,
): SagaInstanceStatus {
  if (cascaded.some((item) => item.kind === 'fail')) {
    return 'failed';
  }
  if (cascaded.some((item) => item.kind === 'compensate')) {
    return 'compensating';
  }
  if (cascaded.some((item) => item.kind === 'complete')) {
    return 'completed';
  }
  if (previousStatus && isTerminalStatus(previousStatus)) {
    return previousStatus;
  }
  return 'running';
}

function isTerminalStatus(status: SagaInstanceStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'compensating' ||
    status === 'cancelled';
}
