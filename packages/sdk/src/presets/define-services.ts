/**
 * Service composition preset for the SDK one-liner path.
 *
 * @module
 */

import { createServiceClient } from '../client/service-client.ts';
import { createQueryFactory } from '../query/query-factory.ts';
import { createServiceQueryUtils } from '../query-client/create-service-query-utils.ts';
import type { QueryFactory } from '../ports/query-factory.ts';
import type { QueryParams } from '../ports/query-options.ts';
import type {
  ContractLike,
  CreateServiceClientOptions,
  ServiceClient,
} from '../ports/service-client.ts';
import type { ServiceQueryUtils } from '../ports/service-query-utils.ts';

/**
 * Service definition consumed by `defineServices()`.
 */
export interface DefineServiceConfig<TContract extends ContractLike> {
  /** Contract definition used for client, query, and query-utils inference. */
  contract: TContract;
  /** Service name registered in Aspire / NetScript config; defaults to the map key. */
  serviceName?: string;
  /** Optional router name used for URL path construction. */
  routerName?: string;
  /** Resolved protocol for service discovery. */
  protocol?: CreateServiceClientOptions<TContract>['protocol'];
  /** Base API RPC path. */
  apiPath?: string;
  /** API version segment. */
  apiVersion?: string;
  /** Reserved override for explicit port selection. */
  port?: number;
  /** Reserved request timeout in milliseconds. */
  timeout?: number;
  /** Whether to propagate trace context headers automatically. */
  propagateTraceContext?: boolean;
  /** Default cache policy for generated query helpers. */
  options?: QueryParams;
  /** TanStack Query path prefix for service query utils; defaults to the map key. */
  queryPath?: string[];
}

/**
 * Input map accepted by `defineServices()`.
 */
export type DefineServicesConfigMap = Record<string, DefineServiceConfig<ContractLike>>;

/**
 * Service clients produced by `defineServices()`.
 */
export type DefinedServiceClients<TServices extends DefineServicesConfigMap> = {
  readonly [K in keyof TServices]: TServices[K] extends DefineServiceConfig<
    infer TContract extends ContractLike
  > ? ServiceClient<TContract>
    : never;
};

/**
 * Query factories produced by `defineServices()`.
 */
export type DefinedServiceQueries<TServices extends DefineServicesConfigMap> = {
  readonly [K in keyof TServices]: TServices[K] extends DefineServiceConfig<
    infer TContract extends ContractLike
  > ? QueryFactory<TContract>
    : never;
};

/**
 * Service query utils produced by `defineServices()`.
 */
export type DefinedServiceQueryUtils<TServices extends DefineServicesConfigMap> = {
  readonly [K in keyof TServices]: TServices[K] extends DefineServiceConfig<
    infer TContract extends ContractLike
  > ? ServiceQueryUtils<TContract>
    : never;
};

/**
 * Result object returned by `defineServices()`.
 */
export interface DefinedServices<TServices extends DefineServicesConfigMap> {
  /** Typed service clients for direct oRPC calls. */
  readonly clients: DefinedServiceClients<TServices>;
  /** Cache-aware query factories for server or framework-neutral consumers. */
  readonly queries: DefinedServiceQueries<TServices>;
  /** TanStack Query utilities for frontend consumers. */
  readonly queryUtils: DefinedServiceQueryUtils<TServices>;
}

/**
 * Create SDK clients, query factories, and query utils from a service map.
 */
export function defineServices<const TServices extends DefineServicesConfigMap>(
  services: TServices,
): DefinedServices<TServices> {
  const clients: Record<string, unknown> = {};
  const queries: Record<string, unknown> = {};
  const queryUtils: Record<string, unknown> = {};

  for (const [key, config] of Object.entries(services)) {
    const serviceName = config.serviceName ?? key;
    const client = createServiceClient({
      contract: config.contract,
      serviceName,
      routerName: config.routerName,
      protocol: config.protocol,
      apiPath: config.apiPath,
      apiVersion: config.apiVersion,
      port: config.port,
      timeout: config.timeout,
      propagateTraceContext: config.propagateTraceContext,
    });

    clients[key] = client;
    queries[key] = createQueryFactory(key, config.contract, client, config.options);
    queryUtils[key] = createServiceQueryUtils(client, {
      path: config.queryPath ?? [key],
    });
  }

  // Object.entries loses the literal key-to-contract relationship; each value
  // is built from the matching config above, so this restores the mapped result.
  return { clients, queries, queryUtils } as DefinedServices<TServices>;
}
