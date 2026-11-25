/**
 * Round-3 reference implementation of the abort-aware, ROOT_CONTEXT-detached
 * in-process fetch adapter used by the RFC 0000 design verification probes.
 */

import { type Context, extractContext, withContext } from '@netscript/telemetry/context';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export interface InProcessServiceAppLike {
  fetch(request: Request): Response | Promise<Response>;
}

export function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

export type ProbeInProcessServiceErrorCode =
  | 'IN_PROCESS_REDIRECT_UNSUPPORTED'
  | 'IN_PROCESS_BODY_UNUSABLE';

export class ProbeInProcessServiceError extends Error {
  readonly code: ProbeInProcessServiceErrorCode;
  constructor(code: ProbeInProcessServiceErrorCode, message: string) {
    super(message);
    this.name = 'InProcessServiceError';
    this.code = code;
  }
}

function releaseReaderSafely(reader: ReadableStreamDefaultReader<Uint8Array>): void {
  try {
    reader.releaseLock();
  } catch {
    // Already unlocked.
  }
}

function cancelUnownedBodyInContext(
  body: ReadableStream<Uint8Array> | null,
  reason: unknown,
  serviceCtx: Context,
): void {
  if (body === null || body.locked) return;
  withContext(serviceCtx, () => {
    try {
      void body.cancel(reason).catch(() => {});
    } catch {
      // Ignore synchronous cancel failures from foreign streams.
    }
  });
}

function rejectIfRedirect(response: Response, serviceCtx: Context): Response {
  if (REDIRECT_STATUSES.has(response.status)) {
    cancelUnownedBodyInContext(response.body, undefined, serviceCtx);
    throw new ProbeInProcessServiceError(
      'IN_PROCESS_REDIRECT_UNSUPPORTED',
      `In-process service link refused HTTP ${response.status} redirect without following it.`,
    );
  }
  return response;
}

/**
 * Wraps any non-null Response.body so:
 * 1. Locked or disturbed bodies returned by app.fetch() fail closed with
 *    IN_PROCESS_BODY_UNUSABLE (never silently bypassing abort protection).
 * 2. Every source read/cancel runs inside `serviceCtx` (ROOT_CONTEXT), never
 *    leaking the caller's active OpenTelemetry AsyncLocalStorage context.
 * 3. Every terminal path (EOF, abort, consumer cancel, source error) removes
 *    the abort listener and releases the owned reader lock synchronously — even
 *    if underlying source cancel() stalls or rejects.
 */
function wrapInProcessResponse(
  response: Response,
  serviceCtx: Context,
  signal?: AbortSignal,
): Response {
  const rawBody = response.body;
  if (rawBody === null) {
    return response;
  }
  if (response.bodyUsed || rawBody.locked) {
    throw new ProbeInProcessServiceError(
      'IN_PROCESS_BODY_UNUSABLE',
      'In-process service app returned a Response whose body was already locked or disturbed.',
    );
  }

  const reader = rawBody.getReader();
  let terminal = false;
  let cancelSent = false;
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;

  const cancelSourceOnce = (reason: unknown): Promise<void> => {
    if (cancelSent) {
      releaseReaderSafely(reader);
      return Promise.resolve();
    }
    cancelSent = true;
    return withContext(serviceCtx, () => {
      try {
        return reader.cancel(reason).catch(() => {});
      } finally {
        releaseReaderSafely(reader);
      }
    });
  };

  const finish = (): void => {
    if (terminal) return;
    terminal = true;
    signal?.removeEventListener('abort', onBodyAbort);
  };

  const onBodyAbort = (): void => {
    if (terminal) return;
    const reason = abortReason(signal!);
    finish();
    streamController?.error(reason);
    void cancelSourceOnce(reason);
  };

  const wrappedBody = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      if (signal) {
        withContext(serviceCtx, () => {
          signal.addEventListener('abort', onBodyAbort, { once: true });
        });
        if (signal.aborted) {
          onBodyAbort();
        }
      }
    },
    async pull(controller) {
      if (terminal) {
        releaseReaderSafely(reader);
        return;
      }
      try {
        const { done, value } = await withContext(serviceCtx, () => reader.read());
        if (terminal) {
          releaseReaderSafely(reader);
          return;
        }
        if (done) {
          finish();
          releaseReaderSafely(reader);
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        if (terminal) {
          releaseReaderSafely(reader);
          return;
        }
        finish();
        releaseReaderSafely(reader);
        controller.error(error);
      }
    },
    cancel(reason) {
      finish();
      return cancelSourceOnce(reason);
    },
  });

  return new Response(wrappedBody, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export function createInProcessFetch(
  app: InProcessServiceAppLike,
): typeof globalThis.fetch {
  return (input, init) => {
    const signal = init && 'signal' in init
      ? (init.signal ?? undefined)
      : (input instanceof Request ? input.signal : undefined);

    if (signal?.aborted) {
      return Promise.reject(abortReason(signal));
    }

    const serviceCtx = extractContext({});

    if (signal === undefined) {
      try {
        const request = new Request(input, init);
        return withContext(serviceCtx, () =>
          Promise.resolve(app.fetch(request)).then((response) =>
            wrapInProcessResponse(rejectIfRedirect(response, serviceCtx), serviceCtx)
          ));
      } catch (error) {
        return Promise.reject(error);
      }
    }

    return new Promise<Response>((resolve, reject) => {
      let settled = false;
      let lateBodyCancelled = false;

      const cancelLateBodyOnce = (response: Response, reason: unknown): void => {
        if (lateBodyCancelled) return;
        lateBodyCancelled = true;
        cancelUnownedBodyInContext(response.body, reason, serviceCtx);
      };

      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        reject(abortReason(signal));
      };

      // Subscribe before constructing Request or invoking app.fetch so a
      // synchronous abort during setup is never missed.
      withContext(serviceCtx, () => {
        signal.addEventListener('abort', onAbort, { once: true });
      });

      let dispatch: Promise<Response>;
      try {
        const request = new Request(input, init);
        dispatch = withContext(serviceCtx, () => Promise.resolve(app.fetch(request)));
      } catch (error) {
        if (!settled) {
          settled = true;
          signal.removeEventListener('abort', onAbort);
          reject(error);
        }
        return;
      }

      // Register the single settlement path inside ROOT_CONTEXT so late cleanup
      // never captures or executes under the caller's OpenTelemetry context.
      withContext(serviceCtx, () => {
        dispatch.then(
          (response) => {
            if (settled || signal.aborted) {
              const reason = abortReason(signal);
              if (!settled) {
                settled = true;
                signal.removeEventListener('abort', onAbort);
                reject(reason);
              }
              cancelLateBodyOnce(response, reason);
              return;
            }
            settled = true;
            signal.removeEventListener('abort', onAbort);
            try {
              resolve(
                wrapInProcessResponse(rejectIfRedirect(response, serviceCtx), serviceCtx, signal),
              );
            } catch (error) {
              reject(error);
            }
          },
          (error) => {
            if (settled) return;
            settled = true;
            signal.removeEventListener('abort', onAbort);
            reject(error);
          },
        );
      });
    });
  };
}
