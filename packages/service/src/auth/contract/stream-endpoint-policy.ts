/**
 * Stream endpoint policy normalization, authoritative mount/declaration cross-checking,
 * dispatch-consistent symmetric path-pattern intersection, and `rou3` stream route indexing.
 *
 * @module
 */

import type {
  StreamEndpointClientAuthMode,
  StreamEndpointContract,
} from '@netscript/contracts/streams';
import { addRoute, createRouter, findRoute } from 'rou3';
import { normalizePath } from './contract-path.ts';
import type { ProcedureAccessPolicy, ProcedurePolicyRequest } from './contract-policy.ts';
import { patternsIntersect } from './stream-path-pattern.ts';

export {
  joinMountPattern,
  type NormalizedPatternSegment,
  parsePathPatternSegments,
  patternsIntersect,
  regexSourceCanMatchSlash,
} from './stream-path-pattern.ts';

const INVALID_STREAM_ENDPOINT_ERROR = '[netscript.service.contract-policy] invalid stream endpoint';
const STREAM_POLICY_MISMATCH_ERROR =
  '[netscript.service.contract-policy] stream endpoint policy mismatch';
const STREAM_PATH_OVERLAP_ERROR =
  '[netscript.service.contract-policy] stream endpoint path overlaps';

const STREAM_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;
const PARAM_SEGMENT_PATTERN = /^\{([A-Za-z_][A-Za-z0-9_]*)\}$/;
const LITERAL_SEGMENT_PATTERN = /^[A-Za-z0-9\-._~!$&'()+,;=:@]+$/;

/** Segment descriptor of a validated stream endpoint template. */
export type StreamTemplateSegment =
  | { readonly kind: 'static'; readonly value: string }
  | { readonly kind: 'param'; readonly name: string };

/** Validated, normalized stream endpoint metadata compiled for policy and dispatch. */
export interface NormalizedStreamEndpoint {
  /** Stable stream endpoint identifier. */
  readonly id: string;
  /** Canonical OpenAPI template path (`/` or `/a/{b}`). */
  readonly path: string;
  /** Hono / `rou3` route pattern (`/` or `/a/:b`). */
  readonly routePattern: string;
  /** Ordered template segments for canonical raw-vs-decoded matching. */
  readonly segments: readonly StreamTemplateSegment[];
  /** Accepted client credential transport mode. */
  readonly clientAuth: StreamEndpointClientAuthMode;
  /** Normalized access-control policy enforced on GET (and internal guards on any method). */
  readonly policy: ProcedureAccessPolicy;
}

/** Compiled stream endpoint lookup table bound alongside oRPC procedures. */
export interface BoundStreamEndpointIndex {
  /** Matches a `GET` request targeting a mounted stream endpoint. */
  find(request: ProcedurePolicyRequest): NormalizedStreamEndpoint | undefined;
  /** Matches any-method requests targeting a stream endpoint with `audience: 'internal'`. */
  findInternalGuard(request: ProcedurePolicyRequest): NormalizedStreamEndpoint | undefined;
}

/** Validates and normalizes one structural `StreamEndpointContract`. */
export function normalizeStreamEndpoint(
  endpoint: StreamEndpointContract<unknown, unknown, unknown, unknown>,
): NormalizedStreamEndpoint {
  if (typeof endpoint !== 'object' || endpoint === null) {
    throw new TypeError(`${INVALID_STREAM_ENDPOINT_ERROR}: endpoint must be an object`);
  }
  const protocol = readProperty(endpoint, 'protocol');
  if (
    readProperty(protocol, 'family') !== 'netscript.durable-stream-sse' ||
    readProperty(protocol, 'major') !== 1
  ) {
    throw new TypeError(
      `${INVALID_STREAM_ENDPOINT_ERROR}: unsupported protocol on '${String(endpoint.id)}'`,
    );
  }
  if (readProperty(endpoint, 'method') !== 'GET') {
    throw new TypeError(
      `${INVALID_STREAM_ENDPOINT_ERROR}: method must be GET on '${String(endpoint.id)}'`,
    );
  }
  const id = readProperty(endpoint, 'id');
  if (typeof id !== 'string' || !STREAM_ID_PATTERN.test(id)) {
    throw new TypeError(`${INVALID_STREAM_ENDPOINT_ERROR}: invalid id '${String(id)}'`);
  }
  const rawPath = readProperty(endpoint, 'path');
  if (typeof rawPath !== 'string') {
    throw new TypeError(`${INVALID_STREAM_ENDPOINT_ERROR}: path must be a string on '${id}'`);
  }
  const { canonicalPath, routePattern, segments } = parseStreamEndpointPath(id, rawPath);

  const clientAuth = readClientAuthMode(readProperty(endpoint, 'clientAuth'), id);
  const policy = normalizeStreamAccessPolicy(readProperty(endpoint, 'access'), id);

  return Object.freeze({
    id,
    path: canonicalPath,
    routePattern,
    segments,
    clientAuth,
    policy,
  });
}

function parseStreamEndpointPath(
  id: string,
  path: string,
): {
  readonly canonicalPath: string;
  readonly routePattern: string;
  readonly segments: readonly StreamTemplateSegment[];
} {
  if (
    !path.startsWith('/') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('*') ||
    path.includes('//') ||
    path.includes('%') ||
    (path.length > 1 && path.endsWith('/'))
  ) {
    throw new TypeError(`${INVALID_STREAM_ENDPOINT_ERROR}: invalid path '${path}' on '${id}'`);
  }
  if (path === '/') {
    return { canonicalPath: '/', routePattern: '/', segments: Object.freeze([]) };
  }

  const rawSegments = path.slice(1).split('/');
  const segments: StreamTemplateSegment[] = [];
  const seenParams = new Set<string>();
  const routeParts: string[] = [];

  for (const segment of rawSegments) {
    if (segment.length === 0 || segment === '.' || segment === '..') {
      throw new TypeError(
        `${INVALID_STREAM_ENDPOINT_ERROR}: invalid segment '${segment}' in path '${path}' on '${id}'`,
      );
    }
    const paramMatch = PARAM_SEGMENT_PATTERN.exec(segment);
    if (paramMatch) {
      const name = paramMatch[1];
      if (!name || seenParams.has(name)) {
        throw new TypeError(
          `${INVALID_STREAM_ENDPOINT_ERROR}: duplicate param '${
            String(name)
          }' in path '${path}' on '${id}'`,
        );
      }
      seenParams.add(name);
      segments.push(Object.freeze({ kind: 'param', name }));
      routeParts.push(`:${name}`);
      continue;
    }
    if (segment.includes('{') || segment.includes('}') || !LITERAL_SEGMENT_PATTERN.test(segment)) {
      throw new TypeError(
        `${INVALID_STREAM_ENDPOINT_ERROR}: invalid literal segment '${segment}' in path '${path}' on '${id}'`,
      );
    }
    segments.push(Object.freeze({ kind: 'static', value: segment }));
    routeParts.push(segment);
  }

  return {
    canonicalPath: path,
    routePattern: `/${routeParts.join('/')}`,
    segments: Object.freeze(segments),
  };
}

function readClientAuthMode(value: unknown, id: string): StreamEndpointClientAuthMode {
  if (value === 'bearer' || value === 'cookie' || value === 'bearer-or-cookie') {
    return value;
  }
  throw new TypeError(
    `${INVALID_STREAM_ENDPOINT_ERROR}: invalid clientAuth '${String(value)}' on '${id}'`,
  );
}

/** Normalizes a stream endpoint's `access` block identically to oRPC contract procedure policies. */
export function normalizeStreamAccessPolicy(
  access: unknown,
  id: string,
): ProcedureAccessPolicy {
  if (access === undefined) {
    return Object.freeze({
      authentication: 'required',
      requiredScopes: Object.freeze([]),
      requiredRoles: Object.freeze([]),
    });
  }
  if (typeof access !== 'object' || access === null) {
    throw new TypeError(`${INVALID_STREAM_ENDPOINT_ERROR}: invalid access policy on '${id}'`);
  }
  const authentication = readProperty(access, 'authentication');
  if (authentication === 'optional') {
    throw new Error(
      `[netscript.service.contract-policy] optional authentication is unsupported: ${id}`,
    );
  }
  if (authentication !== undefined && authentication !== 'required' && authentication !== 'none') {
    throw new Error(
      `[netscript.service.contract-policy] unsupported authentication mode on stream endpoint: ${id}`,
    );
  }
  const audience = readProperty(access, 'audience');
  if (audience !== undefined && audience !== 'internal') {
    throw new Error(`[netscript.service.contract-policy] unsupported audience: ${id}`);
  }
  if (audience === 'internal' && authentication === 'none') {
    throw new Error(
      `[netscript.service.contract-policy] an internal audience cannot be anonymous: ${id}`,
    );
  }
  const authorization = readProperty(access, 'authorization');
  return Object.freeze({
    authentication: authentication === 'none' ? 'none' : 'required',
    requiredScopes: readStringList(readProperty(authorization, 'scopes')),
    requiredRoles: readStringList(readProperty(authorization, 'roles')),
    ...(audience === 'internal' ? { audience } : {}),
  });
}

/**
 * Resolves the authoritative set of stream endpoints for a contract authorizer:
 * - Mounted `streamMounts` are the single runtime source of truth at `build()`.
 * - When `declaredEndpoints` (`options.streamEndpoints`) is also explicitly provided, verifies
 *   exact set equality by `id`, normalized `path`, `clientAuth`, and deep-equal normalized `access`.
 * - When `mountedMounts` is omitted (standalone authorizer unit test), compiles `declaredEndpoints`.
 */
export function resolveAuthoritativeStreamEndpoints(
  mountedMounts:
    | readonly { readonly endpoint: StreamEndpointContract<unknown, unknown, unknown, unknown> }[]
    | undefined,
  declaredEndpoints:
    | readonly StreamEndpointContract<unknown, unknown, unknown, unknown>[]
    | undefined,
): readonly NormalizedStreamEndpoint[] {
  const normalizedDeclared = declaredEndpoints !== undefined
    ? compileDistinctStreamEndpoints(declaredEndpoints)
    : undefined;

  if (mountedMounts === undefined) {
    return normalizedDeclared ?? Object.freeze([]);
  }

  const normalizedMounted = compileDistinctStreamEndpoints(
    mountedMounts.map((mount) => mount.endpoint),
  );

  if (normalizedDeclared !== undefined) {
    assertStreamEndpointSetMatches(normalizedMounted, normalizedDeclared);
  }

  return normalizedMounted;
}

/** Normalizes a list of stream endpoints and rejects duplicate `id`s or intersecting paths. */
export function compileDistinctStreamEndpoints(
  endpoints: readonly StreamEndpointContract<unknown, unknown, unknown, unknown>[],
): readonly NormalizedStreamEndpoint[] {
  const seenIds = new Set<string>();
  const compiled: NormalizedStreamEndpoint[] = [];

  for (const raw of endpoints) {
    const endpoint = normalizeStreamEndpoint(raw);
    if (seenIds.has(endpoint.id)) {
      throw new Error(
        `${STREAM_PATH_OVERLAP_ERROR}: duplicate stream endpoint id '${endpoint.id}'`,
      );
    }
    for (const existing of compiled) {
      if (patternsIntersect(existing.path, endpoint.path)) {
        throw new Error(
          `${STREAM_PATH_OVERLAP_ERROR}: stream endpoint '${endpoint.id}' (${endpoint.path}) overlaps stream endpoint '${existing.id}' (${existing.path})`,
        );
      }
    }
    seenIds.add(endpoint.id);
    compiled.push(endpoint);
  }

  return Object.freeze(compiled);
}

function assertStreamEndpointSetMatches(
  mounted: readonly NormalizedStreamEndpoint[],
  declared: readonly NormalizedStreamEndpoint[],
): void {
  const mountedById = new Map(mounted.map((item) => [item.id, item]));
  const declaredById = new Map(declared.map((item) => [item.id, item]));

  for (const item of mounted) {
    const match = declaredById.get(item.id);
    if (!match) {
      throw new Error(`${STREAM_POLICY_MISMATCH_ERROR}: ${item.id}`);
    }
    if (
      normalizePath(item.path) !== normalizePath(match.path) ||
      item.clientAuth !== match.clientAuth ||
      !sameAccessPolicy(item.policy, match.policy)
    ) {
      throw new Error(`${STREAM_POLICY_MISMATCH_ERROR}: ${item.id}`);
    }
  }

  for (const item of declared) {
    if (!mountedById.has(item.id)) {
      throw new Error(`${STREAM_POLICY_MISMATCH_ERROR}: ${item.id}`);
    }
  }
}

function sameAccessPolicy(left: ProcedureAccessPolicy, right: ProcedureAccessPolicy): boolean {
  if (left.authentication !== right.authentication) return false;
  if (left.audience !== right.audience) return false;
  if (left.requiredScopes.length !== right.requiredScopes.length) return false;
  if (left.requiredRoles.length !== right.requiredRoles.length) return false;
  for (let i = 0; i < left.requiredScopes.length; i += 1) {
    if (left.requiredScopes[i] !== right.requiredScopes[i]) return false;
  }
  for (let i = 0; i < left.requiredRoles.length; i += 1) {
    if (left.requiredRoles[i] !== right.requiredRoles[i]) return false;
  }
  return true;
}

/** Validates that no stream endpoint intersects any pattern in `externalPatterns`. */
export function assertNoStreamPathOverlap(
  endpoints: readonly NormalizedStreamEndpoint[],
  externalPatterns: readonly { readonly label: string; readonly pattern: string }[],
): void {
  for (const endpoint of endpoints) {
    for (const external of externalPatterns) {
      if (patternsIntersect(endpoint.path, external.pattern)) {
        throw new Error(
          `${STREAM_PATH_OVERLAP_ERROR}: stream endpoint '${endpoint.id}' (${endpoint.path}) overlaps ${external.label} (${external.pattern})`,
        );
      }
    }
  }
}

/** Compiles a `rou3` GET matcher and an any-method internal-audience guard table for stream endpoints. */
export function createBoundStreamEndpointIndex(
  endpoints: readonly NormalizedStreamEndpoint[],
): BoundStreamEndpointIndex {
  const getRoutes = createRouter<NormalizedStreamEndpoint>();
  const internalRoutes = createRouter<NormalizedStreamEndpoint>();

  for (const endpoint of endpoints) {
    addRoute(getRoutes, 'GET', endpoint.routePattern, endpoint);
    if (endpoint.policy.audience === 'internal') {
      addRoute(internalRoutes, '', endpoint.routePattern, endpoint);
    }
  }

  return Object.freeze({
    find(request: ProcedurePolicyRequest): NormalizedStreamEndpoint | undefined {
      if (request.method !== 'GET') return undefined;
      return findRoute(getRoutes, 'GET', request.path)?.data;
    },
    findInternalGuard(request: ProcedurePolicyRequest): NormalizedStreamEndpoint | undefined {
      return findRoute(internalRoutes, '', request.path)?.data;
    },
  });
}

function readProperty(value: unknown, property: string): unknown {
  return typeof value === 'object' && value !== null ? Reflect.get(value, property) : undefined;
}

function readStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.filter((item): item is string => typeof item === 'string'));
}
