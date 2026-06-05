/**
 * @module
 *
 * Curated public surface for `@netscript/plugin-streams-core`.
 */

export {};
export { defineStreamSchema } from '../builders/define-stream-schema.ts';
export {
  createDurableStream,
  DurableStreamProducer,
} from '../application/create-durable-stream.ts';
export {
  buildStreamUrl,
  getStreamsAuth,
  getStreamsUrl,
} from '../application/stream-url-resolver.ts';
export { inspectStreamTopic } from '../diagnostics/inspect-stream-topic.ts';
export type {
  StreamTopicInspectionInput,
  StreamTopicInspectionReport,
} from '../diagnostics/inspect-stream-topic.ts';
export type { DurableStreamProducerOptions } from '../application/create-durable-stream.ts';
export type {
  CollectionDefinition,
  CollectionEventHelpers,
  CollectionWithHelpers,
  StateSchema,
  StreamStateDefinition,
} from '../domain/stream-schema.ts';
export type { ChangeEvent, ControlEvent, Operation, StateEvent } from '../domain/stream-event.ts';
export type { StreamProducerPort } from '../ports/stream-producer-port.ts';
