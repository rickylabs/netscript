import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  type CommandOutboxDelivery,
  createStreamCommandOutboxSink,
  type StreamProducerPort,
  type StreamWriteContextV1,
  type StreamWriteOutcomeV1,
  type StreamWriteReceiptV1,
} from '../commands.ts';
import { CommandRelayError } from '@netscript/service/commands/relay';
import { DurableStreamProducer, type StreamProducerTransportPort } from '../mod.ts';
import { createStreamTopicFixture } from '../src/testing/mod.ts';
const message: CommandOutboxDelivery = {
  id: 'message',
  destination: 'streams',
  topic: 'execution',
  payload: { operation: 'upsert', value: { id: 'entity', name: 'safe' } },
  dedupeKey: 'dedupe',
  correlationId: 'correlation',
};
function producer(
  write: (topic: string, value: unknown, context?: StreamWriteContextV1) => StreamWriteReceiptV1,
): StreamProducerPort {
  return {
    state: { state: 'ready', attempt: 1, bufferedEvents: 0, bufferedBytes: 0 },
    isReady: true,
    closed: false,
    upsert: write,
    delete: write,
    waitUntilReady() {
      return Promise.resolve();
    },
    flush() {
      return Promise.resolve();
    },
    stop() {
      return Promise.resolve();
    },
    close() {
      return Promise.resolve();
    },
  };
}
Deno.test('stream command sink waits delivered completion and forwards stable identity and correlation for upsert delete', async () => {
  let resolve: (outcome: StreamWriteOutcomeV1) => void = () => {};
  const completion = new Promise<StreamWriteOutcomeV1>((r) => resolve = r);
  const requests: unknown[] = [];
  const sink = createStreamCommandOutboxSink({
    id: 'streams',
    producer: producer((topic, value, context) => {
      requests.push({ topic, value, context });
      return { id: 1, accepted: true, completion };
    }),
  });
  let settled = false;
  const pending = sink.publish(message).then(() => {
    settled = true;
  });
  for (let tick = 0; tick < 10; tick++) await Promise.resolve();
  assertEquals(settled, false);
  resolve({ status: 'delivered', attempts: 1 });
  await pending;
  assertEquals(requests, [{
    topic: 'execution',
    value: { id: 'entity', name: 'safe' },
    context: { messageId: 'message', correlationId: 'correlation' },
  }]);
  await sink.publish({ ...message, payload: { operation: 'delete', key: 'entity' } });
  assertEquals(requests[1], {
    topic: 'execution',
    value: 'entity',
    context: { messageId: 'message', correlationId: 'correlation' },
  });
});
Deno.test('stream command sink refuses rejected unknown cancelled malformed acceptance and invalid payload before publication', async () => {
  for (const status of ['rejected', 'delivery-unknown', 'cancelled', 'unchecked']) {
    const outcome: StreamWriteOutcomeV1 = { status: 'delivered', attempts: 1 };
    Reflect.set(outcome, 'status', status);
    let calls = 0;
    const sink = createStreamCommandOutboxSink({
      id: 'streams',
      producer: producer(() => {
        calls++;
        return { id: 1, accepted: true, completion: Promise.resolve(outcome) };
      }),
    });
    const error = await assertRejects(() => sink.publish(message), CommandRelayError);
    assert(error instanceof CommandRelayError);
    assertEquals(
      error.failure,
      status === 'rejected'
        ? 'rejected'
        : status === 'unchecked'
        ? 'invalid_response'
        : 'unavailable',
    );
    const before = calls;
    await assertRejects(
      () => sink.publish({ ...message, payload: { operation: 'upsert', value: [] } }),
      CommandRelayError,
    );
    assertEquals(calls, before);
    await assertRejects(() => sink.publish(message, AbortSignal.abort()));
    assertEquals(calls, before);
  }
  const sink = createStreamCommandOutboxSink({
    id: 'streams',
    producer: producer(() => ({
      id: 1,
      accepted: false,
      completion: Promise.resolve({ status: 'delivered', attempts: 1 }),
    })),
  });
  await assertRejects(() => sink.publish(message), CommandRelayError);
});
Deno.test('stream command identity is serialized with correlation and stable producer tuple through native retry and duplicate acknowledgement', async () => {
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://localhost');
  const requests: unknown[] = [];
  let calls = 0;
  const transport: StreamProducerTransportPort = {
    connect() {
      return Promise.resolve({ ok: true, value: undefined });
    },
    append(input) {
      requests.push({ body: input.body, identity: input.identity });
      calls++;
      return Promise.resolve(
        calls === 1
          ? { ok: false, failure: { kind: 'retryable', message: 'planned' } }
          : { ok: true, value: { duplicate: true } },
      );
    },
    close() {
      return Promise.resolve({ ok: true, value: { duplicate: false } });
    },
  };
  const stream = new DurableStreamProducer({
    streamPath: '/command-proof',
    schema: createStreamTopicFixture(),
    producerId: 'stable-producer',
    transport,
    clock: {
      sleep() {
        return Promise.resolve();
      },
    },
    random: {
      next() {
        return 0.5;
      },
    },
  });
  try {
    await stream.waitUntilReady();
    const sink = createStreamCommandOutboxSink({ id: 'streams', producer: stream });
    await sink.publish(message);
    assertEquals(calls, 2);
    assertEquals(requests[0], requests[1]);
    const record = JSON.parse(JSON.stringify(requests[0]));
    const event = JSON.parse(record.body);
    assertEquals(event.headers.messageId, 'message');
    assertEquals(event.headers.correlationId, 'correlation');
    assertEquals(record.identity.producerId, 'stable-producer');
  } finally {
    await stream.stop();
    if (previous === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previous);
  }
});
