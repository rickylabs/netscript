/** Maximum integer used by contract numeric schemas. */
export const DEFAULT_INTEGER_MAX = 2_147_483_647;

/** Default page size for contract pagination schemas. */
export const DEFAULT_PAGINATION_LIMIT = 10;

/** Maximum page size accepted by contract pagination schemas. */
export const DEFAULT_PAGINATION_LIMIT_MAX = 1_000;

/** Default offset for contract offset-pagination schemas. */
export const DEFAULT_PAGINATION_OFFSET = 0;

/** Common oRPC error codes shared by NetScript service contracts. */
export const COMMON_ERROR_CODES: Readonly<{
  notFound: 'NOT_FOUND';
  validationError: 'VALIDATION_ERROR';
  unauthorized: 'UNAUTHORIZED';
  forbidden: 'FORBIDDEN';
  rateLimited: 'RATE_LIMITED';
  serviceUnavailable: 'SERVICE_UNAVAILABLE';
}> = Object.freeze({
  notFound: 'NOT_FOUND',
  validationError: 'VALIDATION_ERROR',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  rateLimited: 'RATE_LIMITED',
  serviceUnavailable: 'SERVICE_UNAVAILABLE',
});

/** Finite statuses emitted by `inspectContracts`. */
export const INSPECTION_STATUS: Readonly<{
  ok: 'ok';
  warning: 'warning';
  error: 'error';
}> = Object.freeze({
  ok: 'ok',
  warning: 'warning',
  error: 'error',
});
