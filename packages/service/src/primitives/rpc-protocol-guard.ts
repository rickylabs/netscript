/**
 * oRPC v1 server-side RPC protocol guard (`X-NetScript-RPC-Protocol`).
 *
 * Phase 0a (`0.0.10`) prepares v1 RPC servers ahead of the `0.1.0` oRPC v2 cut-over:
 * - Allows headerless and `orpc-v1` requests (v1 SDKs remain header-neutral in `0.0.10`).
 * - Exempts `OPTIONS` preflights (and runs at `order = 0 < 9e6` inside v1 `CORSPlugin` so
 *   cross-origin browsers can read `426` rejections cleanly).
 * - Rejects any other `X-NetScript-RPC-Protocol` value (for example `orpc-v2`) with HTTP `426`
 *   and a v2-compatible `ORPCError` JSON envelope omitting `"status"` (`defined: false`,
 *   `code: 'CLIENT_PROTOCOL_UNSUPPORTED'`).
 * - Appends `Vary: X-NetScript-RPC-Protocol` on matched RPC responses (including `426`).
 *
 * Mounted strictly on `createRPCHandler` (never `createOpenAPIHandler`).
 *
 * @module
 */

import type { ServiceHandlerPlugin } from '../types.ts';

/** Canonical RPC protocol negotiation header name. */
export const RPC_PROTOCOL_HEADER = 'X-NetScript-RPC-Protocol';

/** Canonical lowercase header name for case-insensitive lookup. */
export const RPC_PROTOCOL_HEADER_LOWER = 'x-netscript-rpc-protocol';

/** Protocol token accepted by oRPC v1 (`^1.16.6`) servers. */
export const RPC_PROTOCOL_V1 = 'orpc-v1';

interface StandardLikeRequest {
  readonly method: string;
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
  next(): Promise<StandardLikeHandleResult>;
}

type RootInterceptor = (options: RootInterceptorOptions) => Promise<StandardLikeHandleResult>;

interface RootInterceptorHandlerOptions {
  rootInterceptors?: RootInterceptor[];
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
    return raw.length === 0 ? undefined : raw.join(', ').trim();
  }
  return raw.trim();
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
 * for mismatched `X-NetScript-RPC-Protocol` headers while keeping CORS outside.
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
   * Phase 2 (`0.1.0`) replaces this with `ProtocolGuardHandlerPlugin` (`before: ['~cors']`)
   * attached to `routingInterceptors`.
   */
  init(handlerOptions: unknown, _router?: unknown): unknown {
    const options = handlerOptions as RootInterceptorHandlerOptions;
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
