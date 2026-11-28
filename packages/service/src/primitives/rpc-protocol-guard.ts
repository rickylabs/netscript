/**
 * oRPC v1 server-side RPC protocol guard (`X-NetScript-RPC-Protocol`).
 *
 * Prepares oRPC v1 (`0.0.x`) RPC servers ahead of the `0.1.0` oRPC v2 cut-over:
 * - Allows headerless and `orpc-v1` requests (v1 SDKs remain header-neutral on `0.0.x`).
 * - Exempts `OPTIONS` preflights (and runs at `order = 0 < 9e6` inside v1 `CORSPlugin` so
 *   cross-origin browsers can read `426` rejections cleanly).
 * - Only guards matched RPC procedures (via `StandardRPCMatcher`), preserving fallthrough
 *   for overlapping OpenAPI or raw routes mounted under the same path prefix.
 * - Rejects any non-`orpc-v1` `X-NetScript-RPC-Protocol` value (for example `orpc-v2` or
 *   non-ASCII-whitespace-wrapped tokens) with HTTP `426` and a v2-compatible `ORPCError`
 *   JSON envelope omitting `"status"` (`defined: false`, `code: 'CLIENT_PROTOCOL_UNSUPPORTED'`).
 * - Appends `Vary: X-NetScript-RPC-Protocol` on matched RPC responses (including `426`).
 *
 * Mounted strictly on `createRPCHandler` (never `createOpenAPIHandler`).
 *
 * @module
 */

import { StandardRPCMatcher } from '@orpc/server/standard';
import type { ServiceHandlerPlugin } from '../types.ts';
import { isOrpcRouter } from './orpc-router.ts';

/** Canonical RPC protocol negotiation header name. */
export const RPC_PROTOCOL_HEADER = 'X-NetScript-RPC-Protocol';

/** Canonical lowercase header name for case-insensitive lookup. */
export const RPC_PROTOCOL_HEADER_LOWER = 'x-netscript-rpc-protocol';

/** Protocol token accepted by oRPC v1 (`^1.16.6`) servers. */
export const RPC_PROTOCOL_V1 = 'orpc-v1';

interface StandardLikeRequest {
  readonly method: string;
  readonly url?: URL;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
}

interface StandardLikeResponse {
  readonly status: number;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body?: unknown;
}

interface StandardLikeHandleResult {
  readonly matched: boolean;
  readonly response?: StandardLikeResponse;
}

interface RootInterceptorOptions {
  readonly request: StandardLikeRequest;
  readonly prefix?: string;
  next(): Promise<StandardLikeHandleResult>;
}

type RootInterceptor = (options: RootInterceptorOptions) => Promise<StandardLikeHandleResult>;

interface RootInterceptorHandlerOptions {
  rootInterceptors?: RootInterceptor[];
}

/**
 * Strip strictly HTTP optional whitespace (ASCII SP `0x20` and HTAB `0x09`, RFC 9110 §5.5).
 * Unlike `String.prototype.trim()`, this preserves non-ASCII whitespace such as `\u00a0`
 * so invalid protocol tokens are rejected verbatim rather than coerced to `orpc-v1`.
 */
function trimHttpOws(value: string): string {
  return value.replace(/^[ \t]+|[ \t]+$/g, '');
}

function readHeaderCaseInsensitive(
  headers: Readonly<Record<string, string | string[] | undefined>>,
  lowerName: string,
): string | undefined {
  let raw = headers[lowerName];
  if (raw === undefined) {
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === lowerName) {
        raw = value;
        break;
      }
    }
  }
  if (raw === undefined) {
    return undefined;
  }
  if (Array.isArray(raw)) {
    return raw.length === 0 ? undefined : trimHttpOws(raw.join(', '));
  }
  return trimHttpOws(raw);
}

function normalizePrefix(rawPrefix: string | undefined): string | undefined {
  if (!rawPrefix) return undefined;
  const stripped = rawPrefix.replace(/\/+$/, '');
  return stripped.length === 0 ? undefined : stripped;
}

function extractRelativeRpcPathname(
  requestPathname: string,
  rawPrefix: string | undefined,
): `/${string}` | undefined {
  const prefix = normalizePrefix(rawPrefix);
  if (prefix === undefined) {
    return `/${requestPathname.replace(/^\/|\/$/g, '')}`;
  }
  if (requestPathname !== prefix && !requestPathname.startsWith(`${prefix}/`)) {
    return undefined;
  }
  const remainder = requestPathname.slice(prefix.length);
  return `/${remainder.replace(/^\/|\/$/g, '')}`;
}

function initRpcMatcher(router: unknown): StandardRPCMatcher | undefined {
  if (!isOrpcRouter(router)) {
    return undefined;
  }
  const matcher = new StandardRPCMatcher();
  matcher.init(router);
  return matcher;
}

/**
 * Build an immutable path predicate that returns `true` only when `requestPath`
 * matches a real RPC procedure on `router` under one of the snapshotted `prefixes`.
 */
export function createRpcPathMatcher(
  router: unknown,
  prefixes: readonly string[],
): (requestPath: string) => Promise<boolean> {
  const snapshotPrefixes = prefixes
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => (entry === '/' ? '/' : entry.replace(/\/+$/, '')));

  const matcher = snapshotPrefixes.length > 0 ? initRpcMatcher(router) : undefined;
  if (!matcher) {
    return () => Promise.resolve(false);
  }

  return async (requestPath: string): Promise<boolean> => {
    for (const prefix of snapshotPrefixes) {
      const relative = extractRelativeRpcPathname(
        requestPath,
        prefix === '/' ? undefined : prefix,
      );
      if (relative === undefined) continue;
      if (await matcher.match('OPTIONS', relative)) {
        return true;
      }
    }
    return false;
  };
}

function appendVaryToken(
  headers: Record<string, string | string[] | undefined>,
  token: string,
): void {
  const targetLower = token.toLowerCase();
  let existingRaw: string | string[] | undefined = headers.vary;

  // Normalize any mixed-case Vary keys into lowercase `vary` so `@orpc/server` `CORSPlugin`
  // and Fetch response conversion see a single merged header.
  for (const key of Object.keys(headers)) {
    if (key !== 'vary' && key.toLowerCase() === 'vary') {
      const value = headers[key];
      if (existingRaw === undefined) {
        existingRaw = value;
      } else if (value !== undefined) {
        const left = Array.isArray(existingRaw) ? existingRaw.join(', ') : existingRaw;
        const right = Array.isArray(value) ? value.join(', ') : value;
        existingRaw = `${left}, ${right}`;
      }
      delete headers[key];
    }
  }

  const existing = Array.isArray(existingRaw) ? existingRaw.join(', ') : existingRaw;
  if (!existing || existing.trim().length === 0) {
    headers.vary = token;
    return;
  }

  const parts = existing.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.includes('*')) {
    headers.vary = '*';
    return;
  }
  if (parts.some((part) => part.toLowerCase() === targetLower)) {
    headers.vary = parts.join(', ');
    return;
  }

  headers.vary = `${parts.join(', ')}, ${token}`;
}

/**
 * v1 RPC handler plugin enforcing fail-closed `426 CLIENT_PROTOCOL_UNSUPPORTED`
 * for mismatched `X-NetScript-RPC-Protocol` headers on matched RPC procedures
 * while keeping CORS outside and preserving fallthrough for non-RPC routes.
 */
export class ProtocolGuardPluginV1 implements ServiceHandlerPlugin {
  /** Stable plugin name for oRPC plugin ordering diagnostics. */
  readonly name: string = 'netscript-rpc-protocol-guard-v1';

  /**
   * Run before `CORSPlugin` (`order = 9e6`) so `CORSPlugin.init()` unshifts its
   * preflight and CORS-header interceptors outside this guard.
   */
  readonly order: number = 0;

  /**
   * Attach the v1 protocol guard onto `rootInterceptors` and return `handlerOptions`.
   *
   * On oRPC v1 (`^1.16.6`), `StandardHandler` only executes `rootInterceptors`.
   * The `0.1.0` oRPC v2 cut-over replaces this with `ProtocolGuardHandlerPlugin`
   * (`before: ['~cors']`) attached to `routingInterceptors`.
   */
  init(handlerOptions: unknown, router?: unknown): unknown {
    const options = handlerOptions as RootInterceptorHandlerOptions;
    const matcher = initRpcMatcher(router);

    options.rootInterceptors ??= [];
    options.rootInterceptors.push(async (interceptorOptions) => {
      // Defense-in-depth: never reject CORS preflights even if CORSPlugin is absent.
      if (interceptorOptions.request.method.toUpperCase() === 'OPTIONS') {
        return await interceptorOptions.next();
      }

      const receivedProtocol = readHeaderCaseInsensitive(
        interceptorOptions.request.headers,
        RPC_PROTOCOL_HEADER_LOWER,
      );

      if (receivedProtocol !== undefined && receivedProtocol !== RPC_PROTOCOL_V1) {
        if (matcher && interceptorOptions.request.url) {
          const relativePath = extractRelativeRpcPathname(
            interceptorOptions.request.url.pathname,
            interceptorOptions.prefix,
          );
          if (
            relativePath === undefined ||
            !(await matcher.match(interceptorOptions.request.method, relativePath))
          ) {
            // Path does not match any RPC procedure — preserve fallthrough to overlapping
            // OpenAPI or raw routes rather than returning a spurious 426.
            return await interceptorOptions.next();
          }
        }

        return {
          matched: true,
          response: {
            status: 426,
            headers: {
              vary: RPC_PROTOCOL_HEADER,
            },
            // Plain object body is serialized as `application/json` by `@standard-server/fetch`.
            // Deliberately omits `"status"` so oRPC v2 `RPCLink` decodes a genuine `ORPCError`
            // rather than `MalformedResponseError`.
            body: {
              json: {
                defined: false,
                code: 'CLIENT_PROTOCOL_UNSUPPORTED',
                message:
                  `Unsupported RPC protocol '${receivedProtocol}' for this v1 server; expected '${RPC_PROTOCOL_V1}'.`,
                data: {
                  expectedProtocol: RPC_PROTOCOL_V1,
                  receivedProtocol,
                },
              },
            },
          },
        };
      }

      const result = await interceptorOptions.next();
      if (result.matched && result.response) {
        appendVaryToken(result.response.headers, RPC_PROTOCOL_HEADER);
      }
      return result;
    });

    return handlerOptions;
  }
}
