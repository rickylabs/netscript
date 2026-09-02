/** NetScript adapter contract for the triggers plugin.
 *
 * @module
 */

import {
  type InstallStarterResource,
  type ItemScaffolder,
  type NetScriptPlugin,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/adapter';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';
import {
  barrelScaffolder,
  DEFAULT_BARREL_INPUT,
  DEFAULT_FILE_WATCH_INPUT,
  DEFAULT_RUNTIME_GLUE_INPUT,
  DEFAULT_SCHEDULED_INPUT,
  DEFAULT_WEBHOOK_INPUT,
  EMPTY_BARREL_INPUT,
  emptyBarrelScaffolder,
  fileWatchResource,
  runtimeGlueScaffolder,
  scheduledResource,
  webhookResource,
} from './resources/mod.ts';

const controlPlaneModuleScaffolder: ItemScaffolder<Readonly<Record<string, never>>> = {
  name: 'control-plane-module',
  emit(): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'triggers/plugin.ts',
        `/** Generated triggers control-plane module. */\n\nexport const NETSCRIPT_CONTRIBUTION_BUILDERS = [\n  { callee: 'defineWebhook', axis: 'triggers' },\n] as const;\n\nexport { triggersPlugin } from '@netscript/plugin-triggers';\n`,
      ),
    ];
  },
};

/** Starter resources emitted by the triggers install command. */
export const triggersStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: controlPlaneModuleScaffolder, input: {} },
  {
    scaffolder: webhookResource.scaffolder,
    input: DEFAULT_WEBHOOK_INPUT,
    samples: { kind: 'omit' },
  },
  {
    scaffolder: scheduledResource.scaffolder,
    input: DEFAULT_SCHEDULED_INPUT,
    samples: { kind: 'omit' },
  },
  {
    scaffolder: fileWatchResource.scaffolder,
    input: DEFAULT_FILE_WATCH_INPUT,
    samples: { kind: 'omit' },
  },
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
export const triggersAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-triggers',
  kind: 'triggers',
  displayName: 'Trigger Processor',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-triggers@${PLUGIN_PACKAGE_VERSION}`,
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
    targetSpecifier: `jsr:@netscript/plugin-triggers@${PLUGIN_PACKAGE_VERSION}`,
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [webhookResource, fileWatchResource, scheduledResource],
};
