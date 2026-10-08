import { useEffect, useState } from 'preact/hooks';
import { createStateSchema } from '@durable-streams/state';
import { createNetScriptStreamDB } from '@netscript/fresh/streams';
import { useLiveQuery } from '@netscript/fresh/query';
import { workersStreamSchema } from '../../../../plugin-workers-core/src/streams/schema.ts';
import { createQueryCollection } from '../../../../sdk/src/collections/create-query-collection.ts';
import { createNetScriptQueryClient } from '../../../../sdk/src/query-client/query-client-factory.ts';

function createSources(baseUrl: string) {
  const db = createNetScriptStreamDB({
    baseUrl,
    streamPath: '/workers',
    schema: createStateSchema(workersStreamSchema),
  });
  const client = createNetScriptQueryClient({ gcTime: 0 });
  const query = createQueryCollection({
    resource: 'browser-collection',
    queryKey: ['browser-collection'],
    queryFn: () => Promise.resolve([{ id: 'sdk-item' }]),
    getKey: (item) => item.id,
    queryClient: client,
  });
  return { db, client, query };
}
type Sources = ReturnType<typeof createSources>;

function LiveCollection(props: { readonly sources: Sources }): object {
  const { db, client, query } = props.sources;
  const live = useLiveQuery((q) => q.from({ execution: db.collections.execution }));
  const [ready, setReady] = useState(false);
  const [sdkItems, setSdkItems] = useState('');
  useEffect(() => {
    let mounted = true;
    Promise.all([db.preload?.(), query.preload()]).then(() => {
      if (mounted) {
        setReady(true);
        setSdkItems(query.toArray.map((item) => item.id).join(','));
      }
    });
    return () => {
      mounted = false;
      db.close?.();
      const cleanup: unknown = Reflect.get(query, 'cleanup');
      if (typeof cleanup === 'function') cleanup.call(query);
      client.clear();
    };
  }, []);
  return (
    <section data-state={ready ? (live.data?.length ? 'data' : 'empty') : 'loading'}>
      <p id='stream-data'>{(live.data ?? []).map((item) => item.progressMessage).join(',')}</p>
      <p id='sdk-data'>{sdkItems}</p>
    </section>
  );
}

/** Real Fresh island crossing stream, SDK and query adapter Collection boundaries. */
export default function CollectionBrowser(props: { readonly baseUrl: string }): object {
  const [sources] = useState(() => createSources(props.baseUrl));
  const [mounted, setMounted] = useState(true);
  const [subscriptions, setSubscriptions] = useState(-1);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (!mounted) {
      const timer = setInterval(() => {
        const count = sources.db.collections.execution.subscriberCount +
          sources.query.subscriberCount;
        setSubscriptions(count);
        if (count === 0) clearInterval(timer);
      }, 25);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [mounted]);
  return (
    <main data-hydrated={String(hydrated)} data-subscriptions={String(subscriptions)}>
      <h1>Collection runtime</h1>
      {mounted ? <LiveCollection sources={sources} /> : <p>Unmounted</p>}
      <button type='button' onClick={() => fetch('/update', { method: 'POST' })}>
        Update stream
      </button>
      <button type='button' onClick={() => setMounted(false)}>Unmount collections</button>
    </main>
  );
}
