import { assert, assertEquals, assertNotStrictEquals, assertStrictEquals } from '@std/assert';
import { join } from '@std/path';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';

Deno.test('filesystem corpus re-indexes only when a source changes, not per request', async () => {
  const root = await Deno.makeTempDir();
  try {
    const path = join(root, 'guide.md');
    await Deno.writeTextFile(path, '# Guide\n\n## Cron schedule\n\nAdd a cron schedule.');
    await Deno.utime(path, new Date(1_000_000), new Date(1_000_000));
    const corpus = new FilesystemDocsCorpus({ root });

    const first = await corpus.get('guide');
    assert(first);
    // Unchanged sources reuse the parsed documents (and the guidance index built with them).
    assertStrictEquals(await corpus.get('guide'), first);
    assertEquals((await corpus.findGuidance('cron schedule')).recommendations[0]?.slug, 'guide');

    await Deno.writeTextFile(path, '# Guide\n\n## Queue retries\n\nConfigure queue retries.');
    await Deno.utime(path, new Date(2_000_000), new Date(2_000_000));
    const changed = await corpus.get('guide');
    assertNotStrictEquals(changed, first);
    assertEquals(
      (await corpus.findGuidance('queue retries')).recommendations[0]?.section,
      'queue-retries',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
