import { ChildHealthMonitor, type ChildHealthSnapshot } from '@netscript/plugin/health';
import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';
import {
  createSagaRuntime,
  type CreateSagaRuntimeOptions,
  type SagaRuntime,
  type SagaRuntimeAdapter,
} from '@netscript/plugin-sagas-core/runtime';
import {
  KvSagaAppliedKeyStore,
  KvSagaIdempotencyStore,
  openSagaRuntimeKv,
} from '@netscript/plugin-sagas-core/stores';
import { createSagaTelemetry } from '../telemetry/otel-saga-tracer.ts';
import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';
import type { SagaRuntimeDeliveryPort } from './saga-delivery.ts';
import type { SagaInstanceProjectionPort } from './saga-instance-projection.ts';

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
  delivery?: SagaRuntimeDeliveryPort;
  projection?: SagaInstanceProjectionPort;
}>;

/** Immutable runtime supervisor state snapshot. */
export type SagaRuntimeSupervisorSnapshot = Readonly<{
  /** Shared background child health payload. */
  childHealth: ChildHealthSnapshot;
  status: SagaRuntimeSupervisorStatus;
  adapter?: SagaRuntimeAdapter;
  definitionCount: number;
  failure?: string;
}>;

/** Owns one saga runtime process lifecycle. */
export class SagaRuntimeSupervisor {
  private status: SagaRuntimeSupervisorStatus = 'idle';
  private runtime?: SagaRuntime;
  private startup?: Promise<SagaRuntimeSupervisorSnapshot>;
  private definitions: readonly SagaDefinition[] = Object.freeze([]);
  private failure?: string;
  private readonly childHealth = new ChildHealthMonitor();

  /** Frozen supervisor options used for lifecycle operations. */
  readonly options: SagaRuntimeSupervisorOptions;

  /** Create a supervisor for generated saga definitions and a runtime factory. */
  constructor(options: SagaRuntimeSupervisorOptions = {}) {
    this.options = Object.freeze({ ...options });
  }

  /** Start the runtime, register generated definitions, and return a state snapshot. */
  start(): Promise<SagaRuntimeSupervisorSnapshot> {
    if (this.startup) return this.startup;
    const startup = this.startRuntime();
    this.startup = startup;
    void startup.finally(() => {
      this.startup = undefined;
    }).catch(() => undefined);
    return startup;
  }

  /** Bootstrap one owned runtime and roll back partial startup on failure. */
  private async startRuntime(): Promise<SagaRuntimeSupervisorSnapshot> {
    if (this.status === 'running') {
      return this.snapshot();
    }

    if (this.status === 'failed') this.childHealth.restarting();
    this.childHealth.starting();
    this.status = 'starting';
    this.failure = undefined;

    try {
      const definitions = await this.resolveDefinitions();
      const runtime = this.options.createRuntime
        ? await this.options.createRuntime(this.options.runtimeOptions ?? {})
        : await createDefaultRuntime(
          this.options.runtimeOptions ?? {},
          this.options.projection,
        );
      this.runtime = runtime;
      await runtime.register(definitions);
      this.childHealth.registryLoaded();
      await runtime.start();
      await this.options.delivery?.start(runtime);
      this.definitions = definitions;
      this.runtime = runtime;
      this.status = 'running';
      this.childHealth.dependenciesReady();
      this.childHealth.running();
      if (this.options.delivery) {
        void this.options.delivery.wait().then(
          () => this.deliveryFailed(),
          () => this.deliveryFailed(),
        );
      }
      return this.snapshot();
    } catch (cause) {
      this.status = 'failed';
      this.childHealth.failed();
      this.failure = formatFailure(cause);
      await Promise.allSettled([
        this.options.delivery?.stop(),
        this.runtime?.stop('startup-failed'),
      ]);
      this.runtime = undefined;
      throw cause;
    }
  }

  /** Stop the runtime if it has started. */
  async stop(reason = 'sagas-runtime-stop'): Promise<SagaRuntimeSupervisorSnapshot> {
    await this.startup?.catch(() => undefined);
    if (this.runtime === undefined) {
      this.status = 'stopped';
      this.childHealth.stopped();
      return this.snapshot();
    }

    this.status = 'stopping';
    try {
      await this.options.delivery?.stop();
    } finally {
      await this.runtime.stop(reason);
      this.status = 'stopped';
      this.childHealth.stopped();
    }
    return this.snapshot();
  }

  /** Wait for the owned delivery listener to stop or fail. */
  waitForDelivery(): Promise<void> {
    return this.options.delivery?.wait() ?? new Promise<void>(() => undefined);
  }

  /** Return the current immutable supervisor state. */
  snapshot(): SagaRuntimeSupervisorSnapshot {
    return Object.freeze({
      childHealth: this.childHealth.snapshot(),
      status: this.status,
      adapter: this.runtime?.adapter,
      definitionCount: this.definitions.length,
      failure: this.failure,
    });
  }

  /** Mark an unexpectedly completed delivery listener unhealthy. */
  private deliveryFailed(): void {
    if (this.status !== 'running') return;
    this.status = 'failed';
    this.childHealth.failed();
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

async function createDefaultRuntime(
  options: CreateSagaRuntimeOptions,
  projection?: SagaInstanceProjectionPort,
): Promise<SagaRuntime> {
  if (hasInjectedNativeEngine(options)) {
    return createSagaRuntime({
      ...options,
      adapter: 'native',
      native: withDefaultTelemetry(options.native),
    });
  }

  const native = withDefaultTelemetry(options.native);
  const kv = await openSagaRuntimeKv();
  await kv.get(['netscript', 'child-health', 'sagas']);
  const durable = await createDurableSagaRuntime({
    backend: 'kv',
    kv,
    projection,
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
