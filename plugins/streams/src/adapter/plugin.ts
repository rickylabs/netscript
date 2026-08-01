/** NetScript adapter contract for the streams plugin.
 *
 * @module
 */

import type { InstallStarterResource, NetScriptPlugin } from '@netscript/plugin/adapter';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';
import {
  barrelScaffolder,
  DEFAULT_BARREL_INPUT,
  DEFAULT_STREAM_INPUT,
  EMPTY_BARREL_INPUT,
  emptyBarrelScaffolder,
  streamConsumerResource,
  streamProducerResource,
  streamResource,
  streamSchemaResource,
} from './resources/mod.ts';

/** Starter resources emitted by the streams install command. */
export const streamsStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: streamResource.scaffolder, input: DEFAULT_STREAM_INPUT, samples: { kind: 'omit' } },
  {
    scaffolder: barrelScaffolder,
    input: DEFAULT_BARREL_INPUT,
    samples: {
      kind: 'alternate',
      scaffolder: emptyBarrelScaffolder,
      input: EMPTY_BARREL_INPUT,
    },
  },
];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const streamsAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-streams',
  kind: 'streams',
  displayName: 'Durable Streams',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-streams@${PLUGIN_PACKAGE_VERSION}`,
    starterResources: streamsStarterResources,
    configParams: ['STREAMS_API_URL'],
    wiringEntry: '@netscript/plugin-streams/streams',
  },
  doctor: {
    healthEndpoint: '/streams/health',
    requiredConfigKeys: ['STREAMS_API_URL'],
  },
  info: {
    capabilities: [
      'durable stream producers',
      'stream service endpoints',
      'Aspire service contribution',
      'streams E2E probes',
    ],
    versionSource: 'package',
  },
  update: {
    strategy: 'dependency',
    targetSpecifier: `jsr:@netscript/plugin-streams@${PLUGIN_PACKAGE_VERSION}`,
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [streamResource, streamSchemaResource, streamProducerResource, streamConsumerResource],
};
