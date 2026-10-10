import { definePlugin, PLUGIN_TYPES } from '@netscript/plugin';
import type { PluginManifest } from '@netscript/plugin';
import {
  defineStreamConsumer,
  defineStreamProducer,
  defineStreamTopic,
  type StreamConsumerHandle,
  type StreamPayloadSchema,
  type StreamProducerHandle,
  type StreamTopicDefinition,
  StreamUnsupportedOperationError,
  unsupportedStreamOperation,
} from './stream-api.ts';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';

/** Plugin package version, single-sourced from the package `deno.json`. */
const VERSION: string = PLUGIN_PACKAGE_VERSION;

const STREAMS_SERVICE_PERMISSIONS = [
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
  '--allow-sys',
  '--allow-ffi',
] as const;

/**
 * Plugin manifest for the NetScript Durable Streams service.
 *
 * @example
 * ```ts
 * import { streamsPlugin } from "@netscript/plugin-streams";
 *
 * console.log(streamsPlugin.contributions?.services?.[0]?.name);
 * ```
 */
export const streamsPlugin: PluginManifest = definePlugin('@netscript/plugin-streams', VERSION)
  .withDisplayName('Streams (ephemeral by default)')
  .withType('utility')
  .withDescription(
    'Ephemeral streams service with restart-proven file storage opt-in via STREAMS_DATA_DIR.',
  )
  .withAuthor('NetScript Team')
  .withLicense('Apache-2.0')
  .withTags(['streams', 'sse', 'realtime', 'durable-streams-protocol', 'tanstack-db'])
  .withPermissions(STREAMS_SERVICE_PERMISSIONS)
  .withService({
    name: 'streams',
    entrypoint: './services/src/main.ts',
  })
  .withTelemetry([{
    name: 'streams',
    module: '@netscript/plugin-streams-core/telemetry',
  }])
  .withE2e([{
    name: 'streams-health',
    command: 'deno task streams:e2e',
  }])
  .withAspire('./src/aspire/mod.ts')
  .withHooks({
    setup: (ctx): void => {
      ctx.logger.info('Durable Streams plugin loaded', {
        pluginRoot: ctx.pluginRoot ?? '',
      });
    },
    teardown: (ctx): void => {
      ctx.logger.info('Durable Streams plugin unloaded');
    },
  })
  .withMetadata({
    repository: 'https://github.com/rickylabs/netscript-start',
    documentation: 'https://netscript.dev/plugins/streams',
    storage: {
      defaultMode: 'memory',
      ephemeral: true,
      fileOptInEnv: 'STREAMS_DATA_DIR',
      startupProbe: 'write-read',
      restartGuarantee: 'orderly-process-restart',
    },
    features: [
      'Durable Streams protocol HTTP server; memory storage by default',
      'SSE and long-poll consumers',
      'Idempotent producer support',
      'State Protocol entity upsert and delete events',
    ],
    requirements: {
      deno: '>=2.0.0',
      netscript: '>=1.0.0',
    },
  })
  .build();

export {
  defineStreamConsumer,
  defineStreamProducer,
  defineStreamTopic,
  PLUGIN_TYPES,
  type StreamConsumerHandle,
  type StreamPayloadSchema,
  type StreamProducerHandle,
  type StreamTopicDefinition,
  StreamUnsupportedOperationError,
  unsupportedStreamOperation,
};
export type {
  BackgroundProcessorContribution,
  ContractVersionContribution,
  DbSchemaContribution,
  E2eContribution,
  MigrationContribution,
  PluginContext,
  PluginContributions,
  PluginDependencies,
  PluginLifecycleHooks,
  PluginLogger,
  PluginManifest,
  PluginMetadata,
  PluginMetadataValue,
  PluginType,
  RuntimeConfigTopicContribution,
  ServiceContribution,
  StreamTopicContribution,
  TelemetryContribution,
} from '@netscript/plugin';
