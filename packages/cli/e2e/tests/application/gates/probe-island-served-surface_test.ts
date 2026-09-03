import { assertEquals, assertRejects } from '@std/assert';

import {
  collectIslandServedSurface,
  probeIslandServedSurface,
} from '../../../src/application/gates/scaffold/runtime/probe-island-served-surface.ts';

const PAGE = `<!doctype html>
<html><head>
  <link rel="modulepreload" href="/@id/fresh:client-entry">
</head><body>
  <!--frsh:island:ServiceShowcaseLab:1:--><div>Seed User</div><!--/frsh:island-->
  <script type="module">
    import { boot } from "/@id/fresh:client-entry";
    import ServiceShowcaseLab from "/@id/fresh-island::ServiceShowcaseLab";
    boot({ ServiceShowcaseLab });
  </script>
</body></html>`;

Deno.test('served-surface receipt proves marker and every referenced Fresh module', async () => {
  const requested: string[] = [];
  const receipt = await collectIslandServedSurface('http://localhost:41234/examples/users', {
    fetch: (input) => {
      const url = String(input);
      requested.push(url);
      if (url.endsWith('/examples/users')) {
        return Promise.resolve(
          new Response(PAGE, {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          }),
        );
      }
      const body = url.includes('ServiceShowcaseLab')
        ? 'export default function ServiceShowcaseLab() {}'
        : 'export function boot() {}';
      return Promise.resolve(
        new Response(body, {
          status: 200,
          headers: { 'content-type': 'application/javascript; charset=utf-8' },
        }),
      );
    },
  });

  assertEquals(receipt.markers, ['frsh:island:ServiceShowcaseLab:1:']);
  assertEquals(receipt.scripts.length, 2);
  assertEquals(receipt.scripts.every((script) => script.status === 200), true);
  assertEquals(receipt.scripts.every((script) => script.contentType?.includes('javascript')), true);
  assertEquals(receipt.bundleHit, true);
  assertEquals(requested, [
    'http://localhost:41234/examples/users',
    'http://localhost:41234/@id/fresh:client-entry',
    'http://localhost:41234/@id/fresh-island::ServiceShowcaseLab',
  ]);
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
            url.endsWith('/examples/users')
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
    'did not contain ServiceShowcaseLab',
  );
  assertEquals(persisted.length, 1);
});
