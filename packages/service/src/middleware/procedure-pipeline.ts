/**
 * oRPC-native procedure pipeline wrapping for NetScript services.
 *
 * Wraps router leaves idempotently with two independent layers:
 * 1. Per-leaf `WRAPPED_PROCEDURE_SERVICE` (`WeakMap<object, symbol>`) traversal so
 *    nested mounts (`{ v1: { orders: wrappedChild } }`), dual `rpcRouter` aliases,
 *    and repeated builds wrap each leaf at most once while failing closed on
 *    cross-service remounts (`ROUTER_CLIENT_CROSS_SERVICE_MOUNT`).
 * 2. Per-invocation context-symbol guard (`PIPELINE_EXECUTED_SYMBOL`) so the
 *    pipeline executes strictly once per service per invocation even across nested
 *    mounts and future oRPC v2 runtimes without upstream middleware deduplication.
 *
 * @module
 */

import {
  type AnyMiddleware,
  type AnyProcedure,
  type AnyRouter,
  createAccessibleLazyRouter,
  enhanceRouter,
  getHiddenRouterContract,
  getLazyMeta,
  isLazy,
  isProcedure,
  lazy,
  os,
  setHiddenRouterContract,
  unlazy,
} from '@orpc/server';
import type { Logger } from '@netscript/logger';
import { getActiveContext } from '@netscript/telemetry';
import type { AuthnSideEffects, Principal } from '../auth/types.ts';
import type { PreparedProcedureRateLimitStage } from '../rate-limit/middleware/procedure-rate-limit.ts';
import {
  isAsyncIteratorLike,
  wrapDetachedAsyncIterator,
} from '../runtime/async-context-isolation.ts';
import {
  ADMITTED_HTTP_CALL_SYMBOL,
  type ServiceLifecycleTracker,
} from '../runtime/started-service.ts';
import type { ServiceEnvironment, ServiceRouter } from '../types.ts';
import { enforceProcedureAuth, type ProcedureAuthConfig } from './procedure-auth.ts';

/**
 * Machine-readable configuration error codes emitted by NetScript's oRPC procedure pipeline.
 */
export const SERVICE_PIPELINE_ERROR_CODES: {
  readonly CROSS_SERVICE_MOUNT: 'ROUTER_CLIENT_CROSS_SERVICE_MOUNT';
} = {
  CROSS_SERVICE_MOUNT: 'ROUTER_CLIENT_CROSS_SERVICE_MOUNT',
} as const;

/** Stable configuration error code union for {@link ServicePipelineConfigError}. */
export type ServicePipelineErrorCode =
  (typeof SERVICE_PIPELINE_ERROR_CODES)[keyof typeof SERVICE_PIPELINE_ERROR_CODES];

/**
 * Configuration error thrown when a service's oRPC procedure pipeline detects an
 * unsafe or incompatible composition (such as remounting a procedure already wrapped
 * by a different service instance).
 */
export class ServicePipelineConfigError extends Error {
  /** Machine-readable diagnostic code. */
  readonly code: ServicePipelineErrorCode;

  /**
   * Creates a typed procedure-pipeline configuration error.
   *
   * @param code - Stable diagnostic error code.
   * @param message - Actionable error description.
   */
  constructor(code: ServicePipelineErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'ServicePipelineConfigError';
    this.code = code;
  }
}

/** Internal context symbol tracking which service pipelines already executed for one invocation. */
export const PIPELINE_EXECUTED_SYMBOL: unique symbol = Symbol(
  'netscript.service.pipeline.executed',
);

/** Internal context symbol carrying HTTP edge request metadata into procedure middleware. */
export const HTTP_REQUEST_METADATA_SYMBOL: unique symbol = Symbol(
  'netscript.service.http.request-metadata',
);

/**
 * Private response-headers channel used when a caller's context already owns a
 * non-`Headers` `resHeaders` property.
 */
export const PROCEDURE_RESPONSE_HEADERS_SYMBOL: unique symbol = Symbol(
  'netscript.service.procedure.response-headers',
);

/** Shared correlation symbol aligned with `@netscript/logger/orpc`. */
export const CORRELATION_REQUEST_ID_SYMBOL: symbol = Symbol.for('netscript.request-id');

/** Per-request HTTP edge metadata forwarded privately on oRPC initial context. */
export interface HttpRequestMetadata {
  /** Raw Web Platform request received by the service HTTP edge. */
  readonly request: Request;
  /** Stable Hono request context identity (preserved across `withBodyLimit` `Request` replacement). */
  readonly httpContext?: object;
  /** Optional socket/host environment attached to the HTTP request. */
  readonly env?: ServiceEnvironment;
  /** Optional request-scoped logger attached by `withLogger()`. */
  readonly logger?: Logger;
}

/** Configuration for wrapping a service router with NetScript's procedure pipeline. */
export interface ProcedurePipelineConfig {
  /** Unique symbol identifying this service builder instance. */
  readonly serviceId: symbol;
  /** Service name used in diagnostics. */
  readonly serviceName: string;
  /** Optional procedure-level authentication and authorization configuration. */
  readonly auth?: ProcedureAuthConfig;
  /** Validated declarative procedure rate-limit stages executed in registration order. */
  readonly rateLimitStages?: readonly PreparedProcedureRateLimitStage[];
  /** Optional started-service lifecycle tracker for in-flight draining and stream detachment. */
  readonly lifecycle?: ServiceLifecycleTracker;
}

interface ProcedurePipelineContext extends Record<PropertyKey, unknown> {
  readonly principal?: Principal;
  readonly requestId?: unknown;
  readonly clientAddress?: string;
  readonly headers?: Readonly<Record<string, string>> | Headers;
  readonly authnSideEffects?: AuthnSideEffects;
  readonly resHeaders?: unknown;
  readonly [CORRELATION_REQUEST_ID_SYMBOL]?: string;
  readonly [PIPELINE_EXECUTED_SYMBOL]?: ReadonlySet<symbol>;
  readonly [HTTP_REQUEST_METADATA_SYMBOL]?: HttpRequestMetadata;
  readonly [PROCEDURE_RESPONSE_HEADERS_SYMBOL]?: Headers;
}

/**
 * Per-leaf ownership registry mapping each wrapped oRPC procedure object to the
 * `serviceId` that wrapped it. Never mutates unwrapped caller procedure objects.
 */
const WRAPPED_PROCEDURE_SERVICE = new WeakMap<object, symbol>();

/**
 * Maps each wrapped procedure leaf back to its canonical path on the service's
 * primary router so flat `withRPC({ rpcRouter })` aliases resolve canonical
 * contract policies and procedure paths.
 */
const CANONICAL_LEAF_PATH = new WeakMap<object, readonly string[]>();

/**
 * Wraps every oRPC procedure leaf in `router` with NetScript's procedure pipeline.
 *
 * Preserves hidden contract references (`getHiddenRouterContract`), supports lazy
 * router branches, skips leaves already wrapped for `config.serviceId`, reuses
 * wrapped leaves across `router` and `rpcRouter` via `rawLeafCache`, and throws
 * {@link ServicePipelineConfigError} (`ROUTER_CLIENT_CROSS_SERVICE_MOUNT`) when a
 * leaf already owned by another service instance is remounted.
 */
export function wrapRouterWithProcedurePipeline<TRouter extends ServiceRouter>(
  router: TRouter,
  config: ProcedurePipelineConfig,
  rawLeafCache: WeakMap<object, object> = new WeakMap<object, object>(),
): TRouter {
  const rateLimitStages = [...(config.rateLimitStages ?? [])];
  const middleware = createProcedurePipelineMiddleware(
    config.serviceId,
    config.auth,
    rateLimitStages,
    config.lifecycle,
  );
  const activeAncestors = new WeakSet<object>();

  const wrapLeaf = (leaf: AnyProcedure, path: readonly string[]): AnyProcedure => {
    const ownerService = WRAPPED_PROCEDURE_SERVICE.get(leaf);
    if (ownerService === config.serviceId) {
      return leaf;
    }
    if (ownerService !== undefined) {
      const label = path.length > 0 ? path.join('.') : '<root>';
      throw new ServicePipelineConfigError(
        SERVICE_PIPELINE_ERROR_CODES.CROSS_SERVICE_MOUNT,
        `Procedure "${label}" is already wrapped by another service pipeline and cannot be remounted under "${config.serviceName}".`,
      );
    }

    const cached = rawLeafCache.get(leaf);
    if (cached && isProcedure(cached)) {
      return cached;
    }

    const wrappedLeaf = enhanceRouter(leaf, {
      middlewares: [middleware],
      errorMap: {},
      dedupeLeadingMiddlewares: false,
    });
    WRAPPED_PROCEDURE_SERVICE.set(wrappedLeaf, config.serviceId);
    if (!CANONICAL_LEAF_PATH.has(wrappedLeaf)) {
      CANONICAL_LEAF_PATH.set(wrappedLeaf, Object.freeze([...path]));
    }
    rawLeafCache.set(leaf, wrappedLeaf);
    return wrappedLeaf;
  };

  const walkValue = (value: unknown, path: readonly string[]): unknown => {
    if (isLazy(value)) {
      const ownerService = WRAPPED_PROCEDURE_SERVICE.get(value);
      if (ownerService === config.serviceId) {
        return value;
      }
      if (ownerService !== undefined) {
        const label = path.length > 0 ? path.join('.') : '<root>';
        throw new ServicePipelineConfigError(
          SERVICE_PIPELINE_ERROR_CODES.CROSS_SERVICE_MOUNT,
          `Lazy router "${label}" is already wrapped by another service pipeline and cannot be remounted under "${config.serviceName}".`,
        );
      }

      const cached = rawLeafCache.get(value);
      if (cached !== undefined) {
        return cached;
      }

      const laziedMeta = getLazyMeta(value);
      const hiddenContract = readHiddenContract(value);
      const wrappedLazy = lazy(async () => {
        const { default: resolved } = await unlazy(value);
        const wrapped = walkValue(resolved, path);
        const unwrapped = await unlazy(wrapped);
        return { default: unwrapped.default as AnyRouter };
      }, laziedMeta);
      const accessible = createAccessibleLazyRouter(wrappedLazy);
      const finalLazy = hiddenContract !== undefined
        ? attachHiddenContract(accessible, hiddenContract)
        : accessible;
      WRAPPED_PROCEDURE_SERVICE.set(finalLazy, config.serviceId);
      rawLeafCache.set(value, finalLazy);
      return finalLazy;
    }

    if (isProcedure(value)) {
      return wrapLeaf(value, path);
    }

    if (typeof value === 'object' && value !== null) {
      return walkObjectBranch(value, path);
    }

    return value;
  };

  const walkObjectBranch = (
    node: object,
    path: readonly string[],
  ): Record<string, unknown> => {
    if (activeAncestors.has(node)) {
      const label = path.length > 0 ? path.join('.') : '<root>';
      throw new TypeError(`Circular router branch "${label}" cannot be wrapped.`);
    }
    activeAncestors.add(node);
    try {
      const wrapped: Record<string, unknown> = {};
      for (const key in node) {
        Object.defineProperty(wrapped, key, {
          value: walkValue(Reflect.get(node, key), [...path, key]),
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      const hiddenContract = getHiddenRouterContract(node as AnyRouter);
      if (hiddenContract !== undefined) {
        return setHiddenRouterContract(wrapped as AnyRouter, hiddenContract) as Record<
          string,
          unknown
        >;
      }
      return wrapped;
    } finally {
      activeAncestors.delete(node);
    }
  };

  return walkValue(router, []) as TRouter;
}

/** Reports whether a procedure leaf was already wrapped by a NetScript service pipeline. */
export function getWrappedProcedureServiceId(procedure: object): symbol | undefined {
  return WRAPPED_PROCEDURE_SERVICE.get(procedure);
}

function createProcedurePipelineMiddleware(
  serviceId: symbol,
  authConfig: ProcedureAuthConfig | undefined,
  rateLimitStages: readonly PreparedProcedureRateLimitStage[],
  lifecycle: ServiceLifecycleTracker | undefined,
): AnyMiddleware {
  return os.$context<ProcedurePipelineContext>().middleware(
    async ({ context, path, procedure, signal, next }) => {
      const executed = context[PIPELINE_EXECUTED_SYMBOL];
      if (executed?.has(serviceId)) {
        return await next();
      }
      const nextExecuted = new Set(executed);
      nextExecuted.add(serviceId);

      const httpMeta = context[HTTP_REQUEST_METADATA_SYMBOL];
      const alreadyAdmittedHttp = httpMeta?.env !== undefined &&
        Reflect.get(httpMeta.env, ADMITTED_HTTP_CALL_SYMBOL) === serviceId;
      const leaveCall = lifecycle?.enterCall(alreadyAdmittedHttp);
      let streamOwnsLifecycle = false;
      let ownedScope: { readonly end: () => void } | undefined;

      try {
        const requestId = readRequestId(context) ?? createRequestId();
        const preserveCallerRequestId = context.requestId !== undefined &&
          typeof context.requestId !== 'string';
        const candidatePrincipal = isPrincipalLike(context.principal)
          ? context.principal
          : undefined;
        const canonicalPath = CANONICAL_LEAF_PATH.get(procedure) ?? path;

        let verifiedPrincipal = candidatePrincipal;
        if (authConfig) {
          const authOutcome = await enforceProcedureAuth(authConfig, {
            procedure,
            path: canonicalPath,
            candidatePrincipal,
            headers: context.headers,
            authnSideEffects: isAuthnSideEffectsLike(context.authnSideEffects)
              ? context.authnSideEffects
              : undefined,
            httpRequest: httpMeta?.request,
            httpContext: httpMeta?.httpContext,
            logger: httpMeta?.logger,
            requestId,
            signal,
          });
          verifiedPrincipal = authOutcome.principal;
          ownedScope = authOutcome.ownedScope;
        }

        if (rateLimitStages.length > 0) {
          const clientAddress = typeof context.clientAddress === 'string'
            ? context.clientAddress
            : undefined;
          const resHeaders = context[PROCEDURE_RESPONSE_HEADERS_SYMBOL] instanceof Headers
            ? context[PROCEDURE_RESPONSE_HEADERS_SYMBOL]
            : context.resHeaders instanceof Headers
            ? context.resHeaders
            : undefined;
          const isRateLimitedDefined = hasContractError(procedure, 'RATE_LIMITED');

          for (const stage of rateLimitStages) {
            await stage.enforce({
              principal: verifiedPrincipal,
              clientAddress,
              httpRequest: httpMeta?.request,
              httpEnv: httpMeta?.env,
              procedurePath: canonicalPath,
              signal,
              resHeaders,
              logger: httpMeta?.logger,
              isRateLimitedDefined,
            });
          }
        }

        const result = await next({
          context: {
            ...(authConfig ? { principal: verifiedPrincipal } : {}),
            ...(preserveCallerRequestId ? {} : { requestId }),
            [CORRELATION_REQUEST_ID_SYMBOL]: requestId,
            [PIPELINE_EXECUTED_SYMBOL]: nextExecuted,
          },
        });

        if (lifecycle && isAsyncIteratorLike(result.output)) {
          const targetOtelCtx = getActiveContext();
          streamOwnsLifecycle = true;
          const detachedIterator = wrapDetachedAsyncIterator(
            result.output,
            (fn) => lifecycle.cleanAsyncRoot.runDetached(fn, targetOtelCtx),
            leaveCall,
          );
          return {
            ...result,
            output: detachedIterator,
          };
        }

        return result;
      } finally {
        ownedScope?.end();
        if (!streamOwnsLifecycle) {
          leaveCall?.();
        }
      }
    },
  );
}

function isAuthnSideEffectsLike(value: unknown): value is AuthnSideEffects {
  if (typeof value !== 'object' || value === null) return false;
  const onResponseHeaders = Reflect.get(value, 'onResponseHeaders');
  const onSetCookies = Reflect.get(value, 'onSetCookies');
  return (onResponseHeaders === undefined || typeof onResponseHeaders === 'function') &&
    (onSetCookies === undefined || typeof onSetCookies === 'function');
}

function isPrincipalLike(value: unknown): value is Principal {
  return typeof value === 'object' &&
    value !== null &&
    typeof Reflect.get(value, 'subject') === 'string' &&
    Array.isArray(Reflect.get(value, 'scopes')) &&
    Array.isArray(Reflect.get(value, 'roles')) &&
    typeof Reflect.get(value, 'claims') === 'object' &&
    Reflect.get(value, 'claims') !== null;
}

function hasContractError(procedure: AnyProcedure, code: string): boolean {
  const errorMap = procedure['~orpc'].errorMap;
  return typeof errorMap === 'object' && errorMap !== null && Object.hasOwn(errorMap, code);
}

function readRequestId(context: ProcedurePipelineContext): string | undefined {
  const correlated = context[CORRELATION_REQUEST_ID_SYMBOL];
  if (typeof correlated === 'string') {
    const trimmed = correlated.trim();
    if (trimmed.length > 0) return trimmed;
  }
  if (typeof context.requestId === 'string') {
    const trimmed = context.requestId.trim();
    if (trimmed.length > 0) return trimmed;
  }
  const headers = context.headers;
  if (headers instanceof Headers) {
    const value = headers.get('x-request-id')?.trim();
    return value && value.length > 0 ? value : undefined;
  }
  if (typeof headers === 'object' && headers !== null) {
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'x-request-id' && typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) return trimmed;
      }
    }
  }
  return undefined;
}

function createRequestId(): string {
  return crypto.randomUUID().split('-')[0];
}

function readHiddenContract(value: unknown): ReturnType<typeof getHiddenRouterContract> {
  return getHiddenRouterContract(value as AnyRouter);
}

function attachHiddenContract<T extends object>(
  target: T,
  contract: NonNullable<ReturnType<typeof getHiddenRouterContract>>,
): T {
  const rawTarget: unknown = target;
  const attached: unknown = setHiddenRouterContract(rawTarget as AnyRouter, contract);
  return attached as T;
}
