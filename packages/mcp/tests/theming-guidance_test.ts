import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { activatedGuidanceConcepts } from '../src/domain/docs/guidance-result.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';
import { ReleaseEmbeddedDocsCorpus } from '../src/infrastructure/release-embedded-docs-corpus.ts';

const DESIGN_GUIDE = 'web-layer/how-to/design-with-fresh-ui';
const CUSTOMIZE_GUIDE = 'web-layer/how-to/customize-fresh-ui';

/** Intents observed in the #2406 benchmark, mapped to the section an agent must land on first. */
const ROUTES = [
  {
    concept: 'app-theming',
    slug: DESIGN_GUIDE,
    section: 'rebrand-the-whole-app',
    excerpt: 'netscript tokens build',
    intents: [
      'make my theme apply to every page, not just the dashboard',
      'rebrand the app with a new brand color',
      'restyle the whole app',
      'how do I add a dark mode palette with data-ns-theme',
    ],
  },
  {
    concept: 'page-design',
    slug: DESIGN_GUIDE,
    section: 'the-rules',
    excerpt: 'assets/tokens.css',
    intents: ['make the notes page look polished', 'design a page that looks good'],
  },
  {
    concept: 'app-chrome',
    slug: CUSTOMIZE_GUIDE,
    section: 'app-chrome-and-navigation',
    excerpt: 'routes/_layout.tsx',
    intents: ['my new page has no top bar', 'add a nav link for the notes page'],
  },
] as const;

Deno.test('theming, design, and chrome intents activate their concepts', () => {
  for (const route of ROUTES) {
    for (const intent of route.intents) {
      assert(
        activatedGuidanceConcepts(intent).some(({ name }) => name === route.concept),
        intent,
      );
    }
  }
});

Deno.test('a Scalar theme question does not activate the app theming concepts', () => {
  const names = activatedGuidanceConcepts('set the scalar theme option for the api reference')
    .map(({ name }) => name);
  assertEquals(names, []);
});

for (
  const [name, corpus, prefix] of [
    [
      'filesystem',
      new FilesystemDocsCorpus({ root: new URL('../../../docs/site/', import.meta.url).pathname }),
      '',
    ],
    ['standalone MCP', new ReleaseEmbeddedDocsCorpus(), 'pages/'],
  ] as const
) {
  Deno.test(`${name} guidance routes theming, design, and chrome intents to the Fresh UI guides`, async () => {
    for (const route of ROUTES) {
      for (const intent of route.intents) {
        const guidance = await corpus.findGuidance(intent);
        const first = guidance.recommendations[0];
        assert(first, intent);
        assertEquals(first.slug, `${prefix}${route.slug}`, intent);
        assertEquals(first.section, route.section, intent);
        assertStringIncludes(first.excerpt, route.excerpt, intent);
      }
    }
  });

  Deno.test(`${name} docs explain the app-wide theme chain and deny invented theme seams`, async () => {
    const design = await corpus.get(`${prefix}${DESIGN_GUIDE}`);
    const customize = await corpus.get(`${prefix}${CUSTOMIZE_GUIDE}`);
    assert(design, DESIGN_GUIDE);
    assert(customize, CUSTOMIZE_GUIDE);
    for (const document of [design, customize]) {
      const text = document.sectionContents.map(({ content }) => content).join('\n');
      for (
        const fact of [
          'theme-bridge.css',
          'client.ts',
          "[data-theme='dark']",
          'data-scheme',
          'netscript tokens build',
          'semantic.tokens.json',
          'data-ns-theme',
        ]
      ) {
        assertStringIncludes(text, fact, `${document.slug}: ${fact}`);
      }
    }

    // Tokens v2 generates tokens.css, so the guide must not teach the old hand-edit of `:root`.
    const designText = design.sectionContents.map(({ content }) => content).join('\n');
    assert(!designText.includes(':root'), `${design.slug} still teaches editing :root`);

    const matches = await corpus.search('data-ns-theme');
    assert(
      matches.some(({ slug }) => slug === `${prefix}${DESIGN_GUIDE}`),
      'search_docs must surface the design guide for the invented attribute',
    );
  });
}
