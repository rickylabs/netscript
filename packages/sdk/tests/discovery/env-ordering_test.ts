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

const ASCII_PUNCTUATION = Array.from(
  { length: 0x7e - 0x21 + 1 },
  (_, index) => String.fromCharCode(0x21 + index),
).filter((character) => !/[a-zA-Z0-9_]/.test(character));

const RESOURCE_NAME_CORPUS = [
  ...ASCII_PUNCTUATION.flatMap((character) => [
    `${character}alpha`,
    `alpha${character}omega`,
    `alpha${character}`,
  ]),
  'a__b',
  ' orders api ',
  '\torders\napi\r',
  '',
  '1orders',
];

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
    assertEquals(
      createBrowserServiceEnvKey('a--b', 'http', 0),
      'VITE_services__a__b__http__0',
    );
  });
});

Deno.test('browser shorthand normalizes invalid identifier characters', () => {
  assertEquals(createBrowserServiceShortEnvKey('sagas-api'), 'VITE_SAGAS_API_URL');
  assertEquals(createBrowserServiceShortEnvKey('orders.api'), 'VITE_ORDERS_API_URL');
});

Deno.test('server service keys preserve resource names verbatim', () => {
  assertEquals(
    createServerServiceEnvKey('sagas-api', 'http', 0),
    'services__sagas-api__http__0',
  );
  assertEquals(
    createServerServiceEnvKey('orders.api', 'https', 1),
    'services__orders.api__https__1',
  );
});

Deno.test('SDK browser keys agree with Aspire across identifier edge cases', async (t) => {
  for (const resourceName of RESOURCE_NAME_CORPUS) {
    await t.step(JSON.stringify(resourceName), () => {
      const aspireKeys = buildViteEnvVarName(resourceName);
      assertEquals(
        createBrowserServiceEnvKey(resourceName),
        aspireKeys.full,
      );
      assertEquals(createBrowserServiceShortEnvKey(resourceName), aspireKeys.shorthand);
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
