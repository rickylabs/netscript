import { assert, assertEquals } from '@std/assert';
import { toFileUrl } from '@std/path';
import type { RunningService } from '@netscript/service';
import { closeKv, getKv } from '../../../../kv/mod.ts';
import createAuthService from '../../../../../plugins/auth/services/src/main.ts';
import createSagasService from '../../../../../plugins/sagas/services/src/main.ts';
import createWorkersService from '../../../../../plugins/workers/services/src/main.ts';
import type { PluginServiceContext } from './plugin-service-context.ts';

const serviceContextTemplate = new URL(
  '../../../../../packages/cli/src/kernel/assets/plugins/service-context.ts.template',
  import.meta.url,
);
const authPackageRoot = new URL('../../../../../plugins/auth/', import.meta.url);

Deno.test('unchanged generated service context boots workers, auth, and sagas to ready', async () => {
  const fixtureRoot = await Deno.makeTempDir({
    dir: authPackageRoot.pathname,
    prefix: '.generated-service-context-',
  });
  const fixtureUrl = toFileUrl(`${fixtureRoot}/`);
  const generatedContextUrl = new URL('services/_shared/plugin-service-context.ts', fixtureUrl);
  const databaseModuleUrl = new URL('database/mod.ts', fixtureUrl);
  const savedEnvironment = captureEnvironment([
    'PORT',
    'NETSCRIPT_AUTH_BACKEND',
    'NETSCRIPT_AUTH_KV_OAUTH_KEY',
    'NETSCRIPT_SAGA_STORE',
  ]);

  await Deno.mkdir(new URL('services/_shared/', fixtureUrl), { recursive: true });
  await Deno.mkdir(new URL('database/', fixtureUrl), { recursive: true });
  await Deno.writeTextFile(
    generatedContextUrl,
    await Deno.readTextFile(serviceContextTemplate),
  );
  await Deno.writeTextFile(
    databaseModuleUrl,
    'export const db = { getClient: () => Promise.resolve(Object.freeze({})) };\n',
  );

  Deno.env.set('PORT', '0');
  Deno.env.set('NETSCRIPT_AUTH_BACKEND', 'kv-oauth');
  Deno.env.set(
    'NETSCRIPT_AUTH_KV_OAUTH_KEY',
    'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
  );
  Deno.env.set('NETSCRIPT_SAGA_STORE', 'kv');

  const runningServices: RunningService[] = [];
  try {
    await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
    const generatedModule: unknown = await import(generatedContextUrl.href);
    const createContext = requireGeneratedContextFactory(generatedModule);
    const services = [
      ['workers', createWorkersService],
      ['auth', createAuthService],
      ['sagas', createSagasService],
    ] as const;

    for (const [pluginName, createService] of services) {
      const context = await createContext(pluginName);
      const running = await createService(context);
      runningServices.push(running);

      assertEquals(running.addr.transport, 'tcp');
      assert(running.addr.port > 0);
      const health = await running.app.request('/health');
      assertEquals(health.status, 200);
      assertEquals(Reflect.get(await health.json(), 'status'), 'healthy');
    }
  } finally {
    for (const running of runningServices.reverse()) {
      await running.stop();
    }
    await closeKv();
    restoreEnvironment(savedEnvironment);
    await Deno.remove(fixtureRoot, { recursive: true });
  }
});

type GeneratedContextFactory = (pluginName: string) => Promise<PluginServiceContext>;

function requireGeneratedContextFactory(value: unknown): GeneratedContextFactory {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Generated service context module did not load.');
  }
  const factory = Reflect.get(value, 'createPluginServiceContext');
  if (typeof factory !== 'function') {
    throw new TypeError('Generated service context module did not export its context factory.');
  }
  return factory;
}

function captureEnvironment(keys: readonly string[]): ReadonlyMap<string, string | undefined> {
  return new Map(keys.map((key) => [key, Deno.env.get(key)]));
}

function restoreEnvironment(environment: ReadonlyMap<string, string | undefined>): void {
  for (const [key, value] of environment) {
    if (value === undefined) {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, value);
    }
  }
}
