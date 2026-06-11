/**
 * Service client factory for discovered oRPC services.
 *
 * @module
 */

import { createORPCClient, type ClientOptions } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import {
  ClientRetryPlugin,
  type ClientRetryPluginContext,
  DedupeRequestsPlugin,
} from '@orpc/client/plugins';
import { StandardLinkClientInterceptorOptions } from '@orpc/client/standard';
import {
  type AnyContractRouter as ORPCAnyContractRouter,
  inferRPCMethodFromContractRouter,
} from '@orpc/contract';
import { getTraceContext } from '@netscript/telemetry/context';
import { getServiceUrl } from '../discovery/service-discovery.ts';
import type {
  ContractLike,
  CreateServiceClientOptions,
  ServiceClient,
  ServiceClientContext,
} from '../interfaces/service-client.ts';

type InternalServiceClientContext = ServiceClientContext & ClientRetryPluginContext;

function getTraceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  try {
    const traceContext = getTraceContext();
    if (traceContext?.traceparent) {
      headers.traceparent = traceContext.traceparent;
      if (traceContext.tracestate) {
        headers.tracestate = traceContext.tracestate;
      }
    }
  } catch {
    // Telemetry may be unavailable for some runtimes/tests.
  }

  return headers;
}

/**
 * Create a type-safe service client using Aspire service discovery and oRPC.
 *
 * @param options - Service client configuration.
 * @returns Typed service client.
 */
export function createServiceClient<TContract extends ContractLike>({
  contract,
  serviceName,
  routerName,
  protocol = 'http',
  apiPath = '/api/rpc',
  apiVersion = 'v1',
  propagateTraceContext = true,
}: CreateServiceClientOptions<TContract>): ServiceClient<TContract> {
  const pathSegment = routerName ?? serviceName;

  return createORPCClient(
    new RPCLink<InternalServiceClientContext>({
      // Resolve the service URL lazily so browser clients can rely on
      // SSR-injected discovery data instead of touching Deno APIs at import time.
      url: () => {
        const baseUrl = getServiceUrl(serviceName, protocol);
        return `${baseUrl}${apiPath}/${apiVersion}/${pathSegment}`;
      },
      method: inferRPCMethodFromContractRouter(contract as unknown as ORPCAnyContractRouter),
      headers: (options: ClientOptions<InternalServiceClientContext>) => {
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
        new ClientRetryPlugin<InternalServiceClientContext>({
          default: {
            retry: 0,
          },
        }),
        new DedupeRequestsPlugin<InternalServiceClientContext>({
          filter: ({ request }) => request.method === 'GET',
          groups: [
            {
              condition: ({
                context,
              }: StandardLinkClientInterceptorOptions<InternalServiceClientContext>) =>
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
      fetch: (request, init, { context }) =>
        globalThis.fetch(request, {
          ...init,
          cache: context?.cache as RequestCache,
        }),
    }),
  ) as ServiceClient<TContract>;
}
