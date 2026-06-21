/**
 * Request-scoped context bridge for auth service oRPC handlers.
 *
 * @module
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { AuthServiceInitialContext, AuthServiceRequest } from './routers/v1-types.ts';

const authRequestStorage = new AsyncLocalStorage<AuthServiceRequest | undefined>();

type HonoRequestContext = Readonly<{ req: { raw: Request } }>;

/** Captures the current Hono request for later typed oRPC context middleware. */
export async function withAuthRequest(
  c: HonoRequestContext,
  next: () => Promise<void>,
): Promise<void> {
  await authRequestStorage.run(toServiceRequest(c.req.raw), next);
}

/** Reads the current request captured for the active auth service call. */
export function currentAuthRequest(): AuthServiceInitialContext['request'] {
  return authRequestStorage.getStore();
}

function toServiceRequest(raw: Request): AuthServiceRequest {
  return {
    url: raw.url,
    method: raw.method,
    headers: new Headers(raw.headers),
  };
}
