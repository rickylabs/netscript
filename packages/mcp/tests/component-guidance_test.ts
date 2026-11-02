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
      ['How do I use CodeBlock?', 'code-block'],
      ['How do I use DataTable?', 'data-table'],
      ['Button', 'button'],
      ['How do I use Button?', 'button'],
      ['How do I use the Select?', 'select'],
      ['How do I use Pagination', 'pagination'],
      ['Pagination?', 'pagination'],
      ['How do I theme the toast?', 'toast'],
      ['How do I use a data table component?', 'data-table'],
      ['How do I use an empty state component?', 'empty-state'],
      ['How do I use command-palette?', 'command-palette'],
      ['Explain the command palette keyboard shortcuts', 'command-palette'],
      ['What are Button props?', 'button'],
      ['How do I install ui:add button?', 'button'],
      ['How do I use the progress component?', 'progress'],
      ['What keyboard shortcuts does the search component offer?', 'search'],
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
      'How do I link components in my application?',
      'What props control progress reporting in worker jobs?',
      'How do I search documentation for keyboard shortcuts?',
      'How do I add pagination to a component backed by a service list endpoint?',
      'How do I pass props to a command handler?',
      'How do I install a component with the CLI command?',
      'How do I search for component documentation?',
      'How do I create a data table in Postgres with migrations?',
      'How do I validate a form field in a service endpoint?',
      'How do I set the page header for an HTTP response?',
      'How do I handle an empty state when a worker queue has no jobs?',
      'Pagination for list endpoints',
      'Pagination in a service list endpoint',
      'Select a database provider for my project',
      'Search docs for database migrations',
      'Alert on failing health checks',
      'Input validation for service endpoints',
      'Label conventions for GitHub issues',
      'Markdown linting in docs',
      'Progress reporting for a long import',
      'How do I render a select query result in the CLI?',
      'How do I render an empty state in a JSON API?',
      'How do I render a message in my HTTP handler?',
      'How do I theme an alert email?',
    ]
  ) {
    const result = await corpus.findGuidance(intent);
    assert(
      !result.recommendations[0]?.slug.includes('design-system/components/'),
      JSON.stringify({ intent, top: result.recommendations[0]?.slug }),
    );
  }
});
