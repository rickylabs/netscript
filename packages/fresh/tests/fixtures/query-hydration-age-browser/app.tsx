import { useEffect, useState } from 'preact/hooks';
import { QueryIsland, useQuery, useQueryClient } from '@netscript/fresh/query';

const SERVER_SNAPSHOT = 'server snapshot';
const REQUEST_COUNT_KEY = '__netscriptQueryHydrationRequestCount';

export interface QueryHydrationAgeBrowserProps {
  readonly mode: 'old' | 'fresh';
  readonly hydrationNow: number;
}

function requestCount(): number {
  return Number(Reflect.get(globalThis, REQUEST_COUNT_KEY) ?? 0);
}

function recordRequest(): void {
  Reflect.set(globalThis, REQUEST_COUNT_KEY, requestCount() + 1);
}

function QueryHydrationAgeSnapshot(props: QueryHydrationAgeBrowserProps): object {
  const [hydrated, setHydrated] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const queryClient = useQueryClient();
  const queryKey = ['query-hydration-age', props.mode] as const;
  const initialDataUpdatedAt = props.mode === 'old'
    ? props.hydrationNow - 60_000
    : props.hydrationNow;
  const query = useQuery<string>({
    queryKey,
    queryFn: () => {
      recordRequest();
      // Keep the refetch pending so the browser assertion observes the initial
      // server snapshot and its fetching state, independent of worker speed.
      return new Promise<string>(() => {});
    },
    initialData: SERVER_SNAPSHOT,
    initialDataUpdatedAt,
    staleTime: 15_000,
  });

  useEffect(() => setHydrated(true), []);

  return (
    <main
      data-fresh-island='query-hydration-age'
      data-hydrated={String(hydrated)}
      data-interaction-count={String(interactionCount)}
      data-mode={props.mode}
      data-query-client-found={String(queryClient.getQueryCache() !== undefined)}
      data-query-count={String(requestCount())}
      data-fetching={String(query.isFetching)}
      data-refetching={String(query.isRefetching)}
      data-updated-at={String(queryClient.getQueryState(queryKey)?.dataUpdatedAt)}
      data-expected-updated-at={String(initialDataUpdatedAt)}
    >
      <h1>Query hydration age</h1>
      <p id='snapshot'>{query.data}</p>
      <button type='button' onClick={() => setInteractionCount((count) => count + 1)}>
        Prove query island interactivity
      </button>
    </main>
  );
}

/** Public-wrapper island used by the hydration-age browser contract test. */
export default function QueryHydrationAgeBrowser(
  props: QueryHydrationAgeBrowserProps,
): object {
  return (
    <QueryIsland>
      <QueryHydrationAgeSnapshot {...props} />
    </QueryIsland>
  );
}
