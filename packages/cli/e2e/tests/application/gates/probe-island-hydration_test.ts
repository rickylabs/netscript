import { assertEquals, assertRejects, assertThrows } from '@std/assert';

import {
  probeIslandHydration,
  probeResourceQueryRefetch,
  receiptFromIslandInteraction,
  type ResourceQueryRefetchObservation,
} from '../../../src/application/gates/scaffold/runtime/probe-island-hydration.ts';

Deno.test('hydration receipt requires the generated resource surface and QueryClient', () => {
  assertEquals(
    receiptFromIslandInteraction({
      queryClientFound: true,
      freshIslandElement: 'output',
    }),
    {
      islandHydrated: true,
      freshIslandElement: 'output',
    },
  );
});

Deno.test('hydration receipt rejects a server-rendered resource without a browser QueryClient', () => {
  assertThrows(
    () =>
      receiptFromIslandInteraction({
        queryClientFound: false,
        freshIslandElement: 'output',
      }),
    Error,
    'QueryClient was not reachable',
  );
});

Deno.test('hydration probe targets the generated people resource', async () => {
  const requested: string[] = [];
  const receipt = await probeIslandHydration(
    '/workspace/project',
    'inventory-web',
    '/workspace/apphost.mts',
    {
      resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
      interact: (url) => {
        requested.push(url);
        return Promise.resolve({ queryClientFound: true, freshIslandElement: 'output' });
      },
    },
  );

  assertEquals(requested, ['http://localhost:41234/people']);
  assertEquals(receipt, { islandHydrated: true, freshIslandElement: 'output' });
});

Deno.test('resource query refetch requires the hydrated list query, one request, and success', async () => {
  const evidence: ResourceQueryRefetchObservation = {
    queryClientFound: true,
    listQueryFound: true,
    baselineListRequestCount: 0,
    finalListRequestCount: 1,
    refetchStatus: 200,
  };
  const probe = (observed: ResourceQueryRefetchObservation) =>
    probeResourceQueryRefetch('/workspace/project', 'inventory-web', '/workspace/apphost.mts', {
      resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
      interact: () => Promise.resolve(observed),
    });
  await probe(evidence);
  await assertRejects(
    () => probe({ ...evidence, queryClientFound: false }),
    Error,
    'QueryClient was not reachable',
  );
  await assertRejects(
    () => probe({ ...evidence, listQueryFound: false }),
    Error,
    'users.list query was not present',
  );
  await assertRejects(
    () => probe({ ...evidence, finalListRequestCount: 2 }),
    Error,
    'expected 1',
  );
  await assertRejects(
    () => probe({ ...evidence, refetchStatus: 500 }),
    Error,
    'returned 500',
  );
});

Deno.test('resource query refetch probe targets the generated people resource', async () => {
  const requested: string[] = [];
  const evidence = await probeResourceQueryRefetch(
    '/workspace/project',
    'inventory-web',
    '/workspace/apphost.mts',
    {
      resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
      interact: (url) => {
        requested.push(url);
        return Promise.resolve({
          queryClientFound: true,
          listQueryFound: true,
          baselineListRequestCount: 2,
          finalListRequestCount: 3,
          refetchStatus: 204,
        });
      },
    },
  );

  assertEquals(requested, ['http://localhost:41234/people']);
  assertEquals(evidence.finalListRequestCount, 3);
});

Deno.test('hydration probe fails closed and persists negative evidence when Chromium is unavailable', async () => {
  const persisted: unknown[] = [];
  await assertRejects(
    () =>
      probeIslandHydration('/workspace/project', 'inventory-web', '/workspace/apphost.mts', {
        resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
        interact: () =>
          Promise.reject(new Error('No supported headless Chrome/Chromium executable')),
        persist: (receipt) => {
          persisted.push(receipt);
          return Promise.resolve();
        },
      }),
    Error,
    'No supported headless Chrome/Chromium executable',
  );
  assertEquals(persisted, [{ islandHydrated: false, freshIslandElement: null }]);
});
