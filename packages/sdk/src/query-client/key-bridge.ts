/**
 * Server ↔ client query key bridging utilities.
 *
 * The SDK server keys (`[resource, action, serializedInput]`) and query-factory
 * TanStack keys (`[resource, action, { input }]`) live in separate cache tiers
 * and are intentionally **not merged**. These helpers map their shared prefix
 * for cross-tier invalidation.
 *
 * @module
 */

/**
 * Convert an SDK resource/action pair to a client-side TanStack key prefix.
 *
 * TanStack Query's `invalidateQueries` uses prefix matching by default, so
 * `['orders', 'list']` invalidates all queries whose key starts with those
 * elements.
 */
export function toClientKeyPrefix(
  resource: string,
  action?: string,
): readonly unknown[] {
  return action ? [resource, action] as const : [resource] as const;
}

/**
 * Build a client-side invalidation filter from a resource and optional action.
 *
 * Query-factory consumers should derive factory-consistent prefixes from
 * `factory.<action>.clientKey()` instead of repeating the resource and action.
 *
 * @param resource - Resource segment at the start of the client query key.
 * @param action - Optional action segment following the resource.
 * @returns An object with a `queryKey` property suitable for
 *          `queryClient.invalidateQueries()`.
 */
export function bridgeInvalidation(
  resource: string,
  action?: string,
): { queryKey: readonly unknown[] } {
  return { queryKey: toClientKeyPrefix(resource, action) };
}
