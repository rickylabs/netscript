import { buildViteEnvVarName } from '@netscript/aspire/application';
import {
  createBrowserServiceEnvKey,
  createBrowserServiceShortEnvKey,
} from '../../src/discovery/browser-env.ts';
import {
  createServerServiceEnvKey,
  resolveServiceUrlFromSources,
  type ServerEnvironment,
} from '../../src/discovery/service-url.ts';

function assertEquals(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
}

function serverEnv(values: Record<string, string>): ServerEnvironment {
  return {
    get: (key) => values[key],
    toObject: () => values,
  };
}

Deno.test('service URL lookup prefers full browser key before shorthand', () => {
  const fullKey = createBrowserServiceEnvKey('orders-api', 'http', 0);
  const shortKey = createBrowserServiceShortEnvKey('orders-api');

  const url = resolveServiceUrlFromSources('orders-api', 'http', 0, {
    browserEnv: {
      [fullKey]: 'http://browser-full.example',
      [shortKey]: 'http://browser-short.example',
    },
    serverEnv: serverEnv({
      [createServerServiceEnvKey('orders-api', 'http', 0)]: 'http://server.example',
    }),
  });

  assertEquals(url, 'http://browser-full.example');
});

Deno.test('browser service full key matches Aspire identifier normalization', async (t) => {
  await t.step('normalizes hyphenated resource names', () => {
    assertEquals(
      createBrowserServiceEnvKey('sagas-api', 'http', 0),
      'VITE_services__sagas_api__http__0',
    );
    assertEquals(
      createBrowserServiceEnvKey('workers-api', 'http', 0),
      'VITE_services__workers_api__http__0',
    );
  });

  await t.step('preserves resource names that are already valid', () => {
    assertEquals(
      createBrowserServiceEnvKey('orders', 'http', 0),
      'VITE_services__orders__http__0',
    );
  });

  await t.step('normalizes every other invalid identifier character', () => {
    assertEquals(
      createBrowserServiceEnvKey('orders.api/v2', 'https', 1),
      'VITE_services__orders_api_v2__https__1',
    );
  });
});

Deno.test('browser shorthand and server service keys retain their existing contracts', () => {
  assertEquals(createBrowserServiceShortEnvKey('sagas-api'), 'VITE_SAGAS_API_URL');
  assertEquals(
    createServerServiceEnvKey('sagas-api', 'http', 0),
    'services__sagas-api__http__0',
  );
});

Deno.test('SDK browser full key agrees with Aspire output', async (t) => {
  for (const resourceName of ['sagas-api', 'workers.api/v2']) {
    await t.step(resourceName, () => {
      assertEquals(
        createBrowserServiceEnvKey(resourceName),
        buildViteEnvVarName(resourceName).full,
      );
    });
  }
});

Deno.test('service URL lookup falls back from browser full key to shorthand', () => {
  const shortKey = createBrowserServiceShortEnvKey('orders-api');

  const url = resolveServiceUrlFromSources('orders-api', 'http', 0, {
    browserEnv: {
      [shortKey]: 'http://browser-short.example',
    },
    serverEnv: serverEnv({
      [createServerServiceEnvKey('orders-api', 'http', 0)]: 'http://server.example',
    }),
  });

  assertEquals(url, 'http://browser-short.example');
});

Deno.test('service URL lookup falls back from browser keys to server env', () => {
  const url = resolveServiceUrlFromSources('orders-api', 'http', 0, {
    browserEnv: {},
    serverEnv: serverEnv({
      [createServerServiceEnvKey('orders-api', 'http', 0)]: 'http://server.example',
    }),
  });

  assertEquals(url, 'http://server.example');
});
