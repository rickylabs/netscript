import { assert, assertEquals, assertGreater } from '@std/assert';
import { createDocsFlows } from '../src/application/flows/docs-flows.ts';
import { createMcpServer } from '../src/application/runner/mcp-server.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';
import { createMcpCliServer, resolveDocsRoot } from '../cli.ts';

const fixtureRoot = new URL('./fixtures/docs/', import.meta.url).pathname;

Deno.test('fixture corpus excludes private paths and bounds list results', async () => {
  const corpus = new FilesystemDocsCorpus({ root: fixtureRoot });
  const all = await corpus.list();
  assertEquals(all.map((doc) => doc.slug), [
    'getting-started',
    'guides/retries',
    'reference/jobs',
  ]);
  assertEquals(await corpus.get('../ROADMAP'), undefined);
  const result = await createDocsFlows(corpus).list_docs({ limit: 2 });
  assert(result.ok);
  assertEquals(result.value, {
    count: 2,
    docs: [
      {
        slug: 'getting-started',
        title: 'Getting Started',
        description: 'Build your first NetScript service in a few focused steps.',
      },
      {
        slug: 'guides/retries',
        title: 'Reliability Guide',
        description: 'Apply practical reliability patterns.',
      },
    ],
  });
});

Deno.test('search ranks title and heading matches above body matches', async () => {
  const matches = await new FilesystemDocsCorpus({ root: fixtureRoot }).search('retry policy');
  assertEquals(matches.map((match) => match.slug), ['reference/jobs', 'guides/retries']);
  assertGreater(matches[0]!.score, matches[1]!.score);
  assert(matches[0]!.snippet.includes('retry'));
});

Deno.test('search to get funnel retrieves a slugified section only', async () => {
  const flows = createDocsFlows(new FilesystemDocsCorpus({ root: fixtureRoot }));
  const search = await flows.search_docs({ query: 'retry policy', limit: 1 });
  assert(search.ok);
  const slug = (search.value as { matches: Array<{ slug: string }> }).matches[0]!.slug;
  const get = await flows.get_doc({ slug, section: 'Retry policy' });
  assert(get.ok);
  assertEquals(get.value, {
    slug: 'reference/jobs',
    title: 'Background Jobs Reference',
    section: 'Retry policy',
    content:
      'Set the retry count and backoff for transient failures.\n\n### Backoff\n\nBackoff spaces repeated attempts.',
  });
});

Deno.test('corpus bounds indexed content and runner applies its tighter response policy', async () => {
  const corpus = new FilesystemDocsCorpus({ root: fixtureRoot, maxDocumentLength: 80 });
  const document = await corpus.get('getting-started');
  assertEquals(document?.content.length, 80);
  const server = createMcpServer({
    probe: { probe: () => Promise.resolve({ reachable: true, message: 'ready' }) },
    flows: createDocsFlows(corpus),
    truncation: { maxItems: 10, maxStringLength: 24 },
  });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_doc', arguments: { slug: 'getting-started' } },
  });
  const structured = response?.result?.structuredContent as { content: string };
  assert(structured.content.endsWith('…[truncated]'));
});

Deno.test('docs root precedence is flag then environment then embedded default', () => {
  assertEquals(
    resolveDocsRoot(['--docs-root', 'public'], 'environment', '/project'),
    '/project/public',
  );
  assertEquals(resolveDocsRoot([], 'environment', '/project'), '/project/environment');
  assertEquals(resolveDocsRoot([], undefined, '/project'), undefined);
});

Deno.test('CLI composition defaults list, search, and get to package-shipped docs', async () => {
  const server = createMcpCliServer({ projectRoot: fixtureRoot });
  const list = await server.handle({
    jsonrpc: '2.0',
    id: 10,
    method: 'tools/call',
    params: { name: 'list_docs', arguments: {} },
  });
  const listed = list?.result?.structuredContent as {
    count: number;
    docs: readonly { slug: string }[];
  };
  assertGreater(listed.count, 0);
  assertEquals(listed.docs[0]?.slug, 'mcp');

  const search = await server.handle({
    jsonrpc: '2.0',
    id: 11,
    method: 'tools/call',
    params: { name: 'search_docs', arguments: { query: 'telemetry' } },
  });
  assertGreater((search?.result?.structuredContent as { count: number }).count, 0);

  const get = await server.handle({
    jsonrpc: '2.0',
    id: 12,
    method: 'tools/call',
    params: { name: 'get_doc', arguments: { slug: 'mcp' } },
  });
  assertEquals((get?.result?.structuredContent as { slug: string }).slug, 'mcp');
});

Deno.test('missing explicit docs root returns path and --docs-root remediation', async () => {
  const missingRoot = new URL('./fixtures/docs-not-present', import.meta.url).pathname;
  const server = createMcpCliServer({ projectRoot: fixtureRoot, docsRoot: missingRoot });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 13,
    method: 'tools/call',
    params: { name: 'list_docs', arguments: {} },
  });
  assertEquals(response?.result?.isError, true);
  const error = response?.result?.structuredContent as { code: string; message: string };
  assertEquals(error.code, 'docs_corpus_not_found');
  assert(error.message.includes(missingRoot));
  assert(error.message.includes('pass --docs-root'));
});

Deno.test('empty explicit docs root is an explicit corpus error, never bare zeros', async () => {
  const emptyRoot = new URL('./fixtures/docs-empty', import.meta.url).pathname;
  const server = createMcpCliServer({ projectRoot: fixtureRoot, docsRoot: emptyRoot });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 14,
    method: 'tools/call',
    params: { name: 'search_docs', arguments: { query: 'workers' } },
  });
  assertEquals(response?.result?.isError, true);
  assertEquals(
    (response?.result?.structuredContent as { code: string }).code,
    'docs_corpus_not_found',
  );
});

const realDocsRoot = new URL('../../../docs/site/', import.meta.url).pathname;
const realDocsPresent = await Deno.stat(realDocsRoot).then(() => true).catch((error) => {
  if (error instanceof Deno.errors.NotFound) return false;
  throw error;
});

Deno.test({
  name: 'real public docs corpus lists documents when present',
  ignore: !realDocsPresent,
  async fn() {
    const docs = await new FilesystemDocsCorpus({ root: realDocsRoot }).list();
    assert(docs.length > 0);
    assert(!docs.some((doc) => doc.slug.includes('doctrine') || doc.slug === 'ROADMAP'));
  },
});
