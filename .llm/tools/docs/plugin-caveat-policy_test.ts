import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { join, toFileUrl } from '@std/path';
import { checkGoldenPathDocs } from './check-accuracy-and-discoverability.ts';
import { checkResolvedPluginCaveats } from './plugin-caveat-policy.ts';

const retiredCaveats = [
  'Aspire emits WORKER_CONCURRENCY, but the runtime honors WORKERS_CONCURRENCY. Set it manually.',
  'Metadata emits `WORKER_CONCURRENCY`; the runtime reads `WORKERS_CONCURRENCY` instead.',
  '<!-- caveat: arch-debt:streams-manifest-helpers-unsupported -->',
  'The manifest helpers fail loud, by design.',
];

Deno.test('plugin caveat policy rejects both retired defects in source and shipped docs', () => {
  for (const location of ['docs/site/durable-workflows/streams.md', 'corpus:streams.md']) {
    for (const text of retiredCaveats) {
      assertThrows(() => checkResolvedPluginCaveats(text, location), Error, '#1369');
    }
    checkResolvedPluginCaveats('The worker reads WORKERS_CONCURRENCY.', location);
    checkResolvedPluginCaveats('WORKER_CONCURRENCY is a deprecated alias during 0.0.8.', location);
    checkResolvedPluginCaveats(
      'Import createDurableStream from @netscript/plugin-streams-core.',
      location,
    );
  }
});

for (const [index, caveat] of retiredCaveats.entries()) {
  Deno.test(`docs accuracy rejects reintroduced plugin caveat ${index + 1}`, async () => {
    const root = await Deno.makeTempDir();
    const site = join(root, 'docs/site');
    try {
      await Deno.mkdir(join(site, 'reference/sdk'), { recursive: true });
      await Deno.writeTextFile(join(site, 'reference/sdk/index.md'), 'createServiceQueryUtils');
      const rootUrl = toFileUrl(`${root}/`);
      const page = join(site, 'streams.md');
      await Deno.writeTextFile(page, 'WORKERS_CONCURRENCY controls background queue concurrency.');
      assertEquals((await checkGoldenPathDocs('docs/site', rootUrl)).pageCount, 2);
      await Deno.writeTextFile(page, caveat);
      await assertRejects(() => checkGoldenPathDocs('docs/site', rootUrl), Error, '#1369');
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}
