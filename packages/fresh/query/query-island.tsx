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
import type { QueryClient } from '@tanstack/query-core';
import type { ComponentChildren, JSX } from 'preact';
import { getIslandQueryClient } from './query-client.ts';

/**
 * Props for the `QueryIsland` wrapper.
 */
export interface QueryIslandProps {
  /** Island content. */
  children: ComponentChildren;
  /** Override the shared QueryClient (for testing). */
  queryClient?: QueryClient;
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
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}
