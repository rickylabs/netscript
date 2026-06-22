import type { SagaDefinition } from '../domain/mod.ts';
import {
  createSagaRuntime,
  type CreateSagaRuntimeOptions,
  type SagaRuntime,
  type SagaRuntimeAdapter,
} from '../runtime/mod.ts';

/** Options accepted by `startSagas` and `startSagaHandlers`. */
export type StartSagasOptions<TAdapter extends SagaRuntimeAdapter = SagaRuntimeAdapter> =
  & CreateSagaRuntimeOptions
  & Readonly<{
    definitions?: readonly SagaDefinition[];
    autoStart?: boolean;
    adapter?: TAdapter;
  }>;

/** Runtime bundle returned from a `startSagas` call. */
export type StartSagasResult<TAdapter extends SagaRuntimeAdapter = SagaRuntimeAdapter> = Readonly<{
  runtime: SagaRuntime<TAdapter>;
  bus: SagaRuntime<TAdapter>['bus'];
  sagaCount: number;
  shutdown(): Promise<void>;
}>;

/** Start a saga runtime from explicit definitions and composition options. */
export async function startSagas(
  options?: StartSagasOptions<'native'>,
): Promise<StartSagasResult<'native'>>;

export async function startSagas(
  options: StartSagasOptions = {},
): Promise<StartSagasResult> {
  return await startRuntime(
    createSagaRuntime({ adapter: 'native', native: options.native }),
    options.definitions ?? [],
    options.autoStart,
  );
}

/** Semantic alias for distributed saga handler processes. */
export async function startSagaHandlers(
  options?: StartSagasOptions<'native'>,
): Promise<StartSagasResult<'native'>>;

export async function startSagaHandlers(
  options: StartSagasOptions = {},
): Promise<StartSagasResult> {
  return await startSagas({
    adapter: 'native',
    native: options.native,
    definitions: options.definitions,
    autoStart: options.autoStart,
  });
}

async function startRuntime<TAdapter extends SagaRuntimeAdapter>(
  runtime: SagaRuntime<TAdapter>,
  definitions: readonly SagaDefinition[],
  autoStart = true,
): Promise<StartSagasResult<TAdapter>> {
  if (definitions.length > 0) {
    await runtime.register(definitions);
  }

  if (autoStart) {
    await runtime.start();
  }

  return Object.freeze({
    runtime,
    bus: runtime.bus,
    sagaCount: definitions.length,
    shutdown: () => runtime.stop('startSagas shutdown'),
  });
}
