import { assert, assertEquals } from '@std/assert';
import {
  docsSlugFromPath,
  FilesystemDocsCorpus,
  isIndexableDocsRoot,
  isPublicDocsSource,
} from '../src/infrastructure/filesystem-docs-corpus.ts';

Deno.test('filesystem source policy admits Markdown plus only root llms.txt', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/nested`, { recursive: true });
    await Deno.writeTextFile(`${root}/guide.md`, '# Guide\n\nPublic Markdown.');
    await Deno.writeTextFile(`${root}/llms.txt`, '# Task router\n\nRoute unfamiliar work.');
    await Deno.writeTextFile(`${root}/llms-full.txt`, '# Private full corpus\n\nMust not index.');
    await Deno.writeTextFile(`${root}/nested/config.txt`, '# Config\n\nMust not index.');
    await Deno.writeTextFile(`${root}/nested/notes.txt`, '# Notes\n\nMust not index.');

    assertEquals(isPublicDocsSource('guide.md'), true);
    assertEquals(isPublicDocsSource('nested/guide.md'), true);
    assertEquals(isPublicDocsSource('llms.txt'), true);
    assertEquals(isPublicDocsSource('llms-full.txt'), false);
    assertEquals(isPublicDocsSource('nested/llms.txt'), false);
    assertEquals(isPublicDocsSource('nested/config.txt'), false);
    assertEquals(docsSlugFromPath('llms.txt'), 'llms');
    assertEquals(docsSlugFromPath('nested/guide.md'), 'nested/guide');
    assertEquals(isIndexableDocsRoot(root), true);

    const corpus = new FilesystemDocsCorpus({ root });
    const summaries = await corpus.list();
    assertEquals(summaries.map(({ slug }) => slug), ['guide', 'llms']);
    assertEquals((await corpus.get('llms.txt'))?.slug, 'llms');
    assertEquals(await corpus.get('llms-full'), undefined);
    assertEquals((await corpus.search('private full corpus')).length, 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a root containing only llms.txt is synchronously indexable', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${root}/llms.txt`, '# Task router\n\nUse the public task router.');
    assert(isIndexableDocsRoot(root));
    assertEquals((await new FilesystemDocsCorpus({ root }).list())[0]?.slug, 'llms');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
