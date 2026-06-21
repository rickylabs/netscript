/**
 * Internal constants shared by logger integrations.
 */

export const REQUEST_ID_HEADER = 'X-Request-ID';

export const DEFAULT_HTTP_SKIP_PATHS = ['/health', '/health/live', '/health/ready'] as const;

export const DEFAULT_RPC_SKIP_PATHS = ['v1.health.*'] as const;

export const SENSITIVE_FIELD_FRAGMENTS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  'apikey',
  'sessionid',
  'accesstoken',
  'refreshtoken',
  'jwttoken',
] as const;
