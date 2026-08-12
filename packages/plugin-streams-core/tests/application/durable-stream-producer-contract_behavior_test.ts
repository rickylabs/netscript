import { assertEquals, assertNotEquals } from '@std/assert';
import { DurableStreamProducer } from '../../src/application/create-durable-stream.ts';
import type { StreamProducerClockPort } from '../../src/ports/stream-producer-clock-port.ts';
import type { StreamProducerRandomPort } from '../../src/ports/stream-producer-random-port.ts';
import type {
  StreamProducerAcknowledgementV1,
  StreamProducerAppendInputV1,
  StreamProducerCloseInputV1,
  StreamProducerConnectInputV1,
  StreamProducerTransportPort,
  StreamProducerTransportResultV1,
} from '../../src/ports/stream-producer-transport-port.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';

const connected: StreamProducerTransportResultV1<void> = { ok: true, value: undefined };
const retryable: StreamProducerTransportResultV1<void> = {
  ok: false,
  failure: { kind: 'retryable', message: 'offline' },
};
const refused: StreamProducerTransportResultV1<void> = {
  ok: false,
  failure: { kind: 'non-retryable', message: 'refused' },
};
const acknowledged: StreamProducerTransportResultV1<StreamProducerAcknowledgementV1> = {
  ok: true,
  value: { duplicate: false },
};
const appendRetryable: StreamProducerTransportResultV1<StreamProducerAcknowledgementV1> = {
  ok: false,
  failure: { kind: 'retryable', message: 'offline' },
};
const appendRefused: StreamProducerTransportResultV1<StreamProducerAcknowledgementV1> = {
  ok: false,
  failure: { kind: 'non-retryable', message: 'refused' },
};

class ScriptedTransport implements StreamProducerTransportPort {
  readonly #connectResults: StreamProducerTransportResultV1<void>[];
  readonly #appendResults: StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>[];
  appendCalls = 0;

  constructor(
    connectResults: StreamProducerTransportResultV1<void>[] = [connected],
    appendResults: StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>[] = [
      acknowledged,
    ],
  ) {
    this.#connectResults = [...connectResults];
    this.#appendResults = [...appendResults];
  }

  connect(_input: StreamProducerConnectInputV1): Promise<StreamProducerTransportResultV1<void>> {
    return Promise.resolve(this.#connectResults.shift() ?? connected);
  }

  append(
    _input: StreamProducerAppendInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    this.appendCalls++;
    return Promise.resolve(this.#appendResults.shift() ?? acknowledged);
  }

  close(
    _input: StreamProducerCloseInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    return Promise.resolve(acknowledged);
  }
}

class DrainControlledTransport implements StreamProducerTransportPort {
  appendStarted = false;
  #releaseAppend: (() => void) | undefined;

  connect(_input: StreamProducerConnectInputV1): Promise<StreamProducerTransportResultV1<void>> {
    return Promise.resolve(connected);
  }

  append(
    _input: StreamProducerAppendInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    this.appendStarted = true;
    return new Promise((resolve) => {
      this.#releaseAppend = () => resolve(acknowledged);
    });
  }

  close(
    _input: StreamProducerCloseInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    return Promise.resolve(acknowledged);
  }

  releaseAppend(): void {
    this.#releaseAppend?.();
    this.#releaseAppend = undefined;
  }
}

class ManualClock implements StreamProducerClockPort {
  #release: (() => void) | undefined;
  sleepCalls = 0;

  sleep(_delayMs: number, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<void> {
    this.sleepCalls++;
    return new Promise((resolve, reject) => {
      this.#release = resolve;
      options.signal?.addEventListener(
        'abort',
        () => reject(options.signal?.reason ?? new DOMException('Aborted', 'AbortError')),
        { once: true },
      );
    });
  }

  release(): void {
    this.#release?.();
    this.#release = undefined;
  }
}

class FixedRandom implements StreamProducerRandomPort {
  next(): number {
    return 0.5;
  }
}

function setStreamsUrl(): () => void {
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  return () => {
    if (previous === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previous);
    }
  };
}

async function waitForState(
  producer: DurableStreamProducer<ReturnTypeDefinition>,
  state: string,
): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (producer.state.state !== state) {
    if (Date.now() >= deadline) {
      throw new Error(`timed out waiting for producer state ${state}`);
    }
    await Promise.resolve();
  }
}

async function waitFor(predicate: () => boolean, description: string): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error(`timed out waiting for ${description}`);
    }
    await Promise.resolve();
  }
}

type ReturnTypeDefinition = {
  readonly execution: {
    readonly schema: ReturnType<typeof createStreamTopicFixture>['execution']['schema'];
    readonly type: string;
    readonly primaryKey: string;
  };
};

Deno.test('count overflow rejects the newest write with an explicit receipt', async () => {
  const restoreEnv = setStreamsUrl();
  const producer = new DurableStreamProducer({
    streamPath: '/contract/count-overflow',
    schema: createStreamTopicFixture(),
    producerId: 'contract-count-overflow',
    bufferPolicy: { maxEvents: 1, maxBytes: 10_000 },
    transport: new ScriptedTransport(),
  });

  try {
    const accepted = producer.upsert('execution', { id: 'first' });
    const rejected = producer.upsert('execution', { id: 'second' });

    assertEquals(accepted.accepted, true);
    assertEquals(rejected.accepted, false);
    assertEquals(await rejected.completion, {
      status: 'rejected',
      reason: 'buffer-count-exceeded',
    });
    assertEquals((await accepted.completion).status, 'delivered');
  } finally {
    await producer.close();
    restoreEnv();
  }
});

Deno.test('byte overflow rejects an oversized write with an explicit receipt', async () => {
  const restoreEnv = setStreamsUrl();
  const producer = new DurableStreamProducer({
    streamPath: '/contract/byte-overflow',
    schema: createStreamTopicFixture(),
    producerId: 'contract-byte-overflow',
    bufferPolicy: { maxEvents: 10, maxBytes: 256 },
    transport: new ScriptedTransport(),
  });

  try {
    const receipt = producer.upsert('execution', {
      id: 'oversized',
      value: 'x'.repeat(512),
    });
    assertEquals(receipt.accepted, false);
    assertEquals(await receipt.completion, {
      status: 'rejected',
      reason: 'buffer-bytes-exceeded',
    });
  } finally {
    await producer.close();
    restoreEnv();
  }
});

Deno.test('stop during backoff cancels an unattempted accepted write', async () => {
  const restoreEnv = setStreamsUrl();
  const clock = new ManualClock();
  const producer = new DurableStreamProducer({
    streamPath: '/contract/stop-backoff',
    schema: createStreamTopicFixture(),
    producerId: 'contract-stop-backoff',
    transport: new ScriptedTransport([retryable, connected]),
    clock,
    random: new FixedRandom(),
  });

  try {
    const receipt = producer.upsert('execution', { id: 'cancel-me' });
    await waitForState(producer, 'backoff');
    await producer.stop();

    assertEquals(await receipt.completion, {
      status: 'cancelled',
      reason: 'producer-stopped',
    });
    assertEquals(producer.state.state, 'stopped');
  } finally {
    clock.release();
    restoreEnv();
  }
});

Deno.test('readiness resolves only after a reconnect reaches ready', async () => {
  const restoreEnv = setStreamsUrl();
  const clock = new ManualClock();
  const producer = new DurableStreamProducer({
    streamPath: '/contract/readiness',
    schema: createStreamTopicFixture(),
    producerId: 'contract-readiness',
    transport: new ScriptedTransport([retryable, connected]),
    clock,
    random: new FixedRandom(),
  });

  try {
    let ready = false;
    const readiness = producer.waitUntilReady().then(() => {
      ready = true;
    });
    await waitForState(producer, 'backoff');
    assertEquals(ready, false);
    clock.release();
    await readiness;
    assertEquals(producer.isReady, true);
  } finally {
    await producer.stop();
    restoreEnv();
  }
});

Deno.test('close drain rejects a concurrent write as producer-stopping', async () => {
  const restoreEnv = setStreamsUrl();
  const transport = new DrainControlledTransport();
  const producer = new DurableStreamProducer({
    streamPath: '/contract/close-drain-rejection',
    schema: createStreamTopicFixture(),
    producerId: 'contract-close-drain-rejection',
    transport,
  });

  try {
    producer.upsert('execution', { id: 'draining' });
    await waitFor(() => transport.appendStarted, 'append to hold the close drain open');
    const closing = producer.close();

    const rejected = producer.upsert('execution', { id: 'during-close' });
    const outcome = await rejected.completion;
    assertEquals(outcome, { status: 'rejected', reason: 'producer-stopping' });
    if (outcome.status !== 'rejected') {
      throw new Error(`expected rejected outcome, received ${outcome.status}`);
    }
    assertNotEquals(outcome.reason, 'producer-failed');

    transport.releaseAppend();
    await closing;
  } finally {
    transport.releaseAppend();
    await producer.stop();
    restoreEnv();
  }
});

Deno.test('first append refusal settles transport-refused without retrying', async () => {
  const restoreEnv = setStreamsUrl();
  const transport = new ScriptedTransport([connected], [appendRefused]);
  const producer = new DurableStreamProducer({
    streamPath: '/contract/append-refused',
    schema: createStreamTopicFixture(),
    producerId: 'contract-append-refused',
    reconnectPolicy: { maxAttempts: 3 },
    transport,
  });

  try {
    const outcome = await producer.upsert('execution', { id: 'refused' }).completion;
    assertEquals(outcome.status, 'delivery-unknown');
    if (outcome.status !== 'delivery-unknown') {
      throw new Error(`expected delivery-unknown outcome, received ${outcome.status}`);
    }
    assertEquals(outcome.reason, 'transport-refused');
    assertNotEquals(outcome.reason, 'retry-exhausted');
    assertEquals(transport.appendCalls, 1);
  } finally {
    await producer.stop();
    restoreEnv();
  }
});

Deno.test('retryable append failures at maxAttempts settle retry-exhausted', async () => {
  const restoreEnv = setStreamsUrl();
  const transport = new ScriptedTransport(
    [connected, connected, connected],
    [appendRetryable, appendRetryable, appendRetryable],
  );
  const clock = new ManualClock();
  const producer = new DurableStreamProducer({
    streamPath: '/contract/append-retry-exhausted',
    schema: createStreamTopicFixture(),
    producerId: 'contract-append-retry-exhausted',
    reconnectPolicy: { maxAttempts: 3 },
    transport,
    clock,
    random: new FixedRandom(),
  });

  try {
    const receipt = producer.upsert('execution', { id: 'exhausted' });
    await waitFor(() => clock.sleepCalls === 1, 'first append retry backoff');
    clock.release();
    await waitFor(() => clock.sleepCalls === 2, 'second append retry backoff');
    clock.release();
    const outcome = await receipt.completion;
    assertEquals(outcome.status, 'delivery-unknown');
    if (outcome.status !== 'delivery-unknown') {
      throw new Error(`expected delivery-unknown outcome, received ${outcome.status}`);
    }
    assertEquals(outcome.reason, 'retry-exhausted');
    assertNotEquals(outcome.reason, 'transport-refused');
    assertEquals(transport.appendCalls, 3);
  } finally {
    clock.release();
    await producer.stop();
    restoreEnv();
  }
});

Deno.test('non-retryable reconnect failure settles transport-refused', async () => {
  const restoreEnv = setStreamsUrl();
  const transport = new ScriptedTransport(
    [connected, refused],
    [appendRetryable],
  );
  const clock = new ManualClock();
  const producer = new DurableStreamProducer({
    streamPath: '/contract/connect-refused',
    schema: createStreamTopicFixture(),
    producerId: 'contract-connect-refused',
    reconnectPolicy: { maxAttempts: 3 },
    transport,
    clock,
    random: new FixedRandom(),
  });

  try {
    const receipt = producer.upsert('execution', { id: 'connect-refused' });
    await waitFor(() => clock.sleepCalls === 1, 'append retry backoff');
    clock.release();
    const outcome = await receipt.completion;
    assertEquals(outcome.status, 'delivery-unknown');
    if (outcome.status !== 'delivery-unknown') {
      throw new Error(`expected delivery-unknown outcome, received ${outcome.status}`);
    }
    assertEquals(outcome.reason, 'transport-refused');
    assertNotEquals(outcome.reason, 'retry-exhausted');
    assertEquals(transport.appendCalls, 1);
  } finally {
    clock.release();
    await producer.stop();
    restoreEnv();
  }
});
