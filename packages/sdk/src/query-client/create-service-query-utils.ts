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
import type { ContractLike, ServiceClient } from '../ports/service-client.ts';
import type { ServiceQueryUtils } from '../ports/service-query-utils.ts';

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
 * import { ordersClient } from './api-clients.ts';
 *
 * const ordersQueryUtils = createServiceQueryUtils(ordersClient, {
 *   path: ['orders'],
 * });
 *
 * // In an island:
 * const { data } = useQuery(
 *   ordersQueryUtils.list.queryOptions({ input: { page: 1, limit: 20 } }),
 * );
 * ```
 *
 * @typeParam TContract - Contract used by the service client.
 */
export function createServiceQueryUtils<TContract extends ContractLike>(
  client: ServiceClient<TContract>,
  options?: CreateServiceQueryUtilsOptions,
): ServiceQueryUtils<TContract> {
  const utils: unknown = createTanstackQueryUtils(client, {
    path: options?.path,
  });
  // The runtime value is produced by createORPCClient and accepted by
  // createTanstackQueryUtils; the SDK return type remaps that upstream
  // utility shape back to the package-owned contract algebra.
  return utils as ServiceQueryUtils<TContract>;
}
