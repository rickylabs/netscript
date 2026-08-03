import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';
import { checkInternalLinks } from './check-internal-links.ts';

Deno.test('checkInternalLinks validates same-page fragment, cross-page fragment, relative clean URL, and relative .md failure', async () => {
  const siteDir = await Deno.makeTempDir();
  try {
    const pageADir = join(siteDir, 'page-a');
    const pageBDir = join(siteDir, 'page-b');
    await Deno.mkdir(pageADir, { recursive: true });
    await Deno.mkdir(pageBDir, { recursive: true });

    const pageAHtml = `
<!DOCTYPE html>
<html>
<body>
  <h1 id="local-anchor">Page A</h1>
  <!-- 1. Same-page fragment (valid + invalid) -->
  <a href="#local-anchor">Valid Local</a>
  <a href="#missing-local">Invalid Local</a>

  <!-- 2. Cross-page fragment (valid + invalid) -->
  <a href="../page-b/#b-anchor">Valid Cross-Page</a>
  <a href="../page-b/#missing-b-anchor">Invalid Cross-Page</a>

  <!-- 3. Relative clean URL (valid) -->
  <a href="../page-b/">Valid Relative Clean URL</a>

  <!-- 4. Relative .md failure (invalid) -->
  <a href="./nonexistent.md">Invalid Relative MD</a>
</body>
</html>
`;

    const pageBHtml = `
<!DOCTYPE html>
<html>
<body>
  <h1 id="b-anchor">Page B</h1>
</body>
</html>
`;

    await Deno.writeTextFile(join(pageADir, 'index.html'), pageAHtml);
    await Deno.writeTextFile(join(pageBDir, 'index.html'), pageBHtml);

    const result = await checkInternalLinks(siteDir);

    const unresolvedForA = result.unresolved.get('/page-a/index.html');
    assert(unresolvedForA !== undefined, 'Page A should have unresolved links');

    // Asserts:
    // 1. Same-page fragment failure captured
    assert(unresolvedForA.has('#missing-local'), 'Missing local anchor should be flagged');
    assert(!unresolvedForA.has('#local-anchor'), 'Valid local anchor should pass');

    // 2. Cross-page fragment failure captured
    assert(
      unresolvedForA.has('../page-b/#missing-b-anchor'),
      'Missing cross-page anchor should be flagged',
    );
    assert(!unresolvedForA.has('../page-b/#b-anchor'), 'Valid cross-page anchor should pass');

    // 3. Relative clean URL passes
    assert(!unresolvedForA.has('../page-b/'), 'Valid relative clean URL should pass');

    // 4. Relative .md failure captured
    assert(unresolvedForA.has('./nonexistent.md'), 'Relative .md failure should be flagged');

    assertEquals(unresolvedForA.size, 3, 'Exactly 3 invalid links should be flagged on Page A');
  } finally {
    await Deno.remove(siteDir, { recursive: true });
  }
});
