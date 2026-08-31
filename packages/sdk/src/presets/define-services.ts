/**
 * Service composition preset for the SDK one-liner path.
 *
 * @module
 */

import { createServiceClient } from '../client/service-client.ts';
import { getServiceClientContributionRuntime } from '../client/service-client.ts';
import { createQueryFactory } from '../query/query-factory.ts';
import { createServiceQueryUtils } from '../query-client/create-service-query-utils.ts';
import type { QueryFactory } from '../ports/query-factory.ts';
import type { SdkClientServerKeySuffix } from '../ports/query-key.ts';
import type { QueryParams } from '../ports/query-options.ts';
import type {
  SdkClientContributionContext,
  ValidateSdkClientContributions,
} from '../ports/sdk-client-contribution.ts';
import type {
  ContractLike,
  CreateServiceClientOptions,
  ServiceClient,
  ServiceClientContext,
} from '../ports/service-client.ts';
import type { ServiceQueryUtils } from '../ports/service-query-utils.ts';

/**
 * Service definition consumed by `defineServices()`.
 */
export interface DefineServiceConfig<
  TContract extends ContractLike,
  TContributions extends readonly object[] = readonly [],
> {
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
  /**
   * Reserved override for explicit port selection.
   *
   * @deprecated Migrate explicit service addressing to discovery configuration; #1351 owns the
   * transport disposition.
   */
  port?: number;
  /**
   * Reserved request timeout in milliseconds.
   *
   * @deprecated Use an `AbortSignal` for request cancellation; #1351 owns the transport
   * disposition.
   */
  timeout?: number;
  /** Whether to propagate trace context headers automatically. */
  propagateTraceContext?: boolean;
  /** Default cache policy for generated query helpers. */
  options?: QueryParams;
  /** TanStack Query path prefix for service query utils; defaults to the map key. */
  queryPath?: string[];
  /** Explicit literal tuple of typed SDK client contributions. */
  contributions?:
    & TContributions
    & ValidateSdkClientContributions<TContributions>;
}

/**
 * Input map accepted by `defineServices()`.
 */
export type DefineServicesConfigMap = Record<
  string,
  DefineServiceConfig<ContractLike, readonly object[]>
>;

/** @internal Extract the contribution tuple from one service config. */
export type ContributionsOf<TConfig> = TConfig extends {
  readonly contributions: infer TContributions extends readonly object[];
} ? TContributions
  : readonly [];

/** @internal Extract the contract from one service config. */
export type ContractOf<TConfig> = TConfig extends {
  readonly contract: infer TContract extends ContractLike;
} ? TContract
  : never;

/** @internal Detect a tuple that forbids generated query helpers. */
export type HasDirectOnly<TContributions extends readonly object[]> = Extract<
  TContributions[number] extends { readonly responseCache: infer TResponseCache } ? TResponseCache
    : never,
  { readonly mode: 'direct-only' }
> extends never ? false
  : true;

/** @internal Detect a tuple that requires cache partitioning. */
export type HasPartitioned<TContributions extends readonly object[]> = Extract<
  TContributions[number] extends { readonly responseCache: infer TResponseCache } ? TResponseCache
    : never,
  { readonly mode: 'partitioned' }
> extends never ? false
  : true;

/** @internal Select the exact server-cache key suffix for a tuple. */
export type ServerKeySuffixOf<TContributions extends readonly object[]> =
  HasPartitioned<TContributions> extends true ? readonly ['$netscript.sdk-context', string]
    : readonly [];

/** @internal Compose the compatibility context with contribution context. */
export type ClientContextOf<TContributions extends readonly object[]> =
  & ServiceClientContext
  & SdkClientContributionContext<TContributions>;

/** @internal Preserve the empty query-utils default when contributions are omitted. */
export type QueryUtilsContextOf<TContributions extends readonly object[]> = TContributions extends
  readonly [] ? Record<never, never>
  : ClientContextOf<TContributions>;

/** @internal Select service keys that permit generated query helpers. */
export type QueryCompatibleServiceKeys<TServices extends DefineServicesConfigMap> = {
  [K in keyof TServices]: HasDirectOnly<ContributionsOf<TServices[K]>> extends true ? never : K;
}[keyof TServices];

/**
 * Service clients produced by `defineServices()`.
 */
export type DefinedServiceClients<TServices extends DefineServicesConfigMap> = {
  readonly [K in keyof TServices]: ServiceClient<
    ContractOf<TServices[K]>,
    ClientContextOf<ContributionsOf<TServices[K]>>
  >;
};

/**
 * Query factories produced by `defineServices()`.
 */
export type DefinedServiceQueries<TServices extends DefineServicesConfigMap> = {
  readonly [K in QueryCompatibleServiceKeys<TServices>]: QueryFactory<
    ContractOf<TServices[K]>,
    ClientContextOf<ContributionsOf<TServices[K]>>,
    ServerKeySuffixOf<ContributionsOf<TServices[K]>> & SdkClientServerKeySuffix
  >;
};

/**
 * Service query utils produced by `defineServices()`.
 */
export type DefinedServiceQueryUtils<TServices extends DefineServicesConfigMap> = {
  readonly [K in QueryCompatibleServiceKeys<TServices>]: ServiceQueryUtils<
    ContractOf<TServices[K]>,
    QueryUtilsContextOf<ContributionsOf<TServices[K]>>
  >;
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
  services:
    & TServices
    & {
      readonly [K in keyof TServices]: TServices[K] extends {
        readonly contributions: infer TContributions extends readonly object[];
      } ? {
          readonly contributions: TContributions & ValidateSdkClientContributions<TContributions>;
        }
        : Record<never, never>;
    },
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
      contributions: config.contributions,
    });

    clients[key] = client;
    if (getServiceClientContributionRuntime(client)?.directOnly) continue;
    queries[key] = createQueryFactory(key, config.contract, client, config.options);
    queryUtils[key] = createServiceQueryUtils(client, {
      path: config.queryPath ?? [key],
    });
  }

  // Object.entries loses the literal key-to-contract relationship; each value
  // is built from the matching config above, so this restores the mapped result.
  return { clients, queries, queryUtils } as DefinedServices<TServices>;
}
