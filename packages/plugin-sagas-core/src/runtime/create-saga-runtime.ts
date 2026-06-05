import {
  createSagaBusBridge,
  type SagaBridgeCompensationResolver,
} from '../adapters/saga-bus-bridge.ts';
import { createSagaBusLegacy, type SagaBusLegacyOptions } from '../adapters/saga-bus-legacy.ts';
import type { CascadedMessage, SagaDefinition, SagaMessage } from '../domain/mod.ts';
import type {
  SagaBusPort,
  SagaIdempotencyPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
  SagaStorePort,
} from '../ports/mod.ts';
import { createSagaEngine, type SagaEngine, type SagaEngineOptions } from './saga-engine.ts';
import type { SagaCompensator } from './saga-compensator.ts';
import type { SagaIdempotencyDedupTable } from './saga-idempotency.ts';
import type { SagaScheduler } from './saga-scheduler.ts';

/** Adapter selected by the saga runtime composition root. */
export type SagaRuntimeAdapter = 'native' | 'legacy';

/** Native runtime composition options. */
export type SagaRuntimeNativeOptions = Readonly<{
  id?: string;
  engine?: SagaEngine;
  engineOptions?: SagaEngineOptions;
  scheduler?: SagaScheduler;
  compensator?: SagaCompensator;
  store?: SagaStorePort;
  resolveCompensation?: SagaBridgeCompensationResolver;
  idempotency?: SagaIdempotencyPort | SagaIdempotencyDedupTable;
}>;

/** Options accepted by `createSagaRuntime()`. */
export type CreateSagaRuntimeOptions = Readonly<{
  adapter?: SagaRuntimeAdapter;
  native?: SagaRuntimeNativeOptions;
  legacy?: SagaBusLegacyOptions;
}>;

/** Runtime façade returned by the composition root. */
export interface SagaRuntime<TAdapter extends SagaRuntimeAdapter = SagaRuntimeAdapter> {
  readonly adapter: TAdapter;
  readonly bus: SagaBusPort;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  register(definitions: readonly SagaDefinition[]): Promise<void>;
  publish(message: SagaMessage, options?: SagaPublishOptions): Promise<void>;
  dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void>;
  signal<TPayload, TName extends string>(
    dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void>;
  query<TResult, TName extends string>(
    dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult>;
}

/** Create the default native saga runtime. */
export function createSagaRuntime(
  options?: CreateSagaRuntimeOptions & Readonly<{ adapter?: 'native' }>,
): SagaRuntime<'native'>;

/** Create the opt-in deprecated legacy saga runtime. */
export function createSagaRuntime(
  options: CreateSagaRuntimeOptions & Readonly<{ adapter: 'legacy' }>,
): SagaRuntime<'legacy'>;

/** Create a saga runtime with explicit adapter selection. */
export function createSagaRuntime(
  options: CreateSagaRuntimeOptions = {},
): SagaRuntime {
  if (options.adapter === 'legacy') {
    return createRuntimeFacade('legacy', createSagaBusLegacy(options.legacy));
  }

  return createRuntimeFacade('native', createNativeBus(options.native));
}

function createNativeBus(options: SagaRuntimeNativeOptions = {}): SagaBusPort {
  const engine = options.engine ?? createSagaEngine({
    ...options.engineOptions,
    store: options.store ?? options.engineOptions?.store,
  });
  return createSagaBusBridge({
    id: options.id,
    engine,
    scheduler: options.scheduler,
    compensator: options.compensator,
    resolveCompensation: options.resolveCompensation,
    idempotency: options.idempotency,
  });
}

function createRuntimeFacade<TAdapter extends SagaRuntimeAdapter>(
  adapter: TAdapter,
  bus: SagaBusPort,
): SagaRuntime<TAdapter> {
  return Object.freeze({
    adapter,
    bus,
    start: () => bus.start(),
    stop: (reason?: string) => bus.stop(reason),
    register: (definitions: readonly SagaDefinition[]) => bus.register(definitions),
    publish: (message: SagaMessage, options?: SagaPublishOptions) => bus.publish(message, options),
    dispatchCascaded: (messages: readonly CascadedMessage[]) => bus.dispatchCascaded(messages),
    signal: <TPayload, TName extends string>(
      dispatch: SagaSignalDispatch<TPayload, TName>,
    ) => bus.signal(dispatch),
    query: <TResult, TName extends string>(
      dispatch: SagaQueryDispatch<TResult, TName>,
    ) => bus.query(dispatch),
  });
}
