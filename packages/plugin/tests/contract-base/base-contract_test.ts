import { assertEquals } from '@std/assert';
import {
  BASE_PLUGIN_CONTRACT_ROUTES,
  type BasePluginContract,
  PluginCapabilitiesSchema,
} from '../../src/contract-base/mod.ts';

// Type-level conformance: a contract that spreads the mandatory describe route
// satisfies BasePluginContract.
const _conforming = {
  ...BASE_PLUGIN_CONTRACT_ROUTES,
  // A plugin would add its own routes here; extra routes are permitted.
} satisfies BasePluginContract;

// Type-level negative: a contract WITHOUT the mandatory describe route must NOT
// satisfy BasePluginContract. Removing the @ts-expect-error must surface an error.
const _withoutDescribe = {
  someOtherRoute: BASE_PLUGIN_CONTRACT_ROUTES.describe,
};
// @ts-expect-error - missing mandatory `describe` route
const _missingDescribe: BasePluginContract = _withoutDescribe;

Deno.test('BASE_PLUGIN_CONTRACT_ROUTES exposes the mandatory describe route', () => {
  assertEquals(typeof BASE_PLUGIN_CONTRACT_ROUTES.describe, 'object');
});

Deno.test('PluginCapabilitiesSchema validates a capabilities document', () => {
  const parsed = PluginCapabilitiesSchema.parse({
    pluginName: '@netscript/plugin-sample',
    contractVersions: ['v1'],
    routeGroups: ['jobs'],
    capabilities: ['background-processor'],
  });
  assertEquals(parsed.pluginName, '@netscript/plugin-sample');
  // Reference the type-level bindings so they are not unused.
  assertEquals(typeof _conforming.describe, 'object');
  assertEquals(typeof _missingDescribe.someOtherRoute, 'object');
});
