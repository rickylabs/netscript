/**
 * Canonical versioned RPC path construction for NetScript services.
 *
 * @module
 */

/** Default base path for NetScript oRPC endpoints. */
export const DEFAULT_RPC_API_PATH = '/api/rpc' as const;

/** Default version segment for NetScript oRPC endpoints. */
export const DEFAULT_RPC_API_VERSION = 'v1' as const;

/** Inputs used to derive the canonical path for a service router. */
export interface ServiceRpcPathOptions {
  /** Router name appended after the version segment. */
  readonly routerName: string;
  /** Base RPC path. Defaults to `/api/rpc`. */
  readonly apiPath?: string;
  /** API version segment. Defaults to `v1`. */
  readonly apiVersion?: string;
}

/** Build the canonical RPC mount path shared by service hosts and typed clients. */
export function buildServiceRpcPath(options: ServiceRpcPathOptions): string {
  const apiPath = normalizePath(options.apiPath ?? DEFAULT_RPC_API_PATH);
  const apiVersion = normalizeSegment(
    options.apiVersion ?? DEFAULT_RPC_API_VERSION,
    'apiVersion',
  );
  const routerName = normalizeSegment(options.routerName, 'routerName');
  return `${apiPath}/${apiVersion}/${routerName}`;
}

function normalizePath(value: string): string {
  const segments = value.split('/').filter(Boolean);
  if (segments.length === 0) {
    throw new TypeError('apiPath must contain at least one path segment');
  }
  return `/${segments.join('/')}`;
}

function normalizeSegment(value: string, name: string): string {
  const segment = value.replace(/^\/+|\/+$/g, '');
  if (!segment || segment.includes('/')) {
    throw new TypeError(`${name} must be one non-empty path segment`);
  }
  return segment;
}
