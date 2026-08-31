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
import {
  type AnyContractRouter as ORPCAnyContractRouter,
  inferRPCMethodFromContractRouter,
  isContractProcedure,
} from '@orpc/contract';
import { SpanNames } from '@netscript/telemetry/attributes';
import { contextWithSpan, injectContext } from '@netscript/telemetry/context';
import { getTracer, SpanKind, withSpan } from '@netscript/telemetry/tracer';
import { getServiceUrl } from '../discovery/service-discovery.ts';
import type { PreparedSdkClientCall } from '../internal/client-contributions/adapter-ports.ts';
import { createPreparedOutboundHeadersPort } from '../internal/client-contributions/prepared-call.ts';
import {
  createStableV1ClientLink,
  createStableV1ProcedureMetadataPort,
  stableV1PreparedCall,
  type StableV1TransportContext,
} from '../internal/client-contributions/stable-v1-adapter.ts';
import type { ClientLinkPort } from '../ports/client-link-factory.ts';
import type { SdkClientContributionContext } from '../ports/sdk-client-contribution.ts';
import type { ContractLike, ServiceClientContext } from '../ports/service-client.ts';

type HttpRuntimeClientContext =
  & StableV1TransportContext<object>
  & ClientRetryPluginContext;

type HttpRuntimeClientOptions = ClientOptions<HttpRuntimeClientContext> & {
  readonly preparedCall?: PreparedSdkClientCall<object>;
};

const RPC_CLIENT_TRACER = '@netscript/sdk';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isOrpcContractRouter(value: unknown): value is ORPCAnyContractRouter {
  if (isContractProcedure(value)) {
    return true;
  }
  if (!isRecord(value) || Array.isArray(value) || '~orpc' in value) {
    return false;
  }
  const children = Object.values(value);
  return children.length > 0 && children.every(isOrpcContractRouter);
}

/** Options for the HTTP service-client link adapter. */
export interface HttpClientLinkOptions<
  TContract extends ContractLike,
  TContributions extends readonly object[] = readonly [],
> {
  /** Contract definition used for HTTP method inference. */
  contract: TContract;
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

/** Create the default HTTP client link for discovered services. */
export function createHttpClientLink<
  TContract extends ContractLike,
  const TContributions extends readonly object[] = readonly [],
>({
  contract,
  serviceName,
  rpcPath,
  protocol,
  propagateTraceContext,
  getTraceHeaders,
  contributions,
  fetch: transportFetch = globalThis.fetch,
}: HttpClientLinkOptions<TContract, TContributions>): ClientLinkPort<
  ServiceClientContext & SdkClientContributionContext<TContributions>
> {
  if (!isOrpcContractRouter(contract)) {
    throw new TypeError('Service client contracts must contain oRPC contract procedures');
  }

  const link: unknown = new RPCLink<HttpRuntimeClientContext>({
    // Resolve lazily so browser clients can rely on SSR-injected discovery
    // data instead of touching Deno APIs at import time.
    url: (options: HttpRuntimeClientOptions) => {
      const prepared = options.preparedCall ?? options.context?.[stableV1PreparedCall];
      if (prepared !== undefined) {
        return new URL(prepared.call.transport.rpcPath, prepared.call.transport.origin).toString();
      }
      const baseUrl = getServiceUrl(serviceName, protocol);
      return `${baseUrl}${rpcPath}`;
    },
    method: inferRPCMethodFromContractRouter(contract),
    headers: (options: HttpRuntimeClientOptions) => {
      const prepared = options.preparedCall ?? options.context?.[stableV1PreparedCall];
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
        filter: ({ request }) => request.method === 'GET',
        groups: [
          {
            condition: ({
              context,
            }: StandardLinkClientInterceptorOptions<HttpRuntimeClientContext>) =>
              context?.cache === 'force-cache',
            context: {
              cache: 'force-cache',
            },
          },
          {
            condition: () => true,
            context: {},
          },
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
          const injected = injectContext({}, contextWithSpan(span));
          for (const [key, value] of Object.entries(injected)) {
            headers.set(key, value);
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
  const preparation = createPreparedOutboundHeadersPort(
    contributionTuple,
    createStableV1ProcedureMetadataPort(),
  );

  return createStableV1ClientLink<SdkClientContributionContext<TContributions>>({
    contract,
    link: transportLink,
    preparation,
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
