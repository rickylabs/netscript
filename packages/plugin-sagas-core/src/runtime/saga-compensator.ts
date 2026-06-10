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

/** Compensation request for a failed or explicitly compensated saga step. */
export type SagaCompensationRequest<TState extends SagaState = SagaState> = Readonly<{
  definition: SagaDefinition<string, TState, SagaMessage>;
  instanceId: SagaInstanceId;
  state: TState;
  message: SagaMessage;
  reason?: string;
  attempt?: number;
}>;

/** Compensation execution result. */
export type SagaCompensationResult<TState extends SagaState = SagaState> = Readonly<{
  sagaId: SagaId;
  instanceId: SagaInstanceId;
  state: TState;
  message: SagaMessage;
  reason?: string;
  compensated: boolean;
  cascaded: readonly CascadedMessage[];
}>;

/** Options for compensation orchestration. */
export type SagaCompensatorOptions = Readonly<{
  id?: string;
  clock: SagaClockPort;
}>;

/** Runtime primitive for `sagaFail()` and `sagaCompensate()` cascades. */
export class SagaCompensator {
  /** Stable compensator identifier. */
  readonly id: string;
  readonly #clock: SagaClockPort;

  /** Create a saga compensator. */
  constructor(options: SagaCompensatorOptions) {
    this.id = options.id ?? 'saga-compensator';
    this.#clock = options.clock;
  }

  /** Run the registered compensation handler for one failed message. */
  compensate<TState extends SagaState>(
    request: SagaCompensationRequest<TState>,
  ): Promise<SagaCompensationResult<TState>> {
    const handler = request.definition.compensations.get(request.message.type);
    if (!handler) {
      return Promise.resolve(Object.freeze({
        sagaId: request.definition.id,
        instanceId: request.instanceId,
        state: request.state,
        message: request.message,
        reason: request.reason,
        compensated: false,
        cascaded: Object.freeze([]),
      }));
    }

    const saga = { state: request.state };
    const context: SagaContext<TState, SagaMessage> = {
      sagaId: request.definition.id,
      instanceId: request.instanceId,
      correlationKey: request.message.correlationKey ??
        (`${request.definition.id}:${request.message.type}` as SagaCorrelationKey),
      state: request.state,
      message: request.message,
      attempt: request.attempt ?? 1,
      now: this.#clock.now(),
      traceparent: request.message.traceparent,
      tracestate: request.message.tracestate,
    };
    const cascaded = handler(saga, request.message, context);

    return Promise.resolve(Object.freeze({
      sagaId: request.definition.id,
      instanceId: request.instanceId,
      state: saga.state,
      message: request.message,
      reason: request.reason,
      compensated: true,
      cascaded,
    }));
  }

  /** Run compensation from a cascaded compensate command. */
  compensateCascaded<TState extends SagaState>(
    definition: SagaDefinition<string, TState, SagaMessage>,
    instanceId: SagaInstanceId,
    state: TState,
    message: CascadedMessage<'compensate'>,
  ): Promise<SagaCompensationResult<TState>> {
    if (!isSagaMessage(message.message)) {
      throw SagasError.notImplemented(
        'Nested cascaded compensation is deferred to phase 7d.',
      );
    }

    return this.compensate({
      definition,
      instanceId,
      state,
      message: message.message,
      reason: message.reason,
    });
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
}

/** Create a saga compensator. */
export function createSagaCompensator(options: SagaCompensatorOptions): SagaCompensator {
  return new SagaCompensator(options);
}

function isSagaMessage(message: SagaMessage | CascadedMessage): message is SagaMessage {
  return 'type' in message;
}
