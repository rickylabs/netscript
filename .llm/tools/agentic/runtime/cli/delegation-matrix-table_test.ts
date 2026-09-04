import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  fallbackMatches,
  parseMatrixArgs,
  renderFullMatrix,
  renderMatrixQuery,
} from './delegation-matrix-table.ts';

Deno.test('full matrix renders every role including deep-research default and fallback', () => {
  const output = renderFullMatrix();

  for (
    const heading of [
      'Implementer (default)',
      'UI/UX (default)',
      'UI/UX (fallback)',
      'Plan eval (fallback)',
      'Impl eval (default)',
      'Deep research (default)',
      'Deep research (fallback)',
      'Coordinator / orchestrator matrix',
      'CLI / provider precedence',
    ]
  ) {
    assertStringIncludes(output, heading);
  }
  assertStringIncludes(output, 'simple<br>Automation, simple fixes, and chores');
  assertStringIncludes(output, 'Gemini 3.8 Flash low');
  assertStringIncludes(output, 'Luna max');
  assertStringIncludes(output, 'GitHub Copilot Pro+');
  assertStringIncludes(output, 'OpenRouter');
});

Deno.test('UI/UX role query exposes the owner-selected specialist progression', () => {
  const simple = renderMatrixQuery(parseMatrixArgs(['--tier', 'simple', '--role', 'ui-ux']));
  assertStringIncludes(simple, 'Kimi K3 low');
  assertStringIncludes(simple, 'MiniMax M3 provider default');

  const heavy = renderMatrixQuery(parseMatrixArgs(['--tier', 'complex', '--role', 'ui-ux']));
  assertStringIncludes(heavy, 'Kimi K3 max');
  assertStringIncludes(heavy, 'Fable 5.1 medium');

  const review = renderMatrixQuery(
    parseMatrixArgs(['--tier', 'complex', '--role', 'vision-eval']),
  );
  assertStringIncludes(review, 'max 5 roundtrips');
});

Deno.test('tier query renders only one readable workload row', () => {
  const output = renderMatrixQuery(parseMatrixArgs(['--tier', 'standard']));

  assertStringIncludes(output, 'straightforward<br>Straightforward implementations');
  assertStringIncludes(output, 'SOL medium');
  assertStringIncludes(output, 'DeepSeek V4 Pro provider default');
  assertEquals(output.includes('architecture<br>'), false);
  assertEquals(output.includes('## Evaluation policies'), false);
  assertEquals(output.includes('## Coordinator / orchestrator matrix'), false);
});

Deno.test('conventional task delimiter is accepted', () => {
  assertEquals(parseMatrixArgs(['--', '--tier', 'standard']), {
    tier: 'straightforward',
    json: false,
    help: false,
  });
});

Deno.test('role aliases select focused plan and implementation evaluator views', () => {
  const plan = renderMatrixQuery(parseMatrixArgs(['--tier', 'feature', '--plan-evaluator']));
  assertStringIncludes(plan, '# PLAN-EVAL routes');
  assertStringIncludes(plan, 'GLM 5.3 provider default');
  assertStringIncludes(plan, 'Fable 5.1 low');
  assertStringIncludes(plan, 'max 2 roundtrips');

  const implementation = renderMatrixQuery(
    parseMatrixArgs(['--tier', 'architecture', '--impl-evaluator']),
  );
  assertStringIncludes(implementation, '# IMPL-EVAL routes');
  assertStringIncludes(implementation, 'Grok 4.6 xhigh');
  assertStringIncludes(implementation, 'Muse Spark 1.3 max');
  assertStringIncludes(implementation, 'notify owner after 2');
});

Deno.test('fallback query lists every matching context rather than guessing one', () => {
  const output = renderMatrixQuery(parseMatrixArgs(['--fallback-of', 'Astra']));
  const matches = fallbackMatches('astra');

  assertEquals(matches.length, 5);
  assertStringIncludes(output, 'Fallbacks are context-sensitive');
  assertStringIncludes(output, 'feature');
  assertStringIncludes(output, 'Astra low');
  assertStringIncludes(output, 'Muse Spark 1.3 xhigh');
  assertStringIncludes(output, 'framework');
  assertStringIncludes(output, 'milestone');
});

Deno.test('fallback query composes tier and role filters', () => {
  const output = renderMatrixQuery(
    parseMatrixArgs([
      '--fallback',
      'Gemini 3.8 Flash',
      '--tier',
      'straightforward',
      '--role',
      'deep-research',
    ]),
  );

  assertStringIncludes(output, 'straightforward');
  assertStringIncludes(output, 'Deep research');
  assertStringIncludes(output, 'Luna max');
  assertEquals(output.includes('feature'), false);
});

Deno.test('json mode preserves canonical identifiers and route structure', () => {
  const output = renderMatrixQuery(
    parseMatrixArgs(['--tier', 'feature', '--role', 'deep-research', '--json']),
  );
  const parsed = JSON.parse(output);

  assertEquals(parsed.schemaVersion, 1);
  assertEquals(parsed.mode, 'role');
  assertEquals(parsed.role, 'deep_research');
  assertEquals(parsed.tiers[0].routes, [
    { model: 'gemini_3_8_flash', effort: 'high' },
    { model: 'luna', effort: 'max' },
  ]);
});

Deno.test('unknown rows, roles, models, and flags fail closed', () => {
  assertThrows(() => parseMatrixArgs(['--tier', 'huge']), Error, 'Unknown tier');
  assertThrows(() => parseMatrixArgs(['--role', 'critic']), Error, 'Unknown role');
  assertThrows(() => parseMatrixArgs(['--fallback', 'mystery']), Error, 'Unknown logical model');
  assertThrows(() => parseMatrixArgs(['--wat']), Error, 'Unknown argument');
});
