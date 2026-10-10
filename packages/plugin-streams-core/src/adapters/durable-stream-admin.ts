import { DurableStream, DurableStreamError, FetchError } from '@durable-streams/client';
import type { StreamDeletionV1, StreamHeadV1 } from '../domain/admin-contract-v1.ts';
import type {
  StreamProducerTransportFailureV1,
  StreamProducerTransportResultV1,
} from '../domain/producer-contract-v1.ts';
import type { StreamAdminInputV1, StreamAdminPort } from '../ports/stream-admin-port.ts';

/** Upstream durable-streams adapter for bounded whole-stream administrative requests. */
export class DurableStreamAdmin implements StreamAdminPort {
  readonly #fetch: typeof fetch;

  /** Create an adapter with an optional HTTP test seam. */
  constructor(fetchClient: typeof fetch = globalThis.fetch) {
    this.#fetch = fetchClient;
  }

  /** Read stream metadata through DurableStream.head, without reading the log. */
  async head(
    input: StreamAdminInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamHeadV1 | null>> {
    const signal = requestSignal(input);
    try {
      const result = await DurableStream.head({
        url: input.url,
        headers: { ...input.headers },
        fetch: this.#fetch,
        signal,
      });
      if (!result.exists) return { ok: true, value: null };
      const { exists: _exists, ...metadata } = result;
      return { ok: true, value: metadata };
    } catch (error) {
      return { ok: false, failure: classifyFailure(error, signal, input.signal) };
    }
  }

  /** Delete a whole stream through DurableStream.delete, with one bounded attempt. */
  async delete(
    input: StreamAdminInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamDeletionV1>> {
    const signal = requestSignal(input);
    try {
      await DurableStream.delete({
        url: input.url,
        headers: { ...input.headers },
        fetch: this.#fetch,
        signal,
        backoffOptions: { initialDelay: 0, maxDelay: 0, multiplier: 1, maxRetries: 0 },
      });
      return { ok: true, value: { deleted: true } };
    } catch (error) {
      if (
        (error instanceof DurableStreamError && error.code === 'NOT_FOUND') ||
        (error instanceof FetchError && error.status === 404)
      ) {
        return { ok: true, value: { deleted: false } };
      }
      return { ok: false, failure: classifyFailure(error, signal, input.signal) };
    }
  }
}

function requestSignal(input: StreamAdminInputV1): AbortSignal {
  const timeout = AbortSignal.timeout(input.requestTimeoutMs);
  return input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;
}

function classifyFailure(
  error: unknown,
  signal: AbortSignal,
  callerSignal?: AbortSignal,
): StreamProducerTransportFailureV1 {
  const message = error instanceof Error ? error.message : String(error);
  if (callerSignal?.aborted) return { kind: 'aborted', message };
  if (signal.aborted && signal.reason instanceof Error && signal.reason.name === 'TimeoutError') {
    return { kind: 'timeout', message: 'Stream administrative request timed out' };
  }
  const status = error instanceof DurableStreamError || error instanceof FetchError
    ? error.status
    : undefined;
  if (status === 401 || status === 403) return { kind: 'unauthorized', message };
  if (status === 408) return { kind: 'timeout', message };
  if (status !== undefined && status >= 400 && status < 500 && status !== 429) {
    return { kind: 'non-retryable', message };
  }
  return { kind: 'retryable', message };
}
