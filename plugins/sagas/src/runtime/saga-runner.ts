import {
  PrismaSagaStore,
  type PrismaSagaStoreClient,
  resolveSagaProjectionBackend,
  resolveSagaStoreBackend,
  SAGA_PROJECTION_BACKEND_ENV,
  SAGA_STORE_BACKEND_ENV,
  type SagaStoreBackendResolutionInput,
} from '@netscript/plugin-sagas-core/stores';
import { loadSagaRetention } from './load-saga-retention.ts';
import { KvPollingAdapter } from '@netscript/queue/adapters/kv-polling';
import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';
import { SagasError } from '@netscript/plugin-sagas-core/domain';
import type {
  CreateSagaRuntimeOptions,
  SagaRuntimeAdapter,
  SagaStorePort,
} from '@netscript/plugin-sagas-core/runtime';

import {
  SagaRuntimeSupervisor,
  type SagaRuntimeSupervisorOptions,
  type SagaRuntimeSupervisorSnapshot,
} from './saga-supervisor.ts';
import { createSagaTelemetry } from '@netscript/plugin-sagas-core/telemetry';
import { resolveProjectRegistryModule } from './project-registry-module.ts';
import {
  createSagaDeliveryQueue,
  type SagaDeliveryQueuePort,
  SagaQueueDelivery,
  SagaQueueScheduler,
} from './saga-delivery.ts';
import {
  CompositeSagaInstanceProjection,
  KvSagaInstanceProjection,
  PrismaSagaInstanceProjection,
  type PrismaSagaInstanceProjectionClient,
  type SagaInstanceProjectionPort,
} from './saga-instance-projection.ts';
import { getSagasStreamProducer, SagaStreamInstanceProjection } from '../../streams/producer.ts';

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
  cwd?: () => string;
  deliveryQueue?: SagaDeliveryQueuePort;
  /** Cancellable pending-message queue; defaults to KV polling for the production runner. */
  scheduledQueue?: SagaDeliveryQueuePort;
  projection?: SagaInstanceProjectionPort | false;
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
type SagaRunnerContext = Awaited<ReturnType<SagaRunnerBootstrap['createPluginServiceContext']>>;
type SagaRunnerBootstrap = Readonly<{
  createPluginServiceContext(pluginName: string): Promise<
    Readonly<{
      db: Readonly<{ getClient(): Promise<unknown> }>;
      env?: Readonly<Record<string, string | undefined>>;
      appsettings?: unknown;
      settings?: unknown;
      config?: unknown;
    }>
  >;
}>;

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
  const registryModule = resolveProjectRegistryModule({
    registryModule: options.registryModule,
    readEnv,
    cwd: options.cwd,
  });
  const importer = options.importer ?? defaultImporter;
  const bootstrapModule = readEnv('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
  let contextPromise: Promise<SagaRunnerContext> | undefined;
  const loadContext = (): Promise<SagaRunnerContext> | undefined => {
    if (!bootstrapModule) return undefined;
    return contextPromise ??= loadRunnerContext(bootstrapModule);
  };
  const store = options.supervisor?.createRuntime || options.runtimeOptions?.native?.engine
    ? options.runtimeOptions?.native?.store
    : options.runtimeOptions?.native?.store ?? await resolveCanonicalStore(readEnv, loadContext);
  const queue = options.deliveryQueue ?? createSagaDeliveryQueue();
  const queueScheduler = new SagaQueueScheduler(
    queue,
    options.scheduledQueue ??
      (options.deliveryQueue ? undefined : new KvPollingAdapter({ queueName: 'sagas-scheduled' })),
  );
  const scheduler = options.runtimeOptions?.native?.scheduler ?? queueScheduler;
  const delivery = options.supervisor?.delivery ?? new SagaQueueDelivery(
    queue,
    scheduler === queueScheduler ? queueScheduler : undefined,
  );
  const runtimeOptions = {
    ...options.runtimeOptions,
    native: {
      ...withDefaultTelemetry(options.runtimeOptions?.native),
      store,
      scheduler,
    },
    adapter,
  };
  const projection = options.supervisor?.projection ??
    await resolveProjection(options, readEnv, loadContext);
  const supervisor = new SagaRuntimeSupervisor({
    ...options.supervisor,
    loadDefinitions: () => loadSagaRegistryModule(registryModule, importer),
    runtimeOptions,
    delivery,
    projection,
  });
  await supervisor.start();
  return supervisor;
}

/** Start the saga runtime process and return its supervisor. */
export async function startSagaRuntime(
  options: StartSagaRunnerOptions = {},
): Promise<SagaRuntimeSupervisor> {
  return await startSagaRunner(options);
}

/** Run the saga runner until a shutdown signal is received. */
export async function runSagaRunner(
  options: RunSagaRunnerOptions = {},
): Promise<SagaRuntimeSupervisorSnapshot> {
  const supervisor = await startSagaRunner(options);
  try {
    const outcome = await Promise.race([
      waitForShutdownSignal(options.shutdownSignals ?? defaultShutdownSignals()).then((signal) =>
        Object.freeze({ kind: 'signal' as const, signal })
      ),
      supervisor.waitForDelivery().then(() => Object.freeze({ kind: 'delivery-stopped' as const })),
    ]);
    if (outcome.kind === 'delivery-stopped') {
      throw new Error('Saga delivery listener stopped before process shutdown.');
    }
    return await supervisor.stop(`signal:${outcome.signal}`);
  } catch (cause) {
    await supervisor.stop('saga-delivery-failed');
    throw cause;
  }
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

async function loadRunnerContext(specifier: string): Promise<SagaRunnerContext> {
  const imported = await import(specifier) as SagaRunnerBootstrap;
  return await imported.createPluginServiceContext('sagas');
}

function backendInput(
  readEnv: SagaRunnerEnvReader,
  context?: SagaRunnerContext,
): SagaStoreBackendResolutionInput {
  return {
    env: {
      [SAGA_STORE_BACKEND_ENV]: context?.env?.[SAGA_STORE_BACKEND_ENV] ??
        readEnv(SAGA_STORE_BACKEND_ENV),
      [SAGA_PROJECTION_BACKEND_ENV]: context?.env?.[SAGA_PROJECTION_BACKEND_ENV] ??
        readEnv(SAGA_PROJECTION_BACKEND_ENV),
    },
    appsettings: context?.appsettings ?? context?.settings ?? context?.config,
  };
}

async function resolveCanonicalStore(
  readEnv: SagaRunnerEnvReader,
  loadContext: () => Promise<SagaRunnerContext> | undefined,
): Promise<SagaStorePort | undefined> {
  const context = await loadContext();
  const backend = resolveSagaStoreBackend(backendInput(readEnv, context));
  if (backend === 'kv') return undefined;
  if (!context) {
    throw new Error('Prisma saga store backend requires a plugin service bootstrap module.');
  }
  const client = await context.db.getClient();
  if (!isCanonicalStoreClient(client)) {
    throw new Error('Sagas database client is missing required Prisma runtime delegates.');
  }
  return new PrismaSagaStore({ prisma: client });
}

function isCanonicalStoreClient(candidate: unknown): candidate is PrismaSagaStoreClient {
  return isRecord(candidate) && typeof candidate.$transaction === 'function' &&
    hasDelegateMethods(candidate.sagaRuntimeState, [
      'findUnique',
      'findMany',
      'create',
      'upsert',
      'updateMany',
      'deleteMany',
    ]) &&
    hasDelegateMethods(candidate.sagaRuntimeTransition, ['findMany', 'create', 'deleteMany']) &&
    hasDelegateMethods(candidate.sagaRuntimeCorrelation, ['findUnique', 'upsert', 'deleteMany']);
}

function hasDelegateMethods(candidate: unknown, methods: readonly string[]): boolean {
  return isRecord(candidate) && methods.every((method) => typeof candidate[method] === 'function');
}

async function resolveProjection(
  options: StartSagaRunnerOptions,
  readEnv: SagaRunnerEnvReader,
  loadContext: () => Promise<SagaRunnerContext> | undefined,
): Promise<SagaInstanceProjectionPort | undefined> {
  if (options.projection === false) {
    return undefined;
  }
  if (options.projection) {
    return options.projection;
  }
  const bootstrapModule = readEnv('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
  if (!bootstrapModule) {
    const backend = resolveSagaProjectionBackend(backendInput(readEnv));
    if (backend === 'none') return undefined;
    if (backend === 'prisma') {
      throw new Error('Prisma saga projection requires a plugin service bootstrap module.');
    }
    const retention = await loadSagaRetention();
    if (retention.requiresDatabaseArchive) {
      throw new Error('Saga database archive requires a plugin service bootstrap module.');
    }
    return withStreamProjection(new KvSagaInstanceProjection(undefined, retention.completedDays));
  }
  const context = await loadContext()!;
  const retention = await loadSagaRetention();
  const projectionBackend = resolveSagaProjectionBackend(backendInput(readEnv, context));
  if (projectionBackend === 'none') return undefined;
  const kvProjection = new KvSagaInstanceProjection(undefined, retention.completedDays);
  if (projectionBackend === 'kv' && !retention.requiresDatabaseArchive) {
    return withStreamProjection(kvProjection);
  }
  const client = await context.db.getClient();
  if (!isProjectionClient(client)) {
    throw new Error('Sagas database client is missing required Prisma delegates.');
  }
  const readModelProjection = new CompositeSagaInstanceProjection([
    kvProjection,
    new PrismaSagaInstanceProjection(client, retention.archiveToDb, projectionBackend),
  ]);
  return withStreamProjection(readModelProjection);
}

function withStreamProjection(
  readModelProjection: SagaInstanceProjectionPort,
): SagaInstanceProjectionPort {
  let streamProjection: SagaStreamInstanceProjection;
  try {
    streamProjection = new SagaStreamInstanceProjection(getSagasStreamProducer());
  } catch (cause) {
    console.warn('[Sagas Runner] Durable stream projection unavailable:', cause);
    return readModelProjection;
  }
  return new CompositeSagaInstanceProjection([
    readModelProjection,
    streamProjection,
  ]);
}

function isProjectionClient(
  candidate: unknown,
): candidate is PrismaSagaInstanceProjectionClient {
  if (!isRecord(candidate)) {
    return false;
  }
  const sagaInstance = candidate.sagaInstance;
  return isRecord(sagaInstance) && typeof sagaInstance.upsert === 'function';
}

function withDefaultTelemetry(
  native: CreateSagaRuntimeOptions['native'],
): NonNullable<CreateSagaRuntimeOptions['native']> {
  return {
    ...native,
    instrumentation: native?.instrumentation ?? createSagaTelemetry(),
  };
}

function parseAdapter(value: string | undefined): SagaRuntimeAdapter | undefined {
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  if (value === 'native') {
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
