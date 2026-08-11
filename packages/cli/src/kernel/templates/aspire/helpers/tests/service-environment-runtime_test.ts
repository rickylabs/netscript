/**
 * @module templates/aspire/helpers/service-environment-runtime_test
 *
 * Runtime proof for #1447: the generated registration module is **executed**, and
 * every documented precedence category is asserted on the calls it actually
 * made — one test per category, in both directions.
 *
 * **Which authority decides what.** This file is deliberately not the authority on
 * how Aspire resolves two assignments to the same key — a test that reduced the
 * recorded calls itself would keep passing if that resolution changed. Here: what
 * the generated program *does* (which keys, which values, in which order);
 * `lastAssigned()` reads the final assignment in call order and every assertion
 * using it also pins that order. In `behavior.service-env` (E2E,
 * `gates/scaffold/service-env/`): what the AppHost-started process ends up with,
 * read from its own environment — the authority for resolution, which fails if
 * Aspire ever stops being last-write-wins per key. `PORT` needs no ordering at
 * all: the generator refuses it because the endpoint binding owns it, asserted
 * here as "no assignment was made, and the endpoint still carries `env: 'PORT'`".
 *
 * **Real vs. double.** Real: the generated `register-services.mts`, plus
 * `buildOtelEnvVars` / `extractServiceReferences` / `extractPluginReferences`
 * re-exported into the double from `@netscript/aspire/application` — the module the
 * generated compat file copies — so OTel key names and reference extraction are the
 * shipped ones. Doubles: `../.aspire/modules/aspire.mts` (third-party SDK) and the
 * compat-only helpers with no package counterpart, which derive their values from
 * the config they are handed as the template does. No assertion treats a double's
 * value as expected without also pinning call order.
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
const PRIMARY_DATABASE = 'main';

/** Values the AppHost allocates at start — what a declared literal loses to. */
const ALLOCATED_DATABASE_URL = 'postgres://allocated-by-apphost:5432/main';
const ALLOCATED_SIBLING_ENDPOINT = `http://127.0.0.1/${SIBLING_SERVICE}/http`;
/** Keys the discovery convention and the compat helper derive from the topology. */
const DISCOVERY_KEY = `services__${SIBLING_SERVICE}__http__0`;
const DATABASE_URI_KEY = `${PRIMARY_DATABASE.toUpperCase()}_URI`;

/**
 * One documented precedence category and what the generated program must do with
 * it. The *reason* each category has its rule is documented once, per category, in
 * `packages/aspire/README.md` § Resource environment.
 */
interface PrecedenceCase {
  /** Documented category name, as `packages/aspire/README.md` names it. */
  readonly category: string;
  /** Key a consumer declares. */
  readonly key: string;
  /** Value the consumer declares for it. */
  readonly declared: string;
  /** Documented outcome for the category. */
  readonly rule: 'declared-wins' | 'generated-wins' | 'refused';
  /** Value the generated registration assigns after the declared one, when it does. */
  readonly generated?: string;
}

const PRECEDENCE_CASES: readonly PrecedenceCase[] = [
  {
    category: 'plain (control)',
    key: 'MCP_TRANSPORT',
    declared: 'http',
    rule: 'declared-wins',
  },
  {
    category: 'plain (second control)',
    key: 'MCP_SESSION_MODE',
    declared: 'stateless',
    rule: 'declared-wins',
  },
  {
    category: 'OTel',
    key: 'OTEL_SERVICE_NAME',
    declared: 'declared-otel-name',
    rule: 'generated-wins',
    generated: MCP_SERVICE,
  },
  {
    category: 'database URL',
    key: 'DATABASE_URL',
    declared: 'postgres://declared-by-appsettings:5432/stale',
    rule: 'generated-wins',
    generated: ALLOCATED_DATABASE_URL,
  },
  {
    category: 'database engine URI',
    key: DATABASE_URI_KEY,
    declared: 'postgres://declared-by-appsettings:5432/stale-uri',
    rule: 'generated-wins',
    generated: ALLOCATED_DATABASE_URL,
  },
  {
    category: 'database provider',
    key: 'DB_PROVIDER',
    declared: 'declared-provider',
    rule: 'generated-wins',
    generated: PRIMARY_DATABASE,
  },
  {
    category: 'service discovery',
    key: DISCOVERY_KEY,
    declared: 'http://declared-by-appsettings:9/stale',
    rule: 'generated-wins',
    generated: ALLOCATED_SIBLING_ENDPOINT,
  },
  {
    category: 'PORT / endpoint',
    key: 'PORT',
    declared: '59147',
    rule: 'refused',
  },
];

const DECLARED_ENVIRONMENT: Readonly<Record<string, string>> = Object.fromEntries(
  PRECEDENCE_CASES.map((entry) => [entry.key, entry.declared]),
);

/** A recorded `withEnvironment(key, value)` call, in the order it was made. */
interface RecordedEnvironmentCall {
  readonly key: string;
  readonly value: string;
}

/** A resource created by the recording builder. */
interface RecordingResource {
  readonly name: string;
  readonly environmentCalls: RecordedEnvironmentCall[];
  readonly endpointOptions: Record<string, unknown>[];
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

/** The generated module's exported entry points, as this test calls them. */
interface GeneratedServicesModule {
  readonly registerServices: (
    builder: RecordingBuilder,
    config: NetScriptConfig,
    infrastructure: { readonly primaryDatabase?: string },
    appHostDir: string,
  ) => Promise<Map<string, RecordingResource>>;
  readonly wireServiceReferences: (
    config: NetScriptConfig,
    services: Map<string, RecordingResource>,
    plugins: Map<string, RecordingResource>,
  ) => Promise<void>;
}

function isGeneratedServicesModule(value: unknown): value is GeneratedServicesModule {
  if (typeof value !== 'object' || value === null) return false;
  return 'registerServices' in value && typeof value.registerServices === 'function' &&
    'wireServiceReferences' in value && typeof value.wireServiceReferences === 'function';
}

function createRecordingBuilder(): RecordingBuilder {
  const resources = new Map<string, RecordingResource>();
  return {
    resources,
    addExecutable(name) {
      const resource: RecordingResource = {
        name,
        environmentCalls: [],
        endpointOptions: [],
        references: [],
        waits: [],
        withHttpEndpoint(options) {
          resource.endpointOptions.push(options);
          return resource;
        },
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

/** Indexes of every assignment the generated module made for a key, in call order. */
function assignmentIndexes(resource: RecordingResource, key: string): number[] {
  return resource.environmentCalls
    .map((call, index) => (call.key === key ? index : -1))
    .filter((index) => index >= 0);
}

/** Final assignment for a key, in call order — see the module doc on authority. */
function lastAssigned(resource: RecordingResource, key: string): string | undefined {
  const indexes = assignmentIndexes(resource, key);
  const last = indexes.at(-1);
  return last === undefined ? undefined : resource.environmentCalls[last].value;
}

/** Stand-in for the scaffolded Aspire SDK module the generated helper imports. */
const ASPIRE_SDK_DOUBLE = [
  'export const OtlpProtocol = { HttpProtobuf: 1, Grpc: 0 };',
  'export type DistributedApplicationBuilder = unknown;',
  '',
].join('\n');

/**
 * Builds the `_aspire-compat.mts` stand-in: the three helpers that decide key
 * names or reference sets come from `@netscript/aspire/application`, so this test
 * does not invent them; the rest derive their values from the config they are
 * handed, as `_aspire-compat.ts.template` does.
 */
function aspireCompatDouble(): string {
  const applicationModule = import.meta.resolve('@netscript/aspire/application');
  return [
    `export { buildOtelEnvVars, extractPluginReferences, extractServiceReferences } from '${applicationModule}';`,
    'export function buildDatabaseUriEnvKey(config) {',
    '  return config.PrimaryDatabase ? `${config.PrimaryDatabase.toUpperCase()}_URI` : null;',
    '}',
    'export function buildDatabaseProviderEnvVars(config) {',
    '  if (!config.PrimaryDatabase) return {};',
    '  return { DB_PROVIDER: config.PrimaryDatabase, DATABASE_PROVIDER: config.PrimaryDatabase };',
    '}',
    "export function buildSqliteDatabaseUrl() { return 'file:unused.db'; }",
    'export function resolvePermissions() { return []; }',
    'export function resolveWorkspacePath(root, relative) {',
    '  return `${root}/${relative}`;',
    '}',
    '',
  ].join('\n');
}

function serviceEntry(extra: Partial<ServiceEntry>): ServiceEntry {
  return { Enabled: true, Runtime: 'deno', Entrypoint: 'src/main.ts', ...extra };
}

function configFor(services: Record<string, ServiceEntry>): NetScriptConfig {
  return {
    Name: 'env-runtime-fixture',
    Version: '1.0.0',
    PrimaryDatabase: PRIMARY_DATABASE,
    Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
    Defaults: { Deno: { Permissions: ['--allow-net'], WatchMode: false } },
    Services: services,
    Apps: {},
    Plugins: {},
    BackgroundProcessors: {},
    Databases: {
      [PRIMARY_DATABASE]: {
        Enabled: true,
        Engine: 'Postgres',
        Mode: 'Container',
        Persistent: false,
      },
    },
    Cache: {},
    Tools: {},
  };
}

/**
 * Writes the generated helper next to its two doubles, imports it, and runs both
 * registration passes — `registerServices` then `wireServiceReferences`, so the
 * service-discovery category runs through the same code path the AppHost uses.
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
  await Deno.writeTextFile(`${helpersDir}/_aspire-compat.mts`, aspireCompatDouble());

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
      'the generated helper did not export registerServices and wireServiceReferences',
    );

    const builder = createRecordingBuilder();
    const services = await namespace.registerServices(
      builder,
      config,
      { primaryDatabase: ALLOCATED_DATABASE_URL },
      root,
    );
    await namespace.wireServiceReferences(config, services, new Map());
    return builder.resources;
  } finally {
    // The module graph is already resolved; the files on disk are no longer read.
    await Deno.remove(root, { recursive: true });
  }
}

/** Registers the subject with every documented category declared at once. */
function subjectConfig(): NetScriptConfig {
  return configFor({
    [MCP_SERVICE]: serviceEntry({
      Env: DECLARED_ENVIRONMENT,
      ServiceReferences: [SIBLING_SERVICE],
    }),
    [SIBLING_SERVICE]: serviceEntry({}),
  });
}

async function subjectResource(): Promise<RecordingResource> {
  const resources = await runGeneratedRegistration(subjectConfig());
  const subject = resources.get(MCP_SERVICE);
  assert(subject, `the ${MCP_SERVICE} resource must be registered`);
  return subject;
}

describe('generated service registration, executed (#1447)', () => {
  it('should put every declared entry on its own resource', async () => {
    const resources = await runGeneratedRegistration(configFor({
      [MCP_SERVICE]: serviceEntry({ Env: { MCP_TRANSPORT: 'http' } }),
      [SIBLING_SERVICE]: serviceEntry({ Environment: { REPORTS_EXPORT_FORMAT: 'parquet' } }),
    }));

    const mcp = resources.get(MCP_SERVICE);
    const sibling = resources.get(SIBLING_SERVICE);
    assert(mcp && sibling, 'both service resources must be registered');

    assertEquals(lastAssigned(mcp, 'MCP_TRANSPORT'), 'http');
    assertEquals(lastAssigned(mcp, 'REPORTS_EXPORT_FORMAT'), undefined);
    assertEquals(lastAssigned(sibling, 'REPORTS_EXPORT_FORMAT'), 'parquet');
    assertEquals(lastAssigned(sibling, 'MCP_TRANSPORT'), undefined);
  });

  it('should still wire the database reference and wait', async () => {
    const subject = await subjectResource();

    assertEquals(subject.references, [ALLOCATED_DATABASE_URL]);
    assertEquals(subject.waits, [ALLOCATED_DATABASE_URL]);
  });

  it('should register the HTTP endpoint that owns PORT', async () => {
    const subject = await subjectResource();

    assertEquals(subject.endpointOptions.length, 1);
    assertEquals(subject.endpointOptions[0], { env: 'PORT' });
  });
});

describe('declared environment precedence, per documented category (#1447)', () => {
  for (const entry of PRECEDENCE_CASES) {
    it(`should honor the ${entry.category} rule: ${entry.rule}`, async () => {
      const subject = await subjectResource();
      const indexes = assignmentIndexes(subject, entry.key);

      if (entry.rule === 'refused') {
        assertEquals(
          indexes.length,
          0,
          `${entry.key} must not be assigned at all; the endpoint binding owns it`,
        );
        assertEquals(
          subject.endpointOptions[0],
          { env: entry.key },
          `${entry.key} must still be injected by the endpoint the generator registers`,
        );
        return;
      }

      assert(
        indexes.length >= 1,
        `${entry.key} was never applied — the declared value was silently dropped (#1447)`,
      );
      assertEquals(
        subject.environmentCalls[indexes[0]].value,
        entry.declared,
        `the declared ${entry.key} must be applied, not discarded before emission`,
      );

      if (entry.rule === 'declared-wins') {
        assertEquals(
          indexes.length,
          1,
          `nothing generated owns ${entry.key}, so it must be assigned exactly once`,
        );
        assertEquals(lastAssigned(subject, entry.key), entry.declared);
        return;
      }

      assert(
        indexes.length >= 2,
        `${entry.key} was assigned once — the generated value that must win it is missing`,
      );
      const last = indexes[indexes.length - 1];
      assert(
        last > indexes[0],
        `the generated ${entry.key} must be assigned after the declared one`,
      );
      assertEquals(
        subject.environmentCalls[last].value,
        entry.generated,
        `the last ${entry.key} assignment must be the generated value`,
      );
    });
  }

  it('should keep a non-colliding control intact while collisions are overridden', async () => {
    const subject = await subjectResource();
    const controls = PRECEDENCE_CASES.filter((entry) => entry.rule === 'declared-wins');
    const overridden = PRECEDENCE_CASES.filter((entry) => entry.rule === 'generated-wins');

    assert(controls.length > 0 && overridden.length > 0, 'both directions must be covered');
    for (const entry of controls) {
      assertEquals(lastAssigned(subject, entry.key), entry.declared);
    }
    for (const entry of overridden) {
      assert(
        lastAssigned(subject, entry.key) !== entry.declared,
        `${entry.key} kept its declared literal; the generated value must win`,
      );
    }
  });
});

describe('the declared environment reaches a real process (#1447)', () => {
  it('should be observed by a process started with the assigned environment', async () => {
    const subject = await subjectResource();
    const keys = PRECEDENCE_CASES.filter((entry) => entry.rule === 'declared-wins')
      .map((entry) => entry.key);
    const environment: Record<string, string> = {};
    for (const call of subject.environmentCalls) environment[call.key] = call.value;

    const script = `console.log(JSON.stringify(Object.fromEntries(${
      JSON.stringify(keys)
    }.map((key) => [key, Deno.env.get(key) ?? null]))));`;

    const command = new Deno.Command(Deno.execPath(), {
      args: ['eval', '--no-lock', script],
      env: environment,
      stdout: 'piped',
      stderr: 'piped',
    });
    const result = await command.output();
    const stdout = new TextDecoder().decode(result.stdout).trim();
    const stderr = new TextDecoder().decode(result.stderr).trim();

    assertEquals(result.code, 0, `child process failed: ${stderr}`);
    assertEquals(
      JSON.parse(stdout),
      Object.fromEntries(keys.map((key) => [key, DECLARED_ENVIRONMENT[key]])),
    );
  });
});
