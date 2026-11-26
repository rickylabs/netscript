import {
  RESERVED_STREAM_QUERY_PARAMS,
  STREAM_ENDPOINT_CLIENT_AUTH_MODES,
  type StreamEndpointContract,
} from '@netscript/contracts/streams';
import type { StreamProxyMount, StreamProxyMountContext } from '@netscript/service';
import type { StreamProxyOptions } from '../../domain/stream-proxy-contract.ts';
import type { StreamProxyClockPort } from '../../ports/stream-proxy-ports.ts';
import { buildStreamProxyHandler, type StreamProxyInputValidator } from './create-stream-proxy.ts';

const RESERVED_QUERY_KEYS: ReadonlySet<string> = new Set(RESERVED_STREAM_QUERY_PARAMS);

interface SyncParseableSchema {
  readonly parse?: (value: unknown) => unknown;
  readonly '~standard'?: {
    readonly validate?: (value: unknown) => unknown;
  };
}

function isThenableAndConsume(value: unknown): boolean {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }
  let thenFn: unknown;
  try {
    thenFn = Reflect.get(value, 'then');
  } catch {
    // A throwing `.then` getter cannot safely be treated as validated synchronous output.
    return true;
  }
  if (typeof thenFn !== 'function') {
    return false;
  }
  // Attach a no-op rejection handler so an async-rejecting Promise/thenable never triggers
  // an unhandled rejection after we fail closed synchronously.
  try {
    Reflect.apply(thenFn, value, [undefined, () => {}]);
  } catch {
    // Ignore synchronous throw from hostile thenable.
  }
  return true;
}

function parseSchemaSync(
  schema: unknown,
  input: unknown,
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  if (typeof schema !== 'object' || schema === null) return { ok: false };
  const candidate = schema as SyncParseableSchema;
  if (typeof candidate.parse === 'function') {
    try {
      const parsed = candidate.parse(input);
      if (isThenableAndConsume(parsed)) {
        return { ok: false };
      }
      return { ok: true, value: parsed };
    } catch {
      return { ok: false };
    }
  }
  const validate = candidate['~standard']?.validate;
  if (typeof validate === 'function') {
    try {
      const result = validate(input);
      if (
        isThenableAndConsume(result) ||
        typeof result !== 'object' ||
        result === null
      ) {
        return { ok: false };
      }
      if ('issues' in result && (result as { issues?: unknown }).issues) {
        return { ok: false };
      }
      if ('value' in result) {
        const value = (result as { value: unknown }).value;
        if (isThenableAndConsume(value)) {
          return { ok: false };
        }
        return { ok: true, value };
      }
    } catch {
      return { ok: false };
    }
  }
  return { ok: false };
}

function assertValidBoundEndpoint(
  endpoint: StreamEndpointContract<unknown, unknown, unknown, unknown>,
): void {
  if (typeof endpoint !== 'object' || endpoint === null) {
    throw new TypeError(
      '[netscript.streams.proxy] bindStreamProxy requires a StreamEndpointContract',
    );
  }
  if (
    endpoint.protocol?.family !== 'netscript.durable-stream-sse' ||
    endpoint.protocol?.major !== 1 ||
    endpoint.method !== 'GET'
  ) {
    throw new TypeError(
      '[netscript.streams.proxy] bindStreamProxy received an invalid StreamEndpointContract protocol or method',
    );
  }
  if (typeof endpoint.id !== 'string' || endpoint.id.length === 0) {
    throw new TypeError(
      '[netscript.streams.proxy] bindStreamProxy requires a non-empty endpoint.id',
    );
  }
  if (typeof endpoint.path !== 'string' || !endpoint.path.startsWith('/')) {
    throw new TypeError(
      '[netscript.streams.proxy] bindStreamProxy requires an absolute endpoint.path',
    );
  }
  if (!STREAM_ENDPOINT_CLIENT_AUTH_MODES.includes(endpoint.clientAuth)) {
    throw new TypeError(
      `[netscript.streams.proxy] invalid endpoint.clientAuth '${String(endpoint.clientAuth)}'`,
    );
  }
  if (!Array.isArray(endpoint.paramNames)) {
    throw new TypeError('[netscript.streams.proxy] endpoint.paramNames must be an array');
  }
  if (endpoint.paramNames.length > 0 && endpoint.params === undefined) {
    throw new TypeError(
      `[netscript.streams.proxy] endpoint '${endpoint.id}' declares path params without a params schema`,
    );
  }
}

function buildBoundInputValidator<TParams, TQuery>(
  endpoint: StreamEndpointContract<TParams, TQuery, unknown, unknown>,
): StreamProxyInputValidator<TParams, TQuery> {
  return {
    validate(rawParams: Readonly<Record<string, string>>, rawQuery: URLSearchParams) {
      let validatedParams: TParams;
      if (endpoint.params !== undefined) {
        if (typeof rawParams !== 'object' || rawParams === null) {
          return { ok: false, reason: 'invalid_stream_params' };
        }
        const paramObject: Record<string, string> = Object.create(null);
        for (const name of endpoint.paramNames) {
          if (!Object.hasOwn(rawParams, name)) {
            return { ok: false, reason: 'invalid_stream_params' };
          }
          const val: unknown = Reflect.get(rawParams, name);
          if (typeof val !== 'string') {
            return { ok: false, reason: 'invalid_stream_params' };
          }
          Object.defineProperty(paramObject, name, {
            value: val,
            enumerable: true,
            writable: true,
            configurable: true,
          });
        }
        const parsed = parseSchemaSync(endpoint.params, paramObject);
        if (!parsed.ok) {
          return { ok: false, reason: 'invalid_stream_params' };
        }
        validatedParams = parsed.value as TParams;
      } else {
        validatedParams = Object.freeze({}) as TParams;
      }

      let validatedQuery: TQuery;
      if (endpoint.query !== undefined) {
        const grouped = new Map<string, string[]>();
        for (const [key, value] of rawQuery.entries()) {
          if (RESERVED_QUERY_KEYS.has(key)) continue;
          const list = grouped.get(key);
          if (list) list.push(value);
          else grouped.set(key, [value]);
        }
        const queryObject: Record<string, string | readonly string[]> = Object.create(null);
        for (const [key, values] of grouped.entries()) {
          Object.defineProperty(queryObject, key, {
            value: values.length === 1 ? values[0]! : values,
            enumerable: true,
            writable: true,
            configurable: true,
          });
        }
        const parsed = parseSchemaSync(endpoint.query, queryObject);
        if (!parsed.ok) {
          return { ok: false, reason: 'invalid_stream_query' };
        }
        validatedQuery = parsed.value as TQuery;
      } else {
        validatedQuery = Object.freeze({}) as TQuery;
      }

      return { ok: true, params: validatedParams, query: validatedQuery };
    },
  };
}

/**
 * Internal implementation of `bindStreamProxy(endpoint, options)` accepting a composed default
 * clock so `@netscript/plugin-streams-core/proxy` keeps adapters isolated at the entrypoint.
 */
export function buildBoundStreamProxyMount<TParams, TQuery, TGrant = unknown>(
  endpoint: StreamEndpointContract<TParams, TQuery, unknown, unknown>,
  options: Omit<StreamProxyOptions<TGrant, TParams, TQuery>, 'clientAuth'>,
  defaultClock: StreamProxyClockPort,
): StreamProxyMount {
  assertValidBoundEndpoint(endpoint);
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('[netscript.streams.proxy] bindStreamProxy requires an options object');
  }

  const validator = buildBoundInputValidator(endpoint);
  const handler = buildStreamProxyHandler<TGrant, TParams, TQuery>(
    {
      ...options,
      clientAuth: endpoint.clientAuth,
    },
    defaultClock,
    validator,
  );

  const guardConfig = (
      options.allowedOrigins !== undefined ||
      options.trustProxy !== undefined ||
      options.allowDirectNavigation !== undefined
    )
    ? Object.freeze({
      ...(options.allowedOrigins !== undefined
        ? { allowedOrigins: Object.freeze([...options.allowedOrigins]) }
        : {}),
      ...(options.trustProxy !== undefined ? { trustProxy: options.trustProxy } : {}),
      ...(options.allowDirectNavigation !== undefined
        ? { allowDirectNavigation: options.allowDirectNavigation === true }
        : {}),
    })
    : undefined;

  return Object.freeze({
    endpoint,
    ...(guardConfig !== undefined ? { guardConfig } : {}),
    handle(request: Request, context: StreamProxyMountContext): Promise<Response> {
      return handler(request, context);
    },
  });
}
