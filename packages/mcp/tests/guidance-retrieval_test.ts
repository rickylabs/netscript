import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { createFindGuidanceFlow, type GuidanceResult } from '../mod.ts';
import { EmbeddedDocsCorpus } from '../src/infrastructure/embedded-docs-corpus.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';

const SOURCES = [
  {
    slug: 'guides/forms',
    source: `---
title: Forms
---
# Forms

## Before you start

Install the web package and prepare a route schema.

## Define the form

Bind fields on the server and return field errors from the action.

\`\`\`ts
const form = defineForm({ email: field.string() });
\`\`\`

{{ comp.tabbedCode({ tabs: [{
  label: "Route",
  lang: "ts",
  code: "export const handler = defineRoute({ action });"
}] }) }}

## Verify the form

Submit invalid data and assert the rendered field error.
`,
  },
  {
    slug: 'guides/extensions',
    source: `# Extensions

## Before you start

Choose whether the capability belongs in an application or reusable package.

## Scaffold the plugin

Create a thin plugin over a core package when the framework does not ship the capability.
`,
  },
  {
    slug: 'guides/runtime-overview',
    source: `# Runtime overview

## Prerequisites

Runtime setup needs a project. [Configure runtime](runtime-config.md#configure-runtime)
`,
  },
  {
    slug: 'guides/runtime-config',
    source: `# Runtime configuration

## Configure runtime

Configure the runtime project with explicit service settings.
`,
  },
] as const;

Deno.test('shared guidance index bridges concept mismatch and cites fenced and Vento code', async () => {
  const corpus = new EmbeddedDocsCorpus({ documents: SOURCES });
  const result = await corpus.findGuidance('add a capability NetScript does not ship');
  assertEquals(result.recommendations[0]?.slug, 'guides/extensions');
  assertEquals(result.recommendations[0]?.section, 'scaffold-the-plugin');

  const form = await corpus.findGuidance('build a server validated route bound form');
  const definition = form.recommendations.find((entry) => entry.section === 'define-the-form');
  assert(definition);
  assertEquals(definition.code.length, 2);
  assertEquals(definition.code.map(({ language }) => language), ['ts', 'ts']);
  assert(definition.code.every(({ source }) => source.slug === 'guides/forms'));
  assert(definition.code.every(({ source }) => source.section === 'define-the-form'));
  assertStringIncludes(definition.code[0]!.code, 'defineForm');
  assertStringIncludes(definition.code[1]!.code, 'defineRoute');
});

Deno.test('internal prerequisite links contribute one-hop routing without creating a seed', async () => {
  const linked = new EmbeddedDocsCorpus({ documents: SOURCES });
  const withoutLink = new EmbeddedDocsCorpus({
    documents: SOURCES.map((entry) => ({
      ...entry,
      source: entry.source.replace(
        '[Configure runtime](runtime-config.md#configure-runtime)',
        'Configure runtime',
      ),
    })),
  });
  const intent = 'runtime setup';
  const linkedResult = await linked.findGuidance(intent);
  const unlinkedResult = await withoutLink.findGuidance(intent);
  const linkedRank = linkedResult.recommendations.findIndex((entry) =>
    entry.slug === 'guides/runtime-config' && entry.section === 'configure-runtime'
  );
  const unlinkedRank = unlinkedResult.recommendations.findIndex((entry) =>
    entry.slug === 'guides/runtime-config' && entry.section === 'configure-runtime'
  );
  assert(linkedRank >= 0 && unlinkedRank >= 0);
  assert(linkedRank < unlinkedRank, 'the direct prerequisite link must promote the target');
  assert(
    linkedResult.related.some((entry) =>
      entry.relation === 'prerequisite' && entry.slug === 'guides/runtime-config' &&
      entry.section === 'configure-runtime'
    ),
  );

  const unrelated = await linked.findGuidance('configure runtime');
  assertEquals(unrelated.recommendations.some((entry) => entry.slug === 'guides/forms'), false);
});

Deno.test('filesystem and embedded adapters return byte-equal guidance over identical sources', async () => {
  const root = await Deno.makeTempDir();
  try {
    for (const entry of SOURCES) {
      const path = `${root}/${entry.slug}.md`;
      await Deno.mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
      await Deno.writeTextFile(path, entry.source);
    }
    const embedded = new EmbeddedDocsCorpus({ documents: SOURCES });
    const filesystem = new FilesystemDocsCorpus({ root });
    const intent = 'build a server validated route bound form';
    const embeddedFirst = await embedded.findGuidance(intent);
    const embeddedSecond = await embedded.findGuidance(intent);
    const filesystemFirst = await filesystem.findGuidance(intent);
    const filesystemSecond = await filesystem.findGuidance(intent);
    assertEquals(embeddedFirst, embeddedSecond);
    assertEquals(filesystemFirst, filesystemSecond);
    assertEquals(filesystemFirst, embeddedFirst);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('flow bounds shared-index responses and unsupported intent has honest fallback', async () => {
  const corpus = new EmbeddedDocsCorpus({ documents: SOURCES });
  const flow = createFindGuidanceFlow(corpus);
  const response = await flow({ intent: 'form route validation', limit: 2 });
  if (!response.ok) throw new Error(response.error.message);
  assertEquals((response.value as GuidanceResult).recommendations.length, 2);

  const unsupported = await corpus.findGuidance('quantum banana orchestra');
  assertEquals(unsupported.confidence, 'low');
  assertEquals(unsupported.recommendations, []);
  assertStringIncludes(unsupported.fallback ?? '', 'search_docs');
});
