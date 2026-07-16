import type { RouteIdentity } from './contract.ts';
import {
  CANONICAL_ROUTE_POLICY,
  type FallbackCandidate,
  resolveCanonicalRoute,
  type RoutingPolicyContext,
  selectFallbackCandidate,
} from './routing-policy.ts';
import { assertEquals as equal } from '@std/assert';
import { OPENCODE_MODEL_IDS } from '../config/models.ts';

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

Deno.test('orchestrator + complex-decision lanes default to Fable 5 low, in-plan', () => {
  const at = new Date('2026-07-16T00:00:00Z');
  for (const lane of ['planning_decisions', 'deep_analysis'] as const) {
    const route = resolveCanonicalRoute(lane, at);
    equal([route.agent, route.provider, route.model, route.effort], [
      'claude',
      'anthropic',
      'fable-5',
      'low',
    ]);
    equal(route.subscriptionState, 'included');
    equal(route.requiresExplicitApproval ?? false, false);
  }
});

Deno.test('Fable 5 is back on the subscription: every Fable route is in-plan and auto-selectable', () => {
  const fableRoutes = CANONICAL_ROUTE_POLICY.filter((route) => route.model === 'fable-5');
  equal(fableRoutes.length > 0, true);
  for (const route of fableRoutes) {
    equal(route.subscriptionState ?? 'included', 'included');
    equal(route.requiresExplicitApproval ?? false, false);
  }
});

Deno.test('there is no mobile_orchestration lane — the orchestrator session owns /rc', () => {
  equal(
    CANONICAL_ROUTE_POLICY.some((route) => (route.lane as string) === 'mobile_orchestration'),
    false,
  );
});

Deno.test('implementation stays Codex GPT-5.6 Sol — medium normal, high complex', () => {
  const at = new Date('2026-07-16T00:00:00Z');
  const normal = resolveCanonicalRoute('normal_implementation', at);
  equal([normal.agent, normal.provider, normal.model, normal.effort], [
    'codex',
    'openai',
    'gpt-5.6-sol',
    'medium',
  ]);
  const complex = resolveCanonicalRoute('complex_implementation', at);
  equal([complex.agent, complex.provider, complex.model, complex.effort], [
    'codex',
    'openai',
    'gpt-5.6-sol',
    'high',
  ]);
});

Deno.test('adversarial review of Codex work is Fable, opposite-family, paired to effort', () => {
  const at = new Date('2026-07-16T00:00:00Z');
  const normal = resolveCanonicalRoute('review_codex', at);
  equal([normal.agent, normal.provider, normal.model, normal.effort], [
    'claude',
    'anthropic',
    'fable-5',
    'low',
  ]);
  const complex = resolveCanonicalRoute('review_codex_complex', at);
  equal([complex.agent, complex.provider, complex.model, complex.effort], [
    'claude',
    'anthropic',
    'fable-5',
    'high',
  ]);
  // The token-limit fallback for a Codex review stays Claude-family (Opus), never
  // the Codex author's own OpenAI family — opposite-family review is preserved.
  for (const lane of ['review_codex', 'review_codex_complex'] as const) {
    const fallback = CANONICAL_ROUTE_POLICY.find((route) =>
      route.lane === lane && route.condition?.startsWith('fallback')
    );
    equal(fallback?.provider, 'anthropic');
    equal(fallback?.model, 'opus-4.8');
  }
});

Deno.test('delegated chores: docs/cleanup on Sonnet 5 high, code chores on Opus 4.8 medium', () => {
  const at = new Date('2026-07-16T00:00:00Z');
  const docs = resolveCanonicalRoute('documentation_review', at);
  equal([docs.agent, docs.provider, docs.model, docs.effort], [
    'claude',
    'anthropic',
    'sonnet-5',
    'high',
  ]);
  const code = resolveCanonicalRoute('chore_code', at);
  equal([code.agent, code.provider, code.model, code.effort], [
    'claude',
    'anthropic',
    'opus-4.8',
    'medium',
  ]);
});

Deno.test('orchestrator/decision Fable lanes carry a Codex Sol high token-limit fallback', () => {
  for (const lane of ['planning_decisions', 'deep_analysis'] as const) {
    const fallback = CANONICAL_ROUTE_POLICY.find((route) =>
      route.lane === lane && route.condition === 'fallback_on_fable_token_limit'
    );
    equal([fallback?.agent, fallback?.provider, fallback?.model, fallback?.effort], [
      'codex',
      'openai',
      'gpt-5.6-sol',
      'high',
    ]);
  }
});

Deno.test('Claude Code workflow lane stays Opus 4.8 low', () => {
  const route = resolveCanonicalRoute('claude_workflow', new Date('2026-07-16T00:00:00Z'));
  equal([route.agent, route.provider, route.model, route.effort], [
    'claude',
    'anthropic',
    'opus-4.8',
    'low',
  ]);
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

Deno.test('OpenCode vision evaluation complements the mandatory GLM design pass', () => {
  const route = resolveCanonicalRoute('adversarial_design_eval', new Date('2026-07-14T00:00:00Z'));
  equal([route.agent, route.provider, route.model, route.effort], [
    'opencode',
    'openrouter',
    OPENCODE_MODEL_IDS.visionEval,
    'high',
  ]);
  equal(route.condition, 'vision_evidence_complements_required_glm_design_review');
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
