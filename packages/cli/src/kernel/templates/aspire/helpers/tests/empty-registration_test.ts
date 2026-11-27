/** Regression coverage for all 7 executable empty-contribution scaffold helpers (#2174). */
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { join, toFileUrl } from 'jsr:@std/path@^1';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { generateDbCliMode } from '../generate-db-cli-mode.ts';
import { generateRegisterApps } from '../register/generate-register-apps.ts';
import { generateRegisterBackground } from '../register/generate-register-background.ts';
import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts';
import { generateRegisterPlugins } from '../register/generate-register-plugins.ts';
import { generateRegisterServices } from '../register/generate-register-services.ts';
import { generateRegisterTools } from '../register/generate-register-tools.ts';
import {
  MINIMAL_DENO_DEFAULTS,
  MINIMAL_PLUGIN,
  MINIMAL_SERVICE,
} from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const options = { version: 'test', denoDefaults: MINIMAL_DENO_DEFAULTS };

async function assertDenoLintClean(path: string): Promise<void> {
  const lint = await new Deno.Command(Deno.execPath(), {
    args: ['lint', '--no-config', path],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(lint.code, 0, new TextDecoder().decode(lint.stderr));
}

function createUnreadableArg(): unknown {
  return new Proxy({}, {
    get() {
      throw new Error('Empty registration must not access resource/configuration arguments');
    },
  });
}

const mapOrVoidCases = [
  {
    name: 'registerPlugins',
    source: () => generateRegisterPlugins({ ...options, plugins: {} }),
    argumentCount: 5,
    returnsMap: true,
  },
  {
    name: 'registerBackgroundProcessors',
    source: () => generateRegisterBackground({ ...options, processors: {} }),
    argumentCount: 6,
    returnsMap: true,
  },
  {
    name: 'registerTools',
    source: () => generateRegisterTools({ tools: {} }),
    argumentCount: 4,
    returnsMap: false,
  },
];

for (const fixture of mapOrVoidCases) {
  Deno.test(`${fixture.name}: empty output lints and preserves its contract without accessing resources`, async () => {
    const directory = await Deno.makeTempDir({ prefix: 'empty-registration-' });
    try {
      const path = join(directory, 'registration.mts');
      await Deno.writeTextFile(path, fixture.source());
      await assertDenoLintClean(path);

      const module: Record<string, unknown> = await import(toFileUrl(path).href);
      const register = module[fixture.name];
      assert(typeof register === 'function');
      assertEquals(register.length, fixture.argumentCount);
      const unreadable = createUnreadableArg();
      const pending: unknown = register(...Array(fixture.argumentCount).fill(unreadable));
      assert(pending instanceof Promise);
      const first: unknown = await pending;
      const second: unknown = await register(...Array(fixture.argumentCount).fill(unreadable));
      if (fixture.returnsMap) {
        assert(first instanceof Map && second instanceof Map);
        assertEquals(first.size, 0);
        assertEquals(second.size, 0);
        assert(first !== second, 'Each invocation must own its result map');
      } else {
        assertEquals(first, undefined);
        assertEquals(second, undefined);
      }
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });
}

Deno.test('registerServices + wireServiceReferences: empty output lints and preserves both contracts', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'empty-services-' });
  try {
    const path = join(directory, 'register-services.mts');
    await Deno.writeTextFile(path, generateRegisterServices({ ...options, services: {} }));
    await assertDenoLintClean(path);

    const module: Record<string, unknown> = await import(toFileUrl(path).href);
    const registerServices = module.registerServices;
    const wireServiceReferences = module.wireServiceReferences;
    assert(typeof registerServices === 'function');
    assert(typeof wireServiceReferences === 'function');

    const unreadable = createUnreadableArg();
    const pending = registerServices(unreadable, unreadable, unreadable, unreadable);
    assert(pending instanceof Promise);
    const first = await pending;
    const second = await registerServices(unreadable, unreadable, unreadable, unreadable);
    assert(first instanceof Map && second instanceof Map);
    assertEquals(first.size, 0);
    assert(first !== second);

    const wired = wireServiceReferences(unreadable, unreadable);
    assert(wired instanceof Promise);
    assertEquals(await wired, undefined);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('registerApps: empty apps lints and handles both all-empty and populated-sibling CORS graphs', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'empty-apps-' });
  try {
    const path = join(directory, 'register-apps.mts');
    await Deno.writeTextFile(path, generateRegisterApps({ ...options, apps: {} }));
    await assertDenoLintClean(path);

    const module: Record<string, unknown> = await import(toFileUrl(path).href);
    const registerApps = module.registerApps as (
      builder: unknown,
      config: unknown,
      infra: unknown,
      services: Map<string, unknown>,
      plugins: Map<string, unknown>,
      backgroundProcessors: Map<string, unknown>,
      appHostDir: string,
    ) => Promise<Map<string, unknown>>;
    assertEquals(registerApps.length, 6);

    // All-empty graph: never touches builder/infra/background/appHostDir.
    const emptyResult = await registerApps(
      createUnreadableArg(),
      { Services: {}, Plugins: {} },
      createUnreadableArg(),
      new Map(),
      new Map(),
      createUnreadableArg() as Map<string, unknown>,
      '/unused',
    );
    assert(emptyResult instanceof Map && emptyResult.size === 0);

    // Populated sibling services/plugins with empty apps: still applies NETSCRIPT_CORS_ORIGINS.
    const recorded = new Map<string, Record<string, unknown>>();
    const makeResource = (name: string) => ({
      withEnvironment(key: string, value: unknown) {
        const env = recorded.get(name) ?? {};
        env[key] = value;
        recorded.set(name, env);
        return Promise.resolve();
      },
    });
    const result = await registerApps(
      createUnreadableArg(),
      {
        Services: {
          users: {
            ...MINIMAL_SERVICE,
            Environment: { NETSCRIPT_CORS_ORIGINS: 'https://portal.example' },
          },
        },
        Plugins: { auth: MINIMAL_PLUGIN },
      },
      createUnreadableArg(),
      new Map([['users', makeResource('users')]]),
      new Map([['auth', makeResource('auth')]]),
      new Map(),
      '/unused',
    );
    assert(result instanceof Map && result.size === 0);
    assertEquals(recorded.get('users')?.NETSCRIPT_CORS_ORIGINS, 'https://portal.example');
    assertEquals(recorded.get('auth')?.NETSCRIPT_CORS_ORIGINS, '');
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('registerInfrastructure: empty output lints and resolves empty InfrastructureContext without accessing resources', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'empty-infra-' });
  try {
    const path = join(directory, 'register-infrastructure.mts');
    await Deno.writeTextFile(
      path,
      generateRegisterInfrastructure({ databases: {}, caches: {} }),
    );
    await assertDenoLintClean(path);

    const module: Record<string, unknown> = await import(toFileUrl(path).href);
    const registerInfrastructure = module.registerInfrastructure;
    assert(typeof registerInfrastructure === 'function');
    const unreadable = createUnreadableArg();
    const pending = registerInfrastructure(unreadable, unreadable, unreadable);
    assert(pending instanceof Promise);
    const ctx = await pending as Record<string, unknown>;
    assert(ctx.databases instanceof Map && ctx.databases.size === 0);
    assert(
      ctx.databaseConnectionStrings instanceof Map && ctx.databaseConnectionStrings.size === 0,
    );
    assert(ctx.caches instanceof Map && ctx.caches.size === 0);
    assert(ctx.cacheEndpoints instanceof Map && ctx.cacheEndpoints.size === 0);
    assert(ctx.cacheWiring instanceof Map && ctx.cacheWiring.size === 0);
    assertEquals(ctx.primaryDatabase, null);
    assertEquals(ctx.primaryCache, null);
    assertEquals(ctx.primaryCacheEndpoint, null);
    assertEquals(ctx.primaryCacheWiring, null);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('tryHandleDbCliMode: empty output lints and resolves false without accessing resources', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'empty-db-cli-' });
  try {
    await Deno.mkdir(join(directory, '.aspire', 'modules'), { recursive: true });
    await Deno.mkdir(join(directory, '.helpers'), { recursive: true });
    await Deno.writeTextFile(
      join(directory, '.aspire', 'modules', 'aspire.mts'),
      "export const InputType = { Number: 'Number', Boolean: 'Boolean' };\n",
    );
    const path = join(directory, '.helpers', 'db-cli-mode.mts');
    await Deno.writeTextFile(path, generateDbCliMode({ databases: {} }));
    await assertDenoLintClean(path);

    const module: Record<string, unknown> = await import(toFileUrl(path).href);
    const tryHandleDbCliMode = module.tryHandleDbCliMode;
    assert(typeof tryHandleDbCliMode === 'function');
    const unreadable = createUnreadableArg();
    const pending = tryHandleDbCliMode(unreadable, unreadable, unreadable, unreadable);
    assert(pending instanceof Promise);
    assertEquals(await pending, false);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
