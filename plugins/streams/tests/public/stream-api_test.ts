import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1';
import {
  defineStreamConsumer,
  defineStreamProducer,
  defineStreamTopic,
  StreamUnsupportedOperationError,
} from '../../mod.ts';
import type { StreamPayloadSchema } from '../../mod.ts';

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

Deno.test('defineStreamProducer publish rejects instead of silently dropping payloads', async () => {
  const topic = defineStreamTopic<TestPayload>('test.events', testSchema);
  const producer = defineStreamProducer(topic);

  const error = await assertRejects(
    () => producer.publish({ id: 'evt-1' }),
    StreamUnsupportedOperationError,
  );

  assertEquals(error.operation, 'stream.publish');
});

Deno.test('defineStreamConsumer subscribe throws instead of returning a no-op unsubscribe', () => {
  const topic = defineStreamTopic<TestPayload>('test.events', testSchema);
  const consumer = defineStreamConsumer(topic);

  const error = assertThrows(
    () => consumer.subscribe((_payload) => {}),
    StreamUnsupportedOperationError,
  );

  assertEquals(error.operation, 'stream.subscribe');
});
