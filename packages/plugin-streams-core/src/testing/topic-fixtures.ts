import { defineStreamSchema } from '../builders/define-stream-schema.ts';
import type { CollectionDefinition, StateSchema } from '../domain/stream-schema.ts';

/** Schema shape returned by `createStreamTopicFixture`. */
export type StreamTopicFixtureSchema = StateSchema<{
  readonly execution: CollectionDefinition<Record<string, unknown>>;
}>;

const passthroughSchema: CollectionDefinition<Record<string, unknown>>['schema'] = {
  '~standard': {
    version: 1,
    vendor: 'netscript-test',
    validate: (value: unknown) =>
      isRecord(value) ? { value } : { issues: [{ message: 'Expected a record value' }] },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Create a small stream schema fixture with one `execution` collection.
 *
 * @returns A durable stream schema suitable for producer and diagnostics tests.
 */
export function createStreamTopicFixture(): StreamTopicFixtureSchema {
  return defineStreamSchema({
    execution: {
      schema: passthroughSchema,
      type: 'execution',
      primaryKey: 'id',
    },
  });
}
