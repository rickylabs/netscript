/**
 * HTTP transport adapter for service clients.
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
import { getServiceUrl } from '../discovery/service-discovery.ts';
import type { PreparedSdkClientCall } from '../internal/client-contributions/adapter-ports.ts';
import { createPreparedOutboundHeadersPort } from '../internal/client-contributions/prepared-call.ts';
import {
  createStableV1ClientLink,
  stableV1PreparedCall,
  type StableV1TransportContext,
} from '../internal/client-contributions/stable-v1-adapter.ts';
import type {
  ResolvedCallTransportPolicy,
  ResolvedTransportCacheGroup,
  ResolvedTransportPolicy,
} from '../internal/transport-policy.ts';
import type { ClientLinkPort } from '../ports/client-link-factory.ts';
import type { SdkClientContributionContext } from '../ports/sdk-client-contribution.ts';
import type { ServiceClientContext } from '../ports/service-client.ts';

type HttpRuntimeClientContext =
  & StableV1TransportContext<object>
  & ClientRetryPluginContext;

type HttpRuntimeClientOptions = ClientOptions<HttpRuntimeClientContext> & {
  readonly preparedCall?: PreparedSdkClientCall<object>;
};

const RPC_CLIENT_TRACER = '@netscript/sdk';

/** Options for the HTTP service-client link adapter. */
export interface HttpClientLinkOptions<
  TContributions extends readonly object[] = readonly [],
> {
  /** Fully resolved NetScript-owned transport policy. */
  transportPolicy: ResolvedTransportPolicy;
  /** Service name resolved through NetScript discovery. */
  serviceName: string;
  /** Canonical RPC path for the service router. */
  rpcPath: string;
  /** Resolved protocol for service discovery. */
  protocol: 'http' | 'https';
  /** Whether trace headers should be attached automatically. */
  propagateTraceContext: boolean;
  /** Trace header provider used when propagation is enabled. */
  getTraceHeaders: () => Record<string, string>;
  /** Explicit validated client-contribution tuple. */
  contributions?: TContributions;
  /** Private transport fetch seam used by conformance tests. */
  fetch?: typeof globalThis.fetch;
}

function preparedCallFromOptions(
  options: Readonly<{
    readonly context?: HttpRuntimeClientContext;
    readonly preparedCall?: PreparedSdkClientCall<object>;
  }>,
): PreparedSdkClientCall<object> {
  const prepared = options.preparedCall ?? options.context?.[stableV1PreparedCall];
  if (prepared === undefined) {
    throw new TypeError('SDK HTTP transport requires a resolved logical call');
  }
  return prepared;
}

function adaptCacheGroup(
  group: ResolvedTransportCacheGroup<'force-cache'> | ResolvedTransportCacheGroup<'default'>,
): Readonly<{
  readonly condition: (
    options: StandardLinkClientInterceptorOptions<HttpRuntimeClientContext>,
  ) => boolean;
  readonly context: Readonly<{ cache: 'force-cache' }> | Readonly<Record<never, never>>;
}> {
  return Object.freeze({
    condition: (
      options: StandardLinkClientInterceptorOptions<HttpRuntimeClientContext>,
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

/** Create the default HTTP client link for discovered services. */
export function createHttpClientLink<
  const TContributions extends readonly object[] = readonly [],
>({
  transportPolicy,
  serviceName,
  rpcPath,
  protocol,
  propagateTraceContext,
  getTraceHeaders,
  contributions,
  fetch: transportFetch = globalThis.fetch,
}: HttpClientLinkOptions<TContributions>): ClientLinkPort<
  ServiceClientContext & SdkClientContributionContext<TContributions>
> {
  const [forceCacheGroup, defaultCacheGroup] = transportPolicy.cacheGroups;

  const link: unknown = new RPCLink<HttpRuntimeClientContext>({
    // Resolve lazily so browser clients can rely on SSR-injected discovery
    // data instead of touching Deno APIs at import time.
    url: (options: HttpRuntimeClientOptions) => {
      const prepared = preparedCallFromOptions(options);
      return new URL(prepared.call.transport.rpcPath, prepared.call.transport.origin).toString();
    },
    method: (options: HttpRuntimeClientOptions) =>
      stableV1CodecMethod(
        transportPolicy,
        preparedCallFromOptions(options).call.transportPolicy,
      ),
    fallbackMethod: transportPolicy.fallbackMethod,
    maxUrlLength: transportPolicy.maxUrlLength,
    headers: (options: HttpRuntimeClientOptions) => {
      const prepared = preparedCallFromOptions(options);
      const headers: Record<string, string> = {
        ...prepared?.contributedHeaders.values,
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
      new ClientRetryPlugin<HttpRuntimeClientContext>({
        default: {
          retry: 0,
        },
      }),
      new DedupeRequestsPlugin<HttpRuntimeClientContext>({
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
    fetch: async (request, init, { context }) => {
      const requestUrl = typeof request === 'string' ? request : request.url;
      return await withSpan(
        getTracer(RPC_CLIENT_TRACER),
        SpanNames.RPC_CLIENT,
        async (span) => {
          const headers = new Headers(request instanceof Request ? request.headers : undefined);
          if (propagateTraceContext) {
            const injected = injectContext({}, contextWithSpan(span));
            for (const [key, value] of Object.entries(injected)) {
              headers.set(key, value);
            }
          }
          return await transportFetch(request, {
            ...init,
            headers,
            cache: context?.cache as RequestCache,
            signal: context?.signal,
          });
        },
        {
          kind: SpanKind.CLIENT,
          attributes: {
            'rpc.system': 'orpc',
            'rpc.service': serviceName,
            'netscript.rpc.transport': 'orpc',
            'server.address': new URL(requestUrl).hostname,
          },
        },
      );
    },
  });
  const contributionTuple: readonly object[] = contributions ?? [];
  const transportLink = link as ClientLinkPort<
    StableV1TransportContext<object>,
    PreparedSdkClientCall<object>
  >;
  const preparation = createPreparedOutboundHeadersPort(contributionTuple);

  return createStableV1ClientLink<SdkClientContributionContext<TContributions>>({
    link: transportLink,
    preparation,
    transportPolicy,
    resolveTransport: () => {
      const discovered = new URL(getServiceUrl(serviceName, protocol));
      return Object.freeze({
        kind: 'http' as const,
        origin: new URL(discovered.origin),
        rpcPath,
        secure: discovered.protocol === 'https:',
      });
    },
    hasContributions: contributionTuple.length > 0,
  });
}
