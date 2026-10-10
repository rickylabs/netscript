import { assert, assertEquals } from '@std/assert';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';

const docsRoot = new URL('../../../docs/site/', import.meta.url).pathname;
const recipe = 'durable-workflows/how-to/bound-stream-retention';
const reference = 'reference/plugin-streams-core';

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
      entry.code.includes("retention: { kind: 'ttl'")
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
