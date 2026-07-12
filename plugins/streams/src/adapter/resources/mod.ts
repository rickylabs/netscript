/** Streams adapter resources.
 *
 * @module
 */

export { type BarrelInput, barrelScaffolder, DEFAULT_BARREL_INPUT } from './barrel/barrel.ts';
export { DEFAULT_STREAM_INPUT, streamResource, streamScaffolder } from './stream/stream.ts';
export {
  parseStreamSchemaInput,
  type StreamSchemaCollectionInput,
  type StreamSchemaInput,
  streamSchemaResource,
  streamSchemaScaffolder,
} from './schema/schema.ts';
export {
  parseStreamProducerInput,
  type StreamProducerInput,
  streamProducerResource,
  streamProducerScaffolder,
} from './producer/producer.ts';
export {
  type StreamConsumerInput,
  streamConsumerResource,
  streamConsumerScaffolder,
} from './consumer/consumer.ts';
export {
  camelStem,
  durableStreamPath,
  exportStem,
  fileStem,
  parseStreamInput,
  requiredResourceId,
  streamDirectory,
  streamEventType,
  streamProducerId,
} from './input.ts';
export type { StreamInput } from './input.ts';
