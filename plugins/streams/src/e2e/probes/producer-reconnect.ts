import {
  buildStreamUrl,
  defineStreamSchema,
  DurableStreamProducer,
  type StreamProducerStateSnapshotV1,
} from '@netscript/plugin-streams-core';
import { probePayloadSchema } from './probe-context.ts';

export const PRODUCER_BACKOFF_MARKER = 'NETSCRIPT_PRODUCER_RECONNECT_BACKOFF';
export const PRODUCER_RESULT_MARKER = 'NETSCRIPT_PRODUCER_RECONNECT_RESULT';

export interface ProducerReconnectProbeResult {
  readonly traceId: string;
  readonly streamPath: string;
  readonly producerId: string;
  readonly keys: readonly string[];
  readonly sinceUnixMs: number;
}

/** Extract the ordered keys and first W3C trace id from a durable-stream snapshot. */
export function reconnectSnapshotResult(
  value: unknown,
  expectedKeys: readonly string[],
): Readonly<{ keys: readonly string[]; traceId: string }> {
  if (!Array.isArray(value)) {
    throw new Error('Reconnect read-back did not return a durable-stream event array');
  }
  const records = value.filter(isRecord);
  const keys = records
    .map((record) => record.key)
    .filter((key): key is string => typeof key === 'string');
  if (
    keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error(
      `Reconnect FIFO mismatch: expected=${JSON.stringify(expectedKeys)} actual=${
        JSON.stringify(keys)
      }`,
    );
  }
  const headers = records[0]?.headers;
  const traceparent = isRecord(headers) && typeof headers.traceparent === 'string'
    ? headers.traceparent
    : undefined;
  const traceId = traceparent?.split('-')[1];
  if (!traceId || !/^[0-9a-f]{32}$/i.test(traceId)) {
    throw new Error('Reconnect read-back did not preserve a valid W3C traceparent');
  }
  return { keys, traceId };
}

async function main(): Promise<void> {
  const [baseUrl] = Deno.args;
  if (!baseUrl) {
    throw new Error('streams base URL argument is required');
  }
  if (Deno.env.get('OTEL_DENO') !== 'true') {
    throw new Error('Reconnect probe requires the Deno-native OTEL provider');
  }

  const sinceUnixMs = Date.now();
  const streamPath = `/e2e/producer-reconnect/${crypto.randomUUID()}`;
  const producerId = `streams-reconnect-${crypto.randomUUID()}`;
  const expectedKeys = ['outage-1', 'outage-2', 'outage-3'];
  Deno.env.set('DURABLE_STREAMS_URL', baseUrl);
  const schema = defineStreamSchema({
    probe: { schema: probePayloadSchema, type: 'probe', primaryKey: 'id' },
  });
  const producer = new DurableStreamProducer({
    streamPath,
    schema,
    producerId,
    reconnectPolicy: {
      maxAttempts: 30,
      requestTimeoutMs: 500,
      initialDelayMs: 1_000,
      maxDelayMs: 1_000,
      jitterRatio: 0,
    },
  });

  try {
    const receipts = expectedKeys.map((id) =>
      producer.upsert('probe', { id, status: 'buffered-during-outage' }, {
        correlationId: `producer-reconnect-${id}`,
        messageId: id,
      })
    );
    if (receipts.some((receipt) => !receipt.accepted)) {
      throw new Error('Reconnect probe write was rejected before entering the bounded buffer');
    }
    await waitForBackoff(producer);
    console.info(
      `${PRODUCER_BACKOFF_MARKER} state=${producer.state.state} attempt=${producer.state.attempt}`,
    );

    const outcomes = await Promise.all(receipts.map((receipt) => receipt.completion));
    if (outcomes.some((outcome) => outcome.status !== 'delivered')) {
      throw new Error(`Reconnect receipts did not all deliver: ${JSON.stringify(outcomes)}`);
    }
    await producer.flush();

    const response = await fetch(`${buildStreamUrl(streamPath, baseUrl)}?offset=-1`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Reconnect read-back failed with HTTP ${response.status}`);
    }
    const snapshot = reconnectSnapshotResult(await response.json(), expectedKeys);
    await producer.close();
    await new Promise((resolve) => setTimeout(resolve, 250));

    const result: ProducerReconnectProbeResult = {
      traceId: snapshot.traceId,
      streamPath,
      producerId,
      keys: snapshot.keys,
      sinceUnixMs,
    };
    console.info(`${PRODUCER_RESULT_MARKER} ${JSON.stringify(result)}`);
  } finally {
    if (!producer.closed) await producer.stop().catch(() => undefined);
  }
}

async function waitForBackoff(
  producer: Readonly<{ state: StreamProducerStateSnapshotV1 }>,
): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (producer.state.state !== 'backoff') {
    if (producer.state.state === 'failed') {
      throw new Error(
        `Producer failed before backoff marker: ${producer.state.error ?? 'unknown'}`,
      );
    }
    if (Date.now() >= deadline) throw new Error('Producer did not enter backoff within 10 seconds');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) await main();
