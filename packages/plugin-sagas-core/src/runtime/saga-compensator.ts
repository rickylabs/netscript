import type {
  CascadedMessage,
  SagaContext,
  SagaCorrelationKey,
  SagaDefinition,
  SagaId,
  SagaInstanceId,
  SagaMessage,
  SagaState,
} from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';
import type { SagaClockPort } from '../ports/mod.ts';
import {
  type SagaInstrumentation,
  SagaTelemetryOutcomes,
  type SagaTraceParent,
} from '../telemetry/mod.ts';

/** Compensation request for a failed or explicitly compensated saga step. */
export type SagaCompensationRequest<TState extends SagaState = SagaState> = Readonly<{
  definition: SagaDefinition<string, TState, SagaMessage>;
  instanceId: SagaInstanceId;
  state: TState;
  message: SagaMessage;
  reason?: string;
  attempt?: number;
  correlationId?: string;
  correlationKey?: SagaCorrelationKey;
  parent?: SagaTraceParent;
  instrumentation?: SagaInstrumentation;
}>;

/** Compensation execution result. */
export type SagaCompensationResult<TState extends SagaState = SagaState> = Readonly<{
  sagaId: SagaId;
  instanceId: SagaInstanceId;
  state: TState;
  message: SagaMessage;
  reason?: string;
  correlationId?: string;
  correlationKey?: SagaCorrelationKey;
  spanContext?: SagaTraceParent;
  compensated: boolean;
  cascaded: readonly CascadedMessage[];
}>;

/** Options for compensation orchestration. */
export type SagaCompensatorOptions = Readonly<{
  id?: string;
  clock: SagaClockPort;
  instrumentation?: SagaInstrumentation;
}>;

/** Runtime primitive for `sagaFail()` and `sagaCompensate()` cascades. */
export class SagaCompensator {
  /** Stable compensator identifier. */
  readonly id: string;
  readonly #clock: SagaClockPort;
  readonly #instrumentation?: SagaInstrumentation;

  /** Create a saga compensator. */
  constructor(options: SagaCompensatorOptions) {
    this.id = options.id ?? 'saga-compensator';
    this.#clock = options.clock;
    this.#instrumentation = options.instrumentation;
  }

  /** Run the registered compensation handler for one failed message. */
  async compensate<TState extends SagaState>(
    request: SagaCompensationRequest<TState>,
  ): Promise<SagaCompensationResult<TState>> {
    await Promise.resolve();
    const instrumentation = request.instrumentation ?? this.#instrumentation;
    const span = instrumentation?.startCascadeCompensateSpan({
      sagaId: request.definition.id,
      instanceId: request.instanceId,
      correlationId: request.correlationId,
      correlationKey: request.correlationKey,
      parent: request.parent,
      reason: request.reason,
    });
    const spanContext = span && instrumentation?.spanContext(span);
    const handler = request.definition.compensations.get(request.message.type);
    if (!handler) {
      if (span) {
        instrumentation?.recordCompensationCascadeSize(span, 0);
        instrumentation?.finishSpan(span, SagaTelemetryOutcomes.SKIPPED);
      }
      return Object.freeze({
        sagaId: request.definition.id,
        instanceId: request.instanceId,
        state: request.state,
        message: request.message,
        reason: request.reason,
        correlationId: request.correlationId,
        correlationKey: request.correlationKey,
        spanContext,
        compensated: false,
        cascaded: Object.freeze([]),
      });
    }

    try {
      if (!request.correlationKey) {
        throw SagasError.validationFailed(
          'Compensation execution requires an engine-resolved correlationKey.',
        );
      }
      const saga = { state: request.state };
      const context: SagaContext<TState, SagaMessage> = {
        sagaId: request.definition.id,
        instanceId: request.instanceId,
        correlationKey: request.correlationKey,
        state: request.state,
        message: request.message,
        attempt: request.attempt ?? 1,
        now: this.#clock.now(),
        traceparent: spanContext?.traceparent ?? request.message.traceparent,
        tracestate: spanContext?.tracestate ?? request.message.tracestate,
      };
      const cascaded = handler(saga, request.message, context);
      if (span) {
        instrumentation?.recordCompensationCascadeSize(span, cascaded.length);
        instrumentation?.finishSpan(span, SagaTelemetryOutcomes.SUCCESS);
      }

      return Object.freeze({
        sagaId: request.definition.id,
        instanceId: request.instanceId,
        state: saga.state,
        message: request.message,
        reason: request.reason,
        correlationId: request.correlationId,
        correlationKey: request.correlationKey,
        spanContext,
        compensated: true,
        cascaded,
      });
    } catch (error) {
      if (span) {
        instrumentation?.finishSpan(span, SagaTelemetryOutcomes.ERROR, error);
      }
      throw error;
    }
  }

  /** Run compensation from a cascaded compensate command. */
  async compensateCascaded<TState extends SagaState>(
    definition: SagaDefinition<string, TState, SagaMessage>,
    instanceId: SagaInstanceId,
    state: TState,
    message: CascadedMessage<'compensate'>,
    execution: Pick<
      SagaCompensationRequest<TState>,
      'correlationId' | 'correlationKey' | 'parent' | 'instrumentation'
    > = {},
  ): Promise<SagaCompensationResult<TState>> {
    if (!isSagaMessage(message.message)) {
      const error = SagasError.notImplemented(
        'Nested cascaded compensation is deferred to phase 7d.',
      );
      this.#recordRejectedCompensation({
        definition,
        instanceId,
        reason: message.reason,
        ...execution,
      }, error);
      throw error;
    }

    const result = await this.compensate({
      ...execution,
      definition,
      instanceId,
      state,
      message: message.message,
      reason: message.reason,
    });
    if (!result.compensated) {
      throw SagasError.notImplemented(
        `sagaCompensate effect for "${message.message.type}" requires a registered .compensate() handler.`,
      );
    }
    return result;
  }

  /** Run compensation using a failure cascade reason. */
  compensateFailure<TState extends SagaState>(
    request: SagaCompensationRequest<TState>,
    failure: CascadedMessage<'fail'>,
  ): Promise<SagaCompensationResult<TState>> {
    return this.compensate({
      ...request,
      reason: request.reason ?? failure.reason,
    });
  }

  #recordRejectedCompensation<TState extends SagaState>(
    request: Readonly<
      & Pick<SagaCompensationRequest<TState>, 'definition' | 'instanceId'>
      & Partial<
        Pick<
          SagaCompensationRequest<TState>,
          'correlationId' | 'correlationKey' | 'parent' | 'instrumentation' | 'reason'
        >
      >
    >,
    error: unknown,
  ): void {
    const instrumentation = request.instrumentation ?? this.#instrumentation;
    const span = instrumentation?.startCascadeCompensateSpan({
      sagaId: request.definition.id,
      instanceId: request.instanceId,
      correlationId: request.correlationId,
      correlationKey: request.correlationKey,
      parent: request.parent,
      reason: request.reason,
    });
    if (!span) return;
    instrumentation?.recordCompensationCascadeSize(span, 0);
    instrumentation?.finishSpan(span, SagaTelemetryOutcomes.ERROR, error);
  }
}

/** Create a saga compensator. */
export function createSagaCompensator(options: SagaCompensatorOptions): SagaCompensator {
  return new SagaCompensator(options);
}

function isSagaMessage(message: SagaMessage | CascadedMessage): message is SagaMessage {
  return 'type' in message;
}
