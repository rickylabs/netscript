import type { RouteIdentity } from './contract.ts';
import {
  CANONICAL_ROUTE_POLICY,
  type FallbackCandidate,
  resolveCanonicalFormalEvaluatorRoute,
  resolveCanonicalOrdinaryReviewRoute,
  resolveCanonicalRoute,
  type RoutingPolicyContext,
  selectFallbackCandidate,
} from './routing-policy.ts';
import { MODEL_IDS, OPENROUTER_MODEL_IDS } from '../config/models.ts';
import { assertEquals as equal, assertThrows } from '@std/assert';

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

Deno.test('Fable 5 stays authorized on explicit owner request but is never auto-selected', () => {
  const fableRoutes = CANONICAL_ROUTE_POLICY.filter((route) => route.model === 'fable-5');
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

Deno.test('canonical evaluator lanes bind each authored family to its opposite-family route', () => {
  const at = new Date('2026-07-13T00:00:00Z');
  const claudeReview = resolveCanonicalOrdinaryReviewRoute({
    authorFamily: 'anthropic',
    generatorSession: { ...session, agent: 'claude', sessionId: 'claude-generator' },
    evaluatorSession: { ...session, agent: 'codex', sessionId: 'codex-evaluator' },
  }, at);
  const codexReview = resolveCanonicalOrdinaryReviewRoute({
    authorFamily: 'openai',
    generatorSession: { ...session, agent: 'codex', sessionId: 'codex-generator' },
    evaluatorSession: { ...session, agent: 'claude', sessionId: 'claude-evaluator' },
  }, at);
  equal([claudeReview.lane, claudeReview.model, claudeReview.effort], [
    'review_claude',
    'gpt-5.6-sol',
    'xhigh',
  ]);
  equal([codexReview.lane, codexReview.model, codexReview.effort], [
    'review_codex',
    'opus-4.8',
    'high',
  ]);
});

Deno.test('canonical evaluator resolution rejects self-certification', () => {
  const at = new Date('2026-07-13T00:00:00Z');
  const generatorSession = { ...session, agent: 'codex', sessionId: 'generator' } as const;
  assertThrows(() =>
    resolveCanonicalOrdinaryReviewRoute({
      authorFamily: 'openai',
      generatorSession,
      evaluatorSession: generatorSession,
    }, at)
  );
  assertThrows(() =>
    resolveCanonicalOrdinaryReviewRoute({
      authorFamily: 'openai',
      generatorSession,
      evaluatorSession: { ...session, agent: 'codex', sessionId: 'same-family-evaluator' },
    }, at)
  );
});

Deno.test('formal evaluator is Claude OpenRouter with the supported Qwen evaluation preset', () => {
  const route = resolveCanonicalFormalEvaluatorRoute({
    authorFamily: 'openai',
    generatorSession: { ...session, agent: 'codex', sessionId: 'codex-generator' },
    evaluatorSession: { ...session, agent: 'claude', sessionId: 'open-evaluator' },
  }, new Date('2026-07-13T00:00:00Z'));
  equal([
    route.lane,
    route.agent,
    route.provider,
    route.profileId,
    route.presetId,
    route.model,
    route.evaluatorModelPolicy,
  ], [
    'formal_evaluation',
    'claude',
    'openrouter',
    'claude-openrouter',
    'claude-evaluator-qwen-3-7-max',
    OPENROUTER_MODEL_IDS.qwen,
    'open_only',
  ]);
});

Deno.test('formal evaluator rejects closed models and reused generator sessions', () => {
  const at = new Date('2026-07-13T00:00:00Z');
  const generatorSession = { ...session, agent: 'codex', sessionId: 'codex-generator' } as const;
  const evaluatorSession = { ...session, agent: 'claude', sessionId: 'open-evaluator' } as const;
  const route = resolveCanonicalRoute('formal_evaluation', at);
  assertThrows(() =>
    resolveCanonicalFormalEvaluatorRoute({
      authorFamily: 'openai',
      generatorSession,
      evaluatorSession,
      route: { ...route, model: MODEL_IDS.opus },
    }, at)
  );
  assertThrows(() =>
    resolveCanonicalFormalEvaluatorRoute({
      authorFamily: 'openai',
      generatorSession,
      evaluatorSession: generatorSession,
    }, at)
  );
});
