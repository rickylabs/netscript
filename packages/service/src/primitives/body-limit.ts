/**
 * Request-body size limit primitive for service endpoints.
 *
 * Wraps Hono's first-party `bodyLimit` middleware and answers an oversized
 * request with a typed JSON `413`. A request that declares `Content-Length` is
 * rejected from the header alone (`Deno.serve` bounds the body to the declared
 * length). A chunked request with no `Content-Length` is read incrementally and
 * rejected as soon as the counted bytes pass the limit, so at most `maxBytes`
 * plus one chunk is ever held in memory.
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { createBodyLimitMiddleware } from '@netscript/service';
 *
 * const app = new Hono();
 * app.use('/api/*', createBodyLimitMiddleware({ maxBytes: 1024 * 1024 }));
 * ```
 *
 * @module
 */

import type { Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { ServiceMiddleware } from '../types.ts';

/** Error code carried by the JSON body of a `413` body-limit rejection. */
export const PAYLOAD_TOO_LARGE_ERROR = 'PAYLOAD_TOO_LARGE';

/**
 * Request-body size limit for a service.
 *
 * @example
 * ```typescript
 * import type { ServiceBodyLimitOptions } from '@netscript/service';
 *
 * const bodyLimit: ServiceBodyLimitOptions = { maxBytes: 1024 * 1024 };
 * ```
 */
export interface ServiceBodyLimitOptions {
  /** Largest accepted request body, in bytes. Must be a positive safe integer. */
  readonly maxBytes: number;
}

/**
 * JSON body of a `413` body-limit rejection.
 *
 * @example
 * ```typescript
 * import type { PayloadTooLargeResponse } from '@netscript/service';
 *
 * const body: PayloadTooLargeResponse = {
 *   error: 'PAYLOAD_TOO_LARGE',
 *   message: 'Request body exceeds 1048576 bytes',
 *   maxBytes: 1048576,
 * };
 * ```
 */
export interface PayloadTooLargeResponse {
  /** Stable error code. */
  readonly error: typeof PAYLOAD_TOO_LARGE_ERROR;
  /** Human-readable reason. */
  readonly message: string;
  /** Configured limit that the request exceeded. */
  readonly maxBytes: number;
}

/**
 * Creates middleware that rejects request bodies larger than `maxBytes` with a
 * typed JSON `413` before any handler parses them.
 *
 * Requests without a body (for example `GET`) pass through untouched.
 *
 * @param options - Body limit configuration.
 * @returns Service middleware enforcing the limit.
 * @throws {RangeError} When `maxBytes` is not a positive safe integer.
 *
 * @example
 * ```typescript
 * import {
 *   createBodyLimitMiddleware,
 *   createService,
 *   type ServiceRouter,
 * } from '@netscript/service';
 *
 * declare const router: ServiceRouter;
 *
 * createService(router, { name: 'uploads' })
 *   .use(createBodyLimitMiddleware({ maxBytes: 8 * 1024 * 1024 }))
 *   .withRPC();
 * ```
 */
export function createBodyLimitMiddleware(options: ServiceBodyLimitOptions): ServiceMiddleware {
  const maxBytes = assertMaxBytes(options.maxBytes);
  const rejection: PayloadTooLargeResponse = {
    error: PAYLOAD_TOO_LARGE_ERROR,
    message: `Request body exceeds ${maxBytes} bytes`,
    maxBytes,
  };

  return bodyLimit({
    maxSize: maxBytes,
    onError: (c: Context) => c.json(rejection, 413),
  });
}

function assertMaxBytes(maxBytes: number): number {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError(`bodyLimit.maxBytes must be a positive safe integer, got ${maxBytes}`);
  }
  return maxBytes;
}
