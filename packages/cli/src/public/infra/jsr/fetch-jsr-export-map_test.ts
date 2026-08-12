import { assertEquals, assertRejects } from '@std/assert';

import { JsrExportMapHttpError } from '../../features/plugins/doctor/jsr-export-map-loader-port.ts';
import { fetchJsrExportMap } from './fetch-jsr-export-map.ts';

Deno.test('fetch JSR export map exposes the exact 404 response status', async () => {
  const requested: string[] = [];
  const error = await assertRejects(
    () =>
      fetchJsrExportMap(
        '@example/plugin-fixture',
        '0.0.6-unpublished',
        (input) => {
          requested.push(String(input));
          return Promise.resolve(new Response(null, { status: 404 }));
        },
      ),
    JsrExportMapHttpError,
  );

  assertEquals(error.status, 404);
  assertEquals(requested, [
    'https://jsr.io/@example/plugin-fixture/0.0.6-unpublished_meta.json',
  ]);
});

Deno.test('fetch JSR export map preserves a non-404 response status', async () => {
  const error = await assertRejects(
    () =>
      fetchJsrExportMap(
        '@example/plugin-fixture',
        '1.0.0',
        () => Promise.resolve(new Response(null, { status: 503 })),
      ),
    JsrExportMapHttpError,
  );

  assertEquals(error.status, 503);
});
