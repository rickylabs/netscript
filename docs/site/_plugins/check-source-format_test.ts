import { assertSiteSourceFormat, collectSiteSourceDiagnostics } from './check-source-format.ts';
import { assertNoLiteralVentoPlaceholders } from './check-rendered-placeholders.ts';

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

async function assertRejects(operation: () => Promise<unknown>, message: string): Promise<void> {
  try {
    await operation();
  } catch (error) {
    if (error instanceof Error && error.message.includes(message)) return;
    throw error;
  }
  throw new Error(`Expected operation to reject with: ${message}`);
}

async function withSite(files: Record<string, string>, test: (root: string) => Promise<void>) {
  const root = await Deno.makeTempDir();
  try {
    for (const [path, source] of Object.entries(files)) {
      const target = `${root}/${path}`;
      await Deno.mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
      await Deno.writeTextFile(target, source);
    }
    await test(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('rejects raw newlines inside quoted Vento component arguments', async () => {
  await withSite({
    'page.md':
      `---\ntemplateEngine: [vento, md]\n---\n{{ comp.card({ body: "line one\nline two" }) }}\n`,
  }, async (root) => {
    const diagnostics = await collectSiteSourceDiagnostics(root);
    assertEquals(diagnostics.map((entry) => entry.message), [
      'Vento expression contains a raw newline inside a quoted string',
    ]);
    await assertRejects(() => assertSiteSourceFormat(root), 'Invalid docs source formatting');
  });
});

Deno.test('rejects Markdown headings in Vento pages without Markdown rendering', async () => {
  await withSite({
    'index.vto': `---\nlayout: layouts/base.vto\n---\n## Literal heading\n`,
  }, async (root) => {
    const diagnostics = await collectSiteSourceDiagnostics(root);
    assertEquals(diagnostics.map((entry) => entry.message), [
      'Vento page authors Markdown headings without enabling the Markdown template engine',
    ]);
  });
});

Deno.test('accepts multiline component objects whose individual strings stay valid', async () => {
  await withSite({
    'index.vto':
      `---\ntemplateEngine: [vento, md]\n---\n## Rendered heading\n{{ comp.card({\n  title: "Title",\n  body: "One physical line",\n}) }}\n`,
  }, async (root) => assertEquals(await collectSiteSourceDiagnostics(root), []));
});

Deno.test('rejects literal Vento placeholders in any rendered page', async () => {
  await withSite({
    'index.html': '<main>clean</main>',
    'reference/broken/index.html': '<code>{{ releaseSpecifier }}</code>',
  }, async (root) => {
    await assertRejects(
      () => assertNoLiteralVentoPlaceholders(root),
      'reference/broken/index.html: {{ releaseSpecifier }}',
    );
  });
});

Deno.test('allows only the bounded CLI string-template documentation tokens', async () => {
  await withSite({
    'reference/cli/index.html':
      '<code>{{var}}</code><code>{{var | pipe}}</code><code>{{var | pipe}}</code><code>{{var | pipe}}</code>',
  }, async (root) => {
    assertEquals(await assertNoLiteralVentoPlaceholders(root), {
      filesScanned: 1,
      allowancesUsed: 4,
    });
  });
});

Deno.test('rejects CLI documentation tokens beyond the bounded allowance', async () => {
  await withSite({
    'reference/cli/index.html':
      '<code>{{var | pipe}}</code><code>{{var | pipe}}</code><code>{{var | pipe}}</code><code>{{var | pipe}}</code>',
  }, async (root) => {
    await assertRejects(
      () => assertNoLiteralVentoPlaceholders(root),
      'reference/cli/index.html: {{var | pipe}}',
    );
  });
});
