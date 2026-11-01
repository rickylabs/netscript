import { assert, assertEquals } from '@std/assert';
import { decodeAgentDocsPages, EMBEDDED_AGENT_DOCS_PAGES } from '../docs.ts';
import { createDocsFlows } from '../src/application/docs/docs-flows.ts';
import { normalizeDocsSlug } from '../src/domain/docs/docs-corpus-port.ts';
import { ReleaseEmbeddedDocsCorpus } from '../src/infrastructure/release-embedded-docs-corpus.ts';
import { MCP_PACKAGE_VERSION } from '../src/publish-assets.generated.ts';

const corpus = new ReleaseEmbeddedDocsCorpus();
const flows = createDocsFlows(corpus);
const pages = await decodeAgentDocsPages(EMBEDDED_AGENT_DOCS_PAGES);

// Expected membership comes from the public CLI transport, independently of MCP's index.
Deno.test('every published page resolves through get_doc with deterministic slug variants', async () => {
  for (const path of Object.keys(pages)) {
    const slug = normalizeDocsSlug(path);
    const short = slug === 'pages' ? 'index' : slug.replace(/^pages\//, '');
    for (const lookup of [slug, `${slug}/index`, short, `${short}/index`, path]) {
      const result = await flows.get_doc({ slug: lookup });
      assert(result.ok, `${path}: ${lookup}: ${JSON.stringify(result)}`);
      const value = result.value as { slug: string; citation: typeof corpus.citation };
      assertEquals(value.slug, slug);
      assertEquals(value.citation, corpus.citation);
      assertEquals(value.citation.frameworkVersion, MCP_PACKAGE_VERSION);
      assertEquals(value.citation.sha256.length, 64);
    }
  }
});

const ISSUE_SLUGS = [
  'reference/kv',
  'observability/telemetry',
  'observability',
  'data-persistence/kv-queues-cron',
  'background-processing/workers',
  'durable-workflows/streams',
] as const;

Deno.test('issue 2269 missing slugs resolve with and without pages and index', async () => {
  for (const slug of ISSUE_SLUGS) {
    for (const lookup of [slug, `pages/${slug}`, `${slug}/index`, `pages/${slug}/index/`]) {
      const result = await flows.get_doc({ slug: lookup });
      assert(result.ok, `${lookup}: ${JSON.stringify(result)}`);
      assertEquals((result.value as { slug: string }).slug, `pages/${slug}`);
    }
  }
});

Deno.test('issue 2269 undocumented withReadinessCheck search has explicit cited no-seam fallback', async () => {
  const result = await flows.search_docs({ query: 'withReadinessCheck' });
  assert(result.ok);
  const value = result.value as {
    count: number;
    confidence: string;
    fallback: string;
    citation: typeof corpus.citation;
  };
  assertEquals(value.count, 0);
  assertEquals(value.confidence, 'low');
  assert(value.fallback.includes('No seam documented'));
  assert(value.fallback.includes('find_export'));
  assertEquals(value.citation, corpus.citation);
});

Deno.test('release search matches have the same citation and resolve through get_doc', async () => {
  for (const query of ['expireIn', 'watch', 'readiness', 'stream']) {
    const result = await flows.search_docs({ query, limit: 5 });
    assert(result.ok);
    const value = result.value as { matches: { slug: string }[]; citation: typeof corpus.citation };
    assert(value.matches.length > 0, query);
    assertEquals(value.citation, corpus.citation);
    for (const match of value.matches) assert((await flows.get_doc({ slug: match.slug })).ok);
  }
});

Deno.test('non-docs package imports do not decompress the full published corpus', async () => {
  const entrypoint = new URL('../cli.ts', import.meta.url).href;
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'eval',
      '--no-lock',
      `
      const Native = DecompressionStream;
      let decompressions = 0;
      globalThis.DecompressionStream = class extends Native {
        constructor(format) { super(format); decompressions++; }
      };
      await import(${JSON.stringify(entrypoint)});
      if (decompressions > 1) throw new Error('Non-docs import decoded ' + decompressions + ' sources');
    `,
    ],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assert(result.success, new TextDecoder().decode(result.stderr));
});

Deno.test('literal identifier fragments still find documented readiness APIs', async () => {
  const result = await flows.search_docs({ query: 'ReadinessHandler', limit: 20 });
  assert(result.ok);
  const value = result.value as { matches: { slug: string }[]; fallback?: string };
  assert(value.matches.some(({ slug }) => slug === 'pages/services-sdk/services'));
  assertEquals(value.fallback, undefined);
});
