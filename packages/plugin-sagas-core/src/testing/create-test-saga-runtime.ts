import type { CascadedMessage, SagaDefinition, SagaMessage } from '../domain/mod.ts';
import type { SagaPublishOptions, SagaQueryDispatch, SagaSignalDispatch } from '../ports/mod.ts';
import type { SagaRuntime } from '../runtime/mod.ts';
import { MemorySagaBus } from './memory-saga-bus.ts';
import { MemorySagaStore } from './memory-saga-store.ts';
import { TestSagaClock } from './test-saga-clock.ts';

/** Options for composing a deterministic test saga runtime. */
export type TestSagaRuntimeOptions = Readonly<{
  bus?: MemorySagaBus;
  store?: MemorySagaStore;
  clock?: TestSagaClock;
}>;

/** Deterministic runtime facade returned by `createTestSagaRuntime`. */
export type TestSagaRuntime =
  & SagaRuntime<'native'>
  & Readonly<{
    bus: MemorySagaBus;
    store: MemorySagaStore;
    clock: TestSagaClock;
  }>;

/** Create an in-memory saga runtime facade for deterministic tests. */
export function createTestSagaRuntime(options: TestSagaRuntimeOptions = {}): TestSagaRuntime {
  const bus = options.bus ?? new MemorySagaBus();
  const store = options.store ?? new MemorySagaStore();
  const clock = options.clock ?? new TestSagaClock();

  return Object.freeze({
    adapter: 'native',
    bus,
    store,
    clock,
    start: () => bus.start(),
    stop: (reason?: string) => bus.stop(reason),
    register: (definitions: readonly SagaDefinition[]) => bus.register(definitions),
    publish: (message: SagaMessage, publishOptions?: SagaPublishOptions) =>
      bus.publish(message, publishOptions),
    dispatchCascaded: (messages: readonly CascadedMessage[]) => bus.dispatchCascaded(messages),
    signal: <TPayload, TName extends string>(dispatch: SagaSignalDispatch<TPayload, TName>) =>
      bus.signal(dispatch),
    query: <TResult, TName extends string>(dispatch: SagaQueryDispatch<TResult, TName>) =>
      bus.query(dispatch),
  });
}
