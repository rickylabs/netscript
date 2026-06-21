import type { CascadedMessage, SagaDefinition, SagaMessage } from '../domain/mod.ts';
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
import type { SagaCompensationRequest, SagaCompensator } from '../runtime/saga-compensator.ts';
import type { SagaEngine } from '../runtime/saga-engine.ts';
import type { SagaScheduler } from '../runtime/saga-scheduler.ts';
import type { SagaInstrumentation } from '../telemetry/mod.ts';

/** Resolver used when a fail/compensate cascade needs saga state context. */
export type SagaBridgeCompensationResolver = (
  message: CascadedMessage<'fail' | 'compensate'>,
) => Promise<SagaCompensationRequest | undefined> | SagaCompensationRequest | undefined;

/** Options for the native saga bus bridge adapter. */
export type SagaBusBridgeOptions = Readonly<{
  id?: string;
  engine: SagaEngine;
  scheduler?: SagaScheduler;
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
  readonly #scheduler?: SagaScheduler;
  readonly #compensator?: SagaCompensator;
  readonly #resolveCompensation?: SagaBridgeCompensationResolver;
  readonly #idempotency: SagaIdempotencyPort;
  readonly #instrumentation?: SagaInstrumentation;

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
  async register(definitions: readonly SagaDefinition[]): Promise<void> {
    await this.#engine.register(definitions);
  }

  /** Publish one saga message through the engine. */
  async publish(message: SagaMessage, options: SagaPublishOptions = {}): Promise<void> {
    const idempotencyKey = options.idempotencyKey ?? message.idempotencyKey;
    if (
      idempotencyKey &&
      !await this.#reserve(sagaMessageIdempotencyTarget(message), idempotencyKey)
    ) {
      return;
    }

    await this.#engine.publish(withPublishOptions(message, options), options);
  }

  /** Dispatch cascaded messages through engine, scheduler, or compensator. */
  async dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void> {
    for (const message of messages) {
      if (message.idempotencyKey) {
        const target = cascadedMessageIdempotencyTarget(message);
        if (!await this.#reserve(target, message.idempotencyKey)) {
          continue;
        }
      }
      await this.#dispatchOne(message);
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

  async #dispatchOne(message: CascadedMessage): Promise<void> {
    switch (message.kind) {
      case 'send':
        await this.#engine.publish({
          type: message.target.id,
          payload: message.payload,
          idempotencyKey: message.idempotencyKey,
          concurrencyKey: message.concurrencyKey,
        });
        return;
      case 'scheduled':
        await this.#schedule(message);
        return;
      case 'complete':
        return;
      case 'fail':
      case 'compensate':
        await this.#compensate(message);
        return;
      case 'spawn':
        throw SagasError.notImplemented('spawn cascades are deferred to phase 7d.');
    }
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

  async #compensate(message: CascadedMessage<'fail' | 'compensate'>): Promise<void> {
    if (!this.#compensator || !this.#resolveCompensation) {
      throw SagasError.notImplemented('compensation cascades require SagaCompensator context.');
    }

    const request = await this.#resolveCompensation(message);
    if (!request) {
      throw SagasError.sagaInstanceNotFound(message.kind);
    }

    if (message.kind === 'fail') {
      await this.#compensator.compensateFailure(request, message);
      return;
    }

    await this.#compensator.compensateCascaded(
      request.definition,
      request.instanceId,
      request.state,
      message,
    );
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
