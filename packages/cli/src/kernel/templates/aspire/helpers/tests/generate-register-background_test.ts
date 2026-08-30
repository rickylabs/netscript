/**
 * @module templates/aspire/helpers/generate-register-background_test
 *
 * Executes the emitted background-registration helper against narrow Aspire
 * doubles so declared service and plugin reference behavior is tested at the
 * generated-module boundary.
 */

import { assert, assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { toFileUrl } from 'jsr:@std/path@^1';
import type { BackgroundProcessorEntry, NetScriptConfig } from '@netscript/aspire/types';
import { createServerServiceEnvKey } from '../../../../../../../sdk/src/discovery/service-url.ts';
import { generateRegisterBackground } from '../register/generate-register-background.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { EMPTY_CONFIG, MINIMAL_DENO_DEFAULTS } from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const PROCESSOR_NAME = 'notifications';
const REFERENCE_NAME = 'workers-api';
const REFERENCE_ENDPOINT = 'http://127.0.0.1:43123';
const DISCOVERY_KEY = 'services__workers-api__http__0';
const SOURCE_SAFE_NAMES = [
  "it's",
  String.raw`back\slash`,
  'tick`name',
  'workers-api',
  'workers_api',
  'workers',
  'class',
  'await',
  'builder',
] as const;

interface EndpointResource {
  getEndpoint(name: string): Promise<string | undefined>;
}

interface RecordingResource extends EndpointResource {
  readonly environment: Array<readonly [string, unknown]>;
  withEnvironment(key: string, value: unknown): Promise<RecordingResource>;
}

interface RecordingBuilder {
  readonly registrations: string[];
  addExecutable(
    name: string,
    command: string,
    workdir: string,
    args: string[],
  ): RecordingResource;
}

interface GeneratedBackgroundModule {
  registerBackgroundProcessors(
    builder: RecordingBuilder,
    config: NetScriptConfig,
    infrastructure: Record<string, never>,
    services: Map<string, EndpointResource>,
    plugins: Map<string, EndpointResource>,
    appHostDir: string,
  ): Promise<Map<string, RecordingResource>>;
}

function backgroundEntry(
  references: Pick<BackgroundProcessorEntry, 'ServiceReferences' | 'PluginReferences'>,
): BackgroundProcessorEntry {
  return {
    Enabled: true,
    Runtime: 'deno',
    Entrypoint: 'bin/notifications.ts',
    Telemetry: false,
    WatchMode: false,
    RequiresDb: false,
    RequiresKv: false,
    ...references,
  };
}

function configForProcessors(
  processors: Record<string, BackgroundProcessorEntry>,
): NetScriptConfig {
  return {
    ...EMPTY_CONFIG,
    BackgroundProcessors: processors,
  };
}

function configFor(entry: BackgroundProcessorEntry): NetScriptConfig {
  return configForProcessors({ [PROCESSOR_NAME]: entry });
}

function endpointResource(endpoint: string | undefined): EndpointResource {
  return {
    getEndpoint: (_name: string): Promise<string | undefined> => Promise.resolve(endpoint),
  };
}

function createRecordingBuilder(): RecordingBuilder {
  const registrations: string[] = [];
  return {
    registrations,
    addExecutable(name: string): RecordingResource {
      registrations.push(name);
      const environment: Array<readonly [string, unknown]> = [];
      return {
        environment,
        getEndpoint: (_endpointName: string): Promise<string | undefined> =>
          Promise.resolve(undefined),
        withEnvironment(key: string, value: unknown): Promise<RecordingResource> {
          environment.push([key, value]);
          return Promise.resolve(this);
        },
      };
    },
  };
}

function isGeneratedBackgroundModule(value: unknown): value is GeneratedBackgroundModule {
  return typeof value === 'object' && value !== null &&
    'registerBackgroundProcessors' in value &&
    typeof value.registerBackgroundProcessors === 'function';
}

async function loadGeneratedModule(
  processors: Record<string, BackgroundProcessorEntry>,
): Promise<{ module: GeneratedBackgroundModule; dispose: () => Promise<void> }> {
  const root = await Deno.makeTempDir({ prefix: 'ns-1371-background-' });
  const helpersDir = `${root}/.helpers`;
  const sdkDir = `${root}/.aspire/modules`;
  await Deno.mkdir(helpersDir, { recursive: true });
  await Deno.mkdir(sdkDir, { recursive: true });

  await Deno.writeTextFile(
    `${sdkDir}/aspire.mts`,
    [
      `export const OtlpProtocol = { HttpProtobuf: 'http/protobuf' } as const;`,
      `export interface ExecutableResource {`,
      `  getEndpoint(name: string): Promise<string | undefined>;`,
      `  withEnvironment(key: string, value: unknown): Promise<ExecutableResource>;`,
      `}`,
      `export interface DistributedApplicationBuilder {`,
      `  addExecutable(name: string, command: string, workdir: string, args: string[]): ExecutableResource;`,
      `}`,
      ``,
    ].join('\n'),
  );
  await Deno.writeTextFile(
    `${helpersDir}/_aspire-compat.mts`,
    [
      `export function buildDatabaseUriEnvKey(): undefined { return undefined; }`,
      `export function buildDatabaseProviderEnvVars(): Record<string, string> { return {}; }`,
      `export function buildSqliteDatabaseUrl(): string { return 'file:unused'; }`,
      `export function buildOtelEnvVars(): Record<string, string> { return {}; }`,
      `export function resolvePermissions(): string[] { return []; }`,
      `export function resolveWorkspacePath(root: string, relative: string): string { return root + '/' + relative; }`,
      `export async function withCacheReference<T>(resource: T): Promise<T> { return await Promise.resolve(resource); }`,
      ``,
    ].join('\n'),
  );
  await Deno.writeTextFile(
    `${helpersDir}/register-infrastructure.mts`,
    `export interface InfrastructureContext {}\n`,
  );

  const generatedPath = `${helpersDir}/register-background.mts`;
  await Deno.writeTextFile(
    generatedPath,
    generateRegisterBackground({
      processors,
      version: EMPTY_CONFIG.Version,
      denoDefaults: MINIMAL_DENO_DEFAULTS,
    }),
  );

  try {
    const namespace: unknown = await import(toFileUrl(generatedPath).href);
    assert(
      isGeneratedBackgroundModule(namespace),
      'the generated helper did not export registerBackgroundProcessors',
    );
    return {
      module: namespace,
      dispose: () => Deno.remove(root, { recursive: true }),
    };
  } catch (error) {
    await Deno.remove(root, { recursive: true });
    throw error;
  }
}

async function runGeneratedRegistration(
  entry: BackgroundProcessorEntry,
  services: Map<string, EndpointResource>,
  plugins: Map<string, EndpointResource>,
  builder: RecordingBuilder,
): Promise<Map<string, RecordingResource>> {
  const loaded = await loadGeneratedModule({ [PROCESSOR_NAME]: entry });
  try {
    return await loaded.module.registerBackgroundProcessors(
      builder,
      configFor(entry),
      {},
      services,
      plugins,
      '/apphost',
    );
  } finally {
    await loaded.dispose();
  }
}

async function assertGeneratedModuleLoads(
  processors: Record<string, BackgroundProcessorEntry>,
): Promise<void> {
  const loaded = await loadGeneratedModule(processors);
  await loaded.dispose();
}

function configurationError(kind: 'service' | 'plugin'): string {
  return `Background processor configuration error: '${PROCESSOR_NAME}' could not resolve ${kind} reference '${REFERENCE_NAME}' HTTP endpoint.`;
}

function assignedValue(resource: RecordingResource, key: string): unknown {
  return resource.environment.find(([candidate]) => candidate === key)?.[1];
}

describe('generateRegisterBackground declared references (#1371)', () => {
  it('emits parseable source for every required processor-name spelling', async () => {
    await assertGeneratedModuleLoads(
      Object.fromEntries(SOURCE_SAFE_NAMES.map((name) => [name, backgroundEntry({})])),
    );
  });

  for (const kind of ['service', 'plugin'] as const) {
    it(`emits parseable source for every required ${kind}-reference spelling`, async () => {
      await assertGeneratedModuleLoads({
        [PROCESSOR_NAME]: backgroundEntry(
          kind === 'service'
            ? { ServiceReferences: [...SOURCE_SAFE_NAMES] }
            : { PluginReferences: [...SOURCE_SAFE_NAMES] },
        ),
      });
    });
  }

  it('parses and executes platform-valid reserved and generator-binding names', async () => {
    const names = ['class', 'await', 'builder'] as const;
    const processors = Object.fromEntries(names.map((name) => [name, backgroundEntry({})]));
    const loaded = await loadGeneratedModule(processors);
    const builder = createRecordingBuilder();
    try {
      const registered = await loaded.module.registerBackgroundProcessors(
        builder,
        configForProcessors(processors),
        {},
        new Map(),
        new Map(),
        '/apphost',
      );
      assertEquals(builder.registrations, [...names]);
      assertEquals([...registered.keys()], [...names]);
    } finally {
      await loaded.dispose();
    }
  });

  it('keeps U+2028 processor text out of generated comment syntax', async () => {
    await assertGeneratedModuleLoads({
      ['line\u2028separator']: backgroundEntry({}),
    });
  });

  it('stringifies user-supplied entrypoint, workdir, and concurrency env key literals', async () => {
    await assertGeneratedModuleLoads({
      [PROCESSOR_NAME]: {
        ...backgroundEntry({}),
        Entrypoint: String.raw`bin/it's\worker.ts`,
        Workdir: String.raw`work\it's`,
        Concurrency: 2,
        ConcurrencyEnvVar: String.raw`WORK'\KEY`,
      },
    });
  });

  it('pins the raw hyphenated emitted key to the SDK consumer-read key for both kinds', () => {
    const output = generateRegisterBackground({
      processors: {
        [PROCESSOR_NAME]: backgroundEntry({
          ServiceReferences: [REFERENCE_NAME],
          PluginReferences: [REFERENCE_NAME],
        }),
      },
      version: EMPTY_CONFIG.Version,
      denoDefaults: MINIMAL_DENO_DEFAULTS,
    });

    assertEquals(createServerServiceEnvKey(REFERENCE_NAME), DISCOVERY_KEY);
    assertEquals(
      output.split(`withEnvironment("${DISCOVERY_KEY}"`).length - 1,
      2,
      'service and plugin references must emit the same raw consumer-read key',
    );
    assert(!output.includes('services__workers_api__http__0'));
  });

  it('sets the service endpoint env var and returns the registered processor', async () => {
    const entry = backgroundEntry({ ServiceReferences: [REFERENCE_NAME] });
    const builder = createRecordingBuilder();
    const processors = await runGeneratedRegistration(
      entry,
      new Map([[REFERENCE_NAME, endpointResource(REFERENCE_ENDPOINT)]]),
      new Map(),
      builder,
    );

    assertEquals(builder.registrations, [PROCESSOR_NAME]);
    const processor = processors.get(PROCESSOR_NAME);
    assert(processor);
    assertEquals(assignedValue(processor, DISCOVERY_KEY), REFERENCE_ENDPOINT);
  });

  it('sets the plugin endpoint env var and returns the registered processor', async () => {
    const entry = backgroundEntry({ PluginReferences: [REFERENCE_NAME] });
    const builder = createRecordingBuilder();
    const processors = await runGeneratedRegistration(
      entry,
      new Map(),
      new Map([[REFERENCE_NAME, endpointResource(REFERENCE_ENDPOINT)]]),
      builder,
    );

    assertEquals(builder.registrations, [PROCESSOR_NAME]);
    const processor = processors.get(PROCESSOR_NAME);
    assert(processor);
    assertEquals(assignedValue(processor, DISCOVERY_KEY), REFERENCE_ENDPOINT);
  });

  for (const kind of ['service', 'plugin'] as const) {
    it(`throws before registration when the declared ${kind} resource is missing`, async () => {
      const entry = backgroundEntry(
        kind === 'service'
          ? { ServiceReferences: [REFERENCE_NAME] }
          : { PluginReferences: [REFERENCE_NAME] },
      );
      const builder = createRecordingBuilder();

      const error = await assertRejects(
        () => runGeneratedRegistration(entry, new Map(), new Map(), builder),
        Error,
      );
      assertEquals(error.message, configurationError(kind));
      assertEquals(
        builder.registrations,
        [],
        'addExecutable must not run before reference preflight',
      );
    });

    it(`throws the same error before registration when the ${kind} HTTP endpoint is unresolved`, async () => {
      const entry = backgroundEntry(
        kind === 'service'
          ? { ServiceReferences: [REFERENCE_NAME] }
          : { PluginReferences: [REFERENCE_NAME] },
      );
      const builder = createRecordingBuilder();
      const unresolved = new Map([[REFERENCE_NAME, endpointResource(undefined)]]);

      const error = await assertRejects(
        () =>
          runGeneratedRegistration(
            entry,
            kind === 'service' ? unresolved : new Map(),
            kind === 'plugin' ? unresolved : new Map(),
            builder,
          ),
        Error,
      );
      assertEquals(error.message, configurationError(kind));
      assertEquals(
        builder.registrations,
        [],
        'addExecutable must not run before endpoint preflight',
      );
    });
  }

  it('emits both reference preflights before addExecutable', () => {
    const output = generateRegisterBackground({
      processors: {
        [PROCESSOR_NAME]: backgroundEntry({
          ServiceReferences: [REFERENCE_NAME],
          PluginReferences: [REFERENCE_NAME],
        }),
      },
      version: EMPTY_CONFIG.Version,
      denoDefaults: MINIMAL_DENO_DEFAULTS,
    });
    const registration = output.indexOf(`builder.addExecutable("${PROCESSOR_NAME}"`);

    const serviceError = configurationError('service');
    const pluginError = configurationError('plugin');
    assertStringIncludes(output, serviceError);
    assertStringIncludes(output, pluginError);
    assert(output.indexOf(serviceError) < registration);
    assert(output.indexOf(pluginError) < registration);
  });
});
