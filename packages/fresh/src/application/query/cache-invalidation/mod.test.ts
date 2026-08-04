import { assertEquals, assertRejects } from '@std/assert';
import { DEFAULT_QUERY_CACHE_INVALIDATION_PATH, invalidateServerQueryCache } from './mod.ts';

Deno.test('invalidateServerQueryCache sends the canonical key to the standard endpoint', async () => {
  let receivedInput: string | URL | Request | undefined;
  let receivedInit: RequestInit | undefined;

  await invalidateServerQueryCache(['boards', 'board', 'acme'], {
    fetcher: (input, init) => {
      receivedInput = input;
      receivedInit = init;
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  });

  assertEquals(receivedInput, DEFAULT_QUERY_CACHE_INVALIDATION_PATH);
  assertEquals(receivedInit?.method, 'POST');
  assertEquals(receivedInit?.credentials, 'same-origin');
  assertEquals(receivedInit?.body, JSON.stringify({ queryKey: ['boards', 'board', 'acme'] }));
});

Deno.test('invalidateServerQueryCache rejects an unsuccessful invalidation', async () => {
  await assertRejects(
    () =>
      invalidateServerQueryCache(['boards'], {
        fetcher: () => Promise.resolve(new Response(null, { status: 403 })),
      }),
    Error,
    'status 403',
  );
});
