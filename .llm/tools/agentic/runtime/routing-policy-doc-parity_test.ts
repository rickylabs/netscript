import { assertEquals } from '@std/assert';
import { CANONICAL_ROUTE_POLICY } from './routing-policy.ts';

const ROUTE_MARKER =
  /<!-- canonical-open-evaluator-route lane=(\S+) preset=(\S+) model=(\S+) effort=(\S+) condition=(\S+) -->/g;

Deno.test('lane-policy formal OpenRouter markers exactly match canonical route bindings', async () => {
  const source = await Deno.readTextFile('.llm/harness/workflow/lane-policy.md');
  const documented = [...source.matchAll(ROUTE_MARKER)].map((match) => ({
    lane: match[1],
    presetId: match[2],
    model: match[3],
    effort: match[4],
    condition: match[5],
  })).sort((left, right) => left.lane.localeCompare(right.lane));
  const canonical = CANONICAL_ROUTE_POLICY.filter((route) =>
    route.provider === 'openrouter' &&
    (route.lane === 'formal_plan_evaluation' || route.lane === 'formal_impl_evaluation')
  ).map((route) => ({
    lane: route.lane,
    presetId: route.presetId ?? '',
    model: route.model,
    effort: route.effort,
    condition: route.condition ?? '',
  })).sort((left, right) => left.lane.localeCompare(right.lane));

  assertEquals(documented, canonical);
});
