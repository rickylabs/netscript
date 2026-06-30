/** NetScript adapter contract for the triggers plugin.
 *
 * @module
 */

import type { InstallStarterResource, NetScriptPlugin } from '@netscript/plugin/adapter';
import {
  barrelScaffolder,
  DEFAULT_BARREL_INPUT,
  DEFAULT_FILE_WATCH_INPUT,
  DEFAULT_SCHEDULED_INPUT,
  DEFAULT_WEBHOOK_INPUT,
  fileWatchResource,
  scheduledResource,
  webhookResource,
} from './resources/mod.ts';

/** Starter resources emitted by the triggers install command. */
export const triggersStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: webhookResource.scaffolder, input: DEFAULT_WEBHOOK_INPUT },
  { scaffolder: scheduledResource.scaffolder, input: DEFAULT_SCHEDULED_INPUT },
  { scaffolder: fileWatchResource.scaffolder, input: DEFAULT_FILE_WATCH_INPUT },
  { scaffolder: barrelScaffolder, input: DEFAULT_BARREL_INPUT },
];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const triggersAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-triggers',
  kind: 'triggers',
  displayName: 'Trigger Processor',
  install: {
    dependencySpecifier: 'jsr:@netscript/plugin-triggers@^0.0.1-alpha.12',
    starterResources: triggersStarterResources,
    configParams: ['TRIGGERS_API_URL', 'TRIGGER_CONCURRENCY'],
    wiringEntry: '@netscript/plugin-triggers-core/stores',
  },
  doctor: {
    healthEndpoint: '/triggers/health',
    requiredConfigKeys: ['TRIGGERS_API_URL'],
  },
  info: {
    capabilities: [
      'webhook ingress',
      'scheduled triggers',
      'file-watch triggers',
      'trigger runtime APIs',
    ],
    versionSource: 'package',
  },
  update: {
    strategy: 'dependency',
    targetSpecifier: 'jsr:@netscript/plugin-triggers@^0.0.1-alpha.12',
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [webhookResource, fileWatchResource, scheduledResource],
};
