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

function parseSchemaSync(
  schema: unknown,
  input: unknown,
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  if (typeof schema !== 'object' || schema === null) return { ok: false };
  const candidate = schema as SyncParseableSchema;
  if (typeof candidate.parse === 'function') {
    try {
      return { ok: true, value: candidate.parse(input) };
    } catch {
      return { ok: false };
    }
  }
  const validate = candidate['~standard']?.validate;
  if (typeof validate === 'function') {
    try {
      const result = validate(input);
      if (
        typeof result !== 'object' ||
        result === null ||
        result instanceof Promise ||
        typeof (result as { then?: unknown }).then === 'function'
      ) {
        return { ok: false };
      }
      if ('issues' in result && (result as { issues?: unknown }).issues) {
        return { ok: false };
      }
      if ('value' in result) {
        return { ok: true, value: (result as { value: unknown }).value };
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
        const paramObject: Record<string, string> = {};
        for (const name of endpoint.paramNames) {
          const val = rawParams[name];
          if (typeof val !== 'string') {
            return { ok: false, reason: 'invalid_stream_params' };
          }
          paramObject[name] = val;
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
        const queryObject: Record<string, string | readonly string[]> = {};
        for (const [key, values] of grouped.entries()) {
          queryObject[key] = values.length === 1 ? values[0]! : values;
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
        ? { allowDirectNavigation: options.allowDirectNavigation }
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
