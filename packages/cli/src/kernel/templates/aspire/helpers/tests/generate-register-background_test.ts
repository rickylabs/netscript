/**
 * @module templates/aspire/helpers/generate-register-background_test
 *
 * Executes the emitted background-registration helper against narrow Aspire
 * doubles so declared service and plugin reference behavior is tested at the
 * generated-module boundary.
 */

import { assert, assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { fromFileUrl, join, toFileUrl } from 'jsr:@std/path@^1';
import {
  CHILD_CRASH_LOOP_THRESHOLD,
  ChildHealthMonitor,
  childHealthResponse,
} from '@netscript/plugin/health';
import { buildBackgroundProcessorEntry } from '../../../../adapters/plugin/appsettings-entry-builders.ts';
import { DenoFileSystem } from '../../../../adapters/runtime/file-system/deno-file-system.ts';
import { PluginKindRegistry } from '../../../../application/registries/plugin-kind-registry.ts';
import { resolveLocalPluginDescriptor } from '../../../../../public/features/plugins/install/install-plugin.ts';
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
  'class',
  'await',
  'function',
  'const',
  'line\u2028separator',
] as const;

interface EndpointResource {
  getEndpoint(name: string): Promise<string | undefined>;
}

interface RecordingResource extends EndpointResource {
  readonly environment: Array<readonly [string, unknown]>;
  readonly probes: Array<{ path: string; endpointName: string }>;
  withHttpEndpoint(options: { env: string }): Promise<RecordingResource>;
  withHttpHealthCheck(
    options: { path: string; endpointName: string },
  ): Promise<RecordingResource>;
  withOtlpExporter(options: unknown): Promise<RecordingResource>;
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
  references: Pick<
    BackgroundProcessorEntry,
    'ServiceReferences' | 'PluginReferences'
  >,
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

function createRecordingBuilder(endpoint?: string): RecordingBuilder {
  const registrations: string[] = [];
  return {
    registrations,
    addExecutable(name: string): RecordingResource {
      registrations.push(name);
      const environment: Array<readonly [string, unknown]> = [];
      let endpointRegistered = false;
      const probes: Array<{ path: string; endpointName: string }> = [];
      return {
        environment,
        probes,
        withHttpEndpoint(options): Promise<RecordingResource> {
          assertEquals(options, { env: 'PORT' });
          endpointRegistered = true;
          return Promise.resolve(this);
        },
        withHttpHealthCheck(options): Promise<RecordingResource> {
          assert(endpointRegistered, 'probe must follow its endpoint');
          probes.push(options);
          return Promise.resolve(this);
        },
        withOtlpExporter(): Promise<RecordingResource> {
          return Promise.resolve(this);
        },
        getEndpoint: (_endpointName: string): Promise<string | undefined> =>
          Promise.resolve(endpointRegistered ? endpoint : undefined),
        withEnvironment(
          key: string,
          value: unknown,
        ): Promise<RecordingResource> {
          environment.push([key, value]);
          return Promise.resolve(this);
        },
      };
    },
  };
}

function isGeneratedBackgroundModule(
  value: unknown,
): value is GeneratedBackgroundModule {
  return typeof value === 'object' && value !== null &&
    'registerBackgroundProcessors' in value &&
    typeof value.registerBackgroundProcessors === 'function';
}

async function loadGeneratedModule(
  processors: Record<string, BackgroundProcessorEntry>,
): Promise<
  { module: GeneratedBackgroundModule; dispose: () => Promise<void> }
> {
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
  it('parses every source-sensitive processor-name spelling', async () => {
    await assertGeneratedModuleLoads(
      Object.fromEntries(
        SOURCE_SAFE_NAMES.map((name) => [name, backgroundEntry({})]),
      ),
    );
  });

  it('parses and executes reserved and normalization-collision processor names', async () => {
    const names = [
      'class',
      'await',
      'function',
      'const',
      'workers-api',
      'workers_api',
    ] as const;
    const processors = Object.fromEntries(
      names.map((name) => [name, backgroundEntry({})]),
    );
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

  it('parses quote, backslash, and backtick entry literals', async () => {
    await assertGeneratedModuleLoads({
      [PROCESSOR_NAME]: {
        ...backgroundEntry({}),
        Entrypoint: String.raw`bin/it's\`worker.ts`,
        Workdir: String.raw`work\it's\`dir`,
        Concurrency: 2,
        ConcurrencyEnvVar: String.raw`WORK'\KEY\`TICK`,
      },
    });
  });

  for (const kind of ['service', 'plugin'] as const) {
    it(`parses every source-sensitive ${kind} reference spelling`, async () => {
      await assertGeneratedModuleLoads({
        [PROCESSOR_NAME]: backgroundEntry(
          kind === 'service'
            ? { ServiceReferences: [...SOURCE_SAFE_NAMES] }
            : { PluginReferences: [...SOURCE_SAFE_NAMES] },
        ),
      });
    });
  }

  it('JSON-stringifies every processor-name literal site', () => {
    const name = 'quoted"processor';
    const quotedName = JSON.stringify(name);
    const output = generateRegisterBackground({
      processors: { [name]: { ...backgroundEntry({}), Telemetry: true } },
      version: EMPTY_CONFIG.Version,
      denoDefaults: MINIMAL_DENO_DEFAULTS,
    });

    assertStringIncludes(output, `config.BackgroundProcessors[${quotedName}]`);
    assertStringIncludes(output, `builder.addExecutable(${quotedName}`);
    assertStringIncludes(output, `buildOtelEnvVars(${quotedName}`);
    assertStringIncludes(output, `backgroundProcessors.set(${quotedName}`);
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
      const unresolved = new Map([[
        REFERENCE_NAME,
        endpointResource(undefined),
      ]]);

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
    const registration = output.indexOf(
      `builder.addExecutable("${PROCESSOR_NAME}"`,
    );

    const serviceError = configurationError('service');
    const pluginError = configurationError('plugin');
    assertStringIncludes(output, serviceError);
    assertStringIncludes(output, pluginError);
    assert(output.indexOf(serviceError) < registration);
    assert(output.indexOf(pluginError) < registration);
  });
});

describe('generated background child probes (#1366)', () => {
  for (const pluginName of ['workers', 'sagas', 'triggers']) {
    it(`probes ${pluginName} child registry/dependency failures, restart storms and shutdown`, async () => {
      const registry = new PluginKindRegistry([]);
      const pluginsRoot = fromFileUrl(
        new URL('../../../../../../../../plugins/', import.meta.url),
      );
      const descriptor = await resolveLocalPluginDescriptor(
        join(pluginsRoot, pluginName),
        registry,
        new DenoFileSystem(),
      );
      assert(descriptor.planningKind);
      const provider = registry.get(descriptor.planningKind);
      const entry = buildBackgroundProcessorEntry(
        {
          scaffoldResult: {
            filesCreated: [],
            directoriesCreated: [],
            filesSkipped: [],
            totalOperations: 0,
            durationMs: 0,
          },
          pluginDir: `plugins/${pluginName}`,
          kind: provider.kind,
          port: 0,
          servicePort: 0,
          configSection: 'BackgroundProcessors',
          configKey: pluginName,
          serviceConfigKey: `${pluginName}-api`,
          backgroundWorkdir: '.',
        },
        provider,
        {},
      );
      // The shipped manifest capability is the production generator input.
      assertEquals(entry.Runtime, 'deno');
      assertEquals(entry.RequiresKv, true);
      // Dependency attachment is covered by the reference tests above. This
      // narrow host exercises the emitted HTTP probe and the real child route.
      entry.RequiresDb = false;
      entry.PluginReferences = [];
      let now = 0;
      const health = new ChildHealthMonitor(() => now);
      const server = Deno.serve({
        hostname: '127.0.0.1',
        port: 0,
        onListen() {},
      }, (request) => childHealthResponse(request, health.snapshot()));
      const endpoint = `http://127.0.0.1:${server.addr.port}`;
      const loaded = await loadGeneratedModule({ [pluginName]: entry });
      try {
        const resources = await loaded.module.registerBackgroundProcessors(
          createRecordingBuilder(endpoint),
          configForProcessors({ [pluginName]: entry }),
          {},
          new Map(),
          new Map(),
          '/apphost',
        );
        const child = resources.get(pluginName);
        assert(child);
        assertEquals(child.probes, [{ path: '/health', endpointName: 'http' }]);
        const probe = child.probes[0];
        assert(probe);
        const probeEndpoint = await child.getEndpoint(probe.endpointName);
        assert(probeEndpoint);
        const readProbe = async (status: number, state: string) => {
          const response = await fetch(new URL(probe.path, probeEndpoint));
          assertEquals(response.status, status);
          assertEquals(await response.json(), { ...health.snapshot(), state });
        };
        await readProbe(503, 'starting');
        health.running();
        await readProbe(503, 'degraded'); // startup race: listener before registry
        health.failed();
        await readProbe(503, 'failed'); // registry bootstrap failure
        assertEquals(health.snapshot().registryReady, false);
        health.starting();
        health.registryLoaded();
        health.running();
        await readProbe(503, 'degraded'); // dependency unavailable
        health.dependenciesReady();
        await readProbe(200, 'ready');
        for (
          let restart = 0;
          restart < CHILD_CRASH_LOOP_THRESHOLD.restarts;
          restart++
        ) {
          health.restarting();
          health.starting();
          health.registryLoaded();
          health.dependenciesReady();
          health.running();
        }
        assertEquals(
          health.snapshot().restartCount,
          CHILD_CRASH_LOOP_THRESHOLD.restarts,
        );
        assert(health.snapshot().lastFatalError);
        await readProbe(503, 'crash-looping');
        now = CHILD_CRASH_LOOP_THRESHOLD.windowMs - 1;
        await readProbe(503, 'crash-looping');
        now++;
        await readProbe(200, 'ready');
        health.stopped();
        await readProbe(503, 'stopped');
      } finally {
        await server.shutdown();
        await loaded.dispose();
      }
    });
  }

  it('uses capability metadata for renamed children with telemetry disabled', async () => {
    const entry = {
      ...backgroundEntry({}),
      RequiresKv: true,
      Entrypoint: 'bin/custom.ts',
    };
    const builder = createRecordingBuilder();
    const resources = await runGeneratedRegistration(
      entry,
      new Map(),
      new Map(),
      builder,
    );
    assertEquals(resources.get(PROCESSOR_NAME)?.probes, [{
      path: '/health',
      endpointName: 'http',
    }]);
  });

  it('does not infer child health from saga names or entrypoint spelling', async () => {
    const entry = { ...backgroundEntry({}), Entrypoint: 'sagas/runtime.ts' };
    const loaded = await loadGeneratedModule({ sagas: entry });
    try {
      const resources = await loaded.module.registerBackgroundProcessors(
        createRecordingBuilder(),
        configForProcessors({ sagas: entry }),
        {},
        new Map(),
        new Map(),
        '/apphost',
      );
      assertEquals(resources.get('sagas')?.probes, []);
    } finally {
      await loaded.dispose();
    }
  });

  it('leaves disabled and non-Deno entries without implicit HTTP probes', async () => {
    const processors = {
      disabled: { ...backgroundEntry({}), RequiresKv: true, Enabled: false },
      benchmark: backgroundEntry({}),
      other: { ...backgroundEntry({}), RequiresKv: true, Runtime: 'other' },
    };
    const loaded = await loadGeneratedModule(processors);
    try {
      const builder = createRecordingBuilder();
      const resources = await loaded.module.registerBackgroundProcessors(
        builder,
        configForProcessors(processors),
        {},
        new Map(),
        new Map(),
        '/apphost',
      );
      assertEquals(builder.registrations, ['benchmark', 'other']);
      assertEquals(resources.get('benchmark')?.probes, []);
      assertEquals(resources.get('other')?.probes, []);
    } finally {
      await loaded.dispose();
    }
  });
});
