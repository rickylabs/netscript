import { defineStub, type StubSource } from '@netscript/plugin/adapter';

type ConsumerToken =
  | 'DB_EXPORT'
  | 'FACTORY_FILE'
  | 'ISLAND_EXPORT'
  | 'SCHEMA_EXPORT'
  | 'STREAM_PATH';

const TOKENS = [
  'DB_EXPORT',
  'FACTORY_FILE',
  'ISLAND_EXPORT',
  'SCHEMA_EXPORT',
  'STREAM_PATH',
] as const;

/** Type-checked StreamDB factory template. */
export const streamConsumerFactoryStub: StubSource<ConsumerToken> = defineStub({
  source: `/** Generated browser StreamDB factory for %%STREAM_PATH%%. */
import { createStreamDB } from '@durable-streams/state/db';
import {
  buildStreamUrl,
  defineStreamSchema,
  getStreamsAuth,
} from '@netscript/plugin-streams-core';
import { z } from 'zod';

/** Minimal event schema; replace it with the topic's domain schema. */
export const %%SCHEMA_EXPORT%% = defineStreamSchema({
  event: {
    schema: z.object({ id: z.string() }).passthrough(),
    type: 'event',
    primaryKey: 'id',
  },
});

/** Create the live StreamDB collections for %%STREAM_PATH%%. */
export function %%DB_EXPORT%%(options: { readonly baseUrl?: string } = {}) {
  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('%%STREAM_PATH%%', options.baseUrl ?? 'http://localhost:4437'),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: %%SCHEMA_EXPORT%%,
  });
}
`,
  tokens: TOKENS,
});

/** Type-checked Fresh query-island template. */
export const streamConsumerIslandStub: StubSource<ConsumerToken> = defineStub({
  source: `/** Generated Fresh query island for %%STREAM_PATH%%. */
import { useLiveQuery } from '@tanstack/react-db';
import { %%DB_EXPORT%% } from '../streams/%%FACTORY_FILE%%.ts';

const streamDb = %%DB_EXPORT%%();

/** Render the current event collection as inspectable JSON. */
export default function %%ISLAND_EXPORT%%() {
  const query = useLiveQuery((q) => q.from({ event: streamDb.collections.event }));
  return <pre>{JSON.stringify(query.data ?? [], null, 2)}</pre>;
}
`,
  tokens: TOKENS,
});

/** Type-checked Fresh 2.x seed-route template. */
export const streamConsumerSeedStub: StubSource<ConsumerToken> = defineStub({
  source: `/** Generated Fresh 2.x seed loader for %%STREAM_PATH%%. */
import { createDefine } from 'fresh';
import { createDurableStream } from '@netscript/plugin-streams-core';
import { %%SCHEMA_EXPORT%% } from '../../../../streams/%%FACTORY_FILE%%.ts';

const define = createDefine();

/** POST one development event into %%STREAM_PATH%%. */
export const handler = define.handlers({
  async POST(ctx) {
    const value = await ctx.req.json() as Record<string, unknown>;
    const event = value.id === undefined ? { ...value, id: crypto.randomUUID() } : value;
    const producer = createDurableStream({
      streamPath: '%%STREAM_PATH%%',
      schema: %%SCHEMA_EXPORT%%,
      producerId: 'fresh-seed-loader',
    });
    producer.upsert('event', event);
    await producer.flush();
    await producer.close();
    return Response.json(event, { status: 201 });
  },
});
`,
  tokens: TOKENS,
});
