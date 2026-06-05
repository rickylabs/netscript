import { stream as durableStream } from '@durable-streams/client';
import {
  buildStreamUrl,
  createDurableStream,
  defineStreamSchema,
} from '@netscript/plugin-streams-core';
import {
  createProbeStreamPath,
  ignoreExpectedProbeCleanupError,
  probePayloadSchema,
  resolveStreamsProbeUrl,
} from './probe-context.ts';

function hasExpectedKey(item: unknown, expectedKey: string): item is { key: string } {
  return typeof item === 'object' && item !== null && 'key' in item &&
    (item as { key?: unknown }).key === expectedKey;
}

const baseUrl = resolveStreamsProbeUrl();
Deno.env.set('DURABLE_STREAMS_URL', baseUrl);
const streamPath = createProbeStreamPath('subscribe');

const schema = defineStreamSchema({
  probe: {
    schema: probePayloadSchema,
    type: 'probe',
    primaryKey: 'id',
  },
});

const producer = createDurableStream({
  streamPath,
  schema,
  producerId: 'streams-e2e-subscribe',
});

const expectedId = crypto.randomUUID();
producer.upsert('probe', {
  id: expectedId,
  status: 'subscribed',
});
await producer.flush();

const response = await durableStream({
  url: buildStreamUrl(streamPath, baseUrl),
  offset: '-1',
  live: true,
  signal: AbortSignal.timeout(5_000),
});

const items = await response.json<unknown>();
response.cancel();
// The probe has already consumed the validation payload; cleanup errors should
// not mask the subscription assertion below.
await response.closed.catch(ignoreExpectedProbeCleanupError);
await producer.close();

const received = items.some((item) => hasExpectedKey(item, expectedId));
if (!received) {
  throw new Error(`Streams subscribe probe did not receive expected event ${expectedId}`);
}
