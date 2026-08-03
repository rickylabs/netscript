import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { checkFreshRootImports } from './check-accuracy-and-discoverability.ts';

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
