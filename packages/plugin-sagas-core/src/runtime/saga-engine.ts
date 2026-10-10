import {
  produceWorkerCommands,
  sagaCommandDigest,
} from '../application/produce-worker-commands.ts';
import type { StoredCommandOutbox } from '@netscript/database/commands';
import { requireSagaTransitionStore } from '../ports/saga-transition-commit-port.ts';
import {
  type CascadedMessage,
  DEFAULT_RETRY_POLICY,
  type RetryPolicy,
  type SagaCompensationError,
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
import { resolveCompensationStatus, resolveTransitionStatus } from '../domain/saga-status.ts';
import type {
  SagaAppliedKeyStore,
  SagaBusPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
  SagaStorePort,
} from '../ports/mod.ts';
import { MemorySagaAppliedKeyStore } from './saga-applied-keys.ts';
import {
  SagaAttributes,
  SagaInstrumentation,
  type SagaTelemetryOutcome,
  SagaTelemetryOutcomes,
  type SagaTraceParent,
} from '../telemetry/mod.ts';

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
  correlationId: string;
  correlationKey: SagaCorrelationKey;
  spanContext?: SagaTraceParent;
  completed: boolean;
  alreadyApplied: boolean;
  /** Persisted version this transition left the instance at; absent without a store. */
  version?: number;
}>;

/** Outcome of one `.compensate()` branch, ready to persist as the instance's next transition. */
export type SagaCompensationOutcome<TState extends SagaState = SagaState> = Readonly<{
  sagaId: SagaId;
  instanceId: SagaInstanceId;
  correlationKey: SagaCorrelationKey;
  /** Message the compensation branch handled. */
  message: SagaMessage;
  /** Persisted version the compensation ran against; the commit expects exactly this version. */
  version: number;
  /** State after the branch ran, or the pre-compensation state when it threw. */
  state: TState;
  /** Effects the branch returned; empty when it threw. */
  cascaded: readonly CascadedMessage[];
  /** Error thrown by the branch; persists the instance as `failed`. */
  error?: unknown;
}>;

/** Result of persisting a compensation outcome. */
export type SagaCompensationCommit = Readonly<{
  /** False when this outcome was already committed (replay); nothing new was written. */
  committed: boolean;
  status: SagaInstanceStatus;
  /** Version the outcome is committed at; absent without a store. */
  version?: number;
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
  appliedKeys?: SagaAppliedKeyStore;
  instrumentation?: SagaInstrumentation;
}>;

type ConcurrencySlot = Readonly<{
  active: number;
  limit: number;
}>;

/** Native saga engine with indexed dispatch and per-key concurrency throttling. */
export class SagaEngine implements SagaBusPort {
  /** Stable engine identifier. */
  readonly id: string;
  readonly #retryPolicy: RetryPolicy;
  readonly #store?: SagaStorePort;
  readonly #appliedKeys: SagaAppliedKeyStore;
  readonly #instrumentation: SagaInstrumentation;
  readonly #definitions = new Map<SagaId, SagaDefinition<string, SagaState, SagaMessage>>();
  readonly #dispatchIndex = new Map<string, readonly SagaEngineDispatchEntry[]>();
  readonly #concurrency = new Map<string, ConcurrencySlot>();
  #running = false;

  /** Create a native saga engine. */
  constructor(options: SagaEngineOptions = {}) {
    this.id = options.id ?? 'saga-engine';
    this.#retryPolicy = options.defaultRetryPolicy ?? DEFAULT_RETRY_POLICY;
    this.#store = options.store;
    this.#appliedKeys = options.appliedKeys ?? new MemorySagaAppliedKeyStore();
    this.#instrumentation = options.instrumentation ?? new SagaInstrumentation();
  }

  /** Start accepting saga messages. */
  start(): Promise<void> {
    this.#running = true;
    return Promise.resolve();
  }

  /** Stop accepting saga messages and clear transient concurrency state. */
  stop(_reason?: string): Promise<void> {
    this.#running = false;
    this.#concurrency.clear();
    return Promise.resolve();
  }

  /** Register saga definitions and rebuild the dispatch index. */
  register<TId extends string, TState extends SagaState, TMessage extends SagaMessage>(
    definitions: readonly SagaDefinition<TId, TState, TMessage>[],
  ): Promise<void> {
    for (const definition of definitions) {
      if (definition.durableWorkerCommands) requireSagaTransitionStore(this.#store);
    }
    for (const definition of definitions) {
      this.#definitions.set(definition.id, registeredSagaDefinition(definition));
    }
    this.#rebuildDispatchIndex();
    return Promise.resolve();
  }

  /** Publish a message directly into the native handler pipeline. */
  async publish(message: SagaMessage, options: SagaPublishOptions = {}): Promise<void> {
    await this.handle(withPublishOptions(message, options));
  }

  /** Dispatch cascaded send messages through the native engine. */
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

  /** Dispatch a signal; deferred until the signal runtime is implemented. */
  signal<TPayload, TName extends string>(
    _dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void> {
    return Promise.reject(
      SagasError.notImplemented('signal dispatch deferred to phase 7d'),
    );
  }

  /** Dispatch a query; deferred until the query runtime is implemented. */
  query<TResult, TName extends string>(
    _dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult> {
    return Promise.reject(
      SagasError.notImplemented('query dispatch deferred to phase 7d'),
    );
  }

  /** Execute all handlers registered for a message type. */
  async handle(
    message: SagaMessage,
    execution: number | Readonly<{ attempt?: number; correlationId?: string }> = 1,
  ): Promise<readonly SagaEngineHandleResult[]> {
    if (!this.#running) {
      throw SagasError.validationFailed('SagaEngine must be started before handling messages.');
    }

    const entries = this.#dispatchIndex.get(message.type);
    if (!entries || entries.length === 0) {
      throw SagasError.sagaNotFound(message.type);
    }

    const attempt = typeof execution === 'number' ? execution : execution.attempt ?? 1;
    const correlationId = typeof execution === 'number' ? undefined : execution.correlationId;
    const results: SagaEngineHandleResult[] = [];
    for (const entry of entries) {
      results.push(await this.#handleEntry(entry, message, attempt, correlationId));
    }
    return Object.freeze(results);
  }

  /**
   * Persist the outcome of a `.compensate()` branch as the next transition of its instance.
   *
   * The commit takes the same path as an `.on()` transition: it expects the version the
   * compensation ran against, bumps it, and carries a replay identity derived from that version,
   * so a redelivered outcome reports `committed: false` instead of being applied twice.
   */
  async commitCompensation(outcome: SagaCompensationOutcome): Promise<SagaCompensationCommit> {
    if (!this.#running) {
      throw SagasError.validationFailed('SagaEngine must be started before committing outcomes.');
    }
    const definition = this.#definitions.get(outcome.sagaId);
    if (!definition) throw SagasError.sagaNotFound(outcome.sagaId);
    const status = outcome.error === undefined
      ? resolveCompensationStatus(outcome.cascaded)
      : 'failed';
    if (!this.#store) return Object.freeze({ committed: true, status });

    const version = outcome.version + 1;
    const replayKey = `${COMPENSATION_REPLAY_NAMESPACE}:${outcome.version}`;
    if (!definition.durableWorkerCommands) {
      const replay = await this.#appliedKeys.recordApplied(outcome.instanceId, replayKey);
      if (!replay.applied) return Object.freeze({ committed: false, status, version });
    }
    const loaded = await this.#store.load(outcome.instanceId);
    if (!loaded) throw SagasError.sagaInstanceNotFound(outcome.instanceId);
    const committed = await this.#persistTransition({
      definition,
      commands: [],
      instanceId: outcome.instanceId,
      correlationKey: outcome.correlationKey,
      loaded,
      expectedVersion: outcome.version,
      previousState: loaded.state,
      state: cloneState(outcome.state),
      message: outcome.message,
      completed: status === 'completed',
      status,
      now: new Date(),
      replayIdentity: [
        COMPENSATION_REPLAY_NAMESPACE,
        definition.id,
        outcome.instanceId,
        String(outcome.version),
      ],
      compensationError: outcome.error === undefined
        ? undefined
        : toCompensationError(outcome.error),
    });
    return Object.freeze({ committed, status, version });
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
    suppliedCorrelationId?: string,
  ): Promise<SagaEngineHandleResult> {
    return await this.#withConcurrency(entry.definition, message, async () => {
      const handler = entry.definition.handlers.get(message.type);
      if (!handler) {
        throw SagasError.sagaNotFound(`${entry.sagaId}:${message.type}`);
      }

      const correlationKey = resolveCorrelationKey(entry.definition, message);
      const correlationId = suppliedCorrelationId ?? message.correlationKey ?? correlationKey;
      const instanceId = await this.#resolveInstanceId(entry.sagaId, correlationKey);
      const loaded = await this.#store?.load(instanceId);
      const baseState = loaded?.state ?? entry.definition.initialState;
      if (message.idempotencyKey && !entry.definition.durableWorkerCommands) {
        const outcome = await this.#appliedKeys.recordApplied(instanceId, message.idempotencyKey);
        if (!outcome.applied) {
          return Object.freeze({
            sagaId: entry.sagaId,
            instanceId,
            message,
            state: cloneState(baseState),
            cascaded: Object.freeze([]),
            correlationId,
            correlationKey,
            completed: false,
            alreadyApplied: true,
            version: loaded?.metadata.version,
          });
        }
      }
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
      const handleSpanInput = Object.freeze({
        sagaId: entry.sagaId,
        instanceId,
        eventType: message.type,
        attempt,
        durabilityTier: entry.definition.durability,
        correlationId,
        correlationKey,
        parent: {
          traceparent: message.traceparent,
          tracestate: message.tracestate,
        },
        links: [{
          traceparent: message.traceparent,
          tracestate: message.tracestate,
          attributes: {
            [SagaAttributes.SAGA_ID]: entry.sagaId,
            [SagaAttributes.SAGA_INSTANCE_ID]: instanceId,
            [SagaAttributes.SAGA_EVENT_TYPE]: message.type,
            [SagaAttributes.SAGA_ATTEMPT]: attempt,
            [SagaAttributes.CORRELATION_ID]: correlationId,
            [SagaAttributes.SAGA_CORRELATION_KEY]: correlationKey,
          },
        }],
      });
      const startedAt = performance.now();
      const span = this.#instrumentation.startHandleSpan(handleSpanInput);
      const spanContext = this.#instrumentation.spanContext(span);
      this.#instrumentation.recordStateBefore(span, {
        [SagaAttributes.STATUS]: loaded?.metadata.status,
      });

      try {
        const effects = handler(saga, message, context);
        const { cascaded, commands } = await produceWorkerCommands(effects, {
          durable: entry.definition.durableWorkerCommands === true,
          sagaId: entry.sagaId,
          instanceId,
          version: (loaded?.metadata.version ?? 0) + 1,
          correlationId,
          now: context.now,
          traceparent: message.traceparent,
          tracestate: message.tracestate,
        });
        const completion = cascaded.find(
          (item): item is CascadedMessage<'complete'> => item.kind === 'complete',
        );
        const completed = completion !== undefined;
        const state = cloneState(saga.state);
        const status = resolveTransitionStatus(cascaded, loaded?.metadata.status);
        const outcome = telemetryOutcomeFromStatus(status);
        const completeSpan = completion
          ? this.#instrumentation.startCascadeCompleteSpan({
            sagaId: entry.sagaId,
            instanceId,
            correlationId,
            correlationKey,
            parent: spanContext,
            status,
            resultPresent: completion.result !== undefined,
          })
          : undefined;

        try {
          const committed = await this.#persistTransition({
            definition: entry.definition,
            instanceId,
            correlationKey,
            commands,
            loaded,
            expectedVersion: loaded?.metadata.version,
            previousState,
            state,
            message,
            completed,
            status,
            now: context.now,
            replayIdentity: message.idempotencyKey === undefined
              ? undefined
              : ['saga-inbound-v1', entry.sagaId, instanceId, message.idempotencyKey],
          });
          if (!committed) {
            if (completeSpan) this.#instrumentation.finishSpan(completeSpan, outcome);
            this.#instrumentation.finishSpan(span, outcome);
            return Object.freeze({
              sagaId: entry.sagaId,
              instanceId,
              message,
              state: cloneState(baseState),
              cascaded: Object.freeze([]),
              correlationId,
              correlationKey,
              spanContext,
              completed: loaded?.metadata.status === 'completed',
              alreadyApplied: true,
              version: loaded?.metadata.version,
            });
          }
          if (completeSpan) {
            this.#instrumentation.finishSpan(completeSpan, outcome);
          }
        } catch (error) {
          if (completeSpan) {
            this.#instrumentation.finishSpan(
              completeSpan,
              SagaTelemetryOutcomes.ERROR,
              error,
            );
          }
          throw error;
        }

        this.#instrumentation.recordStateAfter(span, {
          [SagaAttributes.STATUS]: status,
        });
        this.#instrumentation.finishSpan(span, outcome);
        this.#instrumentation.recordHandleDuration({
          ...handleSpanInput,
          outcome,
          durationMs: performance.now() - startedAt,
        });

        return Object.freeze({
          sagaId: entry.sagaId,
          instanceId,
          message,
          state,
          cascaded,
          correlationId,
          correlationKey,
          spanContext,
          completed,
          alreadyApplied: false,
          version: this.#store ? (loaded?.metadata.version ?? 0) + 1 : undefined,
        });
      } catch (error) {
        this.#instrumentation.finishSpan(span, SagaTelemetryOutcomes.ERROR, error);
        this.#instrumentation.recordHandleDuration({
          ...handleSpanInput,
          outcome: SagaTelemetryOutcomes.ERROR,
          durationMs: performance.now() - startedAt,
        });
        throw error;
      }
    });
  }

  async #resolveInstanceId(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId> {
    const correlated = await this.#store?.findByCorrelation(sagaId, correlationKey);
    return correlated ?? resolveInstanceId(sagaId, correlationKey);
  }

  async #persistTransition(
    input: Readonly<{
      definition: SagaDefinition<string, SagaState, SagaMessage>;
      commands: readonly StoredCommandOutbox[];
      instanceId: SagaInstanceId;
      correlationKey: SagaCorrelationKey;
      loaded?: SagaStateEnvelope;
      /** Version the store must hold; absent when the instance is new. */
      expectedVersion?: number;
      previousState: SagaState;
      state: SagaState;
      message: SagaMessage;
      completed: boolean;
      status: SagaInstanceStatus;
      now: Date;
      /** Digest parts identifying this transition across redelivery, for atomic stores. */
      replayIdentity?: readonly string[];
      compensationError?: SagaCompensationError;
    }>,
  ): Promise<boolean> {
    if (!this.#store) return true;

    const previousVersion = input.expectedVersion ?? 0;
    const nextVersion = previousVersion + 1;
    const compensationError = input.compensationError ??
      input.loaded?.metadata.compensationError;
    const envelope: SagaStateEnvelope = Object.freeze({
      metadata: Object.freeze({
        instanceId: input.instanceId,
        sagaId: input.definition.id,
        version: nextVersion,
        status: input.status,
        durability: input.definition.durability,
        createdAt: input.loaded?.metadata.createdAt ?? input.now,
        updatedAt: input.now,
        completedAt: input.completed ? input.now : input.loaded?.metadata.completedAt,
        traceparent: input.message.traceparent ?? input.loaded?.metadata.traceparent,
        tracestate: input.message.tracestate ?? input.loaded?.metadata.tracestate,
        ...(compensationError === undefined ? {} : { compensationError }),
      }),
      state: input.state,
    });

    const correlation = {
      sagaId: input.definition.id,
      correlationKey: input.correlationKey,
      instanceId: input.instanceId,
    };
    const record = {
      version: nextVersion,
      transition: {
        from: input.previousState,
        to: input.state,
        status: input.status,
        message: input.message,
        occurredAt: input.message.occurredAt ?? input.now,
      },
    };
    if (input.definition.durableWorkerCommands) {
      const appliedKeyHash = input.replayIdentity === undefined
        ? undefined
        : await sagaCommandDigest(input.replayIdentity);
      return (await requireSagaTransitionStore(this.#store).commitTransition({
        expectedVersion: previousVersion,
        envelope,
        correlation,
        record,
        commands: input.commands,
        ...(appliedKeyHash === undefined ? {} : { appliedKeyHash }),
      })).committed;
    }
    await this.#store.save(envelope, { expectedVersion: input.expectedVersion, correlation });
    await this.#store.saveCorrelation(correlation, envelope);
    await this.#store.appendTransition(input.instanceId, record, envelope);
    return true;
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

function resolveInstanceId(
  sagaId: SagaId,
  correlationKey: SagaCorrelationKey,
): SagaInstanceId {
  return `${sagaId}:${correlationKey}` as SagaInstanceId;
}

function withPublishOptions(message: SagaMessage, options: SagaPublishOptions): SagaMessage {
  return Object.freeze({
    ...message,
    idempotencyKey: options.idempotencyKey ?? message.idempotencyKey,
    concurrencyKey: options.concurrencyKey ?? message.concurrencyKey,
    traceparent: options.traceparent ?? message.traceparent,
    tracestate: options.tracestate ?? message.tracestate,
  });
}

function resolveCorrelationKey(
  definition: SagaDefinition<string, SagaState, SagaMessage>,
  message: SagaMessage,
): SagaCorrelationKey {
  const rule = definition.correlations.find((candidate) => candidate.eventType === message.type) ??
    definition.correlations.find((candidate) => candidate.eventType === '*');
  return rule?.correlate(message) ?? message.correlationKey ??
    (`${definition.id}:${message.type}` as SagaCorrelationKey);
}

function cloneState<TState extends SagaState>(state: TState): TState {
  return structuredClone(state);
}

const COMPENSATION_REPLAY_NAMESPACE = 'saga-compensation-v1';
const MAX_COMPENSATION_ERROR_MESSAGE_LENGTH = 1_024;

function toCompensationError(error: unknown): SagaCompensationError {
  const message = error instanceof Error ? error.message : String(error);
  return Object.freeze({
    name: error instanceof Error ? error.name : typeof error,
    message: message.slice(0, MAX_COMPENSATION_ERROR_MESSAGE_LENGTH),
  });
}

function telemetryOutcomeFromStatus(status: SagaInstanceStatus): SagaTelemetryOutcome {
  if (status === 'failed') return SagaTelemetryOutcomes.ERROR;
  if (status === 'compensating') return SagaTelemetryOutcomes.COMPENSATED;
  return SagaTelemetryOutcomes.SUCCESS;
}

/** Validate the heterogeneous registry boundary while retaining the selected definition callbacks. */
export function registeredSagaDefinition(value: unknown): SagaDefinition {
  if (isRegisteredSagaDefinition(value)) return value;
  if (!value || typeof value !== 'object') {
    throw new TypeError('Invalid saga definition registration.');
  }
  // Older registry artifacts omit unused collections. Complete those defaults at
  // the boundary while retaining validation of every explicitly supplied value.
  const collection = (name: string, fallback: unknown): unknown => {
    const supplied = Reflect.get(value, name);
    return supplied === undefined ? fallback : supplied;
  };
  const complete = {
    ...value,
    correlations: collection('correlations', []),
    compensations: collection('compensations', new Map()),
    signalHandlers: collection('signalHandlers', new Map()),
    queryHandlers: collection('queryHandlers', new Map()),
  };
  if (!isRegisteredSagaDefinition(complete)) {
    throw new TypeError('Invalid saga definition registration.');
  }
  return complete;
}

function isRegisteredSagaDefinition(value: unknown): value is SagaDefinition {
  if (!value || typeof value !== 'object') return false;
  const field = (key: string): unknown => Reflect.get(value, key);
  if (
    typeof field('id') !== 'string' || !field('id') ||
    !['t1', 't2', 't3'].includes(String(field('durability'))) ||
    (field('durableWorkerCommands') !== undefined &&
      typeof field('durableWorkerCommands') !== 'boolean') ||
    !field('initialState') || typeof field('initialState') !== 'object'
  ) return false;
  const types = field('handledMessageTypes'), correlations = field('correlations');
  if (
    !Array.isArray(types) || types.some((type) => typeof type !== 'string') ||
    !Array.isArray(correlations) || correlations.some((rule) =>
      !rule || typeof rule !== 'object' ||
      typeof rule.eventType !== 'string' || typeof rule.canStart !== 'boolean' ||
      typeof rule.correlate !== 'function'
    )
  ) return false;
  for (const name of ['handlers', 'compensations', 'signalHandlers', 'queryHandlers']) {
    const handlers = field(name);
    if (
      !(handlers instanceof Map) ||
      [...handlers].some(([key, handler]) =>
        typeof key !== 'string' || typeof handler !== 'function'
      )
    ) return false;
  }
  const concurrency = field('concurrency');
  return (field('schedule') === undefined || typeof field('schedule') === 'string') &&
    (concurrency === undefined || (!!concurrency && typeof concurrency === 'object' &&
      typeof Reflect.get(concurrency, 'limit') === 'number' &&
      (Reflect.get(concurrency, 'key') === undefined ||
        typeof Reflect.get(concurrency, 'key') === 'function')));
}
