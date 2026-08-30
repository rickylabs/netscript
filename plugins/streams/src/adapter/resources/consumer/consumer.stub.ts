import { defineStub, type StubSource } from '@netscript/plugin/adapter';

type ConsumerToken =
  | 'DB_EXPORT'
  | 'FACTORY_FILE'
  | 'ISLAND_EXPORT'
  | 'SCHEMA_EXPORT'
  | 'SUBSCRIBE_EXPORT'
  | 'STREAM_PATH';

const TOKENS = [
  'DB_EXPORT',
  'FACTORY_FILE',
  'ISLAND_EXPORT',
  'SCHEMA_EXPORT',
  'SUBSCRIBE_EXPORT',
  'STREAM_PATH',
] as const;

/** Type-checked StreamDB factory template. */
export const streamConsumerFactoryStub: StubSource<ConsumerToken> = defineStub({
  source: `/** Generated browser StreamDB factory for %%STREAM_PATH%%. */
import {
  createNetScriptStreamEventSourceV1,
  type CreateNetScriptStreamEventSourceOptionsV1,
} from '@netscript/fresh/streams';
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
      url: buildStreamUrl('%%STREAM_PATH%%', options.baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: %%SCHEMA_EXPORT%%,
  });
}

/** Bind the versioned named-event SSE consumer for %%STREAM_PATH%%. */
export function %%SUBSCRIBE_EXPORT%%(
  options: Omit<CreateNetScriptStreamEventSourceOptionsV1, 'streamPath'>,
) {
  return createNetScriptStreamEventSourceV1({ ...options, streamPath: '%%STREAM_PATH%%' });
}
`,
  tokens: TOKENS,
});

/** Type-checked Fresh query-island template. */
export const streamConsumerIslandStub: StubSource<ConsumerToken> = defineStub({
  source: `/** Generated Fresh named-event island for %%STREAM_PATH%%. */
import { useEffect, useState } from 'preact/hooks';
import { %%SUBSCRIBE_EXPORT%% } from '../streams/%%FACTORY_FILE%%.ts';

interface StreamViewItem {
  readonly key: string;
  readonly value: unknown;
}

/** Render the current event collection as inspectable JSON. */
export default function %%ISLAND_EXPORT%%() {
  const [items, setItems] = useState<readonly StreamViewItem[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const latest = new Map<string, unknown>();
    const binding = %%SUBSCRIBE_EXPORT%%({
      offset: '-1',
      onEvent(event) {
        if (event.event === 'error') {
          setError(event.payload.message);
          return;
        }
        if (event.event !== 'data') return;
        for (const change of event.payload) {
          if (change.headers.operation === 'delete') latest.delete(change.key);
          else latest.set(change.key, change.value);
        }
        setItems([...latest].map(([key, value]) => ({ key, value })));
      },
    });
    return () => binding.dispose();
  }, []);

  return <pre>{error ?? JSON.stringify(items, null, 2)}</pre>;
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
