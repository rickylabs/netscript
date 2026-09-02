/**
 * Service client factory for discovered oRPC services.
 *
 * @module
 */

import { createORPCClient } from '@orpc/client';
import { buildServiceRpcPath } from '@netscript/service/rpc-path';
import { getTraceContext } from '@netscript/telemetry/context';
import { createHttpClientLink } from './http-client-link.ts';
import {
  hasDirectOnlySdkClientContribution,
  resolveSdkClientCachePartition,
  type SdkClientCachePartition,
  validateSdkClientContributions,
} from '../internal/client-contributions/prepared-call.ts';
import { createStableV1ProcedureMetadataPort } from '../internal/client-contributions/stable-v1-adapter.ts';
import { resolveTransportPolicy } from '../internal/transport-policy.ts';
import type {
  ContractLike,
  CreateServiceClientOptions,
  ServiceClient,
  ServiceClientContext,
} from '../ports/service-client.ts';
import type { SdkClientContributionContext } from '../ports/sdk-client-contribution.ts';

/** Package-private cache policy attached to an SDK-created service client. */
export interface ServiceClientContributionRuntime {
  readonly directOnly: boolean;
  readonly partition: (
    procedurePath: readonly string[],
    context: Readonly<Record<string, unknown>>,
  ) => SdkClientCachePartition;
}

const contributionRuntimeByClient = new WeakMap<object, ServiceClientContributionRuntime>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function resolveProcedureNode(contract: object, path: readonly string[]): unknown {
  let node: unknown = contract;
  for (const segment of path) {
    if (!isRecord(node) || !(segment in node)) {
      throw new TypeError(`Service client procedure does not exist: ${path.join('.')}`);
    }
    node = node[segment];
  }
  return node;
}

/** Read contribution cache policy for a client created by this package. */
export function getServiceClientContributionRuntime(
  client: object,
): ServiceClientContributionRuntime | undefined {
  return contributionRuntimeByClient.get(client);
}

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
  transportPolicy: transportPolicyOverride,
}: CreateServiceClientOptions<TContract, TContributions>): ServiceClient<
  TContract,
  ServiceClientContext & SdkClientContributionContext<TContributions>
> {
  const transportPolicy = resolveTransportPolicy(contract, {
    transportPolicy: transportPolicyOverride,
  });
  const contributionTuple = validateSdkClientContributions(contributions ?? []);
  const procedureMetadata = createStableV1ProcedureMetadataPort();
  const pathSegment = routerName ?? serviceName;
  const rpcPath = buildServiceRpcPath({
    routerName: pathSegment,
    apiPath,
    apiVersion,
  });
  const link = createHttpClientLink({
    transportPolicy,
    serviceName,
    protocol,
    rpcPath,
    propagateTraceContext,
    getTraceHeaders,
    contributions,
  });

  const client = createORPCClient(link) as ServiceClient<
    TContract,
    ServiceClientContext & SdkClientContributionContext<TContributions>
  >;
  contributionRuntimeByClient.set(
    client,
    Object.freeze({
      directOnly: hasDirectOnlySdkClientContribution(contributionTuple),
      partition: (
        procedurePath: readonly string[],
        context: Readonly<Record<string, unknown>>,
      ) =>
        resolveSdkClientCachePartition(
          contributionTuple,
          context,
          procedureMetadata.describe(
            resolveProcedureNode(contract, procedurePath),
            procedurePath,
          ),
        ),
    }),
  );
  return client;
}
