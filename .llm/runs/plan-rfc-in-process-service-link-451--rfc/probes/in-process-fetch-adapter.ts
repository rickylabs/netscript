/**
 * Round-2 reference implementation of the abort-aware, ROOT_CONTEXT-detached
 * in-process fetch adapter used by the RFC 0000 design verification probes.
 */

import { extractContext, withContextAsync } from '@netscript/telemetry/context';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export interface InProcessServiceAppLike {
  fetch(request: Request): Response | Promise<Response>;
}

export function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

export class ProbeInProcessServiceError extends Error {
  readonly code: 'IN_PROCESS_REDIRECT_UNSUPPORTED';
  constructor(code: 'IN_PROCESS_REDIRECT_UNSUPPORTED', message: string) {
    super(message);
    this.name = 'InProcessServiceError';
    this.code = code;
  }
}

function rejectIfRedirect(response: Response): Response {
  if (REDIRECT_STATUSES.has(response.status)) {
    void response.body?.cancel().catch(() => {});
    throw new ProbeInProcessServiceError(
      'IN_PROCESS_REDIRECT_UNSUPPORTED',
      `In-process service link refused HTTP ${response.status} redirect without following it.`,
    );
  }
  return response;
}

function wrapAbortableResponse(response: Response, signal: AbortSignal): Response {
  const rawBody = response.body;
  if (rawBody === null || rawBody.locked) {
    return response;
  }

  const reader = rawBody.getReader();
  let terminal = false;
  let cancelSent = false;
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;

  const cancelSourceOnce = (reason: unknown): Promise<void> => {
    if (cancelSent) return Promise.resolve();
    cancelSent = true;
    return reader.cancel(reason).catch(() => {});
  };

  const finish = (): void => {
    if (terminal) return;
    terminal = true;
    signal.removeEventListener('abort', onBodyAbort);
  };

  const onBodyAbort = (): void => {
    if (terminal) return;
    const reason = abortReason(signal);
    finish();
    streamController?.error(reason);
    void cancelSourceOnce(reason);
  };

  const wrappedBody = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      signal.addEventListener('abort', onBodyAbort, { once: true });
      if (signal.aborted) {
        onBodyAbort();
      }
    },
    async pull(controller) {
      if (terminal) return;
      try {
        const { done, value } = await reader.read();
        if (terminal) return;
        if (done) {
          finish();
          reader.releaseLock();
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        if (terminal) return;
        finish();
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

    if (signal === undefined) {
      try {
        const request = new Request(input, init);
        return withContextAsync(extractContext({}), async () => await app.fetch(request)).then(
          rejectIfRedirect,
        );
      } catch (error) {
        return Promise.reject(error);
      }
    }

    return new Promise<Response>((resolve, reject) => {
      let settled = false;
      let lateBodyCancelled = false;

      const cancelLateBodyOnce = (response: Response, reason: unknown): void => {
        if (lateBodyCancelled || response.body === null) return;
        lateBodyCancelled = true;
        void response.body.cancel(reason).catch(() => {});
      };

      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        reject(abortReason(signal));
      };

      // Subscribe before constructing Request or invoking app.fetch so a
      // synchronous abort during setup is never missed.
      signal.addEventListener('abort', onAbort, { once: true });

      let dispatch: Promise<Response>;
      try {
        const request = new Request(input, init);
        dispatch = withContextAsync(
          extractContext({}),
          async () => await app.fetch(request),
        );
      } catch (error) {
        if (!settled) {
          settled = true;
          signal.removeEventListener('abort', onAbort);
          reject(error);
        }
        return;
      }

      // Single settlement path: handles both normal responses and late
      // post-abort settlements with at most one body.cancel() invocation.
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
            resolve(wrapAbortableResponse(rejectIfRedirect(response), signal));
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
  };
}
