/**
 * Service client factory for discovered oRPC services.
 *
 * @module
 */

import { createORPCClient } from '@orpc/client';
import { getTraceContext } from '@netscript/telemetry/context';
import { createHttpClientLink } from './http-client-link.ts';
import type {
  ContractLike,
  CreateServiceClientOptions,
  ServiceClient,
} from '../ports/service-client.ts';

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
  const link = createHttpClientLink({
    contract,
    serviceName,
    pathSegment,
    protocol,
    apiPath,
    apiVersion,
    propagateTraceContext,
    getTraceHeaders,
  });

  return createORPCClient(link) as ServiceClient<TContract>;
}
