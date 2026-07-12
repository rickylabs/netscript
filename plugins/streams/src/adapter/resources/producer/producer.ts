/** Stream producer resource scaffolder. */

import {
  type ItemScaffolder,
  type PluginCliArgs,
  type PluginResource,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { camelStem, exportStem, fileStem, requiredResourceId } from '../input.ts';
import { streamProducerStub } from './producer.stub.ts';

/** Input accepted by `streams add-producer`. */
export interface StreamProducerInput {
  readonly name: string;
  readonly streamPath: string;
  readonly producerId: string;
}

/** Emit a producer around `createDurableStream`. */
export const streamProducerScaffolder: ItemScaffolder<StreamProducerInput> = {
  name: 'producer',
  emit(input: StreamProducerInput): readonly ScaffoldArtifact[] {
    const stem = fileStem(input.name);
    return [
      textArtifact(
        `streams/${stem}-producer.ts`,
        substituteTokens(streamProducerStub, {
          PRODUCER_EXPORT: `${camelStem(input.name)}StreamProducer`,
          PRODUCER_ID: input.producerId,
          SCHEMA_EXPORT: `${exportStem(input.name)}StreamSchema`,
          SCHEMA_FILE: `${stem}-schema`,
          STREAM_PATH: input.streamPath,
        }),
      ),
    ];
  },
};

/** Producer resource exposed through the generic plugin adapter. */
export const streamProducerResource: PluginResource<StreamProducerInput> = {
  name: 'producer',
  scaffolder: streamProducerScaffolder,
  parseInput: parseStreamProducerInput,
};

/** Parse producer name and required routing flags. */
export function parseStreamProducerInput(args: PluginCliArgs): StreamProducerInput {
  const name = requiredResourceId(args);
  const streamPath = requiredStringFlag(args, 'stream-path');
  const producerId = requiredStringFlag(args, 'producer-id');
  return { name, streamPath, producerId };
}

function requiredStringFlag(args: PluginCliArgs, name: string): string {
  const value = args.flags?.[name];
  if (value === undefined || String(value).trim() === '') {
    throw new TypeError(`Missing required --${name}.`);
  }
  return String(value);
}
