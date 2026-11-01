import { assertEquals, assertNotEquals, assertThrows } from '@std/assert';
import {
  createDurableStream,
  DurableStreamProducer,
} from '../../src/application/create-durable-stream.ts';
import type {
  StreamProducerAppendInputV1,
  StreamProducerCloseInputV1,
  StreamProducerTransportPort,
} from '../../src/ports/stream-producer-transport-port.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';

function fixture() {
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  const appends: StreamProducerAppendInputV1[] = [];
  const closes: StreamProducerCloseInputV1[] = [];
  let connects = 0;
  const transport: StreamProducerTransportPort = {
    connect: () => {
      connects++;
      return Promise.resolve({ ok: true, value: undefined });
    },
    append: (input) => {
      appends.push(input);
      return Promise.resolve({ ok: true, value: { duplicate: false } });
    },
    close: (input) => {
      closes.push(input);
      return Promise.resolve({ ok: true, value: { duplicate: false } });
    },
  };
  return {
    appends,
    closes,
    transport,
    get connects() {
      return connects;
    },
    restore() {
      if (previous === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
      else Deno.env.set('DURABLE_STREAMS_URL', previous);
    },
  };
}

Deno.test('session epoch validates before IO, including incompatible singleton reuse', async () => {
  const test = fixture();
  const options = {
    streamPath: '/session/validate',
    schema: createStreamTopicFixture(),
    producerId: 'session-validation',
    transport: test.transport,
  };
  try {
    for (const initialEpoch of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      assertThrows(() => new DurableStreamProducer({ ...options, initialEpoch }), RangeError);
    }
    assertEquals(test.connects, 0);
    const producer = createDurableStream({ ...options, initialEpoch: 7 });
    try {
      assertEquals(createDurableStream({ ...options, initialEpoch: 7 }), producer);
      assertThrows(
        () => createDurableStream({ ...options, initialEpoch: 8 }),
        Error,
        'Incompatible',
      );
      assertThrows(() => createDurableStream(options), Error, 'Incompatible');
      assertThrows(
        () => createDurableStream({ ...options, initialEpoch: NaN }),
        RangeError,
      );
    } finally {
      await producer.stop();
    }
    const replacement = createDurableStream({ ...options, initialEpoch: 8 });
    assertNotEquals(replacement, producer);
    await replacement.stop();
  } finally {
    test.restore();
  }
});

Deno.test('session epoch reaches append and terminal close with consecutive sequences', async () => {
  const test = fixture();
  const producer = new DurableStreamProducer({
    streamPath: '/session/sequence',
    schema: createStreamTopicFixture(),
    producerId: 'session-sequence',
    initialEpoch: Number.MAX_SAFE_INTEGER,
    transport: test.transport,
  });
  try {
    producer.upsert('execution', { id: 'one' });
    producer.delete('execution', 'one');
    await producer.close();
    assertEquals(test.appends.map((input) => input.identity), [
      { producerId: 'session-sequence', epoch: Number.MAX_SAFE_INTEGER, sequence: 0 },
      { producerId: 'session-sequence', epoch: Number.MAX_SAFE_INTEGER, sequence: 1 },
    ]);
    assertEquals(test.closes[0]?.identity, {
      producerId: 'session-sequence',
      epoch: Number.MAX_SAFE_INTEGER,
      sequence: 2,
    });
  } finally {
    await producer.stop();
    test.restore();
  }
});

Deno.test('explicit epoch zero differs from legacy auto-claim singleton configuration', async () => {
  const test = fixture();
  const options = {
    streamPath: '/session/zero',
    schema: createStreamTopicFixture(),
    producerId: 'session-zero',
    transport: test.transport,
  };
  const producer = createDurableStream({ ...options, initialEpoch: 0 });
  try {
    assertThrows(() => createDurableStream(options), Error, 'Incompatible');
    await producer.upsert('execution', { id: 'zero' }).completion;
    assertEquals(test.appends[0]?.identity.epoch, 0);
  } finally {
    await producer.stop();
    test.restore();
  }
});
