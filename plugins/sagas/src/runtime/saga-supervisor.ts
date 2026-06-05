import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';
import {
  createSagaRuntime,
  type CreateSagaRuntimeOptions,
  type SagaRuntime,
  type SagaRuntimeAdapter,
} from '@netscript/plugin-sagas-core/runtime';

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
export type SagaRuntimeFactory = (options: CreateSagaRuntimeOptions) => SagaRuntime;

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

  readonly options: SagaRuntimeSupervisorOptions;

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
      const runtime = (this.options.createRuntime ?? createDefaultRuntime)(
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

function createDefaultRuntime(options: CreateSagaRuntimeOptions): SagaRuntime {
  return options.adapter === 'legacy'
    ? createSagaRuntime({ ...options, adapter: 'legacy' })
    : createSagaRuntime({ ...options, adapter: 'native' });
}
