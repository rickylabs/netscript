import {
  createSagaBusBridge,
  type SagaBridgeCompensationResolver,
} from '../adapters/saga-bus-bridge.ts';
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
import { type LoggerPort, NoopLogger } from './logger.ts';
import type { SagaScheduler } from './saga-scheduler.ts';
import type { SagaInstrumentation } from '../telemetry/mod.ts';

/** Adapter selected by the saga runtime composition root. */
export type SagaRuntimeAdapter = 'native';

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
  logger?: LoggerPort;
  instrumentation?: SagaInstrumentation;
}>;

/** Options accepted by `createSagaRuntime()`. */
export type CreateSagaRuntimeOptions = Readonly<{
  adapter?: SagaRuntimeAdapter;
  native?: SagaRuntimeNativeOptions;
}>;

/** Runtime façade returned by the composition root. */
export interface SagaRuntime<TAdapter extends SagaRuntimeAdapter = SagaRuntimeAdapter> {
  /** Runtime adapter selected by the composition root. */
  readonly adapter: TAdapter;
  /** Bus implementation backing this runtime facade. */
  readonly bus: SagaBusPort;
  /** Start runtime resources. */
  start(): Promise<void>;
  /** Stop runtime resources. */
  stop(reason?: string): Promise<void>;
  /** Register saga definitions with the runtime bus. */
  register(definitions: readonly SagaDefinition[]): Promise<void>;
  /** Publish a saga message through the runtime bus. */
  publish(message: SagaMessage, options?: SagaPublishOptions): Promise<void>;
  /** Dispatch cascaded messages through the runtime bus. */
  dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void>;
  /** Dispatch a signal through the runtime bus. */
  signal<TPayload, TName extends string>(
    dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void>;
  /** Dispatch a query through the runtime bus. */
  query<TResult, TName extends string>(
    dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult>;
}

/** Create the default native saga runtime. */
export function createSagaRuntime(
  options?: CreateSagaRuntimeOptions & Readonly<{ adapter?: 'native' }>,
): SagaRuntime<'native'>;

/** Create a saga runtime with explicit adapter selection. */
export function createSagaRuntime(
  options: CreateSagaRuntimeOptions = {},
): SagaRuntime {
  return createRuntimeFacade('native', createNativeBus(options.native));
}

const storelessWarningLoggers = new WeakSet<LoggerPort>();

function createNativeBus(options: SagaRuntimeNativeOptions = {}): SagaBusPort {
  const store = options.store ?? options.engineOptions?.store;
  if (options.engine === undefined && store === undefined) {
    warnStorelessNativeRuntime(options.logger ?? new NoopLogger());
  }

  const engine = options.engine ?? createSagaEngine({
    ...options.engineOptions,
    store,
    instrumentation: options.instrumentation ?? options.engineOptions?.instrumentation,
  });
  return createSagaBusBridge({
    id: options.id,
    engine,
    scheduler: options.scheduler,
    compensator: options.compensator,
    resolveCompensation: options.resolveCompensation,
    idempotency: options.idempotency,
    instrumentation: options.instrumentation,
  });
}

function warnStorelessNativeRuntime(logger: LoggerPort): void {
  if (storelessWarningLoggers.has(logger)) {
    return;
  }
  storelessWarningLoggers.add(logger);
  logger.warn('Native saga runtime created without a durable SagaStorePort.', {
    code: 'sagas.runtime.store_missing',
    adapter: 'native',
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
