/**
 * @module templates/aspire/helpers/service-environment-runtime_test
 *
 * Runtime proof for #1447: the generated registration module is **executed**,
 * and the environment it produces is then handed to a real process.
 *
 * Source-text assertions cannot decide the precedence question. "Declared
 * environment is emitted before the generated database assignment" is a claim
 * about `withEnvironment` being last-write-wins per key; a test that only
 * compares string offsets would keep passing if that stopped being true. So
 * this test runs `registerServices(...)` from the generated `.mts` against a
 * recording builder, reduces the recorded calls the way Aspire would, and
 * asserts the **resolved** environment map.
 *
 * What is real here and what is a double:
 * - **real** — the generated `register-services.mts`, produced by the generator
 *   under test and imported as a module;
 * - **doubles** — `../.aspire/modules/aspire.mts` and `./_aspire-compat.mts`,
 *   the two value imports the generated module makes. Both are relative
 *   specifiers, so they can be stubbed on disk with no import map and no
 *   network. The doubles record; they do not decide anything the assertions
 *   depend on.
 *
 * The last step spawns a real `deno` process with the resolved map, because
 * "the resource carries the variable" and "the service observes the variable"
 * are different claims and #1447 is about the second one.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { toFileUrl } from 'jsr:@std/path@^1';
import type { NetScriptConfig, ServiceEntry } from '@netscript/aspire/types';
import { generateRegisterServices } from '../register/generate-register-services.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const MCP_SERVICE = 'excalidraw-mcp';
const SIBLING_SERVICE = 'reports';

const MCP_ENV = {
  MCP_TRANSPORT: 'http',
  MCP_SESSION_MODE: 'stateless',
} as const;

const SIBLING_ENV = {
  REPORTS_EXPORT_FORMAT: 'parquet',
} as const;

/** The value the AppHost allocates at start — what a declared literal loses to. */
const ALLOCATED_DATABASE_URL = 'postgres://allocated-by-apphost:5432/main';
/** The stale literal a consumer might declare for the same key. */
const DECLARED_DATABASE_URL = 'postgres://declared-by-appsettings:5432/stale';

const DATABASE_URL_KEY = 'DATABASE_URL';
const DATABASE_URI_KEY = 'POSTGRES_URI';
const DATABASE_PROVIDER_KEY = 'DB_PROVIDER';
const OTEL_SERVICE_NAME_KEY = 'OTEL_SERVICE_NAME';

/** A recorded `withEnvironment(key, value)` call, in the order it was made. */
interface RecordedEnvironmentCall {
  readonly key: string;
  readonly value: string;
}

/** A resource created by the recording builder. */
interface RecordingResource {
  readonly name: string;
  readonly environmentCalls: RecordedEnvironmentCall[];
  readonly references: string[];
  readonly waits: string[];
  withHttpEndpoint(options: Record<string, unknown>): RecordingResource;
  withHttpHealthCheck(options: Record<string, unknown>): Promise<RecordingResource>;
  withEnvironment(key: string, value: string): RecordingResource;
  withOtlpExporter(options: Record<string, unknown>): Promise<RecordingResource>;
  withReference(target: string): RecordingResource;
  waitFor(target: string): RecordingResource;
  getEndpoint(name: string): Promise<string>;
}

/** The subset of the Aspire builder surface the generated module calls. */
interface RecordingBuilder {
  readonly resources: Map<string, RecordingResource>;
  addExecutable(
    name: string,
    command: string,
    workdir: string,
    args: readonly string[],
  ): RecordingResource;
}

/** The generated module's exported entry point, as this test calls it. */
type RegisterServices = (
  builder: RecordingBuilder,
  config: NetScriptConfig,
  infrastructure: { readonly primaryDatabase?: string },
  appHostDir: string,
) => Promise<Map<string, RecordingResource>>;

interface GeneratedServicesModule {
  readonly registerServices: RegisterServices;
}

function isGeneratedServicesModule(value: unknown): value is GeneratedServicesModule {
  if (typeof value !== 'object' || value === null) return false;
  return 'registerServices' in value && typeof value.registerServices === 'function';
}

function createRecordingBuilder(): RecordingBuilder {
  const resources = new Map<string, RecordingResource>();
  return {
    resources,
    addExecutable(name) {
      const resource: RecordingResource = {
        name,
        environmentCalls: [],
        references: [],
        waits: [],
        withHttpEndpoint: () => resource,
        withHttpHealthCheck: () => Promise.resolve(resource),
        withEnvironment(key, value) {
          resource.environmentCalls.push({ key, value });
          return resource;
        },
        withOtlpExporter: () => Promise.resolve(resource),
        withReference(target) {
          resource.references.push(target);
          return resource;
        },
        waitFor(target) {
          resource.waits.push(target);
          return resource;
        },
        getEndpoint: (endpointName) =>
          Promise.resolve(`http://127.0.0.1/${name}/${endpointName}`),
      };
      resources.set(name, resource);
      return resource;
    },
  };
}

/**
 * Reduces recorded calls the way Aspire resolves them: last write wins per key.
 */
function resolveEnvironment(resource: RecordingResource): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const call of resource.environmentCalls) resolved[call.key] = call.value;
  return resolved;
}

/** Stand-in for the scaffolded Aspire SDK module the generated helper imports. */
const ASPIRE_SDK_DOUBLE = [
  'export const OtlpProtocol = { HttpProtobuf: 1, Grpc: 0 };',
  'export type DistributedApplicationBuilder = unknown;',
  '',
].join('\n');

/** Stand-in for `_aspire-compat.mts`; records nothing the assertions rely on. */
const ASPIRE_COMPAT_DOUBLE = [
  `export function buildDatabaseUriEnvKey(): string { return '${DATABASE_URI_KEY}'; }`,
  'export function buildDatabaseProviderEnvVars(): Record<string, string> {',
  `  return { ${DATABASE_PROVIDER_KEY}: 'postgresql' };`,
  '}',
  "export function buildSqliteDatabaseUrl(): string { return 'file:unused.db'; }",
  'export function buildOtelEnvVars(name: string, version: string): Record<string, string> {',
  `  return { ${OTEL_SERVICE_NAME_KEY}: name, OTEL_SERVICE_VERSION: version };`,
  '}',
  'export function extractServiceReferences(): string[] { return []; }',
  'export function extractPluginReferences(): string[] { return []; }',
  'export function resolvePermissions(): string[] { return []; }',
  'export function resolveWorkspacePath(root: string, relative: string): string {',
  '  return `${root}/${relative}`;',
  '}',
  '',
].join('\n');

function serviceEntry(extra: Partial<ServiceEntry>): ServiceEntry {
  return { Enabled: true, Runtime: 'deno', Entrypoint: 'src/main.ts', ...extra };
}

function configFor(services: Record<string, ServiceEntry>): NetScriptConfig {
  return {
    Name: 'env-runtime-fixture',
    Version: '1.0.0',
    PrimaryDatabase: 'main',
    Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
    Defaults: { Deno: { Permissions: ['--allow-net'], WatchMode: false } },
    Services: services,
    Apps: {},
    Plugins: {},
    BackgroundProcessors: {},
    Databases: {
      main: { Enabled: true, Engine: 'Postgres', Mode: 'Container', Persistent: false },
    },
    Cache: {},
    Tools: {},
  };
}

/**
 * Writes the generated helper next to its two doubles, imports it, and runs the
 * registration it exports.
 */
async function runGeneratedRegistration(
  config: NetScriptConfig,
): Promise<Map<string, RecordingResource>> {
  const root = await Deno.makeTempDir({ prefix: 'ns-1447-runtime-' });
  const helpersDir = `${root}/${SCAFFOLD_DIRS.HELPERS}`;
  const sdkDir = `${root}/.aspire/modules`;
  await Deno.mkdir(helpersDir, { recursive: true });
  await Deno.mkdir(sdkDir, { recursive: true });

  await Deno.writeTextFile(`${sdkDir}/aspire.mts`, ASPIRE_SDK_DOUBLE);
  await Deno.writeTextFile(`${helpersDir}/_aspire-compat.mts`, ASPIRE_COMPAT_DOUBLE);

  const generatedPath = `${helpersDir}/register-services.mts`;
  await Deno.writeTextFile(
    generatedPath,
    generateRegisterServices({
      services: config.Services,
      version: config.Version,
      denoDefaults: config.Defaults.Deno,
      databaseEngine: 'Postgres',
    }),
  );

  try {
    const namespace: unknown = await import(toFileUrl(generatedPath).href);
    assert(
      isGeneratedServicesModule(namespace),
      'the generated helper did not export registerServices',
    );

    const builder = createRecordingBuilder();
    await namespace.registerServices(
      builder,
      config,
      { primaryDatabase: ALLOCATED_DATABASE_URL },
      root,
    );
    return builder.resources;
  } finally {
    // The module graph is already resolved; the files on disk are no longer read.
    await Deno.remove(root, { recursive: true });
  }
}

describe('generated service registration, executed (#1447)', () => {
  it('should put every declared entry on its own resource', async () => {
    const resources = await runGeneratedRegistration(configFor({
      [MCP_SERVICE]: serviceEntry({ Env: MCP_ENV }),
      [SIBLING_SERVICE]: serviceEntry({ Environment: SIBLING_ENV }),
    }));

    const mcp = resources.get(MCP_SERVICE);
    const sibling = resources.get(SIBLING_SERVICE);
    assert(mcp && sibling, 'both service resources must be registered');

    const mcpEnv = resolveEnvironment(mcp);
    const siblingEnv = resolveEnvironment(sibling);

    assertEquals(mcpEnv.MCP_TRANSPORT, MCP_ENV.MCP_TRANSPORT);
    assertEquals(mcpEnv.MCP_SESSION_MODE, MCP_ENV.MCP_SESSION_MODE);
    assertEquals(mcpEnv.REPORTS_EXPORT_FORMAT, undefined);

    assertEquals(siblingEnv.REPORTS_EXPORT_FORMAT, SIBLING_ENV.REPORTS_EXPORT_FORMAT);
    assertEquals(siblingEnv.MCP_TRANSPORT, undefined);
  });

  it('should keep the generated infrastructure values it was given', async () => {
    const resources = await runGeneratedRegistration(configFor({
      [MCP_SERVICE]: serviceEntry({ Env: MCP_ENV }),
    }));
    const mcp = resources.get(MCP_SERVICE);
    assert(mcp, 'the service resource must be registered');
    const env = resolveEnvironment(mcp);

    assertEquals(env[DATABASE_URL_KEY], ALLOCATED_DATABASE_URL);
    assertEquals(env[DATABASE_URI_KEY], ALLOCATED_DATABASE_URL);
    assertEquals(env[DATABASE_PROVIDER_KEY], 'postgresql');
    assertEquals(env[OTEL_SERVICE_NAME_KEY], MCP_SERVICE);
  });

  it('should resolve a declared infrastructure key to the generated value', async () => {
    const resources = await runGeneratedRegistration(configFor({
      [MCP_SERVICE]: serviceEntry({
        Env: { ...MCP_ENV, [DATABASE_URL_KEY]: DECLARED_DATABASE_URL },
      }),
    }));
    const mcp = resources.get(MCP_SERVICE);
    assert(mcp, 'the service resource must be registered');

    const declaredCall = mcp.environmentCalls.findIndex(
      (call) => call.value === DECLARED_DATABASE_URL,
    );
    assert(declaredCall >= 0, 'the declared value must be applied, not silently discarded');

    // …and then lose, because the generated assignment comes after it.
    assertEquals(resolveEnvironment(mcp)[DATABASE_URL_KEY], ALLOCATED_DATABASE_URL);
    assertEquals(resolveEnvironment(mcp).MCP_TRANSPORT, MCP_ENV.MCP_TRANSPORT);
  });

  it('should still wire the database reference and wait', async () => {
    const resources = await runGeneratedRegistration(configFor({
      [MCP_SERVICE]: serviceEntry({ Env: MCP_ENV }),
    }));
    const mcp = resources.get(MCP_SERVICE);
    assert(mcp, 'the service resource must be registered');

    assertEquals(mcp.references, [ALLOCATED_DATABASE_URL]);
    assertEquals(mcp.waits, [ALLOCATED_DATABASE_URL]);
  });

  it('should be observed by a process started with the resolved environment', async () => {
    const resources = await runGeneratedRegistration(configFor({
      [MCP_SERVICE]: serviceEntry({ Env: MCP_ENV }),
    }));
    const mcp = resources.get(MCP_SERVICE);
    assert(mcp, 'the service resource must be registered');

    const keys = Object.keys(MCP_ENV);
    const script = `console.log(JSON.stringify(Object.fromEntries(${
      JSON.stringify(keys)
    }.map((key) => [key, Deno.env.get(key) ?? null]))));`;

    const command = new Deno.Command(Deno.execPath(), {
      args: ['eval', '--no-lock', script],
      env: resolveEnvironment(mcp),
      stdout: 'piped',
      stderr: 'piped',
    });
    const result = await command.output();
    const stdout = new TextDecoder().decode(result.stdout).trim();
    const stderr = new TextDecoder().decode(result.stderr).trim();

    assertEquals(result.code, 0, `child process failed: ${stderr}`);
    assertEquals(JSON.parse(stdout), { ...MCP_ENV });
  });
});
