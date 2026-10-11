import {
  isPrismaSagaStoreClient,
  PrismaSagaStore,
  resolveSagaProjectionBackend,
  resolveSagaStoreBackend,
  SAGA_PROJECTION_BACKEND_ENV,
  SAGA_STORE_BACKEND_ENV,
  type SagaStoreBackendResolutionInput,
} from '@netscript/plugin-sagas-core/stores';
import { SCAFFOLD_FILES } from '@netscript/config/paths';
import { SAGAS_PLUGIN_ID } from '../constants.ts';
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
import { projectFileUrl, resolveProjectRegistryModule } from './project-registry-module.ts';
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
type SagaRunnerConfiguration = Readonly<{
  context?: SagaRunnerContext;
  input: SagaStoreBackendResolutionInput;
}>;
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
  let configurationPromise: Promise<SagaRunnerConfiguration> | undefined;
  const loadConfiguration = (): Promise<SagaRunnerConfiguration> => {
    return configurationPromise ??= resolveRunnerConfiguration(options, readEnv, bootstrapModule);
  };
  const store = options.supervisor?.createRuntime || options.runtimeOptions?.native?.engine
    ? options.runtimeOptions?.native?.store
    : options.runtimeOptions?.native?.store ??
      await resolveCanonicalStore(await loadConfiguration());
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
    (options.projection === false
      ? undefined
      : options.projection ?? await resolveProjection(await loadConfiguration()));
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

async function resolveRunnerConfiguration(
  options: StartSagaRunnerOptions,
  readEnv: SagaRunnerEnvReader,
  bootstrapModule?: string,
): Promise<SagaRunnerConfiguration> {
  const context = bootstrapModule ? await loadRunnerContext(bootstrapModule) : undefined;
  const appsettings = context
    ? context.appsettings ?? context.settings ?? context.config
    : await loadProjectAppsettings(
      readEnv('NETSCRIPT_PROJECT_ROOT') ?? (options.cwd ?? Deno.cwd)(),
    );
  return { context, input: backendInput(readEnv, context, appsettings) };
}

async function loadProjectAppsettings(projectRoot: string): Promise<unknown> {
  let document: unknown;
  try {
    document = JSON.parse(
      await Deno.readTextFile(projectFileUrl(SCAFFOLD_FILES.APPSETTINGS, projectRoot)),
    );
  } catch (cause) {
    if (cause instanceof Deno.errors.NotFound) return undefined;
    throw cause;
  }
  // Install-owned processor settings take precedence over project-wide saga settings.
  if (
    isRecord(document) && isRecord(document.NetScript) &&
    isRecord(document.NetScript.BackgroundProcessors)
  ) {
    const processor = document.NetScript.BackgroundProcessors[SAGAS_PLUGIN_ID];
    if (isRecord(processor)) return { ...document, ...processor };
  }
  return document;
}

function backendInput(
  readEnv: SagaRunnerEnvReader,
  context?: SagaRunnerContext,
  appsettings?: unknown,
): SagaStoreBackendResolutionInput {
  return {
    env: {
      [SAGA_STORE_BACKEND_ENV]: context?.env?.[SAGA_STORE_BACKEND_ENV] ??
        readEnv(SAGA_STORE_BACKEND_ENV),
      [SAGA_PROJECTION_BACKEND_ENV]: context?.env?.[SAGA_PROJECTION_BACKEND_ENV] ??
        readEnv(SAGA_PROJECTION_BACKEND_ENV),
    },
    appsettings,
  };
}

async function resolveCanonicalStore(
  { context, input }: SagaRunnerConfiguration,
): Promise<SagaStorePort | undefined> {
  const backend = resolveSagaStoreBackend({ ...input, defaultBackend: 'kv' });
  if (backend === 'kv') return undefined;
  if (!context) {
    throw new Error('Prisma saga store backend requires a plugin service bootstrap module.');
  }
  const client = await context.db.getClient();
  if (!isPrismaSagaStoreClient(client)) {
    throw new Error('Sagas database client is missing required Prisma runtime delegates.');
  }
  return new PrismaSagaStore({ prisma: client });
}

async function resolveProjection(
  { context, input }: SagaRunnerConfiguration,
): Promise<SagaInstanceProjectionPort | undefined> {
  const projectionBackend = resolveSagaProjectionBackend(input);
  if (projectionBackend === 'none') return undefined;
  const retention = await loadSagaRetention();
  const kvProjection = new KvSagaInstanceProjection(undefined, retention.completedDays);
  if (projectionBackend === 'kv' && !retention.requiresDatabaseArchive) {
    return withStreamProjection(kvProjection);
  }
  if (!context) {
    throw new Error(
      projectionBackend === 'prisma'
        ? 'Prisma saga projection requires a plugin service bootstrap module.'
        : 'Saga database archive requires a plugin service bootstrap module.',
    );
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
