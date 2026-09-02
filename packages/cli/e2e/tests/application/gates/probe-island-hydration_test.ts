import { assertEquals, assertRejects } from '@std/assert';

import {
  probeIslandHydration,
  receiptFromIslandInteraction,
} from '../../../src/application/gates/scaffold/runtime/probe-island-hydration.ts';

Deno.test('hydration receipt requires the data-state island surface and Rename row transition', () => {
  assertEquals(
    receiptFromIslandInteraction({
      initialRow: 'Seed User',
      rowAfterRename: 'Seed User*',
      dataState: 'success',
      freshIslandElement: 'ul[data-state="success"]',
    }),
    {
      islandHydrated: true,
      freshIslandElement: 'ul[data-state="success"]',
    },
  );
});

Deno.test('hydration receipt rejects a click that does not perform the Rename transition', () => {
  assertRejects(
    async () => {
      receiptFromIslandInteraction({
        initialRow: 'Seed User',
        rowAfterRename: 'Seed User',
        dataState: 'success',
        freshIslandElement: 'ul[data-state="success"]',
      });
    },
    Error,
    'Rename click did not change',
  );
});

Deno.test('hydration probe fails closed and persists negative evidence when Chromium is unavailable', async () => {
  const persisted: unknown[] = [];
  await assertRejects(
    () =>
      probeIslandHydration('/workspace/project', 'inventory-web', '/workspace/apphost.mts', {
        resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
        interact: () => Promise.reject(new Error('No supported headless Chrome/Chromium executable')),
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
