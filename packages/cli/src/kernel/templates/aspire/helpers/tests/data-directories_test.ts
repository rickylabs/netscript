/** Execute generated AppHost directory provisioning against a recording SDK edge. @module */
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { join, resolve, toFileUrl } from '@std/path';
import { type PluginEntry, PluginEntrySchema } from '@netscript/aspire/config';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { writeGeneratedHelperFixture } from './generated-helper-fixture.ts';
import { EMPTY_CONFIG, MINIMAL_PLUGIN } from './generators-test-support.ts';
import { generateRegisterPlugins } from '../register/generate-register-plugins.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

class Resource {
  readonly environment: Record<string, string> = {};
  withEnvironment(key: string, value: string): this {
    this.environment[key] = value;
    return this;
  }
  withHttpEndpoint(): this {
    return this;
  }
  withHttpHealthCheck(): this {
    return this;
  }
  withOtlpExporter(): this {
    return this;
  }
}

interface Registration {
  registerPlugins(
    builder: object,
    config: unknown,
    infrastructure: object,
    services: Map<string, Resource>,
    appHostDir: string,
  ): Promise<Map<string, Resource>>;
}

async function fixture(
  root: string,
  entry: PluginEntry,
): Promise<{ register: () => Promise<Map<string, Resource>>; resource: Resource }> {
  const config = { ...EMPTY_CONFIG, Plugins: { events: entry } };
  await writeGeneratedHelperFixture(root, config);
  await Deno.mkdir(join(root, '.aspire/modules'), { recursive: true });
  await Deno.writeTextFile(
    join(root, '.aspire/modules/aspire.mts'),
    "export const OtlpProtocol = { HttpProtobuf: 'http' }; export const HealthStatus = {};\n",
  );
  const compatPath = join(root, '.helpers/_aspire-compat.mts');
  await Deno.writeTextFile(
    compatPath,
    (await Deno.readTextFile(compatPath)).replace(
      "'zod'",
      JSON.stringify(import.meta.resolve('zod')),
    ),
  );
  // Run the actual compat implementation, including resolveWorkspacePath.
  const registration: Registration = await import(
    toFileUrl(join(root, '.helpers/register-plugins.mts')).href
  );
  const resource = new Resource();
  return {
    resource,
    register: () =>
      registration.registerPlugins(
        { addExecutable: () => resource },
        config,
        {},
        new Map(),
        root,
      ),
  };
}

const plugin: PluginEntry = {
  ...MINIMAL_PLUGIN,
  RequiresDb: false,
  RequiresKv: false,
  Workdir: 'services/events',
};

Deno.test('generated AppHost provisions relative directories and overrides conflicting literal env', async () => {
  const root = await Deno.makeTempDir();
  try {
    const entry = PluginEntrySchema.parse({
      ...plugin,
      Environment: { EVENTS_DIR: 'stale-literal', OTHER: 'preserved' },
      DataDirectories: { EVENTS_DIR: '../../.netscript/data/events' },
    });
    const { register, resource } = await fixture(root, entry);
    assertEquals(await Deno.stat(join(root, '.helpers')).then((s) => s.isDirectory), true);
    const dataDir = join(root, '.netscript/data/events');
    await assertRejects(() => Deno.stat(dataDir), Deno.errors.NotFound);
    await register();
    assert((await Deno.stat(dataDir)).isDirectory);
    assertEquals(resource.environment.EVENTS_DIR, resolve(root, '.netscript/data/events'));
    assertEquals(resource.environment.OTHER, 'preserved');
    // A new AppHost composition reuses existing data rather than clearing it.
    await Deno.writeTextFile(join(dataDir, 'retained'), 'history');
    await register();
    assertEquals(await Deno.readTextFile(join(dataDir, 'retained')), 'history');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generated AppHost off leaves storage ephemeral and creates no data directory', async () => {
  const root = await Deno.makeTempDir();
  try {
    const { register, resource } = await fixture(root, plugin);
    await register();
    assertEquals(resource.environment.EVENTS_DIR, undefined);
    await assertRejects(() => Deno.stat(join(root, '.netscript/data')), Deno.errors.NotFound);
    const source = await Deno.readTextFile(join(root, '.helpers/register-plugins.mts'));
    assertEquals(source.includes('mkdirSync'), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generated AppHost accepts absolute directories and fails closed on a file target', async () => {
  const root = await Deno.makeTempDir();
  try {
    const dataDir = join(root, 'absolute-data');
    const { register, resource } = await fixture(root, {
      ...plugin,
      DataDirectories: { EVENTS_DIR: dataDir },
    });
    await Deno.writeTextFile(dataDir, 'not-a-directory');
    await assertRejects(register);
    assertEquals(resource.environment.EVENTS_DIR, undefined);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('directory declarations survive config parsing and reject blank paths and reserved keys', () => {
  const directories = { EVENTS_DIR: '.netscript/data/events' };
  assertEquals(
    PluginEntrySchema.parse({ DataDirectories: directories }).DataDirectories,
    directories,
  );
  for (const value of ['', '  ', 1]) {
    assertEquals(
      PluginEntrySchema.safeParse({ DataDirectories: { EVENTS_DIR: value } }).success,
      false,
    );
  }
  assertEquals(
    PluginEntrySchema.safeParse({ DataDirectories: { 'bad-key': 'data' } }).success,
    false,
  );
  for (const key of ['PORT', 'API_TOKEN']) {
    assertThrows(
      () =>
        generateRegisterPlugins({
          plugins: { events: { ...plugin, DataDirectories: { [key]: 'data' } } },
          version: EMPTY_CONFIG.Version,
          denoDefaults: EMPTY_CONFIG.Defaults.Deno,
        }),
      Error,
      'reserved environment keys',
    );
  }
});
