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
