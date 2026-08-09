import { assert, assertEquals, assertGreater } from '@std/assert';
import { join, resolve } from '@std/path';
import { createDocsFlows } from '../src/application/flows/docs-flows.ts';
import { createMcpServer } from '../src/application/runner/mcp-server.ts';
import {
  FilesystemDocsCorpus,
  processDocsSources,
} from '../src/infrastructure/filesystem-docs-corpus.ts';
import { EmbeddedDocsCorpus } from '../src/infrastructure/embedded-docs-corpus.ts';
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

Deno.test('docs root precedence is flag then environment then an indexable project probe', async () => {
  const projectRoot = await Deno.makeTempDir();
  const probedRoot = join(projectRoot, '.netscript', 'docs');
  await Deno.mkdir(join(probedRoot, 'guides'), { recursive: true });
  await Deno.writeTextFile(
    join(probedRoot, 'guides', 'start.md'),
    '# Start\n\nAn indexable project document.\n',
  );
  try {
    assertEquals(
      resolveDocsRoot(['--docs-root', 'public'], 'environment', projectRoot),
      join(projectRoot, 'public'),
    );
    assertEquals(
      resolveDocsRoot([], 'environment', projectRoot),
      join(projectRoot, 'environment'),
    );
    assertEquals(resolveDocsRoot([], undefined, projectRoot), probedRoot);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('list_docs reports filesystem corpus kind, root, and total document count', async () => {
  const server = createMcpCliServer({ projectRoot: fixtureRoot, docsRoot: fixtureRoot });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 9,
    method: 'tools/call',
    params: { name: 'list_docs', arguments: { limit: 1 } },
  });
  const listed = response?.result?.structuredContent as {
    count: number;
    corpus?: { kind: string; root: string | null; documentCount: number };
  };
  assertEquals(listed.count, 1);
  assertEquals(listed.corpus, {
    kind: 'filesystem',
    root: fixtureRoot,
    documentCount: 3,
  });
});

Deno.test('an empty project probe falls back to an observable embedded corpus', async () => {
  const projectRoot = await Deno.makeTempDir();
  const docsRoot = join(projectRoot, '.netscript', 'docs');
  await Deno.mkdir(docsRoot, { recursive: true });
  await Deno.writeTextFile(join(docsRoot, 'README.txt'), 'not Markdown');
  await Deno.writeTextFile(
    join(docsRoot, 'redirect.md'),
    '---\nlayout: layouts/redirect.vto\nredirectTo: /elsewhere/\n---\n',
  );
  try {
    const server = createMcpCliServer({ projectRoot });
    const response = await server.handle({
      jsonrpc: '2.0',
      id: 15,
      method: 'tools/call',
      params: { name: 'list_docs', arguments: {} },
    });
    const listed = response?.result?.structuredContent as {
      count: number;
      corpus?: { kind: string; root: string | null; documentCount: number };
    };
    assertGreater(listed.count, 0);
    assertEquals(listed.corpus, {
      kind: 'embedded',
      root: null,
      documentCount: listed.count,
    });
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('stdio composition preserves environment precedence over an indexable probe', async () => {
  const projectRoot = await Deno.makeTempDir();
  const environmentRoot = await Deno.makeTempDir();
  try {
    const projectDocs = join(projectRoot, '.netscript', 'docs');
    await Deno.mkdir(projectDocs, { recursive: true });
    await Deno.writeTextFile(join(projectDocs, 'probe.md'), '# Probe\n\nProject probe.\n');
    await Deno.writeTextFile(join(environmentRoot, 'environment.md'), '# Environment\n\nOverride.\n');
    const child = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '-A',
        '--config',
        new URL('../../../deno.json', import.meta.url).pathname,
        new URL('../cli.ts', import.meta.url).pathname,
      ],
      cwd: projectRoot,
      env: { NETSCRIPT_DOCS_ROOT: environmentRoot },
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(`${JSON.stringify({
      jsonrpc: '2.0',
      id: 16,
      method: 'tools/call',
      params: { name: 'list_docs', arguments: {} },
    })}\n`));
    await writer.close();
    const output = await child.output();
    assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
    const response = JSON.parse(new TextDecoder().decode(output.stdout)) as {
      readonly result: {
        readonly structuredContent: {
          readonly corpus: {
            readonly kind: string;
            readonly root: string | null;
            readonly documentCount: number;
          };
        };
      };
    };
    assertEquals(response.result.structuredContent.corpus, {
      kind: 'filesystem',
      root: resolve(environmentRoot),
      documentCount: 1,
    });
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
    await Deno.remove(environmentRoot, { recursive: true });
  }
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

Deno.test('CLI composition makes installed help symptoms reachable through MCP docs', async () => {
  const server = createMcpCliServer({
    projectRoot: fixtureRoot,
    embeddedDocs: [{
      slug: 'help',
      source: '# Help\n\n## Healthy is not proof\n\nA hang can leave a dangling AppHost.',
    }],
  });
  for (const query of ['Healthy is not proof', 'hang', 'dangling AppHost']) {
    const response = await server.handle({
      jsonrpc: '2.0',
      id: query,
      method: 'tools/call',
      params: { name: 'search_docs', arguments: { query } },
    });
    const matches =
      (response?.result?.structuredContent as { matches: Array<{ slug: string }> }).matches;
    assert(matches.some((match) => match.slug === 'help'));
  }
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

Deno.test('unexpected corpus failures remain bounded structured tool errors', async () => {
  const flows = createDocsFlows({
    list: () => Promise.reject(new Error('adapter secret detail')),
    search: () => Promise.reject(new Error('adapter secret detail')),
    get: () => Promise.reject(new Error('adapter secret detail')),
  });

  for (
    const result of [
      await flows.list_docs({}),
      await flows.search_docs({ query: 'workers' }),
      await flows.get_doc({ slug: 'workers' }),
    ]
  ) {
    assertEquals(result, {
      ok: false,
      error: {
        code: 'docs_corpus_error',
        message: 'The documentation corpus could not complete the request.',
      },
    });
  }
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

Deno.test('search_docs does not throw on title-only, heading-only, body-only, or natural language queries', async () => {
  const corpus = new EmbeddedDocsCorpus({
    documents: [
      {
        slug: 'title-only-match',
        source: '---\ntitle: Turso database integration\n---\n\nBody contains no matched keywords.',
      },
      {
        slug: 'heading-only-match',
        source:
          '# How do I build a page that validates and submits a form?\n\nBody content goes here.',
      },
      {
        slug: 'empty-body-doc',
        source: '---\ntitle: empty body test\n---\n',
      },
      {
        slug: 'body-only-match',
        source:
          '# General Info\n\nAvoid hitting service every page render and keep server data fresh without polling.',
      },
    ],
  });

  const querySweep = [
    'form',
    'retry policy',
    'telemetry',
    'How do I build a page that validates and submits a form?',
    'avoid hitting service every page render',
    'Turso database',
    'keep server data fresh without polling',
  ];

  for (const query of querySweep) {
    const results = await corpus.search(query);
    assert(Array.isArray(results), `search failed for query: ${query}`);
    for (const match of results) {
      assert(typeof match.snippet === 'string');
    }
  }
});

Deno.test('docs corpus canonicalizes redirect pages and oldUrl aliases', async () => {
  const corpus = new EmbeddedDocsCorpus({
    documents: [
      {
        slug: 'capabilities/ai',
        source: '---\nlayout: layouts/redirect.vto\nredirectTo: /ai/\n---\n',
      },
      {
        slug: 'ai/agent-tooling',
        source:
          '---\ntitle: Agent Tooling\noldUrl: /capabilities/agent-tooling/\n---\n\nAgent tooling body content.',
      },
      {
        slug: 'ai',
        source: '---\ntitle: AI Engine\n---\n\nAI Engine body content.',
      },
    ],
  });

  const list = await corpus.list();
  assertEquals(list.map((d: { slug: string }) => d.slug).sort(), ['ai', 'ai/agent-tooling']);

  const search = await corpus.search('AI Engine');
  assertEquals(search.map((m: { slug: string }) => m.slug), ['ai']);

  const redirectGet = await corpus.get('capabilities/ai');
  assert(redirectGet !== undefined);
  assertEquals(redirectGet.slug, 'ai');
  assertEquals(redirectGet.redirectedFrom, 'capabilities/ai');

  const oldUrlGet = await corpus.get('capabilities/agent-tooling');
  assert(oldUrlGet !== undefined);
  assertEquals(oldUrlGet.slug, 'ai/agent-tooling');
  assertEquals(oldUrlGet.redirectedFrom, 'capabilities/agent-tooling');

  const canonicalGet = await corpus.get('ai/agent-tooling');
  assert(canonicalGet !== undefined);
  assertEquals(canonicalGet.slug, 'ai/agent-tooling');
  assertEquals(canonicalGet.redirectedFrom, undefined);
});

Deno.test('docs corpus fails deterministically on duplicate aliases and alias cycles', () => {
  let threw = false;
  try {
    processDocsSources([
      { slug: 'page1', source: '---\noldUrl: /dup-alias/\n---\nPage 1' },
      { slug: 'page2', source: '---\noldUrl: /dup-alias/\n---\nPage 2' },
    ]);
  } catch (err) {
    threw = true;
    assert((err as Error).message.includes('Duplicate docs alias'));
  }
  assert(threw, 'expected duplicate alias to throw');

  threw = false;
  try {
    processDocsSources([
      { slug: 'a', source: '---\nlayout: layouts/redirect.vto\nredirectTo: /b/\n---\n' },
      { slug: 'b', source: '---\nlayout: layouts/redirect.vto\nredirectTo: /a/\n---\n' },
    ]);
  } catch (err) {
    threw = true;
    assert((err as Error).message.includes('Docs alias cycle detected'));
  }
  assert(threw, 'expected alias cycle to throw');
});

Deno.test({
  name: 'real public docs corpus processes redirects and resolves oldUrl aliases',
  ignore: !realDocsPresent,
  async fn() {
    const corpus = new FilesystemDocsCorpus({ root: realDocsRoot });
    const list = await corpus.list();
    assert(!list.some((doc) => doc.slug === 'capabilities/ai' || doc.slug === 'capabilities'));

    const doc = await corpus.get('capabilities/agent-tooling');
    assert(doc !== undefined);
    assertEquals(doc.slug, 'ai/agent-tooling');
    assertEquals(doc.redirectedFrom, 'capabilities/agent-tooling');

    const querySweep = [
      'form',
      'retry policy',
      'telemetry',
      'How do I build a page that validates and submits a form?',
      'avoid hitting service every page render',
      'Turso database',
      'keep server data fresh without polling',
    ];
    for (const query of querySweep) {
      const results = await corpus.search(query);
      assert(Array.isArray(results));
    }
  },
});
