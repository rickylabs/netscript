/**
 * Request-scoped context bridge for auth service oRPC handlers.
 *
 * @module
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { AuthServiceInitialContext, AuthServiceRequest } from './routers/v1-types.ts';

type AuthRequestScope = Readonly<{ request: AuthServiceRequest; responseHeaders: Headers }>;

const authRequestStorage = new AsyncLocalStorage<AuthRequestScope>();
const ACTIVE_STORE_PROBES_SYMBOL = Symbol.for('@netscript/async-context/active-store-probes');

interface ActiveAsyncStoreProbe {
  readonly name: string;
  readonly isActive: () => boolean;
}

const AUTH_REQUEST_ACTIVE_STORE_PROBE: ActiveAsyncStoreProbe = Object.freeze({
  name: '@netscript/plugin-auth.requestContext',
  isActive: () => authRequestStorage.getStore() !== undefined,
});

function registerAuthRequestActiveStoreProbe(): void {
  const existing: unknown = Reflect.get(globalThis, ACTIVE_STORE_PROBES_SYMBOL);
  const registry = existing instanceof Set ? existing : new Set<ActiveAsyncStoreProbe>();
  if (!(existing instanceof Set)) {
    Reflect.set(globalThis, ACTIVE_STORE_PROBES_SYMBOL, registry);
  }
  registry.add(AUTH_REQUEST_ACTIVE_STORE_PROBE);
}

registerAuthRequestActiveStoreProbe();

type HonoRequestContext = Readonly<{ req: { raw: Request }; res: Response }>;

/** Captures the current Hono request for later typed oRPC context middleware. */
export async function withAuthRequest(
  c: HonoRequestContext,
  next: () => Promise<void>,
): Promise<void> {
  const scope: AuthRequestScope = {
    request: toServiceRequest(c.req.raw),
    responseHeaders: new Headers(),
  };
  await authRequestStorage.run(scope, async () => {
    await next();
    for (const cookie of scope.responseHeaders.getSetCookie()) {
      c.res.headers.append('set-cookie', cookie);
    }
  });
}

/** Reads the current request captured for the active auth service call. */
export function currentAuthRequest(): AuthServiceInitialContext['request'] {
  return authRequestStorage.getStore()?.request;
}

/** Preserve each backend cookie for the active service HTTP response. */
export function captureAuthResponseCookies(response: Response): void {
  const scope = authRequestStorage.getStore();
  if (!scope) return;
  for (const cookie of response.headers.getSetCookie()) {
    scope.responseHeaders.append('set-cookie', cookie);
  }
}

function toServiceRequest(raw: Request): AuthServiceRequest {
  return {
    url: raw.url,
    method: raw.method,
    headers: new Headers(raw.headers),
  };
}
