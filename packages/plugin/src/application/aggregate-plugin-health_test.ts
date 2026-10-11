import { assertEquals } from '@std/assert';
import { aggregatePluginHealth, type ChildHealthSnapshot } from '../health/mod.ts';

const declaration = { pluginName: 'jobs', apiResources: ['api'], childResources: ['child'] };
const api = { name: 'api', state: 'Running', healthStatus: 'Healthy', healthReports: { http: {} } };
const child = {
  name: 'child',
  state: 'Running',
  healthStatus: 'Healthy',
  healthReports: { http: {} },
};

for (const field of ['registryReady', 'dependencyReady'] as const) {
  Deno.test(`aggregation rejects ready child without ${field}`, () => {
    const childHealth: ChildHealthSnapshot = {
      state: 'ready',
      registryReady: true,
      dependencyReady: true,
      restartCount: 0,
      lastFatalError: null,
      [field]: false,
    };
    assertEquals(
      aggregatePluginHealth([declaration], [api, { ...child, childHealth }])[0]?.status,
      'degraded',
    );
  });
}
Deno.test('aggregation never certifies wrapper-only or unsubstantiated readiness', () => {
  assertEquals(
    aggregatePluginHealth([declaration], [api, { ...child, childHealthUnavailable: true }])[0]
      ?.status,
    'degraded',
  );
  assertEquals(
    aggregatePluginHealth([declaration], [api, { ...child, healthReports: {} }])[0]?.status,
    'degraded',
  );
  assertEquals(
    aggregatePluginHealth([declaration], [{ ...api, healthReports: {} }, child])[0]?.status,
    'unknown',
  );
  assertEquals(aggregatePluginHealth([declaration], [child])[0]?.status, 'unhealthy');
  assertEquals(aggregatePluginHealth([declaration], [api, child])[0]?.status, 'healthy');
});
Deno.test('aggregation ignores unrelated unhealthy resources and preserves inputs', () => {
  const observations = [api, child, { name: 'foreign', state: 'Failed' }];
  const before = JSON.stringify(observations);
  assertEquals(aggregatePluginHealth([declaration], observations)[0]?.status, 'healthy');
  assertEquals(JSON.stringify(observations), before);
  assertEquals(
    aggregatePluginHealth([{ pluginName: 'empty', apiResources: [], childResources: [] }], [])[0]
      ?.status,
    'unknown',
  );
});
