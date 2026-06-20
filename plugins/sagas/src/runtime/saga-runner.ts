import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';
import { SagasError } from '@netscript/plugin-sagas-core/domain';
import type {
  CreateSagaRuntimeOptions,
  SagaRuntimeAdapter,
} from '@netscript/plugin-sagas-core/runtime';

import {
  SagaRuntimeSupervisor,
  type SagaRuntimeSupervisorOptions,
  type SagaRuntimeSupervisorSnapshot,
} from './saga-supervisor.ts';
import { createSagaTelemetry } from '../telemetry/otel-saga-tracer.ts';

/** Module importer boundary used by the runtime registry loader. */
export type SagaRuntimeModuleImporter = (specifier: string) => Promise<unknown>;

/** Environment lookup boundary used by the runtime runner. */
export type SagaRunnerEnvReader = (name: string) => string | undefined;

/** Options for starting the plugin-layer saga runner. */
export type StartSagaRunnerOptions = Readonly<{
  adapter?: SagaRuntimeAdapter;
  registryModule?: string;
  importer?: SagaRuntimeModuleImporter;
  readEnv?: SagaRunnerEnvReader;
  supervisor?: Omit<SagaRuntimeSupervisorOptions, 'loadDefinitions' | 'runtimeOptions'>;
  runtimeOptions?: Omit<CreateSagaRuntimeOptions, 'adapter'>;
}>;

/** Options for running the executable saga runner process. */
export type RunSagaRunnerOptions =
  & StartSagaRunnerOptions
  & Readonly<{
    shutdownSignals?: readonly Deno.Signal[];
  }>;

type SagaRegistryModule = Readonly<Record<string, unknown>>;

const DEFAULT_REGISTRY_MODULE = '../../../../.netscript/generated/plugin-sagas/sagas.registry.ts';
const DEFAULT_POSIX_SHUTDOWN_SIGNALS = [
  'SIGINT',
  'SIGTERM',
] as const satisfies readonly Deno.Signal[];
const DEFAULT_WINDOWS_SHUTDOWN_SIGNALS = [
  'SIGINT',
  'SIGBREAK',
] as const satisfies readonly Deno.Signal[];

if (import.meta.main) {
  await runSagaRunner();
}

/** Start the saga runner process and return its supervisor. */
export async function startSagaRunner(
  options: StartSagaRunnerOptions = {},
): Promise<SagaRuntimeSupervisor> {
  const readEnv = options.readEnv ?? ((name: string): string | undefined => Deno.env.get(name));
  const adapter = options.adapter ?? parseAdapter(readEnv('SAGAS_ADAPTER'));
  const registryModule = options.registryModule ?? readEnv('SAGAS_REGISTRY_MODULE') ??
    DEFAULT_REGISTRY_MODULE;
  const importer = options.importer ?? defaultImporter;
  const runtimeOptions = adapter === 'legacy' ? { ...options.runtimeOptions, adapter } : {
    ...options.runtimeOptions,
    native: withDefaultTelemetry(options.runtimeOptions?.native),
    adapter,
  };
  const supervisor = new SagaRuntimeSupervisor({
    ...options.supervisor,
    loadDefinitions: () => loadSagaRegistryModule(resolveModuleSpecifier(registryModule), importer),
    runtimeOptions,
  });
  await supervisor.start();
  return supervisor;
}

/** Run the saga runner until a shutdown signal is received. */
export async function runSagaRunner(
  options: RunSagaRunnerOptions = {},
): Promise<SagaRuntimeSupervisorSnapshot> {
  const supervisor = await startSagaRunner(options);
  const signal = await waitForShutdownSignal(options.shutdownSignals ?? defaultShutdownSignals());
  return await supervisor.stop(`signal:${signal}`);
}

/** Load saga definitions from the generated static registry module. */
export async function loadSagaRegistryModule(
  specifier: string,
  importer: SagaRuntimeModuleImporter = defaultImporter,
): Promise<readonly SagaDefinition[]> {
  const registryModule = asRegistryModule(await importer(specifier), specifier);
  return resolveDefinitions(
    registryModule.sagaRegistry ??
      registryModule.registry ??
      registryModule.definitions ??
      registryModule.default,
    specifier,
  );
}

function defaultImporter(specifier: string): Promise<unknown> {
  return import(specifier) as Promise<unknown>;
}

function withDefaultTelemetry(
  native: CreateSagaRuntimeOptions['native'],
): NonNullable<CreateSagaRuntimeOptions['native']> {
  return {
    ...native,
    instrumentation: native?.instrumentation ?? createSagaTelemetry(),
  };
}

function resolveModuleSpecifier(specifier: string): string {
  return specifier.startsWith('.') ? new URL(specifier, import.meta.url).href : specifier;
}

function parseAdapter(value: string | undefined): SagaRuntimeAdapter | undefined {
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  if (value === 'native' || value === 'legacy') {
    return value;
  }
  throw SagasError.validationFailed(`Unsupported SAGAS_ADAPTER value: ${value}.`);
}

function asRegistryModule(value: unknown, specifier: string): SagaRegistryModule {
  if (isRecord(value)) {
    return value;
  }
  throw SagasError.validationFailed(`Saga registry module ${specifier} did not load as an object.`);
}

function resolveDefinitions(candidate: unknown, specifier: string): readonly SagaDefinition[] {
  if (candidate instanceof Map) {
    return Object.freeze(
      [...candidate.values()].map((definition) => asSagaDefinition(definition, specifier)),
    );
  }
  if (Array.isArray(candidate)) {
    return Object.freeze(candidate.map((definition) => asSagaDefinition(definition, specifier)));
  }
  throw SagasError.validationFailed(
    `Saga registry module ${specifier} must export sagaRegistry, registry, definitions, or default.`,
  );
}

function asSagaDefinition(candidate: unknown, specifier: string): SagaDefinition {
  if (isSagaDefinition(candidate)) {
    return candidate;
  }
  throw SagasError.validationFailed(
    `Saga registry module ${specifier} contains a non-SagaDefinition entry.`,
  );
}

function isSagaDefinition(candidate: unknown): candidate is SagaDefinition {
  if (!isRecord(candidate)) {
    return false;
  }
  return typeof candidate.id === 'string' &&
    typeof candidate.durability === 'string' &&
    isRecord(candidate.initialState) &&
    Array.isArray(candidate.handledMessageTypes) &&
    candidate.handlers instanceof Map;
}

function waitForShutdownSignal(signals: readonly Deno.Signal[]): Promise<Deno.Signal> {
  const controller = new AbortController();
  return Promise.race(signals.map((signal) => waitForSignal(signal, controller)));
}

function defaultShutdownSignals(): readonly Deno.Signal[] {
  return Deno.build.os === 'windows'
    ? DEFAULT_WINDOWS_SHUTDOWN_SIGNALS
    : DEFAULT_POSIX_SHUTDOWN_SIGNALS;
}

function waitForSignal(signal: Deno.Signal, controller: AbortController): Promise<Deno.Signal> {
  return new Promise((resolve) => {
    const listener = (): void => {
      controller.abort();
      resolve(signal);
    };
    controller.signal.addEventListener(
      'abort',
      () => Deno.removeSignalListener(signal, listener),
      { once: true },
    );
    Deno.addSignalListener(signal, listener);
  });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
