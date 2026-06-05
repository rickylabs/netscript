import type { CascadedMessage, SagaDefinition, SagaMessage } from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';
import type {
  SagaBusPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
} from '../ports/mod.ts';

export type MemorySagaPublishRecord = Readonly<{
  message: SagaMessage;
  options?: SagaPublishOptions;
}>;

/** In-memory saga bus that records publications and registrations. */
export class MemorySagaBus implements SagaBusPort {
  readonly id: string;
  readonly #definitions: SagaDefinition[] = [];
  readonly #published: MemorySagaPublishRecord[] = [];
  readonly #cascaded: CascadedMessage[] = [];
  #running = false;

  constructor(id = 'memory-saga-bus') {
    this.id = id;
  }

  start(): Promise<void> {
    this.#running = true;
    return Promise.resolve();
  }

  stop(_reason?: string): Promise<void> {
    this.#running = false;
    return Promise.resolve();
  }

  register(definitions: readonly SagaDefinition[]): Promise<void> {
    this.#definitions.push(...definitions);
    return Promise.resolve();
  }

  publish(message: SagaMessage, options?: SagaPublishOptions): Promise<void> {
    this.#assertRunning();
    this.#published.push(Object.freeze({ message, options }));
    return Promise.resolve();
  }

  dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void> {
    this.#assertRunning();
    this.#cascaded.push(...messages);
    return Promise.resolve();
  }

  signal<TPayload, TName extends string>(
    _dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void> {
    return Promise.reject(SagasError.notImplemented('signal dispatch deferred to phase 7d'));
  }

  query<TResult, TName extends string>(
    _dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult> {
    return Promise.reject(SagasError.notImplemented('query dispatch deferred to phase 7d'));
  }

  definitions(): readonly SagaDefinition[] {
    return Object.freeze([...this.#definitions]);
  }

  published(): readonly MemorySagaPublishRecord[] {
    return Object.freeze([...this.#published]);
  }

  cascaded(): readonly CascadedMessage[] {
    return Object.freeze([...this.#cascaded]);
  }

  #assertRunning(): void {
    if (!this.#running) {
      throw SagasError.validationFailed('MemorySagaBus must be started before publishing.');
    }
  }
}
