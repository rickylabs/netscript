import { benchmarkDocs } from '../benchmarks/doc-retrieval.ts';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { createDocsFlows } from '../src/application/docs/docs-flows.ts';
import { createMcpServer } from '../src/application/runner/mcp-server.ts';
import type { DocRetrievalResult } from '../src/domain/docs/doc-retrieval-contract.ts';
import { DOC_CONTENT_BUDGET } from '../src/domain/docs/doc-retrieval-contract.ts';
import { docContentBytes } from '../src/domain/docs/faithful-extraction.ts';
import { EmbeddedDocsCorpus } from '../src/infrastructure/embedded-docs-corpus.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';

function server(source: string) {
  return createMcpServer({
    probe: { probe: () => Promise.resolve({ reachable: true, message: 'ready' }) },
    flows: createDocsFlows(new EmbeddedDocsCorpus({ documents: [{ slug: 'sample', source }] })),
    truncation: { maxItems: 1, maxStringLength: 24 },
  });
}

async function retrieve(instance: ReturnType<typeof server>, args: Record<string, unknown>) {
  const response = await instance.handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_doc', arguments: { slug: 'sample', ...args } },
  });
  assert(!response?.error, JSON.stringify(response?.error));
  assertEquals(response?.result?.isError, false);
  assert(new TextEncoder().encode(JSON.stringify(response)).length <= 64 * 1024);
  return response?.result?.structuredContent as DocRetrievalResult;
}

Deno.test('acceptance 1: under-budget get_doc is verbatim through transport', async () => {
  const source = '# Sample\r\n\r\n' + 'Complete words and exact whitespace.  \r\n'.repeat(80);
  const result = await retrieve(server(source), {});
  assertEquals(result.mode, 'verbatim');
  assertEquals(result.contractVersion, 2);
  assertEquals(result.content, source);
});

Deno.test('acceptance 2: extraction retains complete late fences commands keys and links', async () => {
  const fence =
    '````ts\r\nconst text = "```";\r\n# not a section\r\nconsole.log(text);\r\n````\r\n';
  const command = 'deno task serve --port 8080\r\n';
  const keys = 'apiEndpoint: "https://example.test/api"\r\n';
  const link = '[Deep docs](https://example.test/docs?q=complete#fragment)\r\n';
  const source = '# Sample\r\n\r\nA complete introduction. More prose.\r\n\r\n' +
    'Surrounding prose stays readable. Another sentence.\r\n\r\n'.repeat(350) +
    '\r\n## Configure\r\n\r\n' + [fence, command, keys, link].join('\r\n');
  const result = await retrieve(server(source), {});
  assertEquals(result.mode, 'extract');
  for (const text of [fence, command, keys, link]) assert(result.content.includes(text), text);
  assert(result.outline?.some((entry) => entry.slug === 'configure' && entry.characters > 0));
  assert(!result.outline?.some((entry) => entry.slug === 'not-a-section'));
  assert(result.omitted!.characters > 0);
  assert(docContentBytes(result.content) <= DOC_CONTENT_BUDGET);
  assert(!result.content.includes('…[truncated]'));
  assertEquals((await retrieve(server(source), {})).content, result.content);
});

Deno.test('extraction omits oversized fences atomically and reports omissions with full recovery', async () => {
  const source = '# Sample\n\n```txt\n' + 'indivisible '.repeat(2000) +
    '\n```\n\n~~~sh\necho intact\n~~~\n';
  const instance = server(source);
  const result = await retrieve(instance, {});
  assertEquals(result.mode, 'extract');
  assert(!result.content.includes('```'));
  assert(result.content.includes('~~~sh\necho intact\n~~~'));
  assert(result.omitted!.blocks >= 1);
  let reconstructed = '';
  let cursor: string | undefined;
  do {
    const page = await retrieve(instance, { full: true, ...(cursor ? { cursor } : {}) });
    reconstructed += page.content;
    cursor = page.nextCursor;
  } while (cursor);
  assertEquals(reconstructed, source);
});

Deno.test('acceptance 3: full pages reconstruct Unicode escaped source beyond former index limit', async () => {
  const source = '# Sample\r\n\r\n' + '😀漢字\\"\u0001\r\n'.repeat(14000) +
    '\r\n## Tail\r\n\r\nTail text.\r\n';
  const instance = server(source);
  let reconstructed = '';
  let cursor: string | undefined;
  let pages = 0;
  do {
    const page = await retrieve(instance, { full: true, ...(cursor ? { cursor } : {}) });
    assertEquals(page.mode, 'full');
    assert(page.content.length > 0);
    if (cursor) assert(cursor !== page.nextCursor);
    reconstructed += page.content;
    cursor = page.nextCursor;
    pages++;
    assert(pages < 100);
  } while (cursor);
  assert(pages > 1);
  assertEquals(new TextEncoder().encode(reconstructed), new TextEncoder().encode(source));
  const section = await retrieve(instance, { section: 'Tail', full: true });
  assertEquals(section.content, 'Tail text.');
});

Deno.test('full cursors reject changed documents mismatched sections and malformed input', async () => {
  const source = '# Sample\n\n' + 'page '.repeat(6000) + '\n\n## End\nend';
  const first = await retrieve(server(source), { full: true });
  assert(first.nextCursor);
  for (
    const [instance, args] of [
      [server(source + '\nchanged'), { full: true, cursor: first.nextCursor }],
      [server(source), { full: true, section: 'End', cursor: first.nextCursor }],
      [server(source), { full: true, cursor: 'v2:bad:20' }],
      [server(source), { cursor: first.nextCursor }],
    ] as const
  ) {
    const response = await instance.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'get_doc', arguments: { slug: 'sample', ...args } },
    });
    assertEquals(response?.result?.isError, true);
  }
  assertEquals(await retrieve(server(source), { full: true }), first);
});

Deno.test('acceptance 4: every retrieval size section and full response exposes a fidelity mode', async () => {
  for (const source of ['# Sample\nshort', '# Sample\n\n' + 'A sentence. More.\n\n'.repeat(2000)]) {
    const instance = server(source);
    for (const args of [{}, { section: 'Sample' }, { full: true }]) {
      const result = await retrieve(instance, args);
      assert(['verbatim', 'extract', 'full'].includes(result.mode));
      assertEquals(result.contractVersion, 2);
    }
  }
});

Deno.test('filesystem full retrieval preserves front-matter body CRLF and addresses the tail', async () => {
  const root = await Deno.makeTempDir();
  const body = '\r\n# Sample\r\n\r\n' + 'Long prose.\r\n'.repeat(10000) +
    '## Tail\r\n\r\nexact tail\r\n';
  try {
    await Deno.writeTextFile(`${root}/sample.md`, '---\r\ntitle: Source\r\n---\r\n' + body);
    const corpus = new FilesystemDocsCorpus({ root });
    assert(
      (await corpus.get('sample'))?.content === body,
      'Filesystem retrieval must preserve every body byte.',
    );
    const section = await createDocsFlows(corpus).get_doc({
      slug: 'sample',
      section: 'Tail',
      full: true,
    });
    assert(section.ok);
    assertEquals((section.value as DocRetrievalResult).content, 'exact tail');
    await assertRejects(() =>
      new FilesystemDocsCorpus({ root, maxDocumentLength: 100 }).get('sample')
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('acceptance 5: offline benchmark measures fidelity fallback and baseline over fixtures', async () => {
  const report = await benchmarkDocs(
    new EmbeddedDocsCorpus({
      documents: [
        { slug: 'small', source: '# Small\nShort text.' },
        {
          slug: 'large',
          source: '# Large\n\n' +
            'Repeated prose. Additional lengthy explanation that can be omitted.\n\n'.repeat(700) +
            '```sh\ndeno task start\n```\n\n[Docs](https://example.test/full)\n',
        },
      ],
    }),
  );
  assertEquals(report.summary.documents, 2);
  assertEquals(report.summary.fullReconstruction, 'pass');
  assertEquals(report.summary.snippetRetention, 1);
  assertEquals(report.summary.linkRetention, 1);
  assert(report.summary.baselineSnippetRetention < report.summary.snippetRetention);
  assert(report.summary.baselineFallbackProxyRate > report.summary.fallbackProxyRate);
  assert(report.summary.returnedToVerbatimRatio < 1);
  assert(report.summary.latencyP95Ms >= 0);
});
