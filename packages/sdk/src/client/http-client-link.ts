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
import type { ClientLinkPort } from '../ports/client-link-factory.ts';
import type { ContractLike, ServiceClientContext } from '../ports/service-client.ts';

type HttpRuntimeClientContext = ServiceClientContext & ClientRetryPluginContext;

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
export interface HttpClientLinkOptions<TContract extends ContractLike> {
  /** Contract definition used for HTTP method inference. */
  contract: TContract;
  /** Service name resolved through NetScript discovery. */
  serviceName: string;
  /** URL path segment for the service router. */
  pathSegment: string;
  /** Resolved protocol for service discovery. */
  protocol: 'http' | 'https';
  /** Base API RPC path. */
  apiPath: string;
  /** API version segment. */
  apiVersion: string;
  /** Whether trace headers should be attached automatically. */
  propagateTraceContext: boolean;
  /** Trace header provider used when propagation is enabled. */
  getTraceHeaders: () => Record<string, string>;
}

/** Create the default HTTP client link for discovered services. */
export function createHttpClientLink({
  contract,
  serviceName,
  pathSegment,
  protocol,
  apiPath,
  apiVersion,
  propagateTraceContext,
  getTraceHeaders,
}: HttpClientLinkOptions<ContractLike>): ClientLinkPort<ServiceClientContext> {
  if (!isOrpcContractRouter(contract)) {
    throw new TypeError('Service client contracts must contain oRPC contract procedures');
  }

  const link: unknown = new RPCLink<HttpRuntimeClientContext>({
    // Resolve lazily so browser clients can rely on SSR-injected discovery
    // data instead of touching Deno APIs at import time.
    url: () => {
      const baseUrl = getServiceUrl(serviceName, protocol);
      return `${baseUrl}${apiPath}/${apiVersion}/${pathSegment}`;
    },
    method: inferRPCMethodFromContractRouter(contract),
    headers: (options: ClientOptions<HttpRuntimeClientContext>) => {
      const headers: Record<string, string> = {
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
          return await globalThis.fetch(request, {
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
  return link as ClientLinkPort<ServiceClientContext>;
}
