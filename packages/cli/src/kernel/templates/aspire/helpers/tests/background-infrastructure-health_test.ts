/** @module Generated background probes coexist with PostgreSQL readiness registrations. */

import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { toFileUrl } from 'jsr:@std/path@^1';
import type { BackgroundProcessorEntry, NetScriptConfig } from '@netscript/aspire/types';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { writeGeneratedHelperFixture } from './generated-helper-fixture.ts';
import { EMPTY_CONFIG, MINIMAL_DENO_DEFAULTS } from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

class RecordingResource {
  readonly checks: string[] = [];
  readonly probes: unknown[] = [];
  readonly waits: RecordingResource[] = [];
  readonly references: RecordingResource[] = [];
  endpoint?: { env: string };

  constructor(readonly name: string) {}

  withHealthCheck(key: string): this {
    this.checks.push(key);
    return this;
  }

  withHttpEndpoint(options: { env: string }): this {
    this.endpoint = options;
    return this;
  }

  withHttpHealthCheck(options: unknown): this {
    assert(this.endpoint, 'HTTP probe must have an endpoint');
    this.probes.push(options);
    return this;
  }

  withEnvironment(_key: string, _value: unknown): this {
    return this;
  }

  withReference(resource: RecordingResource): this {
    this.references.push(resource);
    return this;
  }

  waitFor(resource: RecordingResource): this {
    this.waits.push(resource);
    return this;
  }

  addDatabase(name: string): RecordingResource {
    return new RecordingResource(name);
  }
}

class RecordingBuilder {
  readonly resources = new Map<string, RecordingResource>();
  readonly healthChecks = new Map<string, unknown>();

  addParameter(name: string, _options: unknown): RecordingResource {
    return this.addExecutable(name);
  }

  addPostgres(name: string, _options: unknown): RecordingResource {
    return this.addExecutable(name);
  }

  addExecutable(name: string): RecordingResource {
    const resource = new RecordingResource(name);
    this.resources.set(name, resource);
    return resource;
  }

  addHealthCheck(key: string, callback: unknown): void {
    assert(!this.healthChecks.has(key), `duplicate health check: ${key}`);
    this.healthChecks.set(key, callback);
  }
}

interface GeneratedInfrastructure {
  readonly primaryDatabase: RecordingResource;
}

interface InfrastructureModule {
  registerInfrastructure(
    builder: RecordingBuilder,
    config: NetScriptConfig,
    root: string,
  ): Promise<GeneratedInfrastructure>;
}

interface BackgroundModule {
  registerBackgroundProcessors(
    builder: RecordingBuilder,
    config: NetScriptConfig,
    infrastructure: GeneratedInfrastructure,
    services: Map<string, RecordingResource>,
    plugins: Map<string, RecordingResource>,
    root: string,
  ): Promise<Map<string, RecordingResource>>;
}

Deno.test('generated child probes preserve PostgreSQL listener/auth checks and database waits', async () => {
  const root = await Deno.makeTempDir({ prefix: 'background-infrastructure-health-' });
  try {
    await Deno.mkdir(`${root}/.helpers`, { recursive: true });
    await Deno.mkdir(`${root}/.aspire/modules`, { recursive: true });
    await Deno.writeTextFile(`${root}/.aspire/modules/aspire.mts`, 'export {};\n');
    const processors: Record<string, BackgroundProcessorEntry> = Object.fromEntries(
      ['workers', 'sagas', 'triggers'].map((name) => [name, {
        Enabled: true,
        Runtime: 'deno' as const,
        Entrypoint: `${name}/runtime.ts`,
        RequiresDb: true,
        RequiresKv: true,
        Telemetry: false,
        WatchMode: false,
      }]),
    );
    const config: NetScriptConfig = {
      ...EMPTY_CONFIG,
      Defaults: { ...EMPTY_CONFIG.Defaults, Deno: MINIMAL_DENO_DEFAULTS },
      Databases: {
        postgres: {
          Enabled: true,
          Engine: 'Postgres',
          Mode: 'Container',
          DatabaseName: 'app',
          Persistent: false,
        },
      },
      PrimaryDatabase: 'postgres',
      BackgroundProcessors: processors,
    };
    await writeGeneratedHelperFixture(root, config);
    // Only the SDK and compat seams are doubled. Both generated registration
    // modules execute in their normal order on the same builder.
    await Deno.writeTextFile(
      `${root}/.helpers/_aspire-compat.mts`,
      [
        'export function ensureDatabasePassword() { return "test-password"; }',
        'export function createEndpointListenerReadinessCheck() { return () => {}; }',
        'export function createPostgresCredentialReadinessCheck() { return () => {}; }',
        'export function buildDatabaseUriEnvKey() { return "POSTGRES_URI"; }',
        'export function buildDatabaseProviderEnvVars() { return {}; }',
        'export function buildSqliteDatabaseUrl() { throw new Error("unexpected SQLite"); }',
        'export function resolvePermissions() { return []; }',
        'export function resolveWorkspacePath(root, path) { return root + "/" + path; }',
        'export function withCacheReference(resource) { return resource; }',
      ].join('\n'),
    );
    const infrastructureModule = await import(
      toFileUrl(`${root}/.helpers/register-infrastructure.mts`).href
    ) as InfrastructureModule;
    const backgroundModule = await import(
      toFileUrl(`${root}/.helpers/register-background.mts`).href
    ) as BackgroundModule;
    const builder = new RecordingBuilder();
    const infrastructure = await infrastructureModule.registerInfrastructure(builder, config, root);
    const postgres = builder.resources.get('postgres');
    assert(postgres);
    const checksBeforeChildren = [...builder.healthChecks.entries()];
    const children = await backgroundModule.registerBackgroundProcessors(
      builder,
      config,
      infrastructure,
      new Map(),
      new Map(),
      root,
    );

    assertEquals([...builder.healthChecks.keys()], ['postgres_listener', 'postgres_auth']);
    assertEquals([...builder.healthChecks.entries()], checksBeforeChildren);
    assertEquals(postgres.checks, ['postgres_listener', 'postgres_auth']);
    assertEquals(postgres.probes, []);
    assertEquals(infrastructure.primaryDatabase.name, 'app');
    for (const name of Object.keys(processors)) {
      const child = children.get(name);
      assert(child);
      assertEquals(child.endpoint, { env: 'PORT' });
      assertEquals(child.probes, [{ path: '/health', endpointName: 'http' }]);
      assertEquals(child.checks, []);
      assertEquals(child.waits, [infrastructure.primaryDatabase]);
      assertEquals(child.references, [infrastructure.primaryDatabase]);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
