/** Type-checked source stubs for generated stream userland files.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked stream definition stub with named substitution tokens. */
export const streamDefinitionStub: StubSource<
  | 'EVENT_TYPE'
  | 'PRODUCER_EXPORT'
  | 'PRODUCER_ID'
  | 'SCHEMA_EXPORT'
  | 'STREAM_DEFINITION'
  | 'STREAM_PATH'
> = defineStub({
  source: `/**
 * Sample durable stream emitted into a user workspace at \`streams/notifications-stream.ts\`.
 *
 * This file is shipped as a real, type-checked stub inside \`@netscript/plugin-streams\` and is copied
 * verbatim into the user's workspace by \`plugin add streams\`. The user owns and edits it; the
 * scaffolder never rewrites it after the first scaffold. Keep it minimal, dependency-direction clean
 * (import only the published runtime core \`@netscript/plugin-streams-core\`), and free of
 * scaffold-time tokens so it can be emitted with no interpolation.
 *
 * @module
 */

import {
  createDurableStream,
  defineStreamSchema,
  type DurableStreamProducer,
  type StateSchema,
  type StreamStateDefinition,
} from '@netscript/plugin-streams-core';
import { z } from 'zod';

/** Collection definition for the sample notifications stream. */
interface %%STREAM_DEFINITION%% extends StreamStateDefinition {
  readonly event: {
    readonly schema: unknown;
    readonly type: '%%EVENT_TYPE%%';
    readonly primaryKey: 'id';
  };
}

/**
 * Standard-Schema validated state schema for the sample notifications stream. Replace the Zod shape
 * and collection name with your own domain events.
 */
export const %%SCHEMA_EXPORT%%: StateSchema<%%STREAM_DEFINITION%%> =
  defineStreamSchema({
    event: {
      type: '%%EVENT_TYPE%%',
      primaryKey: 'id',
      schema: z.object({
        id: z.string(),
        type: z.string(),
        payload: z.record(z.string(), z.unknown()),
      }),
    },
  });

/**
 * A starter durable-stream producer wired to {@linkcode notificationsStreamSchema}. The
 * \`@netscript/plugin-streams-core\` import is all the streams runtime needs to publish to it; point
 * \`streamPath\` at your service's stream route and give the producer a stable identity.
 */
export const %%PRODUCER_EXPORT%%: DurableStreamProducer<%%STREAM_DEFINITION%%> =
  createDurableStream({
    streamPath: '%%STREAM_PATH%%',
    schema: %%SCHEMA_EXPORT%%,
    producerId: '%%PRODUCER_ID%%',
  });

export default %%PRODUCER_EXPORT%%;
`,
  tokens: [
    'EVENT_TYPE',
    'PRODUCER_EXPORT',
    'PRODUCER_ID',
    'SCHEMA_EXPORT',
    'STREAM_DEFINITION',
    'STREAM_PATH',
  ] as const,
});
