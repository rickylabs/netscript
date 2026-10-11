import { assertEquals, assertFalse } from 'jsr:@std/assert@^1';
import * as streams from '@netscript/plugin-streams';
import type { StreamPayloadSchema } from '@netscript/plugin-streams';

type TestPayload = { readonly id: string };

const testSchema: StreamPayloadSchema<TestPayload> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value: unknown) =>
      isTestPayload(value) ? { value } : { issues: [{ message: 'Expected a test payload' }] },
  },
};

function isTestPayload(value: unknown): value is TestPayload {
  return typeof value === 'object' && value !== null && 'id' in value &&
    typeof value.id === 'string';
}

Deno.test('published streams root cannot expose the known unsupported runtime helpers', () => {
  // Import the consumer-facing package name, rather than an internal barrel.
  // These exports previously compiled but failed unconditionally on first IO.
  for (
    const name of [
      'defineStreamProducer',
      'defineStreamConsumer',
      'StreamUnsupportedOperationError',
      'unsupportedStreamOperation',
    ]
  ) {
    assertFalse(name in streams, `Unsupported runtime export: ${name}`);
  }
});

Deno.test('published streams root retains immutable typed topic definitions and manifest', () => {
  const topic = streams.defineStreamTopic<TestPayload>('test.events', testSchema);
  assertEquals(topic.name, 'test.events');
  assertEquals(topic.schema, testSchema);
  assertEquals(Object.isFrozen(topic), true);
  assertEquals(streams.streamsPlugin.name, '@netscript/plugin-streams');
});
