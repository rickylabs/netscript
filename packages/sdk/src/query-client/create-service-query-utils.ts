/**
 * oRPC → TanStack Query bridge utility.
 *
 * Wraps `@orpc/tanstack-query`'s `createTanstackQueryUtils` with NetScript
 * SDK typing, providing typed `.queryOptions()`, `.mutationOptions()`,
 * `.infiniteOptions()`, `.key()`, and `.streamedOptions()` for every
 * contract procedure.
 *
 * @module
 */

import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { getServiceClientContributionRuntime } from '../client/service-client.ts';
import type { ContractLike, ServiceClient } from '../ports/service-client.ts';
import type { ServiceQueryUtils } from '../ports/service-query-utils.ts';

const PARTITIONED_KEY_METHODS = new Set([
  'queryKey',
  'experimental_streamedKey',
  'experimental_liveKey',
  'infiniteKey',
]);
const PARTITIONED_OPTION_KEY_METHODS = new Map([
  ['queryOptions', 'queryKey'],
  ['experimental_streamedOptions', 'experimental_streamedKey'],
  ['experimental_liveOptions', 'experimental_liveKey'],
  ['infiniteOptions', 'infiniteKey'],
]);

function isObjectLike(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function optionContext(args: readonly unknown[]): Readonly<Record<string, unknown>> {
  const options = args[0];
  if (!isRecord(options) || !isRecord(options.context)) return Object.freeze({});
  return options.context;
}

function appendPartition(key: unknown, suffix: readonly unknown[]): readonly unknown[] {
  if (!Array.isArray(key)) throw new TypeError('Service query utility produced an invalid key');
  return suffix.length === 0 ? key : [...key, ...suffix];
}

function wrapContributionAwareUtils(
  target: object,
  procedurePath: readonly string[],
  partition: (
    procedurePath: readonly string[],
    context: Readonly<Record<string, unknown>>,
  ) => readonly unknown[],
): object {
  return new Proxy(target, {
    get(current, property, receiver) {
      const value = Reflect.get(current, property, receiver);
      if (typeof property !== 'string') return value;

      if (typeof value === 'function' && PARTITIONED_KEY_METHODS.has(property)) {
        return (...args: readonly unknown[]): readonly unknown[] => {
          const key = Reflect.apply(value, current, args);
          return appendPartition(key, partition(procedurePath, optionContext(args)));
        };
      }

      const keyMethodName = PARTITIONED_OPTION_KEY_METHODS.get(property);
      if (typeof value === 'function' && keyMethodName !== undefined) {
        return (...args: readonly unknown[]): unknown => {
          const keyMethod = Reflect.get(current, keyMethodName);
          if (typeof keyMethod !== 'function') {
            throw new TypeError(`Service query utility is missing ${keyMethodName}`);
          }
          const key = Reflect.apply(keyMethod, current, args);
          const options = isRecord(args[0]) ? args[0] : {};
          return Reflect.apply(value, current, [{
            ...options,
            queryKey: appendPartition(
              key,
              partition(procedurePath, optionContext(args)),
            ),
          }]);
        };
      }

      if (!isObjectLike(value)) return value;
      return wrapContributionAwareUtils(value, [...procedurePath, property], partition);
    },
  });
}

/**
 * Options for creating TanStack Query utils from an SDK service client.
 */
export interface CreateServiceQueryUtilsOptions {
  /** Key path prefix used by `@orpc/tanstack-query` for query keys. */
  path?: string[];
}

/**
 * Create TanStack Query utils from an existing oRPC service client.
 *
 * The returned utils expose `.queryOptions()`, `.mutationOptions()`,
 * `.infiniteOptions()`, `.key()`, and `.streamedOptions()` for every
 * procedure defined on the contract. All types are inferred from the
 * contract schemas — no manual annotations needed.
 *
 * **Note:** The `client` parameter must be the return value of
 * `createServiceClient()` from `@netscript/sdk/client`. Under the hood,
 * it is an oRPC NestedClient — the SDK's `ServiceClient` type alias is a
 * structural description of the same shape.
 *
 * @example
 * ```ts
 * import { ordersClient } from '@app/lib/orders.ts';
 *
 * const ordersQueryUtils = createServiceQueryUtils(ordersClient, {
 *   path: ['orders'],
 * });
 *
 * const listOptions = ordersQueryUtils.list.queryOptions({
 *   input: { offset: 0, limit: 20 },
 * });
 * console.log(listOptions.queryKey);
 * ```
 *
 * @typeParam TContract - Contract used by the service client.
 */
export function createServiceQueryUtils<
  TContract extends ContractLike,
  TContext extends object = Record<never, never>,
>(
  client: ServiceClient<TContract, TContext>,
  options?: CreateServiceQueryUtilsOptions,
): ServiceQueryUtils<TContract, TContext> {
  const utils: unknown = Reflect.apply(createTanstackQueryUtils, undefined, [client, {
    path: options?.path,
  }]);
  const runtime = getServiceClientContributionRuntime(client as object);
  const contributionAware = runtime === undefined || !isObjectLike(utils)
    ? utils
    : wrapContributionAwareUtils(
      utils,
      [],
      (procedurePath, context) => runtime.partition(procedurePath, context).querySuffix,
    );
  // The runtime value is produced by createORPCClient and accepted by
  // createTanstackQueryUtils; the SDK return type remaps that upstream
  // utility shape back to the package-owned contract algebra.
  return contributionAware as ServiceQueryUtils<TContract, TContext>;
}
