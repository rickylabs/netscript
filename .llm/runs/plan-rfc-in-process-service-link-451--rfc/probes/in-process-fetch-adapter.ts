/**
 * Round-4 reference implementation of the abort-aware, full-AsyncLocalStorage &
 * ROOT_CONTEXT-detached in-process fetch adapter and per-service synthetic
 * origin resolver used by the RFC 0000 design verification probes.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';
import { type Context, extractContext, withContext } from '@netscript/telemetry/context';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const FAST_PATH_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// Captured once at module initialization (outside any request scope) so every
// in-process hop detaches ALL AsyncLocalStorage stores in the process —
// OpenTelemetry, @netscript/logger (LogTape), auth request storage, trigger
// callback scopes, and any application/user AsyncLocalStorage stores created
// before or after module load.
const rootAsyncSnapshot = AsyncLocalStorage.snapshot();

function runDetached<T>(serviceCtx: Context, fn: () => T): T {
  return rootAsyncSnapshot(() => withContext(serviceCtx, fn));
}

/**
 * Deterministic, collision-free per-service RFC 6761 `.localhost` synthetic origin.
 * Valid lowercase LDH service names (not starting with `x-`) map directly to
 * `https://<serviceName>.in-process.localhost`; all other names map to
 * `https://x-<sha256Hex32>.in-process.localhost`.
 */
export function resolveInProcessOrigin(serviceName: string): URL {
  if (FAST_PATH_LABEL_RE.test(serviceName) && !serviceName.startsWith('x-')) {
    return new URL(`https://${serviceName}.in-process.localhost`);
  }
  const digest = createHash('sha256').update(serviceName).digest('hex').slice(0, 32);
  return new URL(`https://x-${digest}.in-process.localhost`);
}

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
  runDetached(serviceCtx, () => {
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
 * 2. Every source read/cancel runs inside `rootAsyncSnapshot` + `serviceCtx`
 *    (`ROOT_CONTEXT`), never leaking caller OTel, @netscript/logger, auth,
 *    or application AsyncLocalStorage context.
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
    return runDetached(serviceCtx, () => {
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
        runDetached(serviceCtx, () => {
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
        const { done, value } = await runDetached(serviceCtx, () => reader.read());
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
        return runDetached(serviceCtx, () =>
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
      runDetached(serviceCtx, () => {
        signal.addEventListener('abort', onAbort, { once: true });
      });

      let dispatch: Promise<Response>;
      try {
        const request = new Request(input, init);
        dispatch = runDetached(serviceCtx, () => Promise.resolve(app.fetch(request)));
      } catch (error) {
        if (!settled) {
          settled = true;
          signal.removeEventListener('abort', onAbort);
          reject(error);
        }
        return;
      }

      // Register the single settlement path inside the detached snapshot +
      // ROOT_CONTEXT so late cleanup never captures or executes under any
      // caller AsyncLocalStorage store.
      runDetached(serviceCtx, () => {
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
