import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked producer template with named substitution tokens. */
export const streamProducerStub: StubSource<
  'PRODUCER_EXPORT' | 'PRODUCER_ID' | 'SCHEMA_EXPORT' | 'SCHEMA_FILE' | 'STREAM_PATH'
> = defineStub({
  source: `/** Generated durable stream producer. */
import { createDurableStream } from '@netscript/plugin-streams-core';
import { %%SCHEMA_EXPORT%% } from './%%SCHEMA_FILE%%.ts';

const STREAM_PATH = '%%STREAM_PATH%%';
const PRODUCER_ID = '%%PRODUCER_ID%%';

/** Producer for %%STREAM_PATH%%. */
export const %%PRODUCER_EXPORT%% = createDurableStream({
  streamPath: STREAM_PATH,
  schema: %%SCHEMA_EXPORT%%,
  producerId: PRODUCER_ID,
});
`,
  tokens: [
    'PRODUCER_EXPORT',
    'PRODUCER_ID',
    'SCHEMA_EXPORT',
    'SCHEMA_FILE',
    'STREAM_PATH',
  ] as const,
});
