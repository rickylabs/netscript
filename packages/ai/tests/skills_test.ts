import { assertEquals, assertThrows } from '@std/assert';
import type { EmbeddingProviderPort } from '../mod.ts';
import type { EmbeddingResponse } from '../src/ports/embedding.ts';
import {
  createInMemorySkillContentSource,
  createSkillLoader,
  parseSkillMarkdown,
} from '../src/skills/mod.ts';

const REVIEW = `---
id: review
name: Code review
tags: [review, quality]
description: Reviews code for correctness.
---
Inspect the diff and report actionable findings.`;

const DEPLOY = `---
id: deploy
name: Deployment
tags:
  - release
  - shipping
description: Helps deploy an application.
---
Validate the release and deploy it safely.`;

Deno.test('parseSkillMarkdown parses blessed frontmatter and body', () => {
  assertEquals(parseSkillMarkdown(REVIEW), {
    id: 'review',
    name: 'Code review',
    tags: ['review', 'quality'],
    description: 'Reviews code for correctness.',
    body: 'Inspect the diff and report actionable findings.',
  });
});

Deno.test('parseSkillMarkdown rejects missing frontmatter, malformed tags, and empty body', () => {
  assertThrows(() => parseSkillMarkdown('No frontmatter'), TypeError, 'frontmatter');
  assertThrows(
    () => parseSkillMarkdown(REVIEW.replace('[review, quality]', 'review, quality')),
    TypeError,
    'tags',
  );
  assertThrows(
    () =>
      parseSkillMarkdown(REVIEW.replace('Inspect the diff and report actionable findings.', '')),
    TypeError,
    'body',
  );
});

Deno.test('loader preserves progressive disclosure and matches tags without embeddings', async () => {
  const base = createInMemorySkillContentSource([{ id: 'review', markdown: REVIEW }]);
  let bodyReads = 0;
  let embeddingCalls = 0;
  const embeddings: EmbeddingProviderPort = {
    embed(): Promise<EmbeddingResponse> {
      embeddingCalls++;
      return Promise.resolve({ embeddings: [[1]], model: 'fake' });
    },
  };
  const loader = createSkillLoader({
    list: () => base.list(),
    load(id) {
      bodyReads++;
      return base.load(id);
    },
  }, { embeddings });

  assertEquals((await loader.list())[0]?.id, 'review');
  assertEquals((await loader.matchByTag(['rev']))[0]?.score, 0.5);
  assertEquals((await loader.matchByQuery('review'))[0]?.modes, ['tag']);
  assertEquals({ bodyReads, embeddingCalls }, { bodyReads: 0, embeddingCalls: 0 });
  assertEquals(
    (await loader.load('review'))?.body,
    'Inspect the diff and report actionable findings.',
  );
  assertEquals(bodyReads, 1);
});

Deno.test('semantic-only and combined matching use the injected provider', async () => {
  const source = createInMemorySkillContentSource([
    { id: 'review', markdown: REVIEW },
    { id: 'deploy', markdown: DEPLOY },
  ]);
  let calls = 0;
  const embeddings: EmbeddingProviderPort = {
    embed(input): Promise<EmbeddingResponse> {
      calls++;
      const inputs = typeof input === 'string' ? [input] : input;
      return Promise.resolve({
        embeddings: inputs.map((text, index) =>
          index === 0 || text.includes('Reviews') ? [1, 0] : [0.8, 0.2]
        ),
        model: 'fake',
      });
    },
  };
  const loader = createSkillLoader(source, { embeddings });

  const semantic = await loader.matchByQuery('production rollout', { semantic: true });
  assertEquals(semantic[0]?.skill.id, 'review');
  assertEquals(semantic[0]?.modes, ['semantic']);
  const combined = await loader.matchByQuery('release', { semantic: true });
  assertEquals(combined[0]?.skill.id, 'deploy');
  assertEquals(combined[0]?.modes, ['tag', 'semantic']);
  assertEquals(calls, 2);
});

Deno.test('semantic matching degrades to tag-only without a provider', async () => {
  const loader = createSkillLoader(
    createInMemorySkillContentSource([{ id: 'deploy', markdown: DEPLOY }]),
  );
  assertEquals((await loader.matchByQuery('release', { semantic: true }))[0]?.modes, ['tag']);
  assertEquals(await loader.matchByQuery('unrelated', { semantic: true }), []);
});
