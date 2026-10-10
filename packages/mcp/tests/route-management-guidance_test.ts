import { assert, assertEquals } from '@std/assert';
import { activatedGuidanceConcepts } from '../src/domain/docs/guidance-result.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';
import { ReleaseEmbeddedDocsCorpus } from '../src/infrastructure/release-embedded-docs-corpus.ts';

const intents = [
  'how do I rename or move a route?',
  'rename a route',
  'move a route',
  'route management',
  'router.ts reconciliation',
];

Deno.test('route lifecycle intents activate the route-management concept', () => {
  for (const intent of intents) {
    assert(
      activatedGuidanceConcepts(intent).some(({ name }) => name === 'route-management'),
      intent,
    );
  }
  assertEquals(activatedGuidanceConcepts('rename a database column'), []);
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
  Deno.test(`${name} route-management guidance prioritizes the checklist and ownership links`, async () => {
    for (const intent of intents) {
      const guidance = await corpus.findGuidance(intent);
      const first = guidance.recommendations[0];
      assert(first, intent);
      assertEquals(first?.slug, `${prefix}web-layer/route`, intent);
      assertEquals(first?.section, 'renaming-or-moving-a-route', intent);
      assert(first.excerpt.includes('string literal'), intent);
      assert(first.excerpt.includes('router.ts'), intent);
      assert(
        guidance.recommendations.some(({ slug }) =>
          slug === `${prefix}web-layer/generated-surface`
        ),
        intent,
      );
      assert(
        guidance.related.some(({ slug }) => slug === `${prefix}web-layer/generated-surface`),
        intent,
      );
    }
    const document = await corpus.get(`${prefix}web-layer/route`);
    const checklist = document?.sectionContents.find(({ slug }) =>
      slug === 'renaming-or-moving-a-route'
    )?.content;
    assert(checklist?.includes('query-loaders.ts'));
    assert(checklist?.includes('.generated/manifest.ts'));
    assert(checklist?.includes('Type-check after regeneration'));
    assert(
      checklist?.includes('No `ui:rename`, `route rename`, `generate routes`, or `ui:remove page`'),
    );
    assert(checklist?.includes('`ui:remove` handles registry items only'));
  });
}
