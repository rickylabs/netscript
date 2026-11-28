/**
 * HTTP transport adapter for service clients.
 *
 * @module
 */

import { getServiceUrl } from '../discovery/service-discovery.ts';
import { createPreparedOutboundHeadersPort } from '../internal/client-contributions/prepared-call.ts';
import { createStableV1ClientLink } from '../internal/client-contributions/stable-v1-adapter.ts';
import { createFetchRpcClientLink } from '../internal/fetch-rpc-link.ts';
import type { ResolvedTransportPolicy } from '../internal/transport-policy.ts';
import type { ClientLinkPort } from '../ports/client-link-factory.ts';
import type { SdkClientContributionContext } from '../ports/sdk-client-contribution.ts';
import type { ServiceClientContext, ServiceUrlResolver } from '../ports/service-client.ts';

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
  /** Per-call service URL resolver; defaults to Aspire discovery (`getServiceUrl`). */
  resolveServiceUrl?: ServiceUrlResolver;
  /** Explicit validated client-contribution tuple. */
  contributions?: TContributions;
  /** Private transport fetch seam used by conformance tests. */
  fetch?: typeof globalThis.fetch;
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
  resolveServiceUrl = getServiceUrl,
  contributions,
  fetch: transportFetch = globalThis.fetch,
}: HttpClientLinkOptions<TContributions>): ClientLinkPort<
  ServiceClientContext & SdkClientContributionContext<TContributions>
> {
  const transportLink = createFetchRpcClientLink({
    transportPolicy,
    serviceName,
    propagateTraceContext,
    getTraceHeaders,
    fetch: transportFetch,
  });
  const contributionTuple: readonly object[] = contributions ?? [];
  const preparation = createPreparedOutboundHeadersPort(contributionTuple);

  return createStableV1ClientLink<SdkClientContributionContext<TContributions>>({
    link: transportLink,
    preparation,
    transportPolicy,
    resolveTransport: () => {
      const discovered = new URL(resolveServiceUrl(serviceName, protocol));
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
