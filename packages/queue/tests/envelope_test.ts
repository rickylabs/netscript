import { assert, assertEquals } from '@std/assert';
import { createEnvelope, createMessageContext, isMessageEnvelope } from '../adapters/_envelope.ts';

Deno.test('createEnvelope preserves payload and enqueue headers', () => {
  const envelope = createEnvelope(
    { type: 'job' },
    { headers: { traceparent: 'abc123' } },
  );

  assertEquals(envelope.__envelope_version, 1);
  assertEquals(envelope.payload, { type: 'job' });
  assertEquals(envelope.headers, { traceparent: 'abc123' });
  assert(typeof envelope.messageId === 'string');
  assert(typeof envelope.enqueuedAt === 'string');
  assertEquals(envelope.deliveryCount, 0);
});

Deno.test('isMessageEnvelope distinguishes normalized envelopes', () => {
  const envelope = createEnvelope({ id: '1' });

  assert(isMessageEnvelope(envelope));
  assertEquals(isMessageEnvelope({ payload: { id: '1' } }), false);
});

Deno.test('createMessageContext exposes ack and nack callbacks', async () => {
  let acked = false;
  let requeue: boolean | undefined;

  const context = createMessageContext(
    'msg-1',
    new Date('2026-01-01T00:00:00.000Z'),
    { traceparent: 'abc123' },
    2,
    () => {
      acked = true;
      return Promise.resolve();
    },
    (options) => {
      requeue = options?.requeue;
      return Promise.resolve();
    },
  );

  await context.ack();
  await context.nack({ requeue: false });

  assertEquals(context.messageId, 'msg-1');
  assertEquals(context.deliveryCount, 2);
  assertEquals(context.headers, { traceparent: 'abc123' });
  assertEquals(context.enqueuedAt.toISOString(), '2026-01-01T00:00:00.000Z');
  assertEquals(acked, true);
  assertEquals(requeue, false);
});
