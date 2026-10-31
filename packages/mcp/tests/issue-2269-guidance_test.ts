import { assert, assertEquals } from '@std/assert';
import type { GuidanceResult } from '../mod.ts';
import { createDocsFlows } from '../src/application/docs/docs-flows.ts';
import { ReleaseEmbeddedDocsCorpus } from '../src/infrastructure/release-embedded-docs-corpus.ts';
import { MCP_PACKAGE_VERSION } from '../src/publish-assets.generated.ts';

interface IssueFixture {
  readonly schemaVersion: 1;
  readonly issue: 2269;
  readonly guidance: readonly {
    readonly intent: string;
    readonly expected: 'page' | 'low';
    readonly pages?: readonly string[];
    readonly section?: string;
  }[];
  readonly search: readonly {
    readonly query: string;
    readonly expected: 'page' | 'missing';
    readonly pages?: readonly string[];
  }[];
}

const fixture: IssueFixture = JSON.parse(
  await Deno.readTextFile(new URL('./fixtures/issue-2269-guidance.json', import.meta.url)),
);
const corpus = new ReleaseEmbeddedDocsCorpus();
const flows = createDocsFlows(corpus);

for (const example of fixture.guidance) {
  Deno.test(`issue 2269 guidance: ${example.intent}`, async () => {
    assertEquals(fixture.schemaVersion, 1);
    assertEquals(fixture.issue, 2269);
    const result = await flows.find_guidance({ intent: example.intent });
    assert(result.ok);
    const value = result.value as GuidanceResult;
    assertEquals(value.citation, corpus.citation);
    assertEquals(value.citation?.frameworkVersion, MCP_PACKAGE_VERSION);
    if (example.expected === 'low') {
      assertEquals(value.confidence, 'low');
      assert(value.fallback && value.fallback.length > 0);
    } else {
      assert(
        value.recommendations.slice(0, 3).some((recommendation) =>
          example.pages?.includes(recommendation.slug) &&
          (!example.section || recommendation.section === example.section)
        ),
        JSON.stringify(value.recommendations),
      );
    }
    // Every advertised page AND section is retrievable, including low-confidence suggestions.
    for (const citation of [...value.recommendations, ...value.related]) {
      const document = await flows.get_doc({ slug: citation.slug, section: citation.section });
      assert(document.ok, `${citation.slug}#${citation.section}: ${JSON.stringify(document)}`);
    }
  });
}

for (const example of fixture.search) {
  Deno.test(`issue 2269 literal search: ${example.query}`, async () => {
    const result = await flows.search_docs({ query: example.query, limit: 10 });
    assert(result.ok);
    const value = result.value as {
      matches: { slug: string }[];
      confidence?: string;
      fallback?: string;
      citation: typeof corpus.citation;
    };
    assertEquals(value.citation, corpus.citation);
    assertEquals(value.citation.frameworkVersion, MCP_PACKAGE_VERSION);
    if (example.expected === 'missing') {
      assertEquals(value.matches, []);
      assertEquals(value.confidence, 'low');
      assert(value.fallback?.includes('No seam documented'));
    } else {
      assert(value.matches.some(({ slug }) => example.pages?.includes(slug)));
      assertEquals(value.fallback, undefined);
    }
    for (const match of value.matches) assert((await flows.get_doc({ slug: match.slug })).ok);
  });
}
