import { assertEquals } from '@std/assert';
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
const acknowledged: StreamProducerTransportResultV1<StreamProducerAcknowledgementV1> = {
  ok: true,
  value: { duplicate: false },
};

class ScriptedTransport implements StreamProducerTransportPort {
  readonly #connectResults: StreamProducerTransportResultV1<void>[];

  constructor(connectResults: StreamProducerTransportResultV1<void>[] = [connected]) {
    this.#connectResults = [...connectResults];
  }

  connect(_input: StreamProducerConnectInputV1): Promise<StreamProducerTransportResultV1<void>> {
    return Promise.resolve(this.#connectResults.shift() ?? connected);
  }

  append(
    _input: StreamProducerAppendInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    return Promise.resolve(acknowledged);
  }

  close(
    _input: StreamProducerCloseInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    return Promise.resolve(acknowledged);
  }
}

class ManualClock implements StreamProducerClockPort {
  #release: (() => void) | undefined;

  sleep(_delayMs: number, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<void> {
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
