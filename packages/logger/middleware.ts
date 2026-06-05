/**
 * @module @netscript/logger/middleware
 *
 * Hono middleware for request logging and logger injection.
 */

import { type Logger, withContext } from '@logtape/logtape';
import {
  DEFAULT_HTTP_SKIP_PATHS,
  REQUEST_ID_HEADER,
  SENSITIVE_FIELD_FRAGMENTS,
} from './constants.ts';
import { createServiceLogger } from './creators.ts';

export type { Logger } from '@logtape/logtape';

/**
 * Context variables injected by the logger middleware.
 */
export interface LoggerContextVariables {
  /** Logger instance available to downstream handlers. */
  logger: Logger;
  /** Request identifier propagated through the request lifecycle. */
  requestId: string;
}

/**
 * Minimal request shape required by the logger middleware.
 */
export interface LoggerMiddlewareRequest {
  /** Read a request header value. */
  header(name: string): string | undefined;
  /** HTTP method for the current request. */
  method: string;
  /** Normalized request path. */
  path: string;
  /** Absolute request URL. */
  url: string;
}

/**
 * Minimal response shape required by the logger middleware.
 */
export interface LoggerMiddlewareResponse {
  /** HTTP status code written by the downstream handler. */
  status: number;
}

/**
 * Minimal context contract consumed by the logger middleware.
 */
export interface LoggerMiddlewareContext {
  /** Request accessor used by the middleware. */
  req: LoggerMiddlewareRequest;
  /** Response accessor used by the middleware. */
  res: LoggerMiddlewareResponse;
  /** Store the request-scoped logger on the context. */
  set(key: 'logger', value: Logger): void;
  /** Store the request identifier on the context. */
  set(key: 'requestId', value: string): void;
}

/**
 * Environment shape consumers can use with Hono when the logger middleware is installed.
 */
export interface LoggerMiddlewareEnv {
  /** Request-scoped context variables injected by the middleware. */
  Variables: LoggerContextVariables;
}

/**
 * Options for logger middleware.
 */
export interface LoggerMiddlewareOptions {
  /** Skip logging for certain paths (for example health checks). */
  skipPaths?: string[];
  /** Include request body in logs. Reserved for a future implementation. */
  logBody?: boolean;
  /** Log level for requests. */
  requestLevel?: 'debug' | 'info';
  /** Log level for successful responses. */
  responseLevel?: 'debug' | 'info';
  /** Log level for error responses (4xx, 5xx). */
  errorLevel?: 'warn' | 'error';
}

/**
 * Middleware next function signature.
 */
export type LoggerMiddlewareNext = () => Promise<void>;

/**
 * Public middleware function signature exposed by this package.
 */
export type LoggerMiddleware = (
  ctx: LoggerMiddlewareContext,
  next: LoggerMiddlewareNext,
) => Promise<Response | void>;

/**
 * Inject a logger into the Hono context.
 *
 * @param ctx - Hono context.
 * @param logger - Logger instance to inject.
 */
export function injectLogger(ctx: LoggerMiddlewareContext, logger: Logger): void {
  ctx.set('logger', logger);
}

/**
 * Inject a request ID into the Hono context.
 *
 * Uses the `X-Request-ID` header if present, otherwise generates one.
 *
 * @param ctx - Hono context.
 * @returns The request ID.
 */
export function injectRequestId(ctx: LoggerMiddlewareContext): string {
  const requestId = ctx.req.header(REQUEST_ID_HEADER) ?? generateRequestId();
  ctx.set('requestId', requestId);
  return requestId;
}

/**
 * Create a logging middleware for Hono.
 *
 * This middleware injects a service logger into the context, generates a
 * request ID, and logs request start, completion, and failure events.
 *
 * @param serviceName - Name of the service.
 * @param options - Middleware options.
 * @returns Hono middleware handler.
 */
export function loggerMiddleware(
  serviceName: string,
  options?: LoggerMiddlewareOptions,
): LoggerMiddleware {
  const logger = createServiceLogger(serviceName);
  const {
    skipPaths = [...DEFAULT_HTTP_SKIP_PATHS],
    requestLevel = 'info',
    responseLevel = 'info',
    errorLevel = 'warn',
  } = options ?? {};

  return async (ctx: LoggerMiddlewareContext, next: LoggerMiddlewareNext) => {
    injectLogger(ctx, logger);
    const requestId = injectRequestId(ctx);
    const path = ctx.req.path;

    if (shouldSkipHttpPath(path, skipPaths)) {
      return await next();
    }

    const method = ctx.req.method;
    const url = new URL(ctx.req.url);
    const query = collectQueryParams(url);
    const start = performance.now();
    const requestLogger = logger.with({ requestId, method, path });

    requestLogger[requestLevel]('HTTP request started', {
      ...(Object.keys(query).length > 0 ? { query } : {}),
    });

    try {
      await withContext({ requestId, method, path }, next);

      const duration = Math.round(performance.now() - start);
      const status = ctx.res.status;
      const level = status >= 400 ? errorLevel : responseLevel;

      requestLogger[level]('HTTP request completed', {
        duration,
        status,
      });
    } catch (error: unknown) {
      const duration = Math.round(performance.now() - start);
      const err = toError(error);

      requestLogger.error('HTTP request failed', {
        duration,
        error: err.message,
        stack: err.stack,
      });

      throw error;
    }
  };
}

/**
 * Create a lightweight request logger middleware that only logs request start.
 *
 * @param serviceName - Name of the service.
 * @returns Hono middleware handler.
 */
export function requestLoggerMiddleware(
  serviceName: string,
): LoggerMiddleware {
  const logger = createServiceLogger(serviceName);

  return async (ctx: LoggerMiddlewareContext, next: LoggerMiddlewareNext) => {
    injectLogger(ctx, logger);
    const requestId = injectRequestId(ctx);

    logger.debug('HTTP request received', {
      requestId,
      method: ctx.req.method,
      path: ctx.req.path,
    });

    await withContext(
      {
        requestId,
        method: ctx.req.method,
        path: ctx.req.path,
      },
      next,
    );
  };
}

function generateRequestId(): string {
  return crypto.randomUUID().split('-')[0];
}

function shouldSkipHttpPath(path: string, skipPaths: readonly string[]): boolean {
  return skipPaths.some((skipPath) => path === skipPath || path.startsWith(skipPath));
}

function collectQueryParams(url: URL): Record<string, string> {
  const queryParams: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    queryParams[key] = isSensitiveKey(key) ? '[REDACTED]' : value;
  });

  return queryParams;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_FIELD_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
