import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked schema template with named substitution tokens. */
export const streamSchemaStub: StubSource<'COLLECTIONS' | 'SCHEMA_EXPORT'> = defineStub({
  source: `/** Generated durable stream schema. */
import {
  defineStreamSchema,
  type StateSchema,
  type StreamStateDefinition,
} from '@netscript/plugin-streams-core';
import { z } from 'zod';

/** Collections published on this durable stream. */
export const %%SCHEMA_EXPORT%%: StateSchema<StreamStateDefinition> = defineStreamSchema({
%%COLLECTIONS%%
});
`,
  tokens: ['COLLECTIONS', 'SCHEMA_EXPORT'] as const,
});
