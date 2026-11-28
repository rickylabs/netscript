import type { GenericHandlerOptions, RootInterceptor } from './_types.ts';

/**
 * Standard oRPC and NetScript error-code to HTTP-status table used when an error
 * does not carry an explicit `.status` property (for example oRPC v2 `ORPCError`).
 */
export const DEFAULT_ORPC_ERROR_STATUS_MAP: Readonly<Record<string, number>> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  NOT_ACCEPTABLE: 406,
  TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_CONTENT: 422,
  UNPROCESSABLE_ENTITY: 422,
  VALIDATION_ERROR: 422,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  RATE_LIMITED: 429,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * Return `true` when `value` is a valid HTTP error status code (`400`–`599` integer)
 * safe to pass to both `ORPCError` and Web `Response`.
 */
export function isValidErrorHttpStatus(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599;
}

/**
 * Attach a root-level interceptor onto oRPC handler options.
 *
 * On oRPC v1 (`^1.16.6`), `StandardHandler` only executes `rootInterceptors` and
 * ignores `routingInterceptors`. Phase 2 (`0.1.0`) switches this single seam to
 * `routingInterceptors` when cutting over to oRPC v2.
 *
 * @param handlerOptions - Handler options passed into plugin `init()`.
 * @param interceptor - Root request interceptor to register.
 * @returns The handler options object for return-based plugin initialization.
 */
export function attachRootHandlerInterceptor<TOptions extends GenericHandlerOptions>(
  handlerOptions: TOptions,
  interceptor: RootInterceptor,
): TOptions {
  handlerOptions.rootInterceptors ??= [];
  handlerOptions.rootInterceptors.push(interceptor);
  return handlerOptions;
}

/**
 * Resolve a valid HTTP error status code (`400`–`599`) for a handler error across
 * oRPC v1 (`error.status`) and oRPC v2 (`error.code` + `errorStatusMap`).
 *
 * Checks:
 * 1. Explicit valid HTTP error status on `error.status` (`400`–`599` integer).
 * 2. Valid caller-provided `errorStatusMap[error.code]` (`400`–`599` integer).
 * 3. Standard oRPC and NetScript status codes (`DEFAULT_ORPC_ERROR_STATUS_MAP`).
 * 4. Defaults unknown coded errors to `500` (returning `undefined` for uncoded errors).
 */
export function resolveErrorHttpStatus(
  error: { readonly code?: string; readonly status?: number },
  errorStatusMap?: Readonly<Record<string, number>>,
): number | undefined {
  if (isValidErrorHttpStatus(error.status)) {
    return error.status;
  }

  const code = error.code;
  if (typeof code !== 'string' || code.length === 0) {
    return undefined;
  }

  if (errorStatusMap && Object.hasOwn(errorStatusMap, code)) {
    const mapped = errorStatusMap[code];
    if (isValidErrorHttpStatus(mapped)) {
      return mapped;
    }
  }

  if (Object.hasOwn(DEFAULT_ORPC_ERROR_STATUS_MAP, code)) {
    return DEFAULT_ORPC_ERROR_STATUS_MAP[code];
  }

  return 500;
}

/**
 * Extract top-level input keys without leaking values.
 *
 * @param input - Procedure input value.
 * @param maxKeys - Maximum keys to return.
 * @returns Safe key list.
 */
export function extractInputKeys(input: unknown, maxKeys: number): string[] {
  if (!input || typeof input !== 'object') {
    return [];
  }

  const keys = Object.keys(input);
  if (keys.length > maxKeys) {
    return [...keys.slice(0, maxKeys), `...(${keys.length - maxKeys} more)`];
  }

  return keys;
}
