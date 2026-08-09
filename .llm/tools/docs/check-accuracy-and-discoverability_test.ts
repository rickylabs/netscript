import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import {
  checkFreshRootImports,
  checkGoldenPathDocs,
} from './check-accuracy-and-discoverability.ts';

Deno.test('checkFreshRootImports allows valid root imports and fails on invalid root import with file, line, and symbol diagnostics', async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const docsDir = join(tempDir, 'docs');
    await Deno.mkdir(docsDir, { recursive: true });

    const validMd = `# Valid Doc
Some intro text.

\`\`\`ts
import { CacheEntryLike } from '@netscript/fresh';
\`\`\`
`;
    await Deno.writeTextFile(join(docsDir, 'valid.md'), validMd);

    const count = await checkFreshRootImports('docs', new URL(`file://${tempDir}/`));
    assertEquals(count, 1);

    const invalidMd = `# Invalid Doc
Line 2
Line 3
import { InvalidFreshSymbol } from '@netscript/fresh';
Line 5
`;
    await Deno.writeTextFile(join(docsDir, 'invalid.md'), invalidMd);

    const error = await assertRejects(
      () => checkFreshRootImports('docs', new URL(`file://${tempDir}/`)),
      Error,
    );

    assertEquals(
      error.message,
      "docs/invalid.md:4: symbol 'InvalidFreshSymbol' is imported from '@netscript/fresh' root, but it is not a valid root export. Use the appropriate subpath export instead.",
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('checkGoldenPathDocs rejects retired paths, aliases, and query dialect drift', async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const site = join(tempDir, 'docs/site');
    const reference = join(site, 'reference/sdk');
    await Deno.mkdir(reference, { recursive: true });
    await Deno.writeTextFile(
      join(reference, 'index.md'),
      'createServiceQueryUtils uses queryOptions({ input }); createQueryFactories uses queryOptions(input) and has no server KV tier.\n',
    );
    await Deno.writeTextFile(join(site, 'guide.md'), '# clean guide\n');

    assertEquals(
      await checkGoldenPathDocs('docs/site', new URL(`file://${tempDir}/`)),
      { pageCount: 2, queryUtilsPageCount: 1 },
    );

    for (
      const [content, expected] of [
        ['lib/api-clients.ts', 'lib/api-clients.ts'],
        ['@contracts', '@contracts'],
        ['@/lib/orders.ts', '@/lib/'],
      ] as const
    ) {
      await Deno.writeTextFile(join(site, 'guide.md'), content);
      await assertRejects(
        () => checkGoldenPathDocs('docs/site', new URL(`file://${tempDir}/`)),
        Error,
        expected,
      );
    }
    await Deno.writeTextFile(join(site, 'guide.md'), 'createServiceQueryUtils');
    await assertRejects(
      () => checkGoldenPathDocs('docs/site', new URL(`file://${tempDir}/`)),
      Error,
      'must appear only',
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
