import { DurableStreamProducer } from '../../../../../../../packages/plugin-streams-core/src/application/create-durable-stream.ts';
import type { CollectionDefinition } from '../../../../../../../packages/plugin-streams-core/src/domain/stream-schema.ts';
import { createStreamTopicFixture } from '../../../../../../../packages/plugin-streams-core/src/testing/mod.ts';

type FixtureDefinition = {
  readonly execution: CollectionDefinition<Record<string, unknown>>;
};

/** Create the unchanged pre-fix producer surface for one compile-time negative. */
export function createProducerFixture(): DurableStreamProducer<FixtureDefinition> {
  return new DurableStreamProducer({
    streamPath: '/red/api-absence',
    schema: createStreamTopicFixture(),
    producerId: 'red-api-absence',
  });
}
