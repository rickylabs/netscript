/**
 * ServiceBuilder integration for mounted stream proxies: build-time validation & overlap checks,
 * pre-authn canonicalization + credential/Origin middleware, and GET route registration with
 * unconditional access enforcement and final mounted response ownership.
 *
 * @module
 */

import type { Context, Hono } from 'hono';
import { toHttpPath } from '@orpc/client/standard';
import { toRou3Pattern } from '@orpc/openapi/standard';
import { isLazy, traverseContractProcedures } from '@orpc/server';
import { createLogger } from '@netscript/logger';
import type { InternalCallerPredicate } from '../auth/contract/contract-policy.ts';
import { isInternalServicePrincipal } from '../auth/internal-credential/internal-credential-authenticator.ts';
import { authorizeProcedurePolicy } from '../auth/contract/procedure-policy-decision.ts';
import {
  assertNoStreamPathOverlap,
  compileDistinctStreamEndpoints,
  joinMountPattern,
  type NormalizedStreamEndpoint,
} from '../auth/contract/stream-endpoint-policy.ts';
import {
  getStreamProxyRequestState,
  setStreamProxyRequestState,
} from '../auth/contract/stream-request-state.ts';
import type { Principal } from '../auth/types.ts';
import { isOrpcRouter } from '../primitives/orpc-router.ts';
import type { ServiceMiddleware, ServiceRouter } from '../types.ts';
import type { RpcWiringOptions } from './service-rpc.ts';
import { resolveRpcWiringPaths } from './service-rpc.ts';
import type { StreamProxyMount, StreamProxyMountContext } from './stream-proxy-mount.ts';
import {
  type CompiledStreamMountGuard,
  matchAndCanonicalizeStreamRequest,
  selectStreamCredentialAndGuard,
  validateStreamAllowedOrigins,
} from './stream-proxy-guard.ts';
import {
  composeMountedStreamResponse,
  createStreamGuardErrorResponse,
  validateAuthnStreamOverlayHeaders,
} from './stream-proxy-headers.ts';

const STREAM_MOUNT_LOGGER = createLogger(['netscript', 'service', 'stream-proxy']);
const NEVER_ABORTED_SIGNAL = new AbortController().signal;

/** Compiled mount entry prepared at `ServiceBuilder.build()` time. */
export interface PreparedStreamProxyMount extends CompiledStreamMountGuard {
  /** Original structural mount handle. */
  readonly mount: StreamProxyMount;
}

/** Build-time snapshot used to validate stream proxy mounts and detect route overlaps. */
export interface PrepareStreamProxyMountsInput {
  readonly mounts: readonly StreamProxyMount[];
  readonly hasAuthn: boolean;
  readonly deferredRoutes: readonly { readonly method: string; readonly path: string }[];
  readonly healthConfigured: boolean;
  readonly openApiConfigured: boolean;
  readonly docsConfigured: boolean;
  readonly serviceInfoConfigured: boolean;
  readonly rpcConfigured: boolean;
  readonly rpcOptions: RpcWiringOptions | null;
  readonly router: ServiceRouter;
}

/** Validates stream mounts, authn posture, and dispatch-consistent route overlaps at `build()`. */
export function prepareStreamProxyMounts(
  input: PrepareStreamProxyMountsInput,
): readonly PreparedStreamProxyMount[] {
  if (input.mounts.length === 0) return Object.freeze([]);

  for (const mount of input.mounts) {
    if (
      typeof mount !== 'object' ||
      mount === null ||
      typeof mount.handle !== 'function'
    ) {
      throw new TypeError(
        '[netscript.service.stream-proxy] stream proxy mount must supply an endpoint and handle()',
      );
    }
  }

  const normalizedEndpoints = compileDistinctStreamEndpoints(
    input.mounts.map((mount) => mount.endpoint),
  );

  const prepared: PreparedStreamProxyMount[] = input.mounts.map((mount, index) => {
    const endpoint = normalizedEndpoints[index]!;
    if (endpoint.policy.authentication !== 'none' && !input.hasAuthn) {
      throw new Error(
        `[netscript.service.stream-proxy] stream proxy endpoint '${endpoint.id}' requires service authentication (withAuthn)`,
      );
    }
    const allowedOrigins = validateStreamAllowedOrigins(mount.guardConfig?.allowedOrigins);
    const trustProxy = mount.guardConfig?.trustProxy ?? false;
    if (trustProxy !== false && typeof trustProxy !== 'function') {
      throw new TypeError(
        `[netscript.service.stream-proxy] guardConfig.trustProxy must be false or a predicate on '${endpoint.id}'`,
      );
    }
    const allowDirectNavigation = mount.guardConfig?.allowDirectNavigation === true;
    return Object.freeze({
      mount,
      endpoint,
      allowedOrigins,
      trustProxy,
      allowDirectNavigation,
    });
  });

  // Collect all external patterns that could intersect a mounted stream endpoint.
  const externalPatterns: Array<{ readonly label: string; readonly pattern: string }> = [];

  for (const route of input.deferredRoutes) {
    externalPatterns.push({
      label: `ServiceBuilder.route(${route.method.toUpperCase()})`,
      pattern: route.path,
    });
  }

  if (input.healthConfigured) {
    externalPatterns.push(
      { label: 'health route', pattern: '/health' },
      { label: 'health route', pattern: '/health/live' },
      { label: 'health route', pattern: '/health/ready' },
    );
  }
  if (input.openApiConfigured) {
    externalPatterns.push({ label: 'OpenAPI route', pattern: '/api/openapi.json' });
  }
  if (input.docsConfigured) {
    externalPatterns.push(
      { label: 'docs route', pattern: '/api/docs' },
      { label: 'docs route', pattern: '/api/docs/scalar.js' },
    );
  }
  if (input.serviceInfoConfigured) {
    externalPatterns.push({ label: 'service info route', pattern: '/' });
  }

  if (input.rpcConfigured) {
    const { rpcPath, apiPath } = resolveRpcWiringPaths(input.rpcOptions ?? undefined);
    const rpcPrefixes = [
      rpcPath,
      ...(input.rpcOptions?.rpcAliases ?? []),
      ...(input.rpcOptions?.deprecatedRpcRoutes?.map((item) => item.pathPrefix) ?? []),
    ];
    for (const prefix of rpcPrefixes) {
      externalPatterns.push({
        label: 'RPC mount',
        pattern: joinMountPattern(prefix, '/**'),
      });
    }
    const openApiPatterns = extractRouterOpenApiPatterns(input.router, apiPath);
    for (const pattern of openApiPatterns) {
      externalPatterns.push({ label: 'oRPC OpenAPI route', pattern });
    }
  }

  assertNoStreamPathOverlap(normalizedEndpoints, externalPatterns);
  return Object.freeze(prepared);
}

/**
 * Extracts oRPC OpenAPI route patterns from a `ServiceRouter` using `@orpc/server`'s canonical
 * traversal (unwrapping hidden contracts when attached) and fails closed if any unresolved lazy
 * oRPC route prevents build-time overlap verification.
 */
function extractRouterOpenApiPatterns(
  router: ServiceRouter,
  apiPath: string,
): readonly string[] {
  if (isLazy(router)) {
    throw new Error(
      "[netscript.service.stream-proxy] cannot verify stream endpoint path overlap against unresolved lazy oRPC route at '<root>'; pass an eager router or unlazy before build()",
    );
  }
  if (!isOrpcRouter(router)) return [];

  const patterns: string[] = [];
  const lazyNodes = traverseContractProcedures({ router, path: [] }, ({ contract, path }) => {
    const rawHttpPath = contract['~orpc'].route.path;
    const httpPath: `/${string}` = typeof rawHttpPath === 'string' && rawHttpPath.length > 0
      ? (rawHttpPath.startsWith('/') ? `/${rawHttpPath.slice(1)}` : `/${rawHttpPath}`)
      : toHttpPath(path);
    const rou3Pattern = toRou3Pattern(httpPath);
    patterns.push(joinMountPattern(apiPath, rou3Pattern));
  });
  if (lazyNodes.length > 0) {
    const firstPath = lazyNodes[0]!.path.join('.') || '<root>';
    throw new Error(
      `[netscript.service.stream-proxy] cannot verify stream endpoint path overlap against unresolved lazy oRPC route at '${firstPath}'; pass an eager router or unlazy before build()`,
    );
  }
  return patterns;
}

/**
 * Creates the pre-authn stream canonicalization & credential/Origin guard middleware.
 * Runs BEFORE `withAuthn` so invalid paths fail `400`, invalid credentials fail `401`/`403`,
 * and `withAuthn` receives an `AuthnRequest` scoped strictly to the selected `credentialMode`.
 */
export function createPreAuthnStreamGuardMiddleware(
  prepared: readonly PreparedStreamProxyMount[],
): ServiceMiddleware {
  return async (c, next) => {
    const rawPathname = readRawPathname(c);
    const match = matchAndCanonicalizeStreamRequest(rawPathname, c.req.path, prepared);
    if (match.kind === 'unmatched') {
      return await next();
    }
    if (match.kind === 'invalid') {
      STREAM_MOUNT_LOGGER.warn('stream proxy rejected non-canonical path before authn', {
        status: 400,
        reason: match.reason,
      });
      return createStreamGuardErrorResponse(400, 'BAD_REQUEST', match.reason);
    }

    // Non-GET methods on a canonical stream path pass through to normal authz/not-found dispatch.
    if (c.req.method !== 'GET') {
      return await next();
    }

    const remoteAddr = readRemoteAddr(c);
    const guardResult = selectStreamCredentialAndGuard(c.req.raw, remoteAddr, match.mount);
    if (!guardResult.ok) {
      STREAM_MOUNT_LOGGER.warn('stream proxy rejected admission at pre-authn credential guard', {
        endpointId: match.mount.endpoint.id,
        status: guardResult.status,
        reason: guardResult.reason,
      });
      return createStreamGuardErrorResponse(
        guardResult.status,
        statusLabel(guardResult.status),
        guardResult.reason,
      );
    }

    setStreamProxyRequestState(c.req.raw, {
      endpointId: match.mount.endpoint.id,
      credentialMode: guardResult.credentialMode,
      authenticationRequired: match.mount.endpoint.policy.authentication !== 'none',
    });

    return await next();
  };
}

/** Registers GET routes for all prepared stream proxy mounts after auth/body-limit middleware. */
export function installStreamProxyRoutes(
  app: Hono,
  prepared: readonly PreparedStreamProxyMount[],
  isInternalCaller: InternalCallerPredicate = isInternalServicePrincipal,
): void {
  for (const item of prepared) {
    app.get(item.endpoint.routePattern, async (c: Context) => {
      const state = getStreamProxyRequestState(c.req.raw);
      if (!state || state.endpointId !== item.endpoint.id) {
        return createStreamGuardErrorResponse(503, 'SERVICE_UNAVAILABLE', 'stream_guard_missing');
      }

      const principal = readPrincipal(c);
      const accessFailure = enforceMountAccess(c, item.endpoint, principal, isInternalCaller);
      if (accessFailure !== null) return accessFailure;

      const validatedAuthn = validateAuthnStreamOverlayHeaders(state.authnResult);
      if (!validatedAuthn.ok) {
        STREAM_MOUNT_LOGGER.warn('stream proxy rejected reserved or invalid AuthnResult headers', {
          endpointId: item.endpoint.id,
          status: 503,
          reason: validatedAuthn.reason,
        });
        return createStreamGuardErrorResponse(
          503,
          'SERVICE_UNAVAILABLE',
          'invalid_authn_response_headers',
        );
      }

      const mountContext: StreamProxyMountContext = {
        params: c.req.param(),
        credentialMode: state.credentialMode,
        ...(principal !== undefined ? { principal } : {}),
        ...(readRemoteAddr(c) !== undefined ? { remoteAddr: readRemoteAddr(c) } : {}),
        shutdownSignal: readShutdownSignal(c) ?? NEVER_ABORTED_SIGNAL,
      };

      let proxyResponse: Response;
      try {
        proxyResponse = await item.mount.handle(c.req.raw, mountContext);
      } catch {
        STREAM_MOUNT_LOGGER.warn('mounted stream proxy handler threw', {
          endpointId: item.endpoint.id,
          status: 503,
          reason: 'stream_handler_error',
        });
        return createStreamGuardErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
      }

      return composeMountedStreamResponse(
        proxyResponse,
        validatedAuthn.headers,
        validatedAuthn.setCookies,
      );
    });
  }
}

function enforceMountAccess(
  c: Context,
  endpoint: NormalizedStreamEndpoint,
  principal: Principal | undefined,
  isInternalCaller: InternalCallerPredicate,
): Response | null {
  if (endpoint.policy.authentication === 'none') return null;
  if (!principal) {
    return createStreamGuardErrorResponse(401, 'UNAUTHORIZED', 'missing-principal');
  }
  const decision = authorizeProcedurePolicy(
    {
      principal,
      method: 'GET',
      path: c.req.path,
      rawPath: readRawPathname(c),
    },
    endpoint.policy,
    isInternalCaller,
  );
  if (!decision.allow) {
    return createStreamGuardErrorResponse(403, 'FORBIDDEN', decision.reason);
  }
  return null;
}

function readRawPathname(c: Context): string {
  const url = c.req.url;
  const start = url.indexOf('/', url.indexOf('//') + 2);
  if (start < 0) return '/';
  const end = url.slice(start).search(/[?#]/);
  return end < 0 ? url.slice(start) : url.slice(start, start + end);
}

function isPrincipal(value: unknown): value is Principal {
  if (typeof value !== 'object' || value === null) return false;
  return typeof Reflect.get(value, 'subject') === 'string' &&
    Array.isArray(Reflect.get(value, 'scopes')) &&
    Array.isArray(Reflect.get(value, 'roles'));
}

function readPrincipal(c: Context): Principal | undefined {
  const value: unknown = c.get('principal');
  return isPrincipal(value) ? value : undefined;
}

function isDenoAddr(value: unknown): value is Deno.Addr {
  if (typeof value !== 'object' || value === null) return false;
  const transport = Reflect.get(value, 'transport');
  return transport === 'tcp' || transport === 'udp' || transport === 'unix' ||
    transport === 'unixpacket';
}

function readRemoteAddr(c: Context): Deno.Addr | undefined {
  const env: unknown = c.env;
  if (typeof env !== 'object' || env === null) return undefined;
  const addr = Reflect.get(env, 'remoteAddr');
  return isDenoAddr(addr) ? addr : undefined;
}

function readShutdownSignal(c: Context): AbortSignal | undefined {
  const env: unknown = c.env;
  if (typeof env !== 'object' || env === null) return undefined;
  const signal = Reflect.get(env, 'shutdownSignal');
  return signal instanceof AbortSignal ? signal : undefined;
}

function statusLabel(status: number): string {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  return 'SERVICE_UNAVAILABLE';
}
