/**
 * Internal query-factory implementation.
 *
 * @module
 */

import { invokeClientProcedure } from './client-proxy.ts';
import { createActionQueryKey } from '../ports/query-key.ts';
import type {
  ActionMethod,
  ProcedureInput,
  ProcedureOutput,
  QueryFactory,
} from '../ports/query-factory.ts';
import type {
  ContractLike,
  ContractProcedureNames,
  ServiceClient,
} from '../ports/service-client.ts';
import type { FactoryConfig } from '../ports/query-factory.ts';
import type { QueryParams } from '../ports/query-options.ts';
import type {
  ActionMutationOptions,
  ActionQueryOptions,
  MutationOptionsResult,
  QueryOptionsWithInitialData,
} from '../query-client/types.ts';

import { getCacheProvider } from '../cache/cache-provider.ts';
import { DEFAULT_QUERY_CACHE_TIME, DEFAULT_QUERY_STALE_TIME } from '../cache/defaults.ts';

/**
 * Create a query factory for an oRPC contract.
 *
 * @param resource - Resource name such as `users` or `orders`.
 * @param contract - oRPC contract used for action discovery and typing.
 * @param client - Typed service client for the contract.
 * @param defaultOptions - Default cache policy for generated actions.
 * @returns Resource-scoped query helpers.
 */
export function createQueryFactory<TContract extends ContractLike>(
  resource: string,
  contract: TContract,
  client: FactoryConfig<TContract>['client'],
  defaultOptions: QueryParams = {},
): QueryFactory<TContract> {
  const {
    staleTime: defaultStaleTime = DEFAULT_QUERY_STALE_TIME,
    cacheTime: defaultCacheTime = DEFAULT_QUERY_CACHE_TIME,
    revalidateOnStale: defaultRevalidateOnStale = true,
    preferFreshOnStale: defaultPreferFreshOnStale = false,
  } = defaultOptions;

  const factory: Record<string, unknown> = {
    resource,
    invalidate: async (): Promise<void> => {
      await getCacheProvider().invalidateQueries([resource]);
    },
  };

  const actionNames = Object.keys(contract) as Array<ContractProcedureNames<TContract>>;

  for (const action of actionNames) {
    const actionMethod = async (
      props: ProcedureInput<TContract, typeof action>,
      options: QueryParams = {},
    ): Promise<ProcedureOutput<TContract, typeof action>> => {
      const {
        staleTime = defaultStaleTime,
        cacheTime = defaultCacheTime,
        revalidateOnStale = defaultRevalidateOnStale,
        preferFreshOnStale = defaultPreferFreshOnStale,
      } = options;

      return await getCacheProvider().query(
        createActionQueryKey(resource, action, props),
        {
          staleTime,
          cacheTime,
          revalidateOnStale,
          preferFreshOnStale,
          queryFn: () => invokeClientProcedure(client, action, props),
        },
      );
    };

    actionMethod.invalidate = async (): Promise<void> => {
      await getCacheProvider().invalidateQueries([resource, action]);
    };

    actionMethod.key = (
      props: ProcedureInput<TContract, typeof action>,
    ): readonly [string, typeof action, string] => {
      return createActionQueryKey(
        resource,
        action,
        props,
      ) as readonly [string, typeof action, string];
    };

    actionMethod.prefetch = (
      props: ProcedureInput<TContract, typeof action>,
      options: QueryParams = {},
    ): void => {
      const {
        staleTime = defaultStaleTime,
        cacheTime = defaultCacheTime,
        revalidateOnStale = defaultRevalidateOnStale,
        preferFreshOnStale = defaultPreferFreshOnStale,
      } = options;

      void getCacheProvider().prefetch(
        createActionQueryKey(resource, action, props),
        {
          staleTime,
          cacheTime,
          revalidateOnStale,
          preferFreshOnStale,
          queryFn: () => invokeClientProcedure(client, action, props),
        },
      );
    };

    actionMethod.getCachedData = async (
      props: ProcedureInput<TContract, typeof action>,
    ): Promise<ProcedureOutput<TContract, typeof action> | null> => {
      return await getCacheProvider().getCachedData(
        createActionQueryKey(resource, action, props),
      );
    };

    actionMethod.getCachedEntry = async (props: ProcedureInput<TContract, typeof action>) => {
      return await getCacheProvider().getCachedEntry(
        createActionQueryKey(resource, action, props),
      );
    };

    // === TanStack Query extensions (RFC 17 §3.3) ===

    actionMethod.queryOptions = (
      props: ProcedureInput<TContract, typeof action>,
      options: ActionQueryOptions = {},
    ): QueryOptionsWithInitialData<ProcedureOutput<TContract, typeof action>> => {
      const { staleTime: clientStaleTime = defaultStaleTime } = options;

      return {
        queryKey: [resource, action, { input: props }] as const,
        queryFn: () => invokeClientProcedure(client, action, props),
        staleTime: clientStaleTime,
      };
    };

    actionMethod.mutationOptions = (
      options: ActionMutationOptions = {},
    ): MutationOptionsResult<
      ProcedureOutput<TContract, typeof action>,
      ProcedureInput<TContract, typeof action>
    > => {
      const { onSuccess, onError, onSettled, onMutate } = options;
      return {
        mutationKey: [resource, action] as const,
        mutationFn: (input: ProcedureInput<TContract, typeof action>) =>
          invokeClientProcedure(client, action, input),
        ...(onSuccess && { onSuccess }),
        ...(onError && { onError }),
        ...(onSettled && { onSettled }),
        ...(onMutate && { onMutate }),
      };
    };

    actionMethod.clientKey = (
      props?: ProcedureInput<TContract, typeof action>,
    ): readonly unknown[] => {
      return props ? [resource, action, { input: props }] as const : [resource, action] as const;
    };

    factory[action] = actionMethod as ActionMethod<TContract, typeof action>;
  }

  return factory as QueryFactory<TContract>;
}

/**
 * Create multiple query factories at once.
 *
 * @param factories - Resource-to-config mapping.
 * @returns Resource-to-query-factory mapping.
 */
export function createQueryFactories<
  const TFactories extends Record<string, {
    contract: ContractLike;
    client: unknown;
    options?: QueryParams;
  }>,
>(
  factories:
    & TFactories
    & {
      [K in keyof TFactories]: TFactories[K] extends
        { contract: infer TContract extends ContractLike } ? {
          contract: TContract;
          client: ServiceClient<TContract>;
          options?: QueryParams;
        }
        : never;
    },
): {
  [K in keyof TFactories]: TFactories[K] extends { contract: infer TContract extends ContractLike }
    ? QueryFactory<TContract>
    : never;
} {
  const result: Record<string, unknown> = {};

  for (const [resource, config] of Object.entries(factories)) {
    result[resource] = createQueryFactory(resource, config.contract, config.client, config.options);
  }

  return result as {
    [K in keyof TFactories]: TFactories[K] extends
      { contract: infer TContract extends ContractLike } ? QueryFactory<TContract>
      : never;
  };
}
