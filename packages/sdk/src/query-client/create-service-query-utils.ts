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
 */
// deno-lint-ignore no-explicit-any
export function createServiceQueryUtils<TClient extends Record<string, any>>(
  client: TClient,
  options?: CreateServiceQueryUtilsOptions,
) {
  // The SDK's createServiceClient() returns an actual oRPC client (via
  // createORPCClient). The ServiceClient<T> type alias narrows the proxy
  // shape for SDK ergonomics, but the runtime value IS a NestedClient.
  // We use `any` here to bridge the structural-vs-nominal type gap.
  // deno-lint-ignore no-explicit-any
  return createTanstackQueryUtils(client as any, {
    path: options?.path,
  });
}
