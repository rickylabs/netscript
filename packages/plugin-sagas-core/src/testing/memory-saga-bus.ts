import type { CascadedMessage, SagaDefinition, SagaMessage } from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';
import type {
  SagaBusPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
} from '../ports/mod.ts';

/** Published message record captured by `MemorySagaBus`. */
export type MemorySagaPublishRecord = Readonly<{
  message: SagaMessage;
  options?: SagaPublishOptions;
}>;

/** In-memory saga bus that records publications and registrations. */
export class MemorySagaBus implements SagaBusPort {
  /** Stable bus identifier. */
  readonly id: string;
  readonly #definitions: SagaDefinition[] = [];
  readonly #published: MemorySagaPublishRecord[] = [];
  readonly #cascaded: CascadedMessage[] = [];
  #running = false;

  /** Create an in-memory saga bus. */
  constructor(id = 'memory-saga-bus') {
    this.id = id;
  }

  /** Start the bus so publish operations are accepted. */
  start(): Promise<void> {
    this.#running = true;
    return Promise.resolve();
  }

  /** Stop the bus. */
  stop(_reason?: string): Promise<void> {
    this.#running = false;
    return Promise.resolve();
  }

  /** Register saga definitions for later inspection. */
  register(definitions: readonly SagaDefinition[]): Promise<void> {
    this.#definitions.push(...definitions);
    return Promise.resolve();
  }

  /** Record a published saga message. */
  publish(message: SagaMessage, options?: SagaPublishOptions): Promise<void> {
    this.#assertRunning();
    this.#published.push(Object.freeze({ message, options }));
    return Promise.resolve();
  }

  /** Record cascaded messages. */
  dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void> {
    this.#assertRunning();
    this.#cascaded.push(...messages);
    return Promise.resolve();
  }

  /** Reject signal dispatches until the test runtime supports them. */
  signal<TPayload, TName extends string>(
    _dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void> {
    return Promise.reject(SagasError.notImplemented('signal dispatch deferred to phase 7d'));
  }

  /** Reject query dispatches until the test runtime supports them. */
  query<TResult, TName extends string>(
    _dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult> {
    return Promise.reject(SagasError.notImplemented('query dispatch deferred to phase 7d'));
  }

  /** Return registered definitions. */
  definitions(): readonly SagaDefinition[] {
    return Object.freeze([...this.#definitions]);
  }

  /** Return published message records. */
  published(): readonly MemorySagaPublishRecord[] {
    return Object.freeze([...this.#published]);
  }

  /** Return recorded cascaded messages. */
  cascaded(): readonly CascadedMessage[] {
    return Object.freeze([...this.#cascaded]);
  }

  #assertRunning(): void {
    if (!this.#running) {
      throw SagasError.validationFailed('MemorySagaBus must be started before publishing.');
    }
  }
}
