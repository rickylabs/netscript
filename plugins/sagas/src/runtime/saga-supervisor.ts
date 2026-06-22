import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';
import {
  createSagaRuntime,
  type CreateSagaRuntimeOptions,
  type SagaRuntime,
  type SagaRuntimeAdapter,
} from '@netscript/plugin-sagas-core/runtime';
import { createSagaTelemetry } from '../telemetry/otel-saga-tracer.ts';
import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';
import { openSagaRuntimeKv } from './kv-saga-store.ts';
import { KvSagaAppliedKeyStore, KvSagaIdempotencyStore } from './kv-saga-runtime-stores.ts';

/** Lifecycle status exposed by the saga runtime supervisor. */
export type SagaRuntimeSupervisorStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed';

/** Async source for statically generated saga definitions. */
export type SagaDefinitionRegistryLoader = () => Promise<readonly SagaDefinition[]>;

/** Runtime factory boundary used by tests and composition roots. */
export type SagaRuntimeFactory = (
  options: CreateSagaRuntimeOptions,
) => SagaRuntime | Promise<SagaRuntime>;

/** Supervisor construction options. */
export type SagaRuntimeSupervisorOptions = Readonly<{
  definitions?: readonly SagaDefinition[];
  loadDefinitions?: SagaDefinitionRegistryLoader;
  runtimeOptions?: CreateSagaRuntimeOptions;
  createRuntime?: SagaRuntimeFactory;
}>;

/** Immutable runtime supervisor state snapshot. */
export type SagaRuntimeSupervisorSnapshot = Readonly<{
  status: SagaRuntimeSupervisorStatus;
  adapter?: SagaRuntimeAdapter;
  definitionCount: number;
  failure?: string;
}>;

/** Owns one saga runtime process lifecycle. */
export class SagaRuntimeSupervisor {
  private status: SagaRuntimeSupervisorStatus = 'idle';
  private runtime?: SagaRuntime;
  private definitions: readonly SagaDefinition[] = Object.freeze([]);
  private failure?: string;

  /** Frozen supervisor options used for lifecycle operations. */
  readonly options: SagaRuntimeSupervisorOptions;

  /** Create a supervisor for generated saga definitions and a runtime factory. */
  constructor(options: SagaRuntimeSupervisorOptions = {}) {
    this.options = Object.freeze({ ...options });
  }

  /** Start the runtime, register generated definitions, and return a state snapshot. */
  async start(): Promise<SagaRuntimeSupervisorSnapshot> {
    if (this.status === 'running') {
      return this.snapshot();
    }

    this.status = 'starting';
    this.failure = undefined;

    try {
      const definitions = await this.resolveDefinitions();
      const runtime = await (this.options.createRuntime ?? createDefaultRuntime)(
        this.options.runtimeOptions ?? {},
      );
      await runtime.register(definitions);
      await runtime.start();
      this.definitions = definitions;
      this.runtime = runtime;
      this.status = 'running';
      return this.snapshot();
    } catch (cause) {
      this.status = 'failed';
      this.failure = formatFailure(cause);
      throw cause;
    }
  }

  /** Stop the runtime if it has started. */
  async stop(reason = 'sagas-runtime-stop'): Promise<SagaRuntimeSupervisorSnapshot> {
    if (this.runtime === undefined) {
      this.status = 'stopped';
      return this.snapshot();
    }

    this.status = 'stopping';
    await this.runtime.stop(reason);
    this.status = 'stopped';
    return this.snapshot();
  }

  /** Return the current immutable supervisor state. */
  snapshot(): SagaRuntimeSupervisorSnapshot {
    return Object.freeze({
      status: this.status,
      adapter: this.runtime?.adapter,
      definitionCount: this.definitions.length,
      failure: this.failure,
    });
  }

  /** Resolve static or lazily loaded saga definitions before runtime startup. */
  private async resolveDefinitions(): Promise<readonly SagaDefinition[]> {
    if (this.options.definitions !== undefined) {
      return Object.freeze([...this.options.definitions]);
    }
    if (this.options.loadDefinitions !== undefined) {
      return Object.freeze([...(await this.options.loadDefinitions())]);
    }
    return Object.freeze([]);
  }
}

function formatFailure(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

async function createDefaultRuntime(options: CreateSagaRuntimeOptions): Promise<SagaRuntime> {
  if (hasInjectedNativeEngine(options)) {
    return createSagaRuntime({
      ...options,
      adapter: 'native',
      native: withDefaultTelemetry(options.native),
    });
  }

  const native = withDefaultTelemetry(options.native);
  const kv = await openSagaRuntimeKv();
  const durable = await createDurableSagaRuntime({
    backend: 'kv',
    kv,
    native: {
      ...native,
      idempotency: native.idempotency ?? new KvSagaIdempotencyStore({ kv }),
      engineOptions: {
        ...native.engineOptions,
        appliedKeys: native.engineOptions?.appliedKeys ?? new KvSagaAppliedKeyStore({ kv }),
      },
    },
  });

  return withDurableDispose(durable.runtime, durable.dispose);
}

function hasInjectedNativeEngine(options: CreateSagaRuntimeOptions): boolean {
  return options.native?.engine !== undefined;
}

function withDurableDispose(runtime: SagaRuntime, dispose: () => Promise<void>): SagaRuntime {
  let closed = false;
  return Object.freeze({
    ...runtime,
    stop: async (reason?: string): Promise<void> => {
      try {
        await runtime.stop(reason);
      } finally {
        if (!closed) {
          closed = true;
          await dispose();
        }
      }
    },
  });
}

function withDefaultTelemetry(
  native: CreateSagaRuntimeOptions['native'],
): NonNullable<CreateSagaRuntimeOptions['native']> {
  return {
    ...native,
    instrumentation: native?.instrumentation ?? createSagaTelemetry(),
  };
}
