import { assert, assertEquals } from '@std/assert';
import { EmbeddedDocsCorpus } from '../src/infrastructure/embedded-docs-corpus.ts';
import {
  guidanceContentTerms,
  GuidanceTermWeights,
  normalizeGuidanceToken,
} from '../src/domain/docs/guidance-terms.ts';

Deno.test('intent terms drop stop and question words but keep content words', () => {
  assertEquals(
    guidanceContentTerms('how do I verify that the signature is valid before I process it').map((
      term,
    ) => term.text),
    ['verify', 'signature', 'valid', 'process'],
  );
  assertEquals(guidanceContentTerms('how do I do it'), []);
});

Deno.test('stemming folds derivations together without truncating short words', () => {
  for (const word of ['verify', 'verified', 'verifies', 'verifier', 'verification']) {
    assertEquals(normalizeGuidanceToken(word), 'verif', word);
  }
  for (const word of ['validate', 'validated', 'validating', 'validation']) {
    assertEquals(normalizeGuidanceToken(word), 'valid', word);
  }
  assertEquals(normalizeGuidanceToken('create'), 'create');
  assertEquals(normalizeGuidanceToken('state'), 'state');
  assertEquals(normalizeGuidanceToken('webhooks'), 'webhook');
});

Deno.test('term weights rank rare stems above common ones and flag the common share', () => {
  const sections = [
    ['service', 'webhook'],
    ['service'],
    ['service'],
    ['service'],
    ['service'],
  ];
  const weights = new GuidanceTermWeights(sections, 0.2);
  assert(weights.inverseFrequency('webhook') > weights.inverseFrequency('service'));
  assert(weights.isCommon('service'));
  assertEquals(weights.rarity('webhook'), 1);
  assert(weights.rarity('service') < 1);
});

Deno.test('a heavily linked hub gains one link boost, not one per linking section', async () => {
  const linkers = Array.from({ length: 30 }, (_, index) => ({
    slug: `notes/${index}`,
    source: `# Note ${index}\n\n## Service note\n\nThe service is described in [the hub](/hub/).`,
  }));
  const corpus = new EmbeddedDocsCorpus({
    documents: [
      { slug: 'hub', source: '# Hub\n\n## Hub overview\n\nGeneral service overview.' },
      {
        slug: 'guides/webhooks',
        source: '# Webhooks\n\n## Verify webhook signatures\n\nVerify the webhook signature.',
      },
      ...linkers,
    ],
  });
  const result = await corpus.findGuidance('verify a webhook signature in my service');
  assertEquals(result.recommendations[0]?.slug, 'guides/webhooks');
});

Deno.test('a literal heading word outranks a heading that only shares its stem', async () => {
  const corpus = new EmbeddedDocsCorpus({
    documents: [
      {
        slug: 'guides/derived',
        source: '# Derived\n\n## Verified delivery\n\nDelivery details.',
      },
      {
        slug: 'guides/literal',
        source: '# Literal\n\n## Delivery verification\n\nDelivery details.',
      },
      // Unrelated pages keep both intent words rare, so their identity boosts are not discounted.
      ...Array.from({ length: 10 }, (_, index) => ({
        slug: `noise/${index}`,
        source: `# Noise ${index}\n\n## Unrelated\n\nNothing to see.`,
      })),
    ],
  });
  // Not a contiguous heading phrase, so the exact-phrase boost cannot decide the order.
  const result = await corpus.findGuidance('verification of the delivery');
  const order = result.recommendations.map(({ slug, section }) => `${slug}#${section}`);
  assertEquals(order[0], 'guides/literal#delivery-verification');
  assert(order.indexOf('guides/derived#verified-delivery') > 0, order.join(', '));
});

Deno.test('confidence is low when the top match rests only on common words', async () => {
  const corpus = new EmbeddedDocsCorpus({
    documents: [
      ...Array.from({ length: 10 }, (_, index) => ({
        slug: `services/${index}`,
        source:
          `# Services ${index}\n\n## Service setup\n\nService setup for a service with service data.`,
      })),
      { slug: 'guides/cron', source: '# Cron\n\n## Cron schedule\n\nAdd a cron schedule.' },
    ],
  });
  const common = await corpus.findGuidance('service setup');
  assertEquals(common.confidence, 'low');
  assert(common.fallback?.includes('search_docs'));

  const distinctive = await corpus.findGuidance('cron schedule');
  assertEquals(distinctive.recommendations[0]?.slug, 'guides/cron');
  assert(distinctive.confidence !== 'low');
});
