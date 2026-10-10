import type { StreamHeadV1 } from '../domain/admin-contract-v1.ts';
import type { StreamProducerTransportFailureV1 } from '../domain/producer-contract-v1.ts';
import type { StreamAdminPort } from '../ports/stream-admin-port.ts';
import { DurableStreamAdmin } from '../adapters/durable-stream-admin.ts';
import { buildStreamUrl, getStreamsAuth } from './stream-url-resolver.ts';
import {
  createStreamsInstrumentation,
  type StreamsInstrumentation,
} from '../telemetry/instrumentation.ts';

/** Service-side administrative helper dependencies and bounded request policy. */
export interface StreamAdminOptionsV1 {
  /** Optional cancellation by the worker or trigger. */
  readonly signal?: AbortSignal;
  /** Positive integer request timeout in milliseconds; defaults to 5,000. */
  readonly requestTimeoutMs?: number;
  /** Optional administrative port override. */
  readonly admin?: StreamAdminPort;
  /** Optional telemetry facade override. */
  readonly instrumentation?: StreamsInstrumentation;
}

/** Typed transport failure thrown by the public administrative helpers. */
export class StreamAdminError extends Error {
  /** Stable transport failure, including unauthorized, timeout, and aborted categories. */
  readonly failure: StreamProducerTransportFailureV1;

  /** Retain the port failure for worker retry or dead-letter decisions. */
  constructor(failure: StreamProducerTransportFailureV1) {
    super(failure.message);
    this.name = 'StreamAdminError';
    this.failure = failure;
  }
}

/**
 * Read whole-stream metadata using the configured background service identity.
 * @param path Stream path relative to the configured streams service.
 * @param options Cancellation, timeout, port, and instrumentation overrides.
 * @returns Metadata, or null if the stream does not exist.
 * @throws {StreamAdminError} When authorization, timeout, cancellation, or transport fails.
 * @example Inspect a segment from a background worker
 * ```ts
 * import { headDurableStream } from '@netscript/plugin-streams-core';
 * const metadata = await headDurableStream('/observations/2026-10-01');
 * console.log(metadata?.offset);
 * ```
 */
export function headDurableStream(
  path: string,
  options: StreamAdminOptionsV1 = {},
): Promise<StreamHeadV1 | null> {
  return administer(path, 'head', options, (admin, input) => admin.head(input));
}

/**
 * Delete a whole stream using the configured background service identity.
 * @param path Stream path relative to the configured streams service.
 * @param options Cancellation, timeout, port, and instrumentation overrides.
 * @returns True when deleted; false when the stream was already absent.
 * @throws {StreamAdminError} When authorization, timeout, cancellation, or transport fails.
 * @example Remove an old segment from a background worker
 * ```ts
 * import { deleteDurableStream } from '@netscript/plugin-streams-core';
 * const deleted = await deleteDurableStream('/observations/2026-10-01');
 * console.log(deleted);
 * ```
 */
export async function deleteDurableStream(
  path: string,
  options: StreamAdminOptionsV1 = {},
): Promise<boolean> {
  const result = await administer(path, 'delete', options, (admin, input) => admin.delete(input));
  return result.deleted;
}

async function administer<T>(
  path: string,
  operation: 'head' | 'delete',
  options: StreamAdminOptionsV1,
  request: (
    admin: StreamAdminPort,
    input: Parameters<StreamAdminPort['head']>[0],
  ) => Promise<import('../domain/producer-contract-v1.ts').StreamProducerTransportResultV1<T>>,
): Promise<T> {
  const requestTimeoutMs = options.requestTimeoutMs ?? 5_000;
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new RangeError('Stream administrative requestTimeoutMs must be a positive safe integer');
  }
  const input = {
    url: buildStreamUrl(path),
    headers: getStreamsAuth(),
    requestTimeoutMs,
    signal: options.signal,
  };
  const span = (options.instrumentation ?? createStreamsInstrumentation()).startAdminSpan(
    path,
    operation,
  );
  try {
    const result = await request(options.admin ?? new DurableStreamAdmin(), input);
    if (!result.ok) throw new StreamAdminError(result.failure);
    span.setStatus({ code: 1 });
    return result.value;
  } catch (error) {
    span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error) span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
