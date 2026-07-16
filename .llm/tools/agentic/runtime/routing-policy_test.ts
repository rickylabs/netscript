import type { RouteIdentity } from './contract.ts';
import {
  CANONICAL_ROUTE_POLICY,
  type FallbackCandidate,
  resolveCanonicalRoute,
  type RoutingPolicyContext,
  selectFallbackCandidate,
} from './routing-policy.ts';
import { assertEquals as equal } from '@std/assert';

const worktree = '/home/codex/repos/routing-policy';
const session = { agent: 'codex', sessionId: 'session-1', worktree, boundary: 'new' } as const;
function route(agent: 'claude' | 'codex', mobileRequired = true): RouteIdentity {
  return {
    agent,
    provider: agent === 'claude' ? 'anthropic' : 'openai',
    model: `${agent}-model`,
    effort: 'low',
    worktree,
    mobileRequired,
  };
}
function candidate(values: Partial<FallbackCandidate> = {}): FallbackCandidate {
  return {
    route: route('claude'),
    family: 'anthropic',
    purpose: 'orchestration',
    available: true,
    subscriptionState: 'included',
    requiresExplicitApproval: false,
    higherEffortEscalation: false,
    priority: 1,
    ...values,
  };
}
function context(values: Partial<RoutingPolicyContext> = {}): RoutingPolicyContext {
  return {
    purpose: 'orchestration',
    session,
    explicitPaidApproval: false,
    explicitEffortEscalation: false,
    fallbackDepth: 0,
    maxFallbackDepth: 3,
    ...values,
  };
}

Deno.test('policy selects by explicit priority and reports mobile visibility changes', () => {
  const selected = selectFallbackCandidate([
    candidate({ priority: 2 }),
    candidate({ route: route('claude', false), priority: 1 }),
  ], context({ explicitPaidApproval: true }));
  equal(selected.status, 'selected');
  if (selected.status === 'selected') equal(selected.notificationRequired, true);
});

Deno.test('active slices and maximum fallback depth block without selecting', () => {
  equal(
    selectFallbackCandidate(
      [candidate()],
      context({ session: { ...session, boundary: 'active' } }),
    ),
    { status: 'blocked', reason: 'turn_boundary_required' },
  );
  equal(
    selectFallbackCandidate([candidate()], context({ fallbackDepth: 3 })),
    { status: 'blocked', reason: 'fallback_depth_exceeded' },
  );
});

Deno.test('evaluation blocks rather than selecting the author model family', () => {
  const sameFamily = candidate({ purpose: 'evaluation', family: 'openai', route: route('codex') });
  equal(
    selectFallbackCandidate(
      [sameFamily],
      context({ purpose: 'evaluation', authorFamily: 'openai' }),
    ),
    { status: 'blocked', reason: 'opposite_family_unavailable' },
  );
  const opposite = candidate({ purpose: 'evaluation', family: 'anthropic' });
  const selected = selectFallbackCandidate(
    [sameFamily, opposite],
    context({ purpose: 'evaluation', authorFamily: 'openai' }),
  );
  equal(selected.status, 'selected');
  if (selected.status === 'selected') equal(selected.candidate.family, 'anthropic');
});

Deno.test('outside-plan and higher-effort Fable-shaped policy requires explicit approvals', () => {
  const fable = candidate({
    subscriptionState: 'outside_plan',
    requiresExplicitApproval: true,
    higherEffortEscalation: true,
  });
  equal(selectFallbackCandidate([fable], context()), {
    status: 'blocked',
    reason: 'approval_required',
  });
  equal(
    selectFallbackCandidate([fable], context({ explicitPaidApproval: true })),
    { status: 'blocked', reason: 'approval_required' },
  );
  equal(
    selectFallbackCandidate(
      [fable],
      context({
        explicitPaidApproval: true,
        explicitEffortEscalation: true,
      }),
    ).status,
    'selected',
  );
});

Deno.test('orchestration lanes run Opus 4.8 medium while Fable 5 is outside the subscription', () => {
  const at = new Date('2026-07-13T00:00:00Z');
  for (const lane of ['planning_decisions', 'mobile_orchestration'] as const) {
    const route = resolveCanonicalRoute(lane, at);
    equal([route.agent, route.provider, route.model, route.effort], [
      'claude',
      'anthropic',
      'opus-4.8',
      'medium',
    ]);
  }
});

Deno.test('non-review Fable 5 routes stay approval-gated and are never auto-selected', () => {
  const reviewLanes = new Set(['review_codex', 'review_codex_complex']);
  const fableRoutes = CANONICAL_ROUTE_POLICY.filter((route) =>
    route.model === 'fable-5' && !reviewLanes.has(route.lane)
  );
  equal(fableRoutes.length > 0, true);
  for (const route of fableRoutes) {
    equal(route.subscriptionState, 'outside_plan');
    equal(route.requiresExplicitApproval, true);
  }
});

Deno.test('major UI/UX work is GLM-led or receives the mandatory GLM adversarial pass', () => {
  const at = new Date('2026-07-12T00:00:00Z');
  const lead = resolveCanonicalRoute('major_ui_ux_design', at);
  const adversarial = resolveCanonicalRoute('major_ui_ux_adversarial_review', at);
  for (const route of [lead, adversarial]) {
    equal([
      route.agent,
      route.provider,
      route.profileId,
      route.presetId,
      route.effort,
    ], [
      'claude',
      'openrouter',
      'claude-openrouter',
      'claude-design-glm-5-2',
      'xhigh',
    ]);
  }
  equal(lead.condition, 'lead_route_for_major_ui_ux_work');
  equal(adversarial.condition, 'required_before_merge_when_glm_not_lead');
});

Deno.test('deep-analysis Fable fallback requires classified Codex quota exhaustion', () => {
  const fable = candidate({ purpose: 'analysis', requiresCodexQuotaExhaustion: true });
  for (const failureCode of [undefined, 'rate_limited', 'provider_unavailable'] as const) {
    equal(selectFallbackCandidate([fable], context({ purpose: 'analysis', failureCode })), {
      status: 'blocked',
      reason: 'route_unavailable',
    });
  }
  equal(
    selectFallbackCandidate(
      [fable],
      context({ purpose: 'analysis', failureCode: 'quota_exhausted' }),
    ).status,
    'selected',
  );
});

Deno.test('canonical research lane is Antigravity agy and no Gemini model is inferred', () => {
  const route = resolveCanonicalRoute('research_extraction', new Date('2026-07-10T00:00:00Z'));
  equal([route.agent, route.provider, route.model], ['antigravity', 'google', 'agy']);
  equal(CANONICAL_ROUTE_POLICY.some((entry) => /gemini/i.test(entry.model)), false);
});

Deno.test('Claude review stays opposite-family on GPT-5.6 Sol xhigh', () => {
  const route = resolveCanonicalRoute('review_claude', new Date('2026-07-10T00:00:00Z'));
  equal([route.agent, route.provider, route.model, route.effort], [
    'codex',
    'openai',
    'gpt-5.6-sol',
    'xhigh',
  ]);
});

Deno.test('review-of-Codex ladder is effort-paired and Fable is reserved for medium+', () => {
  const at = new Date('2026-07-16T00:00:00Z');
  // Small slices → Opus 4.8 high; normal/complex → Fable 5 (low/medium), in-plan and
  // auto-selectable per PR #784 (Fable 5 restored); fast → Opus medium.
  const expected: Record<string, [string, string]> = {
    review_codex_light: ['opus-4.8', 'high'],
    review_codex: ['fable-5', 'low'],
    review_codex_complex: ['fable-5', 'medium'],
    review_codex_fast: ['opus-4.8', 'medium'],
  };
  for (const [lane, [model, effort]] of Object.entries(expected)) {
    const route = resolveCanonicalRoute(lane as Parameters<typeof resolveCanonicalRoute>[0], at);
    equal([route.agent, route.provider, route.model, route.effort], [
      'claude',
      'anthropic',
      model,
      effort,
    ]);
  }
});

Deno.test('every review-of-Codex route is opposite-family (Claude); Fable primaries are in-plan and auto-selectable', () => {
  const reviewLanes = new Set([
    'review_codex_light',
    'review_codex',
    'review_codex_complex',
    'review_codex_fast',
  ]);
  const routes = CANONICAL_ROUTE_POLICY.filter((route) => reviewLanes.has(route.lane));
  equal(routes.length > 0, true);
  for (const route of routes) {
    equal([route.agent, route.provider], ['claude', 'anthropic']);
    if (route.model === 'fable-5') {
      // Fable 5 restored (PR #784): review primaries are included, ungated, unconditional.
      equal(route.subscriptionState, 'included');
      equal(route.requiresExplicitApproval, undefined);
      equal(route.condition, undefined);
    }
  }
  // The auto-selected reviewer for the two medium+ pairings is Fable.
  const fablePairings = routes.filter((route) => route.model === 'fable-5').map((r) => r.lane);
  equal(fablePairings.includes('review_codex'), true);
  equal(fablePairings.includes('review_codex_complex'), true);
});

Deno.test('token-limit review fallbacks stay Claude-family and are never primary', () => {
  const fallbacks = CANONICAL_ROUTE_POLICY.filter((route) =>
    route.condition === 'token_limit_fallback'
  );
  equal(
    fallbacks.map((r) => [r.lane, r.model, r.effort]).toSorted(),
    [
      ['review_codex', 'opus-4.8', 'low'],
      ['review_codex_complex', 'opus-4.8', 'medium'],
      ['review_codex_fast', 'sonnet-5', 'high'],
      ['review_codex_light', 'sonnet-5', 'high'],
    ].toSorted(),
  );
  for (const route of fallbacks) {
    equal([route.agent, route.provider], ['claude', 'anthropic']);
    // A token-limit fallback is never returned as the canonical primary.
    const primary = resolveCanonicalRoute(route.lane, new Date('2026-07-16T00:00:00Z'));
    equal(primary.condition !== 'token_limit_fallback', true);
  }
});

Deno.test('implementation lanes are effort-tiered on GPT-5.6 Sol', () => {
  const at = new Date('2026-07-16T00:00:00Z');
  const expected: Record<string, string> = {
    light_implementation: 'low',
    normal_implementation: 'medium',
    complex_implementation: 'high',
  };
  for (const [lane, effort] of Object.entries(expected)) {
    const route = resolveCanonicalRoute(lane as Parameters<typeof resolveCanonicalRoute>[0], at);
    equal([route.agent, route.provider, route.model, route.effort], [
      'codex',
      'openai',
      'gpt-5.6-sol',
      effort,
    ]);
  }
});
