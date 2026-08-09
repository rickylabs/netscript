import { assertEquals, assertThrows } from '@std/assert';
import {
  createFindGuidanceFlow,
  createToolRegistry,
  GUIDANCE_DEFAULT_RECOMMENDATIONS,
  GUIDANCE_MAX_CODE_CHARACTERS,
  GUIDANCE_MAX_EXCERPT_CHARACTERS,
  GUIDANCE_MAX_FALLBACK_CHARACTERS,
  GUIDANCE_MAX_INTENT_CHARACTERS,
  GUIDANCE_MAX_RECOMMENDATIONS,
  GUIDANCE_MAX_WHY_CHARACTERS,
  type GuidanceRecommendation,
  type GuidanceResult,
  TOOL_INPUT_SCHEMAS,
  TOOL_OUTPUT_SCHEMAS,
} from '../mod.ts';
import { validateSchema } from '../src/domain/schema.ts';

const recommendation = (index: number): GuidanceRecommendation => ({
  stage: index === 0 ? 'prerequisite' : 'implementation',
  slug: `guide-${index}`,
  section: `step-${index}`,
  heading: `Step ${index}`,
  why: 'Relevant to the requested task.',
  excerpt: 'A bounded supporting excerpt.',
  code: [{
    language: 'ts',
    code: `const step = ${index};`,
    source: { slug: `guide-${index}`, section: `step-${index}`, heading: `Step ${index}` },
  }],
});

Deno.test('find_guidance is the 22nd bounded read-only tool contract', () => {
  const registry = createToolRegistry();
  const tool = registry.find((candidate) => candidate.name === 'find_guidance');

  assertEquals(registry.length, 22);
  assertEquals(tool?.kind, 'read');
  assertEquals(tool?.inputSchema, TOOL_INPUT_SCHEMAS.find_guidance);
  assertEquals(tool?.outputSchema, TOOL_OUTPUT_SCHEMAS.find_guidance);

  validateSchema(TOOL_INPUT_SCHEMAS.find_guidance, { intent: 'build a validated form' });
  validateSchema(TOOL_INPUT_SCHEMAS.find_guidance, {
    intent: 'build a validated form',
    limit: GUIDANCE_MAX_RECOMMENDATIONS,
  });
  for (
    const invalid of [
      {},
      { intent: '' },
      { intent: 'x'.repeat(GUIDANCE_MAX_INTENT_CHARACTERS + 1) },
      { intent: 'task', limit: 0 },
      { intent: 'task', limit: GUIDANCE_MAX_RECOMMENDATIONS + 1 },
      { intent: 'task', unexpected: true },
    ]
  ) {
    assertThrows(() => validateSchema(TOOL_INPUT_SCHEMAS.find_guidance, invalid));
  }
});

Deno.test('find_guidance output schema enforces finite vocabulary and collection bounds', () => {
  const valid: GuidanceResult = {
    intent: 'build a validated form',
    confidence: 'high',
    recommendations: [recommendation(0)],
    related: [{
      relation: 'next',
      slug: 'verification',
      section: 'test-the-form',
      heading: 'Test the form',
    }],
    truncated: false,
  };
  validateSchema(TOOL_OUTPUT_SCHEMAS.find_guidance, valid);
  assertThrows(() =>
    validateSchema(TOOL_OUTPUT_SCHEMAS.find_guidance, {
      ...valid,
      confidence: 'certain',
    })
  );
  assertThrows(() =>
    validateSchema(TOOL_OUTPUT_SCHEMAS.find_guidance, {
      ...valid,
      recommendations: Array.from(
        { length: GUIDANCE_MAX_RECOMMENDATIONS + 1 },
        (_, index) => recommendation(index),
      ),
    })
  );
});

Deno.test('find_guidance flow applies defaults and every response bound', async () => {
  const oversized: GuidanceResult = {
    intent: 'task',
    confidence: 'medium',
    recommendations: Array.from({ length: GUIDANCE_DEFAULT_RECOMMENDATIONS + 2 }, (_, index) => {
      const base = recommendation(index);
      const firstCode = base.code[0];
      if (!firstCode) throw new Error('test recommendation must include code');
      return {
        ...base,
        why: 'w'.repeat(GUIDANCE_MAX_WHY_CHARACTERS + 1),
        excerpt: 'e'.repeat(GUIDANCE_MAX_EXCERPT_CHARACTERS + 1),
        code: [
          { ...firstCode, code: 'c'.repeat(GUIDANCE_MAX_CODE_CHARACTERS + 1) },
          firstCode,
          firstCode,
        ],
      };
    }),
    related: Array.from({ length: 10 }, (_, index) => ({
      relation: 'related' as const,
      slug: `related-${index}`,
      section: 'overview',
      heading: 'Overview',
    })),
    fallback: 'f'.repeat(GUIDANCE_MAX_FALLBACK_CHARACTERS + 1),
    truncated: false,
  };
  let receivedIntent = '';
  const flow = createFindGuidanceFlow({
    findGuidance(intent) {
      receivedIntent = intent;
      return Promise.resolve(oversized);
    },
  });

  const result = await flow({ intent: '  task  ' });
  assertEquals(receivedIntent, 'task');
  if (!result.ok) throw new Error(result.error.message);
  const value = result.value as GuidanceResult;
  assertEquals(value.recommendations.length, GUIDANCE_DEFAULT_RECOMMENDATIONS);
  assertEquals(value.recommendations[0]?.why.length, GUIDANCE_MAX_WHY_CHARACTERS);
  assertEquals(value.recommendations[0]?.excerpt.length, GUIDANCE_MAX_EXCERPT_CHARACTERS);
  assertEquals(value.recommendations[0]?.code.length, 2);
  assertEquals(value.recommendations[0]?.code[0]?.code.length, GUIDANCE_MAX_CODE_CHARACTERS);
  assertEquals(value.related.length, 8);
  assertEquals(value.fallback?.length, GUIDANCE_MAX_FALLBACK_CHARACTERS);
  assertEquals(value.truncated, true);
  validateSchema(TOOL_OUTPUT_SCHEMAS.find_guidance, value);
});

Deno.test('find_guidance flow rejects invalid direct calls and bounds corpus failures', async () => {
  const flow = createFindGuidanceFlow({
    findGuidance() {
      throw new Error('sensitive adapter detail');
    },
  });

  assertEquals(await flow({ intent: 'task', limit: 9 }), {
    ok: false,
    error: { code: 'invalid_input', message: 'limit must be an integer from 1-8' },
  });
  assertEquals(await flow({ intent: 'task' }), {
    ok: false,
    error: {
      code: 'docs_corpus_error',
      message: 'The documentation corpus could not complete the guidance request.',
    },
  });
});
