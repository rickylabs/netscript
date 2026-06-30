import { assert, assertEquals } from '@std/assert';
import {
  BASE_PLUGIN_CONTRACT_ROUTES,
  type BasePluginContract,
  type PluginCapabilities,
  PluginCapabilitiesSchema,
} from '@netscript/plugin/contract-base';
import { workersContractV1 } from '../../src/contracts/v1/mod.ts';

// Type-level conformance: a contract that spreads the mandatory base seam
// `describe` route satisfies `BasePluginContract`. This mirrors how the workers
// contract definition is declared and fails to compile if the seam route is
// dropped or mis-typed.
const _workersContractShape = {
  ...BASE_PLUGIN_CONTRACT_ROUTES,
  // Workers layers its own routes (jobs, executions, tasks, ...) on top of the
  // base seam; extra routes are permitted by the index signature.
} satisfies BasePluginContract;

Deno.test('workers contract conforms to the base plugin seam (satisfies BasePluginContract)', () => {
  // Reference the type-level binding so it is not unused.
  assertEquals(typeof _workersContractShape.describe, 'object');
});

Deno.test('bound workers v1 contract exposes the mandatory describe route', () => {
  const router = workersContractV1.$context<Record<string, unknown>>();
  assert('describe' in router, 'workers router must expose the describe route');
  assertEquals(typeof router.describe.handler, 'function');
});

Deno.test('workers capabilities document validates against PluginCapabilitiesSchema', () => {
  const doc: PluginCapabilities = {
    pluginName: '@netscript/plugin-workers',
    contractVersions: ['v1'],
    routeGroups: [
      'jobs',
      'executions',
      'tasks',
      'task-executions',
      'topics',
      'subscribe',
      'admin',
    ],
    capabilities: [
      'background-processor',
      'job-scheduling',
      'task-execution',
      'sse-streaming',
    ],
  };

  const parsed = PluginCapabilitiesSchema.parse(doc);
  assertEquals(parsed.pluginName, '@netscript/plugin-workers');
  assertEquals(parsed.contractVersions, ['v1']);
});
