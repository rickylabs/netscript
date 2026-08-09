import {
  PRODUCER_EPOCH_HEADER,
  PRODUCER_EXPECTED_SEQ_HEADER,
  PRODUCER_ID_HEADER,
  PRODUCER_SEQ_HEADER,
  STREAM_CLOSED_HEADER,
} from '@durable-streams/client';
import type { StreamProducerTransportFailureV1 } from '../domain/producer-contract-v1.ts';
import type {
  StreamProducerAcknowledgementV1,
  StreamProducerAppendInputV1,
  StreamProducerCloseInputV1,
  StreamProducerConnectInputV1,
  StreamProducerTransportPort,
  StreamProducerTransportResultV1,
} from '../ports/stream-producer-transport-port.ts';

/** Raw fetch adapter for the durable-stream producer protocol. */
export class DurableStreamProducerTransport implements StreamProducerTransportPort {
  readonly #fetch: typeof fetch;

  /** Create a transport with an optional fetch override. */
  constructor(fetchClient: typeof fetch = globalThis.fetch) {
    this.#fetch = fetchClient;
  }

  /** Create the stream or treat an existing-stream conflict as connected. */
  async connect(
    input: StreamProducerConnectInputV1,
  ): Promise<StreamProducerTransportResultV1<void>> {
    try {
      const response = await this.#fetch(input.url, {
        method: 'PUT',
        headers: { ...input.headers, 'content-type': 'application/json' },
        signal: input.signal,
      });
      if (response.ok || response.status === 409) {
        return { ok: true, value: undefined };
      }
      return { ok: false, failure: await classifyResponse(response) };
    } catch (error) {
      return { ok: false, failure: classifyThrown(error, input.signal) };
    }
  }

  /** Append one event under an exact producer tuple. */
  async append(
    input: StreamProducerAppendInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    return await this.#send(input, false);
  }

  /** Close the stream under an exact producer tuple. */
  async close(
    input: StreamProducerCloseInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    return await this.#send(input, true);
  }

  async #send(
    input: StreamProducerAppendInputV1 | StreamProducerCloseInputV1,
    closed: boolean,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    const headers: Record<string, string> = {
      ...input.headers,
      'content-type': 'application/json',
      [PRODUCER_ID_HEADER]: input.identity.producerId,
      [PRODUCER_EPOCH_HEADER]: String(input.identity.epoch),
      [PRODUCER_SEQ_HEADER]: String(input.identity.sequence),
    };
    if (closed) {
      headers[STREAM_CLOSED_HEADER] = 'true';
    }

    try {
      const response = await this.#fetch(input.url, {
        method: 'POST',
        headers,
        body: 'body' in input ? `[${input.body}]` : undefined,
        signal: input.signal,
      });
      if (response.ok) {
        // The reference server acknowledges a new producer tuple with 200 and
        // an already-committed tuple with 204.
        return { ok: true, value: { duplicate: response.status === 204 } };
      }
      return { ok: false, failure: await classifyResponse(response) };
    } catch (error) {
      return { ok: false, failure: classifyThrown(error, input.signal) };
    }
  }
}

async function classifyResponse(response: Response): Promise<StreamProducerTransportFailureV1> {
  const message = (await response.text()).trim() || `HTTP ${response.status}`;
  if (response.status === 403) {
    const epoch = parseNonNegativeInteger(response.headers.get(PRODUCER_EPOCH_HEADER));
    return { kind: 'stale-epoch', message, currentEpoch: epoch };
  }
  if (response.status === 409) {
    if (response.headers.get(STREAM_CLOSED_HEADER) === 'true') {
      return { kind: 'stream-closed', message };
    }
    if (response.headers.has(PRODUCER_EXPECTED_SEQ_HEADER)) {
      return { kind: 'sequence-gap', message };
    }
    return { kind: 'non-retryable', message };
  }
  if (response.status === 408 || response.status === 429 || response.status >= 500) {
    return { kind: 'retryable', message };
  }
  return { kind: 'non-retryable', message };
}

function classifyThrown(error: unknown, signal?: AbortSignal): StreamProducerTransportFailureV1 {
  const message = error instanceof Error ? error.message : String(error);
  if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
    return { kind: 'aborted', message };
  }
  return { kind: 'retryable', message };
}

function parseNonNegativeInteger(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}
