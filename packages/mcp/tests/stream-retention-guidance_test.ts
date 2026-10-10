import { assert, assertEquals } from '@std/assert';
import { ReleaseEmbeddedDocsCorpus } from '../src/infrastructure/release-embedded-docs-corpus.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';

const docsRoot = new URL('../../../docs/site/', import.meta.url).pathname;
const recipe = 'durable-workflows/how-to/bound-stream-retention';
const reference = 'reference/plugin-streams-core';

Deno.test('retention guidance distinguishes idle TTL from absolute expiry across the public docs', async () => {
  const docs = new FilesystemDocsCorpus({ root: docsRoot });
  for (const slug of [recipe, reference, 'durable-workflows/streams']) {
    const document = await docs.get(slug);
    assert(document?.content.includes('sliding inactivity window'), slug);
    assert(document?.content.includes('Absolute expiry does not slide'), slug);
    assert(!document?.content.includes('appends do not renew'), slug);
  }
  const readme = await Deno.readTextFile(
    new URL('../../plugin-streams-core/README.md', import.meta.url),
  );
  assert(readme.includes('sliding inactivity window'));
  const guidance = await docs.findGuidance('stream retention');
  assertEquals(guidance.confidence, 'high');
  assert(guidance.recommendations.some((entry) => entry.excerpt.includes('hard bound')));
});

Deno.test('stream retention guidance finds the bounded-stream recipe and typed reference', async () => {
  const docs = new FilesystemDocsCorpus({ root: docsRoot });
  const guidance = await docs.findGuidance('stream retention');
  assertEquals(guidance.confidence, 'high');
  assert(guidance.recommendations.some((entry) => entry.slug === recipe));
  assert(guidance.recommendations.some((entry) =>
    entry.slug === reference &&
    entry.section === 'bounded-streams-retention-and-trim'
  ));
  assert(
    guidance.recommendations.flatMap((entry) => entry.code).some((entry) =>
      entry.code.includes("retention: { kind: 'expires-at'")
    ),
  );
});

Deno.test('stream retention docs expose background deletion and typed failure handling', async () => {
  const docs = new FilesystemDocsCorpus({ root: docsRoot });
  const matches = await docs.search('stream retention');
  assert(matches.some((entry) => entry.slug === reference || entry.slug === recipe));
  const document = await docs.get(recipe);
  const section = document?.sectionContents.find((entry) =>
    entry.slug === 'errors-cancellation-and-instrumentation'
  );
  assert(section?.content.includes('StreamAdminError'));
  assert(section?.content.includes('unauthorized'));
  assert(section?.content.includes('timeout'));
  const worker = document?.sectionContents.find((entry) =>
    entry.slug === 'delete-known-segments-in-a-background-worker'
  );
  assert(worker?.content.includes('defineJobHandler'));
  assert(worker?.content.includes('defineScheduledTrigger'));
  assert(worker?.content.includes('deleteDurableStream'));
});

Deno.test('standalone MCP ships stream retention guidance without a filesystem corpus', async () => {
  const docs = new ReleaseEmbeddedDocsCorpus();
  const guidance = await docs.findGuidance('stream retention');
  assertEquals(guidance.confidence, 'high');
  assert(guidance.recommendations.some((entry) => entry.slug === `pages/${recipe}`));
  const document = await docs.get(`pages/${recipe}`);
  assert(document?.content.includes('sliding inactivity window'));
  assert(document?.content.includes('absolute expiry'));
});
