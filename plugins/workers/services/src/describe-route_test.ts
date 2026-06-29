import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { createPluginService } from '@netscript/plugin/service';
import { router } from './router.ts';

// Integration test in the style of `@netscript/plugin`'s
// `create-plugin-service_test.ts`: build the real workers service router through
// the base service factory and assert the mandatory `describe` route serves a
// valid PluginCapabilities document. The describe handler is context-free, so no
// database/runtime wiring is required.
Deno.test('workers service serves GET /describe with a capabilities document', async () => {
  const app = createPluginService(router, {
    name: 'workers',
    version: '1.0.0',
    openApi: {
      title: 'Workers API',
      description: 'Workers service for job management and execution',
    },
  }).build();

  // The describe route lives under the v1.workers sub-router (prefix
  // `/v1/workers`), so the served OpenAPI path is `/api/v1/workers/describe`.
  const response = await app.request('/api/v1/workers/describe');
  assertEquals(response.status, 200);

  const body = await response.json();
  assertEquals(body.pluginName, '@netscript/plugin-workers');
  assertEquals(body.contractVersions, ['v1']);
  assert(Array.isArray(body.routeGroups), 'routeGroups must be an array');
  assert(body.routeGroups.includes('jobs'), 'routeGroups must include jobs');
  assert(Array.isArray(body.capabilities), 'capabilities must be an array');
  assert(
    body.capabilities.includes('background-processor'),
    'capabilities must include background-processor',
  );
});
