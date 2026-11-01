import { assert, assertEquals } from '@std/assert';
import { createDocsFlows } from '../src/application/docs/docs-flows.ts';
import { DOC_CONTENT_BUDGET } from '../src/domain/docs/doc-retrieval-contract.ts';
import { isRecord } from '../src/domain/schema.ts';
import { EmbeddedDocsCorpus } from '../src/infrastructure/embedded-docs-corpus.ts';
import {
  loadReleaseDocsSource,
  ReleaseEmbeddedDocsCorpus,
} from '../src/infrastructure/release-embedded-docs-corpus.ts';

Deno.test('every registry component is in published docs and get_doc returns its complete Markdown twin', async () => {
  const registry = JSON.parse(
    await Deno.readTextFile(new URL('../../fresh-ui/registry.json', import.meta.url)),
  );
  const expected = registry.items.filter((item: { type: string }) =>
    ['registry:component', 'registry:block'].includes(item.type)
  ).map((item: { name: string }) => item.name).sort();
  const source = await loadReleaseDocsSource();
  const pages = source.documents.filter((page) =>
    /^pages\/design-system\/components\/[^/]+$/.test(page.slug)
  );
  assertEquals(pages.map((page) => page.slug.split('/').at(-1)).sort(), expected);
  const corpus = new ReleaseEmbeddedDocsCorpus();
  const flow = createDocsFlows(corpus).get_doc;
  for (const page of pages) {
    const document = await corpus.get(page.slug);
    assert(document);
    assert(new TextEncoder().encode(document.content).byteLength <= DOC_CONTENT_BUDGET, page.slug);
    const result = await flow({ slug: page.slug });
    assert(result.ok);
    assert(isRecord(result.value));
    assertEquals(result.value.mode, 'verbatim', page.slug);
    assertEquals(result.value.content, document.content, page.slug);
    assert(document.content.includes('netscript ui:add ' + page.slug.split('/').at(-1)));
  }
});

Deno.test('find_guidance routes component questions to generated component pages', async () => {
  const corpus = new ReleaseEmbeddedDocsCorpus();
  for (
    const [intent, name] of [
      ['How do I install the Fresh UI Button component?', 'button'],
      ['What keyboard shortcuts and props does CommandPalette support?', 'command-palette'],
      ['How do I use the CodeBlock component?', 'code-block'],
      ['What props does ResponsiveTable accept?', 'responsive-table'],
    ] as const
  ) {
    const result = await corpus.findGuidance(intent);
    assertEquals(
      result.recommendations[0]?.slug,
      'pages/design-system/components/' + name,
      JSON.stringify({
        intent,
        top: result.recommendations.slice(0, 3).map((r) => ({ slug: r.slug, section: r.section })),
      }),
    );
  }
});

Deno.test('guidance discovers future registry component pages from corpus metadata', async () => {
  const corpus = new EmbeddedDocsCorpus({
    documents: [{
      slug: 'pages/design-system/components/future-control',
      source:
        '# FutureControl\n\nA newly registered Fresh UI control.\n\n## Install\n\nnetscript ui:add future-control\n\n## Props\n\nvalue controls the selected value.\n',
    }],
  });
  assertEquals(
    (await corpus.findGuidance('FutureControl component props')).recommendations[0]?.slug,
    'pages/design-system/components/future-control',
  );
});

Deno.test('ordinary framework terms do not trigger component routing', async () => {
  const corpus = new ReleaseEmbeddedDocsCorpus();
  for (
    const intent of [
      'How do I add pagination to my service list endpoint?',
      'How do I add progress reporting to a worker job?',
      'How do I use search in the MCP server?',
    ]
  ) {
    const result = await corpus.findGuidance(intent);
    assert(
      !result.recommendations[0]?.slug.includes('design-system/components/'),
      JSON.stringify({ intent, top: result.recommendations[0]?.slug }),
    );
  }
});
