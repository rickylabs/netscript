/**
 * Request-scoped handoff state between pre-authn stream proxy guards, `createAuthnMiddleware`,
 * and mounted stream proxy route wrappers.
 *
 * Stored in a `WeakMap<Request, StreamProxyRequestState>` keyed by Hono's `c.req.raw` so auth
 * middleware can scope `AuthnRequest` strictly to `credentialMode` and defer `AuthnResult`
 * headers/`Set-Cookie` without mutating user Hono variables or using unsafe casts.
 *
 * @module
 */

/** Per-request state recorded by the pre-authn stream guard for matched GET stream requests. */
export interface StreamProxyRequestState {
  /** Matched stream endpoint identifier. */
  readonly endpointId: string;
  /** Deterministic credential transport selected before `withAuthn` ran. */
  readonly credentialMode: 'bearer' | 'cookie';
  /** Whether the matched stream endpoint requires authentication (`authentication !== 'none'`). */
  readonly authenticationRequired: boolean;
  /** Deferred `AuthnResult.responseHeaders` recorded by `createAuthnMiddleware` for final ownership checks. */
  authnResponseHeaders?: Readonly<Record<string, string>>;
  /** Deferred `AuthnResult.setCookies` recorded by `createAuthnMiddleware` for additive composition. */
  authnSetCookies?: readonly string[];
}

const STREAM_REQUEST_STATES = new WeakMap<Request, StreamProxyRequestState>();

/** Records stream guard state for one incoming `Request`. */
export function setStreamProxyRequestState(
  request: Request,
  state: StreamProxyRequestState,
): void {
  STREAM_REQUEST_STATES.set(request, state);
}

/** Reads stream guard state recorded for one incoming `Request`, if any. */
export function getStreamProxyRequestState(
  request: Request,
): StreamProxyRequestState | undefined {
  return STREAM_REQUEST_STATES.get(request);
}
