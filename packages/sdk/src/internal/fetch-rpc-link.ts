/**
 * Shared package-private Fetch RPCLink builder for HTTP and in-process SDK transports.
 *
 * @module
 */

import type { ClientOptions } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import {
  ClientRetryPlugin,
  type ClientRetryPluginContext,
  DedupeRequestsPlugin,
} from '@orpc/client/plugins';
import type { StandardLinkClientInterceptorOptions } from '@orpc/client/standard';
import { SpanNames } from '@netscript/telemetry/attributes';
import { contextWithSpan, injectContext } from '@netscript/telemetry/context';
import { getTracer, SpanKind, withSpan } from '@netscript/telemetry/tracer';
import type { PreparedSdkClientCall } from './client-contributions/adapter-ports.ts';
import {
  stableV1PreparedCall,
  type StableV1TransportContext,
} from './client-contributions/stable-v1-adapter.ts';
import type {
  ResolvedCallTransportPolicy,
  ResolvedTransportCacheGroup,
  ResolvedTransportPolicy,
} from './transport-policy.ts';
import type { ClientLinkPort } from '../ports/client-link-factory.ts';

type FetchRpcRuntimeClientContext =
  & StableV1TransportContext<object>
  & ClientRetryPluginContext;

type FetchRpcRuntimeClientOptions = ClientOptions<FetchRpcRuntimeClientContext> & {
  readonly preparedCall?: PreparedSdkClientCall<object>;
};

const RPC_CLIENT_TRACER = '@netscript/sdk';

/** Options for the shared package-private Fetch RPC client link builder. */
export interface FetchRpcClientLinkOptions {
  /** Fully resolved NetScript-owned transport policy. */
  readonly transportPolicy: ResolvedTransportPolicy;
  /** Logical service name recorded on outbound RPC CLIENT spans. */
  readonly serviceName: string;
  /** Whether W3C trace headers should be attached automatically. */
  readonly propagateTraceContext: boolean;
  /** Trace header provider used when propagation is enabled. */
  readonly getTraceHeaders: () => Record<string, string>;
  /** Underlying WHATWG Fetch transport (network HTTP or in-process adapter). */
  readonly fetch: typeof globalThis.fetch;
}

/** Options for the traced WHATWG Fetch wrapper used inside `RPCLink`. */
export interface TracedRpcFetchOptions {
  /** Logical service name recorded on outbound RPC CLIENT spans. */
  readonly serviceName: string;
  /** Whether W3C trace headers should be attached automatically. */
  readonly propagateTraceContext: boolean;
  /** Underlying WHATWG Fetch transport. */
  readonly transportFetch: typeof globalThis.fetch;
}

function preparedCallFromOptions(
  options: Readonly<{
    readonly context?: FetchRpcRuntimeClientContext;
    readonly preparedCall?: PreparedSdkClientCall<object>;
  }>,
): PreparedSdkClientCall<object> {
  const prepared = options.preparedCall ?? options.context?.[stableV1PreparedCall];
  if (prepared === undefined) {
    throw new TypeError('SDK Fetch RPC transport requires a resolved logical call');
  }
  return prepared;
}

function adaptCacheGroup(
  group: ResolvedTransportCacheGroup<'force-cache'> | ResolvedTransportCacheGroup<'default'>,
): Readonly<{
  readonly condition: (
    options: StandardLinkClientInterceptorOptions<FetchRpcRuntimeClientContext>,
  ) => boolean;
  readonly context: Readonly<{ cache: 'force-cache' }> | Readonly<Record<never, never>>;
}> {
  return Object.freeze({
    condition: (
      options: StandardLinkClientInterceptorOptions<FetchRpcRuntimeClientContext>,
    ): boolean => group.condition(preparedCallFromOptions(options).call.transportPolicy),
    context: group.context,
  });
}

function stableV1CodecMethod(
  policy: ResolvedTransportPolicy,
  call: ResolvedCallTransportPolicy,
): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' {
  // Stable v1's declaration is narrower than Fetch's method space; the owned policy validates the
  // actual NetScript method before this adapter invokes the codec callback.
  const opaquePolicy: object = policy;
  const method = Reflect.get(opaquePolicy, 'method');
  return Reflect.apply(method, policy, [call]);
}

function resolveFetchRequestUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function mergeFetchHeaders(
  input: string | URL | Request,
  initHeaders?: HeadersInit,
): Headers {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (initHeaders !== undefined) {
    const overrideHeaders = new Headers(initHeaders);
    for (const key of new Set(overrideHeaders.keys())) {
      headers.delete(key);
    }
    for (const [key, value] of overrideHeaders.entries()) {
      headers.append(key, value);
    }
  }
  return headers;
}

/**
 * Create the traced Fetch callback installed on oRPC's `RPCLink`.
 *
 * Accepts `string | URL | Request` inputs and merges `init?.headers` so both oRPC v1
 * (`Request`) and oRPC v2 (`string` URL + `init.headers`) preserve contributed and content-type
 * headers before W3C trace injection.
 */
export function createTracedRpcFetch(
  options: TracedRpcFetchOptions,
): (
  request: string | URL | Request,
  init: RequestInit | undefined,
  meta: Readonly<{ readonly context?: FetchRpcRuntimeClientContext }>,
) => Promise<Response> {
  return async (request, init, { context }) => {
    const requestUrl = resolveFetchRequestUrl(request);
    return await withSpan(
      getTracer(RPC_CLIENT_TRACER),
      SpanNames.RPC_CLIENT,
      async (span) => {
        const headers = mergeFetchHeaders(request, init?.headers);
        if (options.propagateTraceContext) {
          const injected = injectContext({}, contextWithSpan(span));
          for (const [key, value] of Object.entries(injected)) {
            headers.set(key, value);
          }
        }
        return await options.transportFetch(request, {
          ...init,
          headers,
          cache: context?.cache,
          signal: context?.signal,
        });
      },
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'rpc.system': 'orpc',
          'rpc.service': options.serviceName,
          'netscript.rpc.transport': 'orpc',
          'server.address': new URL(requestUrl).hostname,
        },
      },
    );
  };
}

/**
 * Create the shared package-private `RPCLink` transport shared by HTTP and in-process links.
 */
export function createFetchRpcClientLink({
  transportPolicy,
  serviceName,
  propagateTraceContext,
  getTraceHeaders,
  fetch: transportFetch,
}: FetchRpcClientLinkOptions): ClientLinkPort<
  StableV1TransportContext<object>,
  PreparedSdkClientCall<object>
> {
  const [forceCacheGroup, defaultCacheGroup] = transportPolicy.cacheGroups;
  const tracedFetch = createTracedRpcFetch({
    serviceName,
    propagateTraceContext,
    transportFetch,
  });

  const link: unknown = new RPCLink<FetchRpcRuntimeClientContext>({
    // Resolve lazily from the logical epoch descriptor rather than touching env at import time.
    url: (options: FetchRpcRuntimeClientOptions) => {
      const prepared = preparedCallFromOptions(options);
      return new URL(prepared.call.transport.rpcPath, prepared.call.transport.origin).toString();
    },
    method: (options: FetchRpcRuntimeClientOptions) =>
      stableV1CodecMethod(
        transportPolicy,
        preparedCallFromOptions(options).call.transportPolicy,
      ),
    fallbackMethod: transportPolicy.fallbackMethod,
    maxUrlLength: transportPolicy.maxUrlLength,
    headers: (options: FetchRpcRuntimeClientOptions) => {
      const prepared = preparedCallFromOptions(options);
      const headers: Record<string, string> = {
        ...prepared.contributedHeaders.values,
        'Content-Type': 'application/json',
      };

      if (propagateTraceContext) {
        const explicitHeaders = options?.context?.traceHeaders;
        if (explicitHeaders?.traceparent) {
          headers.traceparent = explicitHeaders.traceparent;
          if (explicitHeaders.tracestate) {
            headers.tracestate = explicitHeaders.tracestate;
          }
        } else {
          Object.assign(headers, getTraceHeaders());
        }
      }

      return headers;
    },
    plugins: [
      new ClientRetryPlugin<FetchRpcRuntimeClientContext>({
        default: {
          retry: 0,
        },
      }),
      new DedupeRequestsPlugin<FetchRpcRuntimeClientContext>({
        filter: (options) =>
          transportPolicy.dedupePredicate(
            preparedCallFromOptions(options).call.transportPolicy,
          ),
        groups: [
          adaptCacheGroup(forceCacheGroup),
          adaptCacheGroup(defaultCacheGroup),
        ],
      }),
    ],
    fetch: (request, init, meta) => tracedFetch(request, init, meta),
  });

  return link as ClientLinkPort<
    StableV1TransportContext<object>,
    PreparedSdkClientCall<object>
  >;
}
