/**
 * Query hydration script and boundary components for advanced SSR handoff.
 *
 * The recommended Fresh island bridge remains passing `initialData` through
 * island props. These components support the full QueryClient dehydration path
 * when a route needs to prefetch several queries into one serialized state.
 *
 * @module
 */

import { useEffect } from 'preact/hooks';
import { getIslandQueryClient } from './query-client.ts';
import { hydrateFromDehydrated } from './hydration.ts';
import type { DehydratedState, IslandQueryClient, QueryIslandChildren } from './query-types.ts';

/** Default script id used for serialized NetScript query state. */
export const DEFAULT_QUERY_HYDRATION_SCRIPT_ID = '__netscript_query_state__';

/** Props for `QueryHydrationScript`. */
export interface QueryHydrationScriptProps {
  /** Dehydrated QueryClient state to serialize into the document. */
  state: DehydratedState;
  /** Script element id used by `HydrationBoundary`. */
  id?: string;
}

/** Props for `HydrationBoundary`. */
export interface HydrationBoundaryProps {
  /** Island content rendered after hydration is scheduled. */
  children: QueryIslandChildren;
  /** Script element id to read when `state` is not provided directly. */
  id?: string;
  /** Dehydrated state passed directly as a prop. */
  state?: DehydratedState;
  /** QueryClient override for tests or advanced app shells. */
  queryClient?: IslandQueryClient;
}

/** Render a JSON script tag containing dehydrated query state. */
export function QueryHydrationScript({
  state,
  id = DEFAULT_QUERY_HYDRATION_SCRIPT_ID,
}: QueryHydrationScriptProps): object {
  return (
    <script
      id={id}
      type='application/json'
      data-netscript-query-state='true'
      dangerouslySetInnerHTML={{ __html: serializeDehydratedState(state) }}
    />
  );
}

/** Hydrate the island QueryClient from direct state or a JSON script tag. */
export function HydrationBoundary({
  children,
  id = DEFAULT_QUERY_HYDRATION_SCRIPT_ID,
  state,
  queryClient,
}: HydrationBoundaryProps): object {
  const client = queryClient ?? getIslandQueryClient();

  useEffect(() => {
    const dehydratedState = state ?? readDehydratedState(id);
    if (dehydratedState) {
      hydrateFromDehydrated(client, dehydratedState);
    }
  }, [client, id, state]);

  return <>{children}</>;
}

function serializeDehydratedState(state: DehydratedState): string {
  return JSON.stringify(state).replaceAll('<', '\\u003c');
}

function readDehydratedState(id: string): DehydratedState | undefined {
  const documentLike = globalThis.document;
  const script = documentLike?.getElementById(id);
  const text = script?.textContent;

  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as DehydratedState;
}
