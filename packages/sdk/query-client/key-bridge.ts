/**
 * Server ↔ client query key bridging utilities.
 *
 * The SDK server keys (`['cache_query', resource, action, serializedInput]`)
 * and oRPC TanStack keys (`[...path, procedure, { type, input }]`) live in
 * separate cache tiers and are intentionally **not merged**. These helpers
 * map between the two for cross-tier invalidation.
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
 * @returns An object with a `queryKey` property suitable for
 *          `queryClient.invalidateQueries()`.
 */
export function bridgeInvalidation(
  resource: string,
  action?: string,
): { queryKey: readonly unknown[] } {
  return { queryKey: toClientKeyPrefix(resource, action) };
}
