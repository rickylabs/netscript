import { assertSiteSourceFormat, collectSiteSourceDiagnostics } from './check-source-format.ts';

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
