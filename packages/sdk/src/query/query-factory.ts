/**
 * Internal query-factory implementation.
 *
 * @module
 */

import { getServiceClientContributionRuntime } from '../client/service-client.ts';
import { createActionQueryKey } from '../ports/query-key.ts';
import type { ProcedureInput, ProcedureOutput, QueryFactory } from '../ports/query-factory.ts';
import type {
  ContractLike,
  ContractProcedureNames,
  ServiceClient,
  ServiceClientContext,
} from '../ports/service-client.ts';
import type { FactoryConfig } from '../ports/query-factory.ts';
import type { SdkClientServerKeySuffix } from '../ports/query-key.ts';
import type { QueryParams } from '../ports/query-options.ts';
import type {
  ActionMutationOptions,
  ActionQueryOptions,
  MutationOptionsResult,
  QueryOptionsWithInitialData,
} from '../query-client/types.ts';

import { getCacheProvider, hasCacheProvider } from '../cache/cache-provider.ts';
import { DEFAULT_QUERY_CACHE_TIME, DEFAULT_QUERY_STALE_TIME } from '../cache/defaults.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requestContext(options: unknown): Readonly<Record<string, unknown>> {
  if (!isRecord(options) || !isRecord(options.context)) return Object.freeze({});
  return options.context;
}

function appendQuerySuffix(
  key: readonly unknown[],
  suffix: readonly unknown[],
): readonly unknown[] {
  return suffix.length === 0 ? key : [...key, ...suffix];
}

function invokeClientProcedureWithOptions<
  TContract extends ContractLike,
  TAction extends ContractProcedureNames<TContract>,
  TContext extends object,
>(
  client: ServiceClient<TContract, TContext>,
  action: TAction,
  input: ProcedureInput<TContract, TAction>,
  options: unknown,
): Promise<ProcedureOutput<TContract, TAction>> {
  const candidate = Reflect.get(client as object, action);
  if (typeof candidate !== 'function') {
    throw new Error(`Procedure "${String(action)}" was not found on the service client.`);
  }
  const result = isRecord(options) && 'context' in options
    ? Reflect.apply(candidate, client, [input, { context: options.context }])
    : Reflect.apply(candidate, client, [input]);
  return result as Promise<
    ProcedureOutput<TContract, TAction>
  >;
}

/**
 * Create a query factory for an oRPC contract.
 *
 * @param resource - Resource name such as `users` or `orders`.
 * @param contract - oRPC contract used for action discovery and typing.
 * @param client - Typed service client for the contract.
 * @param defaultOptions - Default cache policy for generated actions.
 * @returns Resource-scoped query helpers.
 */
export function createQueryFactory<
  TContract extends ContractLike,
  TContext extends object = ServiceClientContext,
  TKeySuffix extends SdkClientServerKeySuffix = readonly [],
>(
  resource: string,
  contract: TContract,
  client: FactoryConfig<TContract, TContext, TKeySuffix>['client'],
  defaultOptions: QueryParams = {},
): QueryFactory<TContract, TContext, TKeySuffix> {
  const contributionRuntime = getServiceClientContributionRuntime(client);
  const {
    staleTime: defaultStaleTime = DEFAULT_QUERY_STALE_TIME,
    cacheTime: defaultCacheTime = DEFAULT_QUERY_CACHE_TIME,
    revalidateOnStale: defaultRevalidateOnStale = true,
    preferFreshOnStale: defaultPreferFreshOnStale = false,
  } = defaultOptions;

  const factory: Record<string, unknown> = {
    resource,
    invalidate: async (): Promise<void> => {
      await getCacheProvider().invalidateQueries([resource], `${resource}.all`);
    },
  };

  const actionNames = Object.keys(contract) as Array<ContractProcedureNames<TContract>>;

  for (const action of actionNames) {
    const operationId = `${resource}.${String(action)}`;
    const partition = (options: unknown) =>
      contributionRuntime?.partition([action], requestContext(options)) ?? {
        serverSuffix: [],
        querySuffix: [],
      };
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
        createActionQueryKey(resource, action, props, partition(options).serverSuffix),
        {
          staleTime,
          cacheTime,
          revalidateOnStale,
          preferFreshOnStale,
          operationId,
          queryFn: () => invokeClientProcedureWithOptions(client, action, props, options),
        },
      );
    };

    actionMethod.invalidate = async (): Promise<void> => {
      await getCacheProvider().invalidateQueries([resource, action], operationId);
    };

    actionMethod.key = (
      props: ProcedureInput<TContract, typeof action>,
      ...request: readonly unknown[]
    ) => {
      return createActionQueryKey(
        resource,
        action,
        props,
        partition(request[0]).serverSuffix,
      );
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
        createActionQueryKey(resource, action, props, partition(options).serverSuffix),
        {
          staleTime,
          cacheTime,
          revalidateOnStale,
          preferFreshOnStale,
          operationId,
          queryFn: () => invokeClientProcedureWithOptions(client, action, props, options),
        },
      );
    };

    actionMethod.getCachedData = async (
      props: ProcedureInput<TContract, typeof action>,
      ...request: readonly unknown[]
    ): Promise<ProcedureOutput<TContract, typeof action> | null> => {
      return await getCacheProvider().getCachedData(
        createActionQueryKey(resource, action, props, partition(request[0]).serverSuffix),
        operationId,
      );
    };

    actionMethod.getCachedEntry = async (
      props: ProcedureInput<TContract, typeof action>,
      ...request: readonly unknown[]
    ) => {
      return await getCacheProvider().getCachedEntry(
        createActionQueryKey(resource, action, props, partition(request[0]).serverSuffix),
        operationId,
      );
    };

    // === TanStack Query extensions (RFC 17 §3.3) ===

    actionMethod.queryOptions = (
      props: ProcedureInput<TContract, typeof action>,
      options: ActionQueryOptions = {},
    ): QueryOptionsWithInitialData<ProcedureOutput<TContract, typeof action>> => {
      const { staleTime: clientStaleTime = defaultStaleTime } = options;

      return {
        queryKey: appendQuerySuffix(
          [resource, action, { input: props }],
          partition(options).querySuffix,
        ),
        queryFn: () =>
          hasCacheProvider()
            ? actionMethod(props, options)
            : invokeClientProcedureWithOptions(client, action, props, options),
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
          invokeClientProcedureWithOptions(client, action, input, options),
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

    factory[action] = actionMethod;
  }

  return factory as QueryFactory<TContract, TContext, TKeySuffix>;
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
