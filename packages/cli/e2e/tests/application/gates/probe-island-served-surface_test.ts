import { assertEquals, assertFalse, assertRejects } from '@std/assert';

import {
  collectIslandServedSurface,
  probeIslandServedSurface,
} from '../../../src/application/gates/scaffold/runtime/probe-island-served-surface.ts';

const PAGE = `<!doctype html>
<html><head>
  <link rel="modulepreload" href="/@id/fresh:client-entry">
</head><body>
  <!--frsh:island:PeopleIsland:1:--><div>People</div><!--/frsh:island-->
  <script type="module">
    import { boot } from "/@id/fresh:client-entry";
    import PeopleIsland from "/@id/fresh-island::PeopleIsland";
    boot({ PeopleIsland });
  </script>
</body></html>`;

Deno.test('served-surface receipt proves marker and every referenced Fresh module', async () => {
  const requested: string[] = [];
  const receipt = await collectIslandServedSurface('http://localhost:41234/people', {
    fetch: (input) => {
      const url = String(input);
      requested.push(url);
      if (url.endsWith('/people')) {
        return Promise.resolve(
          new Response(PAGE, {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          }),
        );
      }
      const body = url.includes('PeopleIsland')
        ? 'export default function PeopleIsland() {}'
        : 'export function boot() {}';
      return Promise.resolve(
        new Response(body, {
          status: 200,
          headers: { 'content-type': 'application/javascript; charset=utf-8' },
        }),
      );
    },
  });

  assertEquals(receipt.markers, ['frsh:island:PeopleIsland:1:']);
  assertEquals(receipt.scripts.length, 2);
  assertEquals(receipt.scripts.every((script) => script.status === 200), true);
  assertEquals(receipt.scripts.every((script) => script.contentType?.includes('javascript')), true);
  assertEquals(receipt.bundleHit, true);
  assertEquals(requested, [
    'http://localhost:41234/people',
    'http://localhost:41234/@id/fresh:client-entry',
    'http://localhost:41234/@id/fresh-island::PeopleIsland',
  ]);
  assertFalse(requested.some((url) => url.includes('ServiceShowcaseLab')));
});

Deno.test('served-surface probe persists its receipt before rejecting a missing island export', async () => {
  const persisted: unknown[] = [];
  await assertRejects(
    () =>
      probeIslandServedSurface('/workspace/project', 'inventory-web', '/workspace/apphost.mts', {
        resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
        fetch: (input) => {
          const url = String(input);
          return Promise.resolve(
            url.endsWith('/people')
              ? new Response(PAGE, { status: 200, headers: { 'content-type': 'text/html' } })
              : new Response('export const unrelated = true;', {
                status: 200,
                headers: { 'content-type': 'text/javascript' },
              }),
          );
        },
        persist: (receipt) => {
          persisted.push(receipt);
          return Promise.resolve();
        },
      }),
    Error,
    'did not contain PeopleIsland',
  );
  assertEquals(persisted.length, 1);
});
