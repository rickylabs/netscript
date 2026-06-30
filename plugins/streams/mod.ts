/**
 * @module @netscript/plugin-streams
 *
 * NetScript plugin manifest for the Durable Streams development service.
 *
 * @example Load the plugin manifest
 * ```ts
 * import { streamsPlugin } from "@netscript/plugin-streams";
 *
 * console.log(streamsPlugin.name);
 * ```
 */

export {
  type BackgroundProcessorContribution,
  type ContractVersionContribution,
  type DbSchemaContribution,
  defineStreamConsumer,
  defineStreamProducer,
  defineStreamTopic,
  type E2eContribution,
  type MigrationContribution,
  PLUGIN_TYPES,
  type PluginContext,
  type PluginContributions,
  type PluginDependencies,
  type PluginLifecycleHooks,
  type PluginLogger,
  type PluginManifest,
  type PluginMetadata,
  type PluginMetadataValue,
  type PluginType,
  type RuntimeConfigTopicContribution,
  type ServiceContribution,
  type StreamConsumerHandle,
  type StreamPayloadSchema,
  type StreamProducerHandle,
  streamsPlugin,
  type StreamTopicContribution,
  type StreamTopicDefinition,
  StreamUnsupportedOperationError,
  type TelemetryContribution,
  unsupportedStreamOperation,
} from './src/public/mod.ts';
