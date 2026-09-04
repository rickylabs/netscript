import { assertEquals } from '@std/assert';
import {
  COORDINATOR_MATRIX,
  COORDINATOR_TIERS,
  DELEGATION_MATRIX,
  type ModelRoute,
  WORKLOAD_TIERS,
} from './delegation-matrix.ts';

function routes(items: readonly ModelRoute[]): string {
  return items.length ? items.map((route) => `${route.model}@${route.effort}`).join(' → ') : '—';
}

function generatedBlock(source: string, name: string): string[] {
  const start = `<!-- generated-${name}:start -->`;
  const end = `<!-- generated-${name}:end -->`;
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from < 0 || to < from) throw new Error(`missing generated ${name} markers`);
  return source.slice(from + start.length, to).trim().split('\n');
}

function tableCells(rows: readonly string[]): string[][] {
  return rows.filter((_, index) => index !== 1).map((row) =>
    row.split('|').slice(1, -1).map((cell) => cell.trim())
  );
}

Deno.test('lane-policy workload table exactly matches the typed matrix', async () => {
  const source = await Deno.readTextFile('.llm/harness/workflow/lane-policy.md');
  const expected = [
    [
      'Tier',
      'Implementation',
      'Plan',
      'PLAN-EVAL',
      'IMPL-EVAL',
      'Vision',
      'Documentation',
      'Deep research',
    ],
    ...WORKLOAD_TIERS.map((tier): string[] => {
      const cell = DELEGATION_MATRIX[tier];
      return [
        tier,
        routes(cell.implementation),
        routes(cell.plan),
        routes(cell.plan_evaluation),
        routes(cell.implementation_evaluation),
        routes(cell.vision_evaluation),
        routes(cell.documentation),
        routes(cell.deep_research),
      ];
    }),
  ];
  assertEquals(tableCells(generatedBlock(source, 'workload-matrix')), expected);
});

Deno.test('lane-policy coordinator table exactly matches the typed matrix', async () => {
  const source = await Deno.readTextFile('.llm/harness/workflow/lane-policy.md');
  const expected: string[][] = [
    ['Scope', 'Coordinator route'],
    ...COORDINATOR_TIERS.map((tier) => [tier, routes(COORDINATOR_MATRIX[tier])]),
  ];
  assertEquals(tableCells(generatedBlock(source, 'coordinator-matrix')), expected);
});
