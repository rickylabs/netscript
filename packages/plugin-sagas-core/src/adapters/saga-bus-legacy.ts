import { type BusConfig, createBus } from '@saga-bus/core';
import type { CascadedMessage, SagaDefinition, SagaMessage } from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';
import type {
  SagaBusPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
} from '../ports/mod.ts';
import {
  cascadedMessageIdempotencyTarget,
  SagaIdempotencyDedupTable,
  type SagaIdempotencyTarget,
  sagaMessageIdempotencyTarget,
} from '../runtime/saga-idempotency.ts';

/** Local structural view of a legacy saga-bus machine. */
export type SagaBusLegacyMachine =
  & Readonly<{
    name: string;
    handledMessageTypes: readonly string[];
  }>
  & Readonly<Record<string, unknown>>;

/** Local structural view of the upstream legacy bus instance. */
export interface SagaBusLegacyBus {
  /** Start the wrapped legacy bus. */
  start(): Promise<void>;
  /** Stop the wrapped legacy bus. */
  stop(): Promise<void>;
  /** Publish a legacy bus message. */
  publish(message: unknown): Promise<void>;
  /** Optionally load legacy saga state by saga and correlation identifiers. */
  getSagaState?<TState>(sagaName: string, correlationId: string): Promise<TState | null>;
}

/** Logger shape used to report legacy-adapter deprecation without console globals. */
export interface SagaBusLegacyLogger {
  /** Emit a warning message with optional structured metadata. */
  warn(message: string, metadata?: Readonly<Record<string, unknown>>): void;
}

/** Maps NetScript saga definitions into legacy saga-bus machine definitions. */
export type SagaBusLegacyDefinitionMapper = (
  definition: SagaDefinition,
) => SagaBusLegacyMachine;

/** Factory hook for tests and migration seams. */
export type SagaBusLegacyFactory = (
  config: Readonly<Record<string, unknown>>,
) => SagaBusLegacyBus;

/** Options for the deprecated legacy saga-bus adapter. */
export type SagaBusLegacyOptions = Readonly<{
  id?: string;
  bus?: SagaBusLegacyBus;
  config?: Readonly<Record<string, unknown>>;
  mapDefinition?: SagaBusLegacyDefinitionMapper;
  createBus?: SagaBusLegacyFactory;
  logger?: SagaBusLegacyLogger;
  idempotency?: SagaIdempotencyDedupTable;
}>;

/** Deprecated adapter that wraps `@saga-bus/core` behind `SagaBusPort`. */
export class SagaBusLegacy implements SagaBusPort {
  /** Stable adapter identifier. */
  readonly id: string;
  readonly #options: SagaBusLegacyOptions;
  readonly #idempotency: SagaIdempotencyDedupTable;
  readonly #definitions: SagaDefinition[] = [];
  #bus?: SagaBusLegacyBus;
  #running = false;
  #deprecationLogged = false;

  /** Create a deprecated legacy saga-bus adapter. */
  constructor(options: SagaBusLegacyOptions = {}) {
    this.id = options.id ?? 'saga-bus-legacy';
    this.#options = options;
    this.#idempotency = options.idempotency ?? new SagaIdempotencyDedupTable();
    this.#bus = options.bus;
  }

  /** Start the wrapped legacy saga bus. */
  async start(): Promise<void> {
    if (this.#running) return;
    this.#logDeprecation();
    this.#bus = this.#bus ?? this.#createBus();
    await this.#bus.start();
    this.#running = true;
  }

  /** Stop the wrapped legacy saga bus. */
  async stop(): Promise<void> {
    if (!this.#running || !this.#bus) return;
    await this.#bus.stop();
    this.#running = false;
  }

  /** Register saga definitions before start. */
  register(definitions: readonly SagaDefinition[]): Promise<void> {
    if (this.#running) {
      throw SagasError.validationFailed('Cannot register legacy sagas after start().');
    }
    this.#definitions.push(...definitions);
    return Promise.resolve();
  }

  /** Publish one saga message through the legacy bus. */
  async publish(message: SagaMessage, options: SagaPublishOptions = {}): Promise<void> {
    this.#logDeprecation();
    const idempotencyKey = options.idempotencyKey ?? message.idempotencyKey;
    if (idempotencyKey && !this.#reserve(sagaMessageIdempotencyTarget(message), idempotencyKey)) {
      return;
    }

    await this.#publishToBus(message, options);
  }

  /** Dispatch cascaded messages supported by the legacy bus adapter. */
  async dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void> {
    for (const message of messages) {
      if (message.idempotencyKey) {
        const target = cascadedMessageIdempotencyTarget(message);
        if (!this.#reserve(target, message.idempotencyKey)) {
          continue;
        }
      }
      if (message.kind !== 'send') {
        throw SagasError.notImplemented(
          `Legacy adapter cascaded ${message.kind} dispatch deferred to native runtime.`,
        );
      }
      await this.#publishToBus({
        type: message.target.id,
        payload: message.payload,
        idempotencyKey: message.idempotencyKey,
        concurrencyKey: message.concurrencyKey,
      });
    }
  }

  #reserve(target: SagaIdempotencyTarget, idempotencyKey: string): boolean {
    return this.#idempotency.reserve(target, idempotencyKey).accepted;
  }

  async #publishToBus(message: SagaMessage, options: SagaPublishOptions = {}): Promise<void> {
    const bus = this.#requireBus();
    await bus.publish(toLegacyMessage(message, options));
  }

  /** Reject signal dispatches because the legacy bus does not support them. */
  signal<TPayload, TName extends string>(
    _dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void> {
    return Promise.reject(
      SagasError.notImplemented('signal dispatch deferred to phase 7d'),
    );
  }

  /** Reject query dispatches because the legacy bus does not support them. */
  query<TResult, TName extends string>(
    _dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult> {
    return Promise.reject(
      SagasError.notImplemented('query dispatch deferred to phase 7d'),
    );
  }

  #requireBus(): SagaBusLegacyBus {
    this.#bus = this.#bus ?? this.#createBus();
    return this.#bus;
  }

  #createBus(): SagaBusLegacyBus {
    const factory = this.#options.createBus ?? defaultLegacyBusFactory;
    const config = {
      ...this.#options.config,
      sagas: this.#definitions.map(this.#mapDefinition),
    };
    return factory(config);
  }

  #mapDefinition = (definition: SagaDefinition): SagaBusLegacyMachine => {
    const mapper = this.#options.mapDefinition ?? defaultLegacyDefinitionMapper;
    return mapper(definition);
  };

  #logDeprecation(): void {
    if (this.#deprecationLogged) return;
    this.#options.logger?.warn(
      'SagaBusLegacy is deprecated; use SagaBusBridge/native runtime instead.',
      { adapter: this.id },
    );
    this.#deprecationLogged = true;
  }
}

/** Create a deprecated legacy saga-bus adapter. */
export function createSagaBusLegacy(options: SagaBusLegacyOptions = {}): SagaBusLegacy {
  return new SagaBusLegacy(options);
}

function defaultLegacyBusFactory(config: Readonly<Record<string, unknown>>): SagaBusLegacyBus {
  return createBus(config as unknown as BusConfig) as unknown as SagaBusLegacyBus;
}

function defaultLegacyDefinitionMapper(definition: SagaDefinition): SagaBusLegacyMachine {
  return Object.freeze({
    name: definition.id,
    handledMessageTypes: definition.handledMessageTypes,
  });
}

function toLegacyMessage(
  message: SagaMessage,
  options: SagaPublishOptions,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    type: message.type,
    payload: message.payload,
    id: message.id,
    correlationId: message.correlationKey,
    idempotencyKey: options.idempotencyKey ?? message.idempotencyKey,
    concurrencyKey: options.concurrencyKey ?? message.concurrencyKey,
    traceparent: options.traceparent ?? message.traceparent,
    tracestate: options.tracestate ?? message.tracestate,
    occurredAt: message.occurredAt,
  });
}
