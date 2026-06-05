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
  type StreamsE2eContribution,
  streamsPlugin,
  type StreamsPluginContributions,
  type StreamsPluginManifest,
  type StreamsServiceContribution,
  type StreamsTelemetryContribution,
  defineStreamConsumer,
  defineStreamProducer,
  defineStreamTopic,
  type StreamConsumerHandle,
  type StreamProducerHandle,
  type StreamTopicDefinition,
} from './src/public/mod.ts';
