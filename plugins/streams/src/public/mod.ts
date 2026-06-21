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

const STREAMS_SERVICE_PERMISSIONS = [
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
  '--allow-sys',
  '--allow-ffi',
] as const;

/** Service contributed by the streams plugin. */
export interface StreamsServiceContribution {
  /** Logical service name. */
  readonly name: string;
  /** Service entrypoint path. */
  readonly entrypoint: string;
  /** Service port. */
  readonly port?: number;
}

/** Telemetry contribution exposed by the streams plugin. */
export interface StreamsTelemetryContribution {
  /** Instrumentation contribution name. */
  readonly name: string;
  /** Instrumentation module specifier. */
  readonly module: string;
}

/** E2E contribution exposed by the streams plugin. */
export interface StreamsE2eContribution {
  /** Gate name. */
  readonly name: string;
  /** Command used to execute the gate. */
  readonly command: string;
}

/** Public contribution groups exposed by the streams plugin. */
export interface StreamsPluginContributions {
  /** Service contributions registered by the plugin. */
  readonly services?: readonly StreamsServiceContribution[];
  /** Telemetry contributions registered by the plugin. */
  readonly telemetry?: readonly StreamsTelemetryContribution[];
  /** End-to-end gate contributions registered by the plugin. */
  readonly e2e?: readonly StreamsE2eContribution[];
  /** Aspire contribution module reference. */
  readonly aspire?: string;
}

/** Public manifest shape for the streams plugin. */
export interface StreamsPluginManifest extends PluginManifest {
  /** Declared contribution axes. */
  readonly contributions: StreamsPluginContributions;
  /** Define a typed stream topic. */
  readonly defineTopic: typeof defineStreamTopic;
  /** Define a typed stream producer handle. */
  readonly defineProducer: typeof defineStreamProducer;
  /** Define a typed stream consumer handle. */
  readonly defineConsumer: typeof defineStreamConsumer;
}

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
const streamsManifest = definePlugin('@netscript/plugin-streams', '0.0.1-alpha.0')
  .withDisplayName('Durable Streams')
  .withType('utility')
  .withDescription('Durable Streams service and tooling for NetScript applications.')
  .withAuthor('NetScript Team')
  .withLicense('MIT')
  .withTags(['streams', 'sse', 'realtime', 'durable', 'tanstack-db'])
  .withPermissions(STREAMS_SERVICE_PERMISSIONS)
  .withService({
    name: 'streams',
    entrypoint: './services/src/main.ts',
    port: 4437,
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
    features: [
      'Durable stream HTTP server for development and tests',
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

/** Plugin manifest for the NetScript Durable Streams service. */
export const streamsPlugin: StreamsPluginManifest = Object.freeze({
  ...streamsManifest,
  defineTopic: defineStreamTopic,
  defineProducer: defineStreamProducer,
  defineConsumer: defineStreamConsumer,
}) as StreamsPluginManifest;

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
