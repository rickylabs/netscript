import { createDurableStream, defineStreamSchema } from '@netscript/plugin-streams-core';
import {
  createProbeStreamPath,
  probePayloadSchema,
  resolveStreamsProbeUrl,
} from './probe-context.ts';

const baseUrl = resolveStreamsProbeUrl();
Deno.env.set('DURABLE_STREAMS_URL', baseUrl);

const schema = defineStreamSchema({
  probe: {
    schema: probePayloadSchema,
    type: 'probe',
    primaryKey: 'id',
  },
});

const producer = createDurableStream({
  streamPath: createProbeStreamPath('publish'),
  schema,
  producerId: 'streams-e2e-publish',
});

producer.upsert('probe', {
  id: crypto.randomUUID(),
  status: 'published',
});

await producer.flush();
await producer.close();
