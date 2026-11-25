import type { NetScriptProcedureMeta } from '../domain/procedure-meta.ts';
import type {
  ContractObjectSchemaLike,
  ContractSchemaInput,
  ContractSchemaOutput,
} from '../domain/schema-types.ts';
import {
  isValidStreamOffset,
  RESERVED_STREAM_QUERY_PARAMS,
  STREAM_ENDPOINT_CLIENT_AUTH_MODES,
  STREAM_ENDPOINT_PROTOCOL_V1,
  type StreamEndpointClientAuthMode,
  type StreamEndpointContract,
  type StreamEndpointDefinition,
  type StreamEndpointUrlInput,
} from '../domain/stream-endpoint.ts';

const ENDPOINT_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;
const PATH_FORBIDDEN_PRINTABLE = /[?#*%\\]/;
const PARAM_SEGMENT_PATTERN = /^\{([A-Za-z_][A-Za-z0-9_]*)\}$/;
const RESERVED_QUERY_SET: ReadonlySet<string> = new Set(RESERVED_STREAM_QUERY_PARAMS);

function hasForbiddenPathChars(value: string): boolean {
  if (PATH_FORBIDDEN_PRINTABLE.test(value)) return true;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return false;
}

function validateEndpointId(id: unknown): string {
  if (typeof id !== 'string' || !ENDPOINT_ID_PATTERN.test(id)) {
    throw new TypeError(
      `[netscript.contracts.streams] invalid endpoint id: ${String(id)}`,
    );
  }
  return id;
}

function parseAndValidatePath(path: unknown): {
  readonly path: `/${string}`;
  readonly paramNames: readonly string[];
} {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new TypeError(
      `[netscript.contracts.streams] endpoint path must start with '/': ${String(path)}`,
    );
  }
  if (hasForbiddenPathChars(path) || path.includes('//')) {
    throw new TypeError(
      `[netscript.contracts.streams] invalid endpoint path syntax: ${path}`,
    );
  }
  if (path !== '/' && path.endsWith('/')) {
    throw new TypeError(
      `[netscript.contracts.streams] endpoint path must not end with '/': ${path}`,
    );
  }

  const paramNames: string[] = [];
  const seenParams = new Set<string>();
  const segments = path === '/' ? [] : path.slice(1).split('/');
  for (const segment of segments) {
    if (segment === '.' || segment === '..') {
      throw new TypeError(
        `[netscript.contracts.streams] endpoint path must not contain dot segments: ${path}`,
      );
    }
    if (segment.includes('{') || segment.includes('}')) {
      const match = PARAM_SEGMENT_PATTERN.exec(segment);
      if (!match) {
        throw new TypeError(
          `[netscript.contracts.streams] invalid parameter segment '${segment}' in path: ${path}`,
        );
      }
      const paramName = match[1]!;
      if (seenParams.has(paramName)) {
        throw new TypeError(
          `[netscript.contracts.streams] duplicate parameter name '${paramName}' in path: ${path}`,
        );
      }
      seenParams.add(paramName);
      paramNames.push(paramName);
    }
  }

  return {
    path: `/${path.slice(1)}`,
    paramNames: Object.freeze(paramNames),
  };
}

function validateSchemaLike(
  schema: ContractObjectSchemaLike | undefined,
  label: string,
): ContractObjectSchemaLike | undefined {
  if (schema === undefined) return undefined;
  if (
    typeof schema !== 'object' ||
    schema === null ||
    typeof schema.parse !== 'function' ||
    typeof schema.shape !== 'object' ||
    schema.shape === null
  ) {
    throw new TypeError(`[netscript.contracts.streams] invalid ${label} schema`);
  }
  return schema;
}

function validateClientAuth(mode: unknown): StreamEndpointClientAuthMode {
  if (mode === undefined) return 'bearer-or-cookie';
  if (
    typeof mode !== 'string' ||
    !STREAM_ENDPOINT_CLIENT_AUTH_MODES.includes(mode as StreamEndpointClientAuthMode)
  ) {
    throw new TypeError(
      `[netscript.contracts.streams] invalid clientAuth mode: ${String(mode)}`,
    );
  }
  return mode as StreamEndpointClientAuthMode;
}

function normalizeAccess(
  access: NetScriptProcedureMeta['access'] | undefined,
  endpointId: string,
): NonNullable<NetScriptProcedureMeta['access']> {
  const authentication = access?.authentication ?? 'required';
  if (authentication === 'optional') {
    throw new TypeError(
      `[netscript.contracts.streams] optional authentication is unsupported: ${endpointId}`,
    );
  }
  if (authentication !== 'required' && authentication !== 'none') {
    throw new TypeError(
      `[netscript.contracts.streams] invalid authentication mode '${
        String(authentication)
      }': ${endpointId}`,
    );
  }

  const audience = access?.audience;
  if (audience !== undefined && audience !== 'internal') {
    throw new TypeError(
      `[netscript.contracts.streams] unsupported audience '${String(audience)}': ${endpointId}`,
    );
  }
  if (audience === 'internal' && authentication === 'none') {
    throw new TypeError(
      `[netscript.contracts.streams] internal audience cannot be combined with authentication: 'none': ${endpointId}`,
    );
  }

  const rawScopes = access?.authorization?.scopes;
  const rawRoles = access?.authorization?.roles;
  if (
    rawScopes !== undefined &&
    (!Array.isArray(rawScopes) || !rawScopes.every((s) => typeof s === 'string'))
  ) {
    throw new TypeError(
      `[netscript.contracts.streams] access.authorization.scopes must be a string array: ${endpointId}`,
    );
  }
  if (
    rawRoles !== undefined &&
    (!Array.isArray(rawRoles) || !rawRoles.every((r) => typeof r === 'string'))
  ) {
    throw new TypeError(
      `[netscript.contracts.streams] access.authorization.roles must be a string array: ${endpointId}`,
    );
  }

  const authorization = rawScopes !== undefined || rawRoles !== undefined
    ? Object.freeze({
      ...(rawScopes !== undefined ? { scopes: Object.freeze([...rawScopes]) } : {}),
      ...(rawRoles !== undefined ? { roles: Object.freeze([...rawRoles]) } : {}),
    })
    : undefined;

  return Object.freeze({
    authentication,
    ...(audience !== undefined ? { audience } : {}),
    ...(authorization !== undefined ? { authorization } : {}),
  });
}

function isWireScalar(value: unknown): value is string | number | boolean {
  return typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'boolean';
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Declare a runtime-free authorizing Durable Streams SSE endpoint contract.
 *
 * Enforces path syntax, required `{param}` schema coverage, reserved protocol query names
 * (`offset`, `live`, `cursor`), valid `clientAuth`, and normalized `access` metadata at
 * construction time, returning a deeply frozen contract with zero oRPC runtime markers.
 */
export function defineStreamEndpoint<
  TParams extends ContractObjectSchemaLike | undefined = undefined,
  TQuery extends ContractObjectSchemaLike | undefined = undefined,
>(
  definition: StreamEndpointDefinition<TParams, TQuery>,
): StreamEndpointContract<
  TParams extends ContractObjectSchemaLike ? ContractSchemaOutput<TParams> : Record<never, never>,
  TQuery extends ContractObjectSchemaLike ? ContractSchemaOutput<TQuery> : Record<never, never>,
  TParams extends ContractObjectSchemaLike ? ContractSchemaInput<TParams> : Record<never, never>,
  TQuery extends ContractObjectSchemaLike ? ContractSchemaInput<TQuery> : Record<never, never>
> {
  if (!isRecord(definition)) {
    throw new TypeError(
      '[netscript.contracts.streams] stream endpoint definition must be an object',
    );
  }
  const id = validateEndpointId(definition.id);
  const { path, paramNames } = parseAndValidatePath(definition.path);
  const params = validateSchemaLike(definition.params, 'params');
  const query = validateSchemaLike(definition.query, 'query');

  if (paramNames.length > 0) {
    if (!params) {
      throw new TypeError(
        `[netscript.contracts.streams] endpoint '${id}' declares path parameters (${
          paramNames.join(', ')
        }) and requires a 'params' schema`,
      );
    }
    for (const name of paramNames) {
      if (!Object.hasOwn(params.shape, name)) {
        throw new TypeError(
          `[netscript.contracts.streams] endpoint '${id}' params schema is missing path parameter '${name}'`,
        );
      }
    }
  }

  if (query) {
    for (const key of Object.keys(query.shape)) {
      if (RESERVED_QUERY_SET.has(key)) {
        throw new TypeError(
          `[netscript.contracts.streams] endpoint '${id}' query schema must not declare reserved protocol parameter '${key}'`,
        );
      }
    }
  }

  const clientAuth = validateClientAuth(definition.clientAuth);
  const access = normalizeAccess(definition.access, id);
  const tags = definition.tags !== undefined ? Object.freeze([...definition.tags]) : undefined;

  return Object.freeze({
    protocol: STREAM_ENDPOINT_PROTOCOL_V1,
    method: 'GET',
    id,
    path,
    paramNames,
    ...(params !== undefined ? { params } : {}),
    ...(query !== undefined ? { query } : {}),
    clientAuth,
    access,
    ...(definition.summary !== undefined ? { summary: definition.summary } : {}),
    ...(definition.description !== undefined ? { description: definition.description } : {}),
    ...(tags !== undefined ? { tags } : {}),
  });
}

/**
 * Construct a validated stream proxy URL from a {@link StreamEndpointContract}.
 *
 * Validates `params` and `query` synchronously via the contract schemas, serializes the caller's
 * wire input values (preserving schema transforms across client/server boundaries), validates
 * optional `offset` and `cursor` against {@link isValidStreamOffset}, and never appends `live=sse`.
 */
export function buildStreamEndpointUrl<
  TParamsInput,
  TParamsOutput,
  TQueryInput,
  TQueryOutput,
>(
  endpoint: StreamEndpointContract<TParamsOutput, TQueryOutput, TParamsInput, TQueryInput>,
  input: StreamEndpointUrlInput<TParamsInput, TQueryInput>,
): string {
  const base = URL.parse(input.baseUrl);
  if (!base || (base.protocol !== 'http:' && base.protocol !== 'https:')) {
    throw new TypeError(
      `[netscript.contracts.streams] invalid baseUrl for endpoint '${endpoint.id}': expected http(s) URL`,
    );
  }
  if (base.search || base.hash) {
    throw new TypeError(
      `[netscript.contracts.streams] baseUrl for endpoint '${endpoint.id}' must not include query or fragment`,
    );
  }

  if (endpoint.params !== undefined) {
    endpoint.params.parse(input.params ?? {});
  }

  const rawParams = input.params;
  if (endpoint.paramNames.length > 0 && !isRecord(rawParams)) {
    throw new TypeError(
      `[netscript.contracts.streams] endpoint '${endpoint.id}' requires params object`,
    );
  }

  let resolvedPath: string = endpoint.path;
  if (endpoint.paramNames.length > 0 && isRecord(rawParams)) {
    const segments = endpoint.path.slice(1).split('/').map((segment) => {
      const match = PARAM_SEGMENT_PATTERN.exec(segment);
      if (!match) return segment;
      const paramName = match[1]!;
      const rawValue = rawParams[paramName];
      if (!isWireScalar(rawValue)) {
        throw new TypeError(
          `[netscript.contracts.streams] path parameter '${paramName}' for endpoint '${endpoint.id}' is not wire-serializable`,
        );
      }
      const serialized = String(rawValue);
      if (serialized.length === 0 || serialized === '.' || serialized === '..') {
        throw new TypeError(
          `[netscript.contracts.streams] path parameter '${paramName}' for endpoint '${endpoint.id}' must be a non-empty non-dot segment`,
        );
      }
      return encodeURIComponent(serialized);
    });
    resolvedPath = `/${segments.join('/')}`;
  }

  const basePath = base.pathname.replace(/\/$/, '');
  const targetUrl = new URL(`${base.origin}${basePath}${resolvedPath}`);

  if (endpoint.query !== undefined) {
    endpoint.query.parse(input.query ?? {});
  }

  if (input.query !== undefined) {
    if (!isRecord(input.query)) {
      throw new TypeError(
        `[netscript.contracts.streams] query for endpoint '${endpoint.id}' must be an object`,
      );
    }
    const entries = Object.entries(input.query);
    if (endpoint.query === undefined && entries.some(([, value]) => value !== undefined)) {
      throw new TypeError(
        `[netscript.contracts.streams] endpoint '${endpoint.id}' declares no query schema`,
      );
    }
    for (const [key, rawValue] of entries) {
      if (rawValue === undefined) continue;
      if (RESERVED_QUERY_SET.has(key)) {
        throw new TypeError(
          `[netscript.contracts.streams] query parameter '${key}' is reserved by the stream protocol`,
        );
      }
      if (isWireScalar(rawValue)) {
        targetUrl.searchParams.append(key, String(rawValue));
      } else if (Array.isArray(rawValue) && rawValue.every((item) => typeof item === 'string')) {
        for (const item of rawValue) {
          targetUrl.searchParams.append(key, item);
        }
      } else {
        throw new TypeError(
          `[netscript.contracts.streams] query parameter '${key}' for endpoint '${endpoint.id}' is not wire-serializable`,
        );
      }
    }
  }

  if (input.offset !== undefined) {
    if (!isValidStreamOffset(input.offset)) {
      throw new TypeError(
        `[netscript.contracts.streams] invalid stream offset for endpoint '${endpoint.id}'`,
      );
    }
    targetUrl.searchParams.set('offset', input.offset);
  }

  if (input.cursor !== undefined) {
    if (!isValidStreamOffset(input.cursor)) {
      throw new TypeError(
        `[netscript.contracts.streams] invalid stream cursor for endpoint '${endpoint.id}'`,
      );
    }
    targetUrl.searchParams.set('cursor', input.cursor);
  }

  return targetUrl.href;
}
