/** Bounded transport policy for published JSR metadata and package files. */
import { delay, retry, RetryError } from '@std/async';

const MAX_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 250;
const MAX_BACKOFF_MS = 2_000;
const MAX_RETRY_AFTER_MS = 60_000;

/** Terminal request details retained by both the validator and file reader. */
export class JsrRequestError extends Error {
  readonly retryable: boolean;

  constructor(
    readonly url: string,
    readonly attempts: number,
    readonly status: number | undefined,
    options: ErrorOptions & { readonly retryable?: boolean; readonly detail?: string } = {},
  ) {
    const outcome = status === undefined ? 'transport failure' : `HTTP ${status}`;
    super(
      `JSR request failed for ${url} after ${attempts} attempt${attempts === 1 ? '' : 's'}: ` +
        outcome + (options.detail ? `; ${options.detail}` : ''),
      options,
    );
    this.name = 'JsrRequestError';
    this.retryable = options.retryable ?? true;
  }
}

/** Consumed bytes and status, with parsing deliberately outside the retry boundary. */
export interface JsrResource {
  readonly status: number;
  readonly ok: boolean;
  readonly attempts: number;
  readonly bytes: Uint8Array;
}

/** Read a JSR resource, retrying only transient HTTP and raw transport failures. */
export async function readJsrResource(
  url: string,
  init: RequestInit,
  fetcher: typeof fetch = fetch,
): Promise<JsrResource> {
  // Invalid URLs are caller errors, not transient Fetch TypeErrors.
  new URL(url);
  let attempts = 0;
  let retryNotBefore = 0;
  try {
    return await retry(async () => {
      if (retryNotBefore > Date.now()) await delay(retryNotBefore - Date.now());
      attempts++;
      let response: Response;
      try {
        response = await fetcher(url, init);
      } catch (cause) {
        if (!isTransportError(cause)) throw cause;
        throw new JsrRequestError(url, attempts, undefined, { cause });
      }
      if (!response.ok) {
        // Release each failed response before starting another request.
        await response.body?.cancel().catch(() => {});
        if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
          const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
          if (retryAfterMs > MAX_RETRY_AFTER_MS) {
            throw new JsrRequestError(url, attempts, response.status, {
              retryable: false,
              detail: `Retry-After ${retryAfterMs}ms exceeds ${MAX_RETRY_AFTER_MS}ms limit`,
            });
          }
          retryNotBefore = Date.now() + retryAfterMs;
          throw new JsrRequestError(url, attempts, response.status);
        }
        return { status: response.status, ok: false, attempts, bytes: new Uint8Array() };
      }
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await response.arrayBuffer());
      } catch (cause) {
        if (!isTransportError(cause)) throw cause;
        throw new JsrRequestError(url, attempts, response.status, { cause });
      }
      return { status: response.status, ok: true, attempts, bytes };
    }, {
      maxAttempts: MAX_ATTEMPTS,
      minTimeout: INITIAL_BACKOFF_MS,
      maxTimeout: MAX_BACKOFF_MS,
      multiplier: 2,
      jitter: 1,
      isRetriable: (error) => error instanceof JsrRequestError && error.retryable,
    });
  } catch (error) {
    // Preserve our URL/status/attempt diagnostic rather than @std's generic wrapper.
    if (error instanceof RetryError && error.cause instanceof JsrRequestError) throw error.cause;
    throw error;
  }
}

function parseRetryAfter(value: string | null): number {
  if (value === null) return 0;
  if (/^\d+(?:\.\d+)?$/.test(value.trim())) return Number(value) * 1_000;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : 0;
}

function isTransportError(error: unknown): boolean {
  return error instanceof TypeError || error instanceof Deno.errors.ConnectionReset ||
    error instanceof Deno.errors.ConnectionRefused || error instanceof Deno.errors.BrokenPipe ||
    error instanceof Deno.errors.NotConnected || error instanceof Deno.errors.TimedOut ||
    error instanceof Deno.errors.UnexpectedEof || error instanceof Deno.errors.Http;
}
