import { assertEquals, assertStringIncludes } from '@std/assert';
import { QueryClient } from '@tanstack/query-core';
import { renderToString } from 'preact-render-to-string';
import { useQuery } from './hooks.ts';
import { QueryIsland } from './query-island.tsx';

const boardKey = ['board'] as const;
const serverUpdatedAt = 1_725_000_000_000;

function BoardSnapshot(): object {
  const { data, isFetching, isRefetching } = useQuery({
    queryKey: boardKey,
    queryFn: () => Promise.resolve('client refetch'),
    initialData: 'authoritative server snapshot',
    initialDataUpdatedAt: serverUpdatedAt,
  });

  return (
    <p data-fetching={String(isFetching)} data-refetching={String(isRefetching)}>
      {data}
    </p>
  );
}

Deno.test('server initialData wins first paint over an older shared-client entry', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(boardKey, 'stale shared-client snapshot', {
    updatedAt: 1_700_000_000_000,
  });

  const html = renderToString(
    <QueryIsland queryClient={queryClient}>
      <BoardSnapshot />
    </QueryIsland>,
  );

  assertStringIncludes(html, 'authoritative server snapshot');
  assertStringIncludes(html, 'data-fetching="true"');
  assertStringIncludes(html, 'data-refetching="true"');
  assertEquals(queryClient.getQueryState(boardKey)?.dataUpdatedAt, serverUpdatedAt);
});
