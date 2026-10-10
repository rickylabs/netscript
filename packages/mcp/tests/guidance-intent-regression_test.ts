import { assert, assertEquals } from '@std/assert';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';

// Regression for #2102: sentence-length intents were ranked on stop words, so the page that
// answers them fell out of the top results. These run against the public docs tree the issue
// measured; like the real-corpus listing test in docs_test.ts they skip only when it is absent.
const realDocsRoot = new URL('../../../docs/site/', import.meta.url).pathname;
const realDocsPresent = await Deno.stat(realDocsRoot).then(() => true).catch((error) => {
  if (error instanceof Deno.errors.NotFound) return false;
  throw error;
});

const WEBHOOK_PAGE = 'reference/plugin-triggers-core';
const LONG_INTENT =
  'how do I receive a GitHub webhook in my service and verify that the signature is valid before I process it';
const SHORT_INTENT = 'webhook signature verification';
const INTENT_STOP_WORDS = [
  'how',
  'do',
  'in',
  'my',
  'and',
  'that',
  'the',
  'is',
  'before',
  'it',
];

Deno.test({
  name: 'find_guidance ranks the webhook verification reference in the top 3 for a sentence intent',
  ignore: !realDocsPresent,
  async fn() {
    const result = await new FilesystemDocsCorpus({ root: realDocsRoot }).findGuidance(
      LONG_INTENT,
    );
    const topThree = result.recommendations.slice(0, 3).map(({ slug }) => slug);
    assert(topThree.includes(WEBHOOK_PAGE), `top 3 was ${topThree.join(', ')}`);
  },
});

Deno.test({
  name: 'find_guidance still ranks the webhook verification reference first for the short intent',
  ignore: !realDocsPresent,
  async fn() {
    const result = await new FilesystemDocsCorpus({ root: realDocsRoot }).findGuidance(
      SHORT_INTENT,
    );
    assertEquals(result.recommendations[0]?.slug, WEBHOOK_PAGE);
  },
});

Deno.test({
  name: 'find_guidance never explains a match through a stop word',
  ignore: !realDocsPresent,
  async fn() {
    const result = await new FilesystemDocsCorpus({ root: realDocsRoot }).findGuidance(
      LONG_INTENT,
    );
    assert(result.recommendations.length > 0);
    for (const { slug, section, why } of result.recommendations) {
      const listed = why.replace(/^Matches the task through: /, '').replace(/\.$/, '').split(
        ', ',
      );
      const leaked = listed.filter((word) => INTENT_STOP_WORDS.includes(word));
      assertEquals(leaked, [], `${slug}#${section}: ${why}`);
    }
  },
});
