import { useEffect, useRef, useState } from 'preact/hooks';
import {
  type DehydratedState,
  getIslandQueryClient,
  hydrateFromDehydrated,
  QueryIsland,
  useQuery,
  useQueryClient,
} from '../../../../../../src/application/query/mod.ts';

interface ServiceRow {
  readonly id: number;
  readonly name: string;
}

export interface ServiceShowcaseLabProps {
  readonly dehydratedState: DehydratedState;
  readonly initialRow: ServiceRow;
  readonly initialDataUpdatedAt: number;
}

const listQueryKey = ['route-binding-browser', 'service-list'] as const;
const browserEvidence = globalThis as Record<string, unknown>;

if (typeof document !== 'undefined') {
  browserEvidence.__serviceShowcaseIslandModuleLoaded = true;
}

function ServiceShowcaseLabInner(props: ServiceShowcaseLabProps) {
  if (typeof document !== 'undefined') {
    const attempts = Number(browserEvidence.__serviceShowcaseInnerRenderAttempts ?? 0);
    browserEvidence.__serviceShowcaseInnerRenderAttempts = attempts + 1;
    browserEvidence.__serviceShowcaseSingletonClientAttempts = Number(
      browserEvidence.__serviceShowcaseSingletonClientAttempts ?? 0,
    ) + 1;
  }

  const islandQueryClient = getIslandQueryClient();
  const hydratedCacheRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  if (typeof document !== 'undefined') {
    browserEvidence.__serviceShowcaseSingletonClientResolved = true;
  }

  if (!hydratedCacheRef.current) {
    hydrateFromDehydrated(islandQueryClient, props.dehydratedState);
    hydratedCacheRef.current = true;
  }

  if (typeof document !== 'undefined') {
    browserEvidence.__serviceShowcaseHydratedCache = hydratedCacheRef.current;
    browserEvidence.__serviceShowcaseQueryClientHookAttempts = Number(
      browserEvidence.__serviceShowcaseQueryClientHookAttempts ?? 0,
    ) + 1;
  }

  const queryClient = useQueryClient();

  if (typeof document !== 'undefined') {
    browserEvidence.__serviceShowcaseQueryClientHookResolved = true;
    browserEvidence.__serviceShowcaseQueryClientMatchesSingleton =
      queryClient === islandQueryClient;
    browserEvidence.__serviceShowcaseQueryClientData = queryClient.getQueryData<ServiceRow>(
      listQueryKey,
    )?.name;
    browserEvidence.__serviceShowcaseQueryHookAttempts = Number(
      browserEvidence.__serviceShowcaseQueryHookAttempts ?? 0,
    ) + 1;
  }

  const { data } = useQuery<ServiceRow>({
    queryKey: listQueryKey,
    queryFn: () => Promise.resolve(props.initialRow),
    initialData: props.initialRow,
    initialDataUpdatedAt: props.initialDataUpdatedAt,
    staleTime: 60_000,
  });

  if (typeof document !== 'undefined') {
    browserEvidence.__serviceShowcaseQueryHookResolved = true;
  }

  useEffect(() => {
    browserEvidence.__serviceShowcaseHydrationEffectRan = true;
    setHydrated(true);
  }, []);

  return (
    <section
      id='service-showcase-lab'
      data-hydrated={String(hydrated)}
      data-hydrated-cache={String(hydratedCacheRef.current)}
      data-query-client={String(queryClient !== undefined)}
    >
      <p id='service-showcase-row'>{data?.name ?? 'missing row'}</p>
      <button
        type='button'
        onClick={() => {
          queryClient.setQueryData<ServiceRow>(listQueryKey, (previous) => ({
            id: previous?.id ?? props.initialRow.id,
            name: 'Hydrated row',
          }));
        }}
      >
        Rename fixture row
      </button>
    </section>
  );
}

export default function ServiceShowcaseLab(props: ServiceShowcaseLabProps): object {
  if (typeof document !== 'undefined') {
    const attempts = Number(browserEvidence.__serviceShowcaseIslandRenderAttempts ?? 0);
    browserEvidence.__serviceShowcaseIslandRenderAttempts = attempts + 1;
  }

  return (
    <QueryIsland>
      <ServiceShowcaseLabInner {...props} />
    </QueryIsland>
  );
}
