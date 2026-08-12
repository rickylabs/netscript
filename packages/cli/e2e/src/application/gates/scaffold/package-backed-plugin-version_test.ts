import { assertEquals, assertRejects } from '@std/assert';
import {
  findUnpublishedFixturePackages,
  PACKAGE_BACKED_DOCTOR_UNPUBLISHED_EXIT_CODE,
  PACKAGE_BACKED_DOCTOR_UNPUBLISHED_MESSAGE,
} from './package-backed-plugin-version.ts';

Deno.test('reports every package missing at the exact pinned version', async () => {
  const requested: string[] = [];
  const fetcher: typeof fetch = (input) => {
    const url = String(input);
    requested.push(url);
    const published = url.includes('/@netscript/config/');
    return Promise.resolve(new Response(null, { status: published ? 200 : 404 }));
  };

  assertEquals(await findUnpublishedFixturePackages('0.0.1597-unpublished', fetcher), [
    '@netscript/plugin-workers',
    '@netscript/plugin-streams',
  ]);
  assertEquals(requested, [
    'https://jsr.io/@netscript/config/0.0.1597-unpublished_meta.json',
    'https://jsr.io/@netscript/plugin-workers/0.0.1597-unpublished_meta.json',
    'https://jsr.io/@netscript/plugin-streams/0.0.1597-unpublished_meta.json',
  ]);
  assertEquals(PACKAGE_BACKED_DOCTOR_UNPUBLISHED_EXIT_CODE, 78);
  assertEquals(
    PACKAGE_BACKED_DOCTOR_UNPUBLISHED_MESSAGE,
    'Package-backed plugin doctor excluded: the pinned NetScript version is not published on JSR.',
  );
});

Deno.test('does not degrade registry failures other than an unpublished 404', async () => {
  await assertRejects(
    () =>
      findUnpublishedFixturePackages(
        '0.0.5',
        () => Promise.resolve(new Response(null, { status: 503 })),
      ),
    Error,
    'JSR availability check failed for @netscript/config@0.0.5: HTTP 503.',
  );
});
