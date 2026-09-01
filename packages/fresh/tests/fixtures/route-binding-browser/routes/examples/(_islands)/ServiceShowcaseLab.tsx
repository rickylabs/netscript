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
  const islandQueryClient = getIslandQueryClient();
  const hydratedCacheRef = useRef(false);
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);

  if (!hydratedCacheRef.current) {
    hydrateFromDehydrated(islandQueryClient, props.dehydratedState);
    hydratedCacheRef.current = true;
  }

  const { data } = useQuery<ServiceRow>({
    queryKey: listQueryKey,
    queryFn: () => Promise.resolve(props.initialRow),
    initialData: props.initialRow,
    initialDataUpdatedAt: props.initialDataUpdatedAt,
    staleTime: 60_000,
  });

  useEffect(() => {
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
