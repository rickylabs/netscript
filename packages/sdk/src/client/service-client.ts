/**
 * Service client factory for discovered oRPC services.
 *
 * @module
 */

import { createORPCClient } from '@orpc/client';
import { buildServiceRpcPath } from '@netscript/service/rpc-path';
import { getTraceContext } from '@netscript/telemetry/context';
import { createHttpClientLink } from './http-client-link.ts';
import type {
  ContractLike,
  CreateServiceClientOptions,
  ServiceClient,
  ServiceClientContext,
} from '../ports/service-client.ts';
import type { SdkClientContributionContext } from '../ports/sdk-client-contribution.ts';

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
export function createServiceClient<
  TContract extends ContractLike,
  const TContributions extends readonly object[] = readonly [],
>({
  contract,
  serviceName,
  routerName,
  protocol = 'http',
  apiPath = '/api/rpc',
  apiVersion = 'v1',
  propagateTraceContext = true,
  contributions,
}: CreateServiceClientOptions<TContract, TContributions>): ServiceClient<
  TContract,
  ServiceClientContext & SdkClientContributionContext<TContributions>
> {
  const pathSegment = routerName ?? serviceName;
  const rpcPath = buildServiceRpcPath({
    routerName: pathSegment,
    apiPath,
    apiVersion,
  });
  const link = createHttpClientLink({
    contract,
    serviceName,
    protocol,
    rpcPath,
    propagateTraceContext,
    getTraceHeaders,
    contributions,
  });

  return createORPCClient(link) as ServiceClient<
    TContract,
    ServiceClientContext & SdkClientContributionContext<TContributions>
  >;
}
