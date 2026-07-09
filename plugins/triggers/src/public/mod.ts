/**
 * @module @netscript/plugin-triggers/public
 *
 * Public manifest constants for the triggers plugin package.
 */

import { definePlugin, type PluginManifest } from '@netscript/plugin';
import {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
  TRIGGERS_PLUGIN_VERSION,
} from '../constants.ts';

const TRIGGERS_SERVICE_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
] as const;

const triggersPluginDependencies = Object.freeze({
  workersCore: definePlugin('@netscript/plugin-workers-core', '0.0.1-alpha.0').build(),
  streamsCore: definePlugin('@netscript/plugin-streams-core', '0.0.1-alpha.0').build(),
  sagasCore: definePlugin('@netscript/plugin-sagas-core', '0.0.1-alpha.0').build(),
});

const triggersManifest: PluginManifest = definePlugin(
  '@netscript/plugin-triggers',
  TRIGGERS_PLUGIN_VERSION,
)
  .withDisplayName('Triggers')
  .withType('background-processor')
  .withDescription('Trigger ingress, scheduling, file watching, and trigger runtime APIs.')
  .withAuthor('NetScript Team')
  .withLicense('Apache-2.0')
  .withTags(['triggers', 'webhooks', 'schedules', 'file-watchers'])
  .withPermissions(TRIGGERS_SERVICE_PERMISSIONS)
  .withDependencies(triggersPluginDependencies)
  .withService({
    name: TRIGGERS_API_SERVICE_NAME,
    entrypoint: './services/src/main.ts',
    port: TRIGGERS_API_DEFAULT_PORT,
  })
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
  .withRuntimeConfigTopics([
    { name: TRIGGERS_PLUGIN_ID, schemaPath: './runtime/triggers.schema.json' },
  ])
  .withE2e([{
    name: 'triggers-health',
    command: 'deno task triggers:e2e',
  }])
  .withAspire('./src/aspire/mod.ts')
  .withHooks({
    setup: (ctx): void => {
      ctx.logger.info('Triggers plugin loaded', {
        pluginRoot: ctx.pluginRoot ?? '',
        projectRoot: ctx.projectRoot,
        isDev: ctx.isDev ?? false,
      });
    },
    beforeGenerate: (ctx): void => {
      ctx.logger.info('Triggers plugin beforeGenerate hook');
    },
    afterGenerate: (ctx): void => {
      ctx.logger.info('Triggers plugin afterGenerate hook');
    },
    teardown: (ctx): void => {
      ctx.logger.info('Triggers plugin unloaded');
    },
  })
  .withMetadata({
    repository: 'https://github.com/rickylabs/netscript-start',
    documentation: 'https://netscript.dev/plugins/triggers',
    features: [
      'Ack-then-process webhook ingress',
      'Cron-backed scheduled triggers',
      'File-watch trigger adapters',
      'Typed worker, stream, and saga cross-axis integration',
      'Trigger runtime management API',
    ],
    requirements: {
      deno: '>=2.0.0',
      netscript: '>=1.0.0',
    },
  })
  .build();

/** Plugin manifest for NetScript triggers. */
export const triggersPlugin: PluginManifest = triggersManifest;

export {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
  TRIGGERS_PLUGIN_VERSION,
} from '../constants.ts';
export type {
  TriggersApiServiceName,
  TriggersPluginId,
  TriggersPluginVersion,
} from '../constants.ts';
