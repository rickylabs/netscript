import { registeredSagaDefinition } from '../runtime/saga-engine.ts';
import type { SagaState } from '../domain/mod.ts';
import type {
  CascadedMessage,
  SagaCorrelationKey,
  SagaDefinition,
  SagaMessage,
} from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';
import type {
  SagaBusPort,
  SagaIdempotencyPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
} from '../ports/mod.ts';
import {
  cascadedMessageIdempotencyTarget,
  MemorySagaIdempotencyStore,
  type SagaIdempotencyDedupTable,
  type SagaIdempotencyTarget,
  sagaMessageIdempotencyTarget,
} from '../runtime/saga-idempotency.ts';
import type {
  SagaCompensationRequest,
  SagaCompensationResult,
  SagaCompensator,
} from '../runtime/saga-compensator.ts';
import type {
  SagaCompensationCommit,
  SagaCompensationOutcome,
  SagaEngine,
} from '../runtime/saga-engine.ts';
import type { SagaSchedulerPort } from '../runtime/saga-scheduler.ts';
import {
  type SagaInstrumentation,
  SagaTelemetryOutcomes,
  type SagaTraceParent,
} from '../telemetry/mod.ts';

/** Resolver used when a fail/compensate cascade needs saga state context. */
export type SagaBridgeCompensationResolver = (
  message: CascadedMessage<'fail' | 'compensate'>,
) => Promise<SagaCompensationRequest | undefined> | SagaCompensationRequest | undefined;

/** Options for the native saga bus bridge adapter. */
export type SagaBusBridgeOptions = Readonly<{
  id?: string;
  engine: SagaEngine;
  scheduler?: SagaSchedulerPort;
  compensator?: SagaCompensator;
  resolveCompensation?: SagaBridgeCompensationResolver;
  idempotency?: SagaIdempotencyPort | SagaIdempotencyDedupTable;
  instrumentation?: SagaInstrumentation;
}>;

/** Native adapter that composes engine, scheduler, and compensator behind `SagaBusPort`. */
export class SagaBusBridge implements SagaBusPort {
  /** Stable adapter identifier. */
  readonly id: string;
  readonly #engine: SagaEngine;
  readonly #scheduler?: SagaSchedulerPort;
  readonly #compensator?: SagaCompensator;
  readonly #resolveCompensation?: SagaBridgeCompensationResolver;
  readonly #idempotency: SagaIdempotencyPort;
  readonly #instrumentation?: SagaInstrumentation;
  readonly #definitions = new Map<string, SagaDefinition>();

  /** Create a native saga bus bridge. */
  constructor(options: SagaBusBridgeOptions) {
    this.id = options.id ?? 'saga-bus-bridge';
    this.#engine = options.engine;
    this.#scheduler = options.scheduler;
    this.#compensator = options.compensator;
    this.#resolveCompensation = options.resolveCompensation;
    this.#idempotency = toIdempotencyPort(options.idempotency);
    this.#instrumentation = options.instrumentation;
  }

  /** Start the engine and scheduler. */
  async start(): Promise<void> {
    await this.#engine.start();
    await this.#scheduler?.start();
  }

  /** Stop the scheduler and engine. */
  async stop(reason?: string): Promise<void> {
    await this.#scheduler?.stop();
    await this.#engine.stop(reason);
  }

  /** Register saga definitions with the engine. */
  async register<TId extends string, TState extends SagaState, TMessage extends SagaMessage>(
    definitions: readonly SagaDefinition<TId, TState, TMessage>[],
  ): Promise<void> {
    await this.#engine.register(definitions);
    for (const definition of definitions) {
      this.#definitions.set(definition.id, registeredSagaDefinition(definition));
    }
  }

  /** Publish one saga message through the engine. */
  async publish(message: SagaMessage, options: SagaPublishOptions = {}): Promise<void> {
    const idempotencyKey = options.idempotencyKey ?? message.idempotencyKey;
    if (
      idempotencyKey &&
      !this.#usesAtomicReplay(message.type) &&
      !await this.#reserve(sagaMessageIdempotencyTarget(message), idempotencyKey)
    ) {
      return;
    }

    await this.#handleAndDispatch(
      withPublishOptions(message, options),
      undefined,
      new InstanceLedger(),
    );
  }

  /** Dispatch cascaded messages through engine, scheduler, or compensator. */
  async dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void> {
    const ledger = new InstanceLedger();
    for (const message of messages) {
      if (
        message.idempotencyKey &&
        !(message.kind === 'send' && this.#usesAtomicReplay(message.target.id))
      ) {
        const target = cascadedMessageIdempotencyTarget(message);
        if (!await this.#reserve(target, message.idempotencyKey)) {
          continue;
        }
      }
      await this.#dispatchOne(message, undefined, ledger);
    }
  }

  /** Dispatch a saga signal through the engine. */
  signal<TPayload, TName extends string>(
    dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void> {
    return this.#engine.signal(dispatch);
  }

  /** Dispatch a saga query through the engine. */
  query<TResult, TName extends string>(
    dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult> {
    return this.#engine.query(dispatch);
  }

  async #dispatchOne(
    message: CascadedMessage,
    compensation: SagaCompensationRequest | undefined,
    ledger: InstanceLedger,
  ): Promise<void> {
    switch (message.kind) {
      case 'send':
        await this.#dispatchSend(message, compensation, ledger);
        return;
      case 'scheduled':
        await this.#dispatchScheduled(message, compensation);
        return;
      case 'complete':
        return;
      case 'fail':
        await this.#compensate(message, compensation, ledger);
        return;
      case 'compensate':
        await this.#compensate(message, compensation, ledger);
        return;
      case 'spawn':
        await this.#dispatchSpawn(message, compensation);
        return;
      default:
        throw SagasError.notImplemented(
          `Unhandled saga cascade effect kind "${
            String(Reflect.get(message, 'kind'))
          }"; no dispatcher option is registered.`,
        );
    }
  }

  /** Handle one message, record each resulting transition, then dispatch its cascades. */
  async #handleAndDispatch(
    message: SagaMessage,
    correlationId: string | undefined,
    ledger: InstanceLedger,
  ): Promise<void> {
    const results = await this.#engine.handle(message, { correlationId });
    // The engine commits every matching handler before returning, so the whole batch is recorded
    // first: a cascade dispatched for one result may move another result's instance, and that
    // newer entry must not be overwritten by the older batch snapshot.
    for (const result of results) ledger.record(result.instanceId, result.state, result.version);
    for (const result of results) {
      const definition = this.#definitions.get(result.sagaId);
      if (!definition) {
        throw SagasError.sagaNotFound(result.sagaId);
      }
      const request: SagaCompensationRequest = {
        definition,
        instanceId: result.instanceId,
        state: result.state,
        message: result.message,
        correlationId: result.correlationId,
        correlationKey: result.correlationKey,
        parent: result.spanContext,
        instrumentation: this.#instrumentation,
        version: result.version,
      };
      await this.#dispatchSequence(result.cascaded, request, ledger);
    }
  }

  /**
   * Dispatch sibling cascades in order. Each one starts from its instance's latest entry in the
   * ledger, so a compensation step commits against whatever an earlier sibling (or any cascade it
   * reached, directly or through other sagas) left, and carries its own version-derived replay
   * identity.
   */
  async #dispatchSequence(
    messages: readonly CascadedMessage[],
    context: SagaCompensationRequest,
    ledger: InstanceLedger,
  ): Promise<void> {
    for (const message of messages) {
      await this.#dispatchOne(message, ledger.current(context), ledger);
    }
  }

  #usesAtomicReplay(messageType: string): boolean {
    return [...this.#definitions.values()].some((definition) =>
      definition.durableWorkerCommands && definition.handledMessageTypes.includes(messageType)
    );
  }

  async #reserve(target: SagaIdempotencyTarget, idempotencyKey: string): Promise<boolean> {
    return (await this.#idempotency.reserve(target, idempotencyKey)).accepted;
  }

  async #schedule(message: CascadedMessage<'scheduled'>): Promise<void> {
    if (!this.#scheduler) {
      throw SagasError.notImplemented('schedule cascades require SagaScheduler.');
    }
    await this.#scheduler.scheduleCascaded(message);
  }

  async #compensate(
    message: CascadedMessage<'fail' | 'compensate'>,
    context: SagaCompensationRequest | undefined,
    ledger: InstanceLedger,
  ): Promise<void> {
    if (!this.#compensator) {
      throw SagasError.notImplemented(
        'compensation cascades require the compensator option.',
      );
    }

    const resolved = context ?? await this.#resolveCompensation?.(message);
    if (!resolved) {
      throw SagasError.notImplemented(
        'externally dispatched compensation cascades require the resolveCompensation option.',
      );
    }
    const request = ledger.current(resolved);

    const executionRequest: SagaCompensationRequest = {
      ...request,
      instrumentation: this.#instrumentation ?? request.instrumentation,
    };
    let result: SagaCompensationResult;
    try {
      if (message.kind === 'fail') {
        result = await this.#compensator.compensateFailure(executionRequest, message);
      } else {
        result = await this.#compensator.compensateCascaded(
          executionRequest.definition,
          executionRequest.instanceId,
          executionRequest.state,
          message,
          executionRequest,
        );
      }
    } catch (error) {
      await this.#commitCompensation(request, {
        message: compensationMessage(message, request),
        state: request.state,
        cascaded: [],
        error,
      });
      throw error;
    }
    // A sagaFail without a matching branch ran nothing; its `failed` status is already persisted.
    if (!result.compensated) return;

    const commit = await this.#commitCompensation(request, {
      message: result.message,
      state: result.state,
      cascaded: result.cascaded,
    });
    // Later siblings start past this step's version, so on a replay their own replay identities
    // line up with the original run.
    ledger.record(request.instanceId, result.state, commit?.version ?? request.version);
    // A replayed outcome was dispatched when it was first committed.
    if (commit?.committed === false) return;

    const nextRequest: SagaCompensationRequest = {
      ...request,
      state: result.state,
      message: result.message,
      correlationId: result.correlationId,
      correlationKey: result.correlationKey,
      parent: result.spanContext,
      instrumentation: executionRequest.instrumentation,
      version: commit?.version,
    };
    // The branch's sagaFail is its persisted outcome; dispatching it would re-enter the branch.
    await this.#dispatchSequence(
      result.cascaded.filter((cascaded) => cascaded.kind !== 'fail'),
      nextRequest,
      ledger,
    );
  }

  /** Persist a compensation outcome through the engine; undefined when there is no version. */
  async #commitCompensation(
    request: SagaCompensationRequest,
    outcome: Pick<SagaCompensationOutcome, 'message' | 'state' | 'cascaded' | 'error'>,
  ): Promise<SagaCompensationCommit | undefined> {
    // Storeless engines, and resolver-supplied requests without a version, have nothing to commit.
    if (request.version === undefined || request.correlationKey === undefined) return undefined;
    return await this.#engine.commitCompensation({
      ...outcome,
      sagaId: request.definition.id,
      instanceId: request.instanceId,
      correlationKey: request.correlationKey,
      version: request.version,
    });
  }

  async #dispatchSend(
    message: CascadedMessage<'send'>,
    execution: SagaCompensationRequest | undefined,
    ledger: InstanceLedger,
  ): Promise<void> {
    const span = this.#instrumentation?.startCascadeSendSpan({
      ...cascadeContext(execution),
      targetJobId: message.target.id,
      idempotencyKey: message.idempotencyKey,
      retryMaxAttempts: message.retry?.maximumAttempts,
      concurrencyKey: message.concurrencyKey,
      queueName: message.queue,
    });
    try {
      const child = span && this.#instrumentation?.spanContext(span);
      await this.#handleAndDispatch(
        {
          type: message.target.id,
          payload: message.payload,
          idempotencyKey: message.idempotencyKey,
          concurrencyKey: message.concurrencyKey,
          traceparent: child?.traceparent,
          tracestate: child?.tracestate,
        },
        execution?.correlationId,
        ledger,
      );
      if (span) this.#instrumentation?.finishSpan(span, SagaTelemetryOutcomes.SUCCESS);
    } catch (error) {
      if (span) this.#instrumentation?.finishSpan(span, SagaTelemetryOutcomes.ERROR, error);
      throw error;
    }
  }

  async #dispatchScheduled(
    message: CascadedMessage<'scheduled'>,
    execution?: SagaCompensationRequest,
  ): Promise<void> {
    const span = this.#instrumentation?.startCascadeScheduleSpan({
      ...cascadeContext(execution),
      scheduledFor: message.scheduledFor,
    });
    try {
      const child = span && this.#instrumentation?.spanContext(span);
      await this.#schedule(withScheduledContext(message, execution?.correlationId, child));
      if (span) this.#instrumentation?.finishSpan(span, SagaTelemetryOutcomes.SUCCESS);
    } catch (error) {
      if (span) this.#instrumentation?.finishSpan(span, SagaTelemetryOutcomes.ERROR, error);
      throw error;
    }
  }

  #dispatchSpawn(
    message: CascadedMessage<'spawn'>,
    execution?: SagaCompensationRequest,
  ): Promise<void> {
    const span = this.#instrumentation?.startCascadeSpawnSpan({
      ...cascadeContext(execution),
      childSagaId: message.sagaId,
    });
    const error = SagasError.notImplemented('Spawn cascades are unsupported.');
    if (span) this.#instrumentation?.finishSpan(span, SagaTelemetryOutcomes.ERROR, error);
    return Promise.reject(error);
  }
}

/** Create the native saga bus bridge adapter. */
export function createSagaBusBridge(options: SagaBusBridgeOptions): SagaBusBridge {
  return new SagaBusBridge(options);
}

function toIdempotencyPort(
  idempotency?: SagaIdempotencyPort | SagaIdempotencyDedupTable,
): SagaIdempotencyPort {
  if (!idempotency) {
    return new MemorySagaIdempotencyStore();
  }
  return {
    reserve: (target, idempotencyKey) =>
      Promise.resolve(idempotency.reserve(target, idempotencyKey)),
  };
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

/**
 * Latest committed state and version of every instance one synchronous dispatch tree touched.
 * Scoped to a single `publish`/`dispatchCascaded` call, so it holds at most one entry per instance
 * that call reached.
 */
class InstanceLedger {
  readonly #entries = new Map<string, Readonly<{ state: SagaState; version?: number }>>();

  /** Record the state and version a transition or compensation commit left an instance at. */
  record(instanceId: string, state: SagaState, version: number | undefined): void {
    this.#entries.set(instanceId, Object.freeze({ state, version }));
  }

  /** The context moved to its instance's latest recorded state and version. */
  current(context: SagaCompensationRequest): SagaCompensationRequest {
    const latest = this.#entries.get(context.instanceId);
    return latest ? { ...context, state: latest.state, version: latest.version } : context;
  }
}

function compensationMessage(
  message: CascadedMessage<'fail' | 'compensate'>,
  request: SagaCompensationRequest,
): SagaMessage {
  return message.kind === 'compensate' && 'type' in message.message
    ? message.message
    : request.message;
}

function cascadeContext(request?: SagaCompensationRequest): Readonly<{
  sagaId?: string;
  instanceId?: string;
  correlationId?: string;
  correlationKey?: string;
  parent?: SagaTraceParent;
}> {
  return {
    sagaId: request?.definition.id,
    instanceId: request?.instanceId,
    correlationId: request?.correlationId,
    correlationKey: request?.correlationKey,
    parent: request?.parent,
  };
}

function withScheduledContext(
  scheduled: CascadedMessage<'scheduled'>,
  correlationId: string | undefined,
  parent: SagaTraceParent | undefined,
): CascadedMessage<'scheduled'> {
  if (!('type' in scheduled.message) || (!correlationId && !parent)) return scheduled;
  return Object.freeze({
    ...scheduled,
    message: Object.freeze({
      ...scheduled.message,
      correlationKey: scheduled.message.correlationKey ??
        (correlationId as SagaCorrelationKey | undefined),
      traceparent: parent?.traceparent ?? scheduled.message.traceparent,
      tracestate: parent?.tracestate ?? scheduled.message.tracestate,
    }),
  });
}
