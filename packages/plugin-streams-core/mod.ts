/**
 * @module @netscript/plugin-streams-core
 *
 * Durable stream schema, producer, configuration, telemetry, testing, and
 * diagnostics primitives for NetScript runtime plugins.
 *
 * @example Define a stream schema
 * ```ts
 * import { defineStreamSchema } from "@netscript/plugin-streams-core";
 *
 * const schema = defineStreamSchema({});
 * console.log(Object.keys(schema));
 * ```
 */

export { defineStreamSchema } from './src/public/mod.ts';
export { createDurableStream, DurableStreamProducer } from './src/public/mod.ts';
export { buildStreamUrl, getStreamsAuth, getStreamsUrl } from './src/public/mod.ts';
export { inspectStreamTopic } from './src/public/mod.ts';
export type { DurableStreamProducerOptions, StreamProducerPort } from './src/public/mod.ts';
export type { StreamTopicInspectionInput, StreamTopicInspectionReport } from './src/public/mod.ts';
export type {
  ChangeEvent,
  CollectionDefinition,
  CollectionEventHelpers,
  CollectionWithHelpers,
  ControlEvent,
  Operation,
  StateEvent,
  StateSchema,
  StreamStateDefinition,
} from './src/public/mod.ts';
