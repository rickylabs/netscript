/** NetScript adapter contract for the sagas plugin.
 *
 * @module
 */

import type { InstallStarterResource, NetScriptPlugin } from '@netscript/plugin/adapter';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';
import {
  barrelScaffolder,
  DEFAULT_BARREL_INPUT,
  DEFAULT_RUNTIME_GLUE_INPUT,
  DEFAULT_SAGA_INPUT,
  EMPTY_BARREL_INPUT,
  emptyBarrelScaffolder,
  runtimeGlueScaffolder,
  sagaResource,
} from './resources/mod.ts';

/** Starter resources emitted by the sagas install command. */
export const sagasStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: sagaResource.scaffolder, input: DEFAULT_SAGA_INPUT, samples: { kind: 'omit' } },
  {
    scaffolder: barrelScaffolder,
    input: DEFAULT_BARREL_INPUT,
    samples: {
      kind: 'alternate',
      scaffolder: emptyBarrelScaffolder,
      input: EMPTY_BARREL_INPUT,
    },
  },
  { scaffolder: runtimeGlueScaffolder, input: DEFAULT_RUNTIME_GLUE_INPUT },
];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const sagasAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-sagas',
  kind: 'sagas',
  displayName: 'Saga Orchestrator',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-sagas@${PLUGIN_PACKAGE_VERSION}`,
    starterResources: sagasStarterResources,
    configParams: ['SAGAS_API_URL', 'SAGA_CONCURRENCY'],
    wiringEntry: '@netscript/plugin-sagas-core/stores',
  },
  doctor: {
    healthEndpoint: '/sagas/health',
    requiredConfigKeys: ['SAGAS_API_URL'],
  },
  info: {
    capabilities: [
      'durable saga orchestration',
      'saga API endpoints',
      'saga runtime registries',
      'database-backed saga state',
    ],
    versionSource: 'package',
  },
  update: {
    strategy: 'dependency',
    targetSpecifier: `jsr:@netscript/plugin-sagas@${PLUGIN_PACKAGE_VERSION}`,
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [sagaResource],
};
