/** Streams stream resource scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type PluginResource,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import {
  camelStem,
  durableStreamPath,
  exportStem,
  fileStem,
  parseStreamInput,
  streamDirectory,
  streamEventType,
  type StreamInput,
  streamProducerId,
} from '../input.ts';
import { streamDefinitionStub } from './stream.stub.ts';

/** Canonical starter stream input emitted during streams install. */
export const DEFAULT_STREAM_INPUT: StreamInput = {
  id: 'notifications',
  eventType: 'notifications.event',
  streamPath: '/v1/streams/notifications/events',
  producerId: 'notifications-producer',
};

/** Unified streams item scaffolder used by install and add stream. */
export const streamScaffolder: ItemScaffolder<StreamInput> = {
  name: 'stream',
  emit(input: StreamInput): readonly ScaffoldArtifact[] {
    const stem = fileStem(input.id);
    const exportBase = camelStem(input.id);
    return [
      textArtifact(
        `${streamDirectory(input)}/${stem}-stream.ts`,
        substituteTokens(streamDefinitionStub, {
          EVENT_TYPE: streamEventType(input),
          PRODUCER_EXPORT: `${exportBase}Stream`,
          PRODUCER_ID: streamProducerId(input),
          SCHEMA_EXPORT: `${exportBase}StreamSchema`,
          STREAM_DEFINITION: `${exportStem(input.id)}StreamDefinition`,
          STREAM_PATH: durableStreamPath(input),
        }),
      ),
    ];
  },
};

/** Streams stream plugin resource descriptor. */
export const streamResource: PluginResource<StreamInput> = {
  name: 'stream',
  scaffolder: streamScaffolder,
  defaultInput: DEFAULT_STREAM_INPUT,
  parseInput: parseStreamInput,
};
