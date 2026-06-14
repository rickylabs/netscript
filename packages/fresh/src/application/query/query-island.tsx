/**
 * `QueryIsland` — island-level TanStack Query provider.
 *
 * Every island that uses TanStack Query hooks must be wrapped in a
 * `QueryClientProvider`. `QueryIsland` wraps this with the shared singleton
 * `QueryClient` from {@link getIslandQueryClient}.
 *
 * @module
 */

import { QueryClientProvider } from '@tanstack/preact-query';
import { getIslandQueryClient } from './query-client.ts';
import type { IslandQueryClient, QueryIslandChildren } from './query-types.ts';

/**
 * Props for the `QueryIsland` wrapper.
 */
export interface QueryIslandProps {
  /** Island content. */
  children: QueryIslandChildren;
  /** Override the shared QueryClient (for testing). */
  queryClient?: IslandQueryClient;
}

/**
 * Island-level TanStack Query provider.
 *
 * @example
 * ```tsx
 * export default function MyIsland() {
 *   return (
 *     <QueryIsland>
 *       <MyComponent />
 *     </QueryIsland>
 *   );
 * }
 * ```
 */
export function QueryIsland({ children, queryClient }: QueryIslandProps): object {
  const client = queryClient ?? getIslandQueryClient();
  return (
    <QueryClientProvider client={client as never}>
      {children}
    </QueryClientProvider>
  );
}
