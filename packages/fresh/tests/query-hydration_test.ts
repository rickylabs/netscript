import { assertEquals, assertThrows } from '@std/assert';
import { QueryClient } from '@tanstack/query-core';
import { dehydrateQueryClient, hydrateFromDehydrated } from '../src/application/query/hydration.ts';

Deno.test('hydrateFromDehydrated restores readonly server state', () => {
  const serverClient = new QueryClient();
  serverClient.setQueryData(['greeting'], 'hello');
  const dehydratedState = dehydrateQueryClient(serverClient);
  Object.freeze(dehydratedState.mutations);
  Object.freeze(dehydratedState.queries);

  const browserClient = new QueryClient();
  hydrateFromDehydrated(browserClient, dehydratedState);

  assertEquals(browserClient.getQueryData(['greeting']), 'hello');
});

Deno.test('hydrateFromDehydrated rejects invalid cache entries', () => {
  const queryClient = new QueryClient();

  assertThrows(
    () => hydrateFromDehydrated(queryClient, { mutations: [{}], queries: [] }),
    TypeError,
    'Invalid dehydrated mutation at index 0',
  );
});
