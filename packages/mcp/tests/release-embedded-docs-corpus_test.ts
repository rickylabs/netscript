import { assert, assertEquals, assertThrows } from '@std/assert';
import { MCP_PACKAGE_VERSION } from '../src/publish-assets.generated.ts';
import {
  ReleaseEmbeddedDocsCorpus,
  type ReleaseEmbeddedDocsSource,
} from '../src/infrastructure/release-embedded-docs-corpus.ts';

Deno.test('generated release fallback contains the enumerated intent-guidance documents', async () => {
  const docs = await new ReleaseEmbeddedDocsCorpus().list();
  assertEquals(docs.map((document) => document.slug), [
    'llms',
    'mcp',
    'pages/data-persistence/how-to/use-a-second-database',
    'pages/durable-workflows/how-to/bound-stream-retention',
    'pages/explanation/contracts',
    'pages/explanation/plugin-system',
    'pages/orchestration-runtime/how-to/author-a-plugin',
    'pages/services-sdk/services',
    'pages/tutorials/live-dashboard/03-sdk-cache-first-query',
    'pages/tutorials/live-dashboard/04-definePage-QueryIsland',
    'pages/web-layer/builders',
    'pages/web-layer/generated-surface',
    'pages/web-layer/how-to/build-a-server-validated-form',
    'pages/web-layer/how-to/customize-fresh-ui',
    'pages/web-layer/how-to/design-with-fresh-ui',
    'pages/web-layer/query',
    'pages/web-layer/route',
  ]);
});

Deno.test('docs-site slugs resolve to their release pages', async () => {
  const corpus = new ReleaseEmbeddedDocsCorpus();
  const page = await corpus.get('web-layer/how-to/design-with-fresh-ui');
  assertEquals(page?.slug, 'pages/web-layer/how-to/design-with-fresh-ui');
  assertEquals(page?.redirectedFrom, 'web-layer/how-to/design-with-fresh-ui');

  const exact = await corpus.get('pages/web-layer/route');
  assertEquals(exact?.slug, 'pages/web-layer/route');
  assertEquals(exact?.redirectedFrom, undefined);
  assertEquals((await corpus.get('mcp'))?.slug, 'mcp');
  assertEquals(await corpus.get('web-layer/not-a-page'), undefined);
  assertEquals(await corpus.get('pages/not-a-page'), undefined);
});

Deno.test('outer CLI help augments rather than replaces the generated fallback', async () => {
  const docs = await new ReleaseEmbeddedDocsCorpus({
    additionalDocuments: [{ slug: 'help', source: '# Help\n\nRuntime symptoms.\n' }],
  }).list();
  assert(docs.some((document) => document.slug === 'help'));
  assert(docs.some((document) => document.slug === 'pages/services-sdk/services'));
});

Deno.test('embedded docs version mismatch fails synchronously at construction', () => {
  const source = fixtureSource('0.0.0-wrong');
  assertThrows(
    () => new ReleaseEmbeddedDocsCorpus({ source }),
    Error,
    `embedded docs version 0.0.0-wrong does not match ${MCP_PACKAGE_VERSION}`,
  );
});

Deno.test('embedded docs integrity mismatch fails closed before listing', async () => {
  const source = fixtureSource(MCP_PACKAGE_VERSION);
  let rejected = false;
  try {
    await new ReleaseEmbeddedDocsCorpus({ source }).list();
  } catch (error) {
    rejected = true;
    assert((error as Error).message.includes('hash does not match provenance'));
  }
  assert(rejected);
});

function fixtureSource(frameworkVersion: string): ReleaseEmbeddedDocsSource {
  const document = { path: 'pages/test/index.md', slug: 'pages/test', source: '# Test\n' };
  return {
    documents: [document],
    provenance: {
      schemaVersion: 1,
      frameworkVersion,
      sourceCommit: 'fixture',
      paths: [document.path],
      sourceBytes: new TextEncoder().encode(document.source).byteLength,
      documentCount: 1,
      sha256: '0'.repeat(64),
    },
  };
}
