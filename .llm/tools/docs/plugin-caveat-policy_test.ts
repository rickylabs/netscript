import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { dirname, join, toFileUrl } from '@std/path';
import { checkGoldenPathDocs } from './check-accuracy-and-discoverability.ts';
import { checkResolvedPluginCaveats } from './plugin-caveat-policy.ts';
import historicalCaveats from './fixtures/resolved-plugin-caveats.json' with { type: 'json' };

Deno.test('plugin caveat policy allows canonical config, deprecation and the shipped migration', async () => {
  checkResolvedPluginCaveats('The worker reads WORKERS_CONCURRENCY.', 'workers.md');
  checkResolvedPluginCaveats(
    'WORKER_CONCURRENCY is a deprecated alias during 0.0.8.',
    'workers.md',
  );
  const page = await Deno.readTextFile('docs/site/durable-workflows/streams.md');
  checkResolvedPluginCaveats(page, 'docs/site/durable-workflows/streams.md');
  checkResolvedPluginCaveats(page, 'corpus:pages/durable-workflows/streams/index.md');
  assertThrows(
    () =>
      checkResolvedPluginCaveats(
        `${page}\n## New section\nStreamUnsupportedOperationError`,
        'docs/site/durable-workflows/streams.md',
      ),
    Error,
    '#1369',
  );
  assertThrows(() => checkResolvedPluginCaveats(page, 'other-page.md'), Error, '#1369');
});

Deno.test('retired streams marker fails independently of prose', () => {
  assertThrows(
    () =>
      checkResolvedPluginCaveats(
        '<!-- caveat: arch-debt:streams-manifest-helpers-unsupported -->',
        'other-page.md',
      ),
    Error,
    '#1369',
  );
});

// Exact removed prose from the two recorded parent revisions. Each passage must fail
// without its HTML caveat marker, both directly and through the production docs walker.
for (const fixture of historicalCaveats) {
  Deno.test(`docs accuracy rejects historical ${fixture.kind} caveats: ${fixture.path}`, async () => {
    const root = await Deno.makeTempDir();
    try {
      const site = join(root, 'docs/site');
      await Deno.mkdir(join(site, 'reference/sdk'), { recursive: true });
      await Deno.writeTextFile(join(site, 'reference/sdk/index.md'), 'createServiceQueryUtils');
      const page = join(root, fixture.path);
      await Deno.mkdir(dirname(page), { recursive: true });
      const rootUrl = toFileUrl(`${root}/`);
      await Deno.writeTextFile(page, 'WORKERS_CONCURRENCY controls background queue concurrency.');
      assertEquals((await checkGoldenPathDocs('docs/site', rootUrl)).pageCount, 2);
      for (const passage of fixture.passages) {
        assertThrows(() => checkResolvedPluginCaveats(passage, fixture.path), Error, '#1369');
        assertThrows(
          () => checkResolvedPluginCaveats(passage, `corpus:${fixture.path}`),
          Error,
          '#1369',
        );
        await Deno.writeTextFile(page, passage);
        await assertRejects(() => checkGoldenPathDocs('docs/site', rootUrl), Error, '#1369');
      }
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}
