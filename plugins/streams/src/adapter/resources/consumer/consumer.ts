/** Stream consumer resource scaffolder. */

import {
  type ItemScaffolder,
  type PluginCliArgs,
  type PluginResource,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { camelStem, exportStem, fileStem, requiredResourceId } from '../input.ts';
import {
  streamConsumerFactoryStub,
  streamConsumerIslandStub,
  streamConsumerSeedStub,
} from './consumer.stub.ts';

/** Input accepted by `streams add-consumer`. */
export interface StreamConsumerInput {
  readonly topic: string;
}

/** Emit a StreamDB factory, query island, and Fresh server seed loader. */
export const streamConsumerScaffolder: ItemScaffolder<StreamConsumerInput> = {
  name: 'consumer',
  emit(input: StreamConsumerInput): readonly ScaffoldArtifact[] {
    const stem = topicStem(input.topic);
    const exportName = exportStem(stem);
    const tokens = {
      DB_EXPORT: `create${exportName}StreamDB`,
      FACTORY_FILE: `${stem}-db`,
      ISLAND_EXPORT: `${exportName}Stream`,
      SCHEMA_EXPORT: `${camelStem(stem)}ConsumerSchema`,
      STREAM_PATH: normalizedTopic(input.topic),
    };
    return [
      textArtifact(`streams/${stem}-db.ts`, substituteTokens(streamConsumerFactoryStub, tokens)),
      textArtifact(
        `islands/${exportName}Stream.tsx`,
        substituteTokens(streamConsumerIslandStub, tokens),
      ),
      textArtifact(
        `routes/api/streams/${stem}/seed.ts`,
        substituteTokens(streamConsumerSeedStub, tokens),
      ),
    ];
  },
};

/** Consumer resource exposed through the generic plugin adapter. */
export const streamConsumerResource: PluginResource<StreamConsumerInput> = {
  name: 'consumer',
  scaffolder: streamConsumerScaffolder,
  parseInput: (args: PluginCliArgs): StreamConsumerInput => ({ topic: requiredResourceId(args) }),
};

function normalizedTopic(topic: string): string {
  return topic.startsWith('/') ? topic : `/${topic}`;
}

function topicStem(topic: string): string {
  return fileStem(topic.split('/').filter(Boolean).at(-1) ?? topic);
}
