import { assertEquals } from '@std/assert';
import * as root from '../../mod.ts';
import {
  type BrowserEnvironment,
  getBrowserServiceUrlFromEnv,
  resolveServiceUrlFromSources,
  type ServerEnvironment,
  type ServiceUrlEnvironmentSources,
} from '../../src/discovery/mod.ts';

Deno.test('the discovery barrel exports the pure resolver and its source types', () => {
  const browserEnv: BrowserEnvironment = { VITE_ORDERS_URL: 'http://browser.example' };
  const serverEnv: ServerEnvironment = {
    get: (key) => key === 'services__orders__https__0' ? 'https://server.example' : undefined,
  };
  const sources: ServiceUrlEnvironmentSources = { browserEnv, serverEnv };

  assertEquals(getBrowserServiceUrlFromEnv(browserEnv, 'orders'), 'http://browser.example');
  assertEquals(
    resolveServiceUrlFromSources('orders', 'http', 0, sources),
    'http://browser.example',
  );
  assertEquals(
    resolveServiceUrlFromSources('orders', 'https', 0, { serverEnv }),
    'https://server.example',
  );
  assertEquals(resolveServiceUrlFromSources('orders', 'http', 0, {}), undefined);
});

Deno.test('the root entrypoint re-exports the pure resolver', () => {
  assertEquals(root.resolveServiceUrlFromSources, resolveServiceUrlFromSources);
  assertEquals(root.getBrowserServiceUrlFromEnv, getBrowserServiceUrlFromEnv);
});
