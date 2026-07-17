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
import { MODEL_IDS, OPENCODE_MODEL_IDS, OPENROUTER_MODEL_IDS } from '../config/models.ts';
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
    'medium',
  ]);
  // The token-limit fallback for a Codex review stays Claude-family (Opus), never
  // the Codex author's own OpenAI family — opposite-family review is preserved.
  for (const lane of ['review_codex', 'review_codex_complex'] as const) {
    const fallback = CANONICAL_ROUTE_POLICY.find((route) =>
      route.lane === lane && route.condition === 'token_limit_fallback'
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

Deno.test('canonical evaluator lanes bind each authored family to its opposite-family route', () => {
  const at = new Date('2026-07-16T00:00:00Z');
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
    'fable-5',
    'low',
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

Deno.test('docs_audit is an opposite-family Codex Sol medium single pass with NO cross-family fallback', () => {
  const at = new Date('2026-07-17T00:00:00Z');
  const route = resolveCanonicalRoute('docs_audit', at);
  equal([route.agent, route.provider, route.model, route.effort], [
    'codex',
    'openai',
    'gpt-5.6-sol',
    'medium',
  ]);
  equal(route.purpose, 'docs_audit');
  // The audit is defined by its opposite-family (Codex) transport reviewing
  // Claude-generated docs, so there is exactly one docs_audit route and no fallback.
  const auditRoutes = CANONICAL_ROUTE_POLICY.filter((entry) => entry.lane === 'docs_audit');
  equal(auditRoutes.length, 1);
  equal(auditRoutes.every((entry) => entry.agent === 'codex' && entry.provider === 'openai'), true);
});

Deno.test('docs_polish is Claude Fable 5 medium edit-only, with an ordered depth-2 fallback chain', () => {
  const at = new Date('2026-07-17T00:00:00Z');
  const route = resolveCanonicalRoute('docs_polish', at);
  equal([route.agent, route.provider, route.model, route.effort], [
    'claude',
    'anthropic',
    'fable-5',
    'medium',
  ]);
  equal(route.purpose, 'docs_polish');
  equal(route.subscriptionState, 'included');
  equal(route.requiresExplicitApproval ?? false, false);
  // The primary is never a fallback route.
  equal(route.condition, 'edit_only_prose_polish_after_audit');

  // Fallback chain, in order: (1) token-limit → Opus 4.8 · xhigh (Claude-family),
  // (2) no-Claude-surface → GLM 5.2 · xhigh over the claude-openrouter transport.
  const chain = CANONICAL_ROUTE_POLICY.filter((entry) =>
    entry.lane === 'docs_polish' && entry.condition !== 'edit_only_prose_polish_after_audit'
  );
  equal(chain.length, 2);
  const [tokenLimit, noClaude] = chain;
  equal(tokenLimit.condition, 'fallback_on_fable_token_limit');
  equal([tokenLimit.agent, tokenLimit.provider, tokenLimit.model, tokenLimit.effort], [
    'claude',
    'anthropic',
    'opus-4.8',
    'xhigh',
  ]);
  equal(noClaude.condition, 'fallback_no_claude_surface');
  equal([noClaude.agent, noClaude.provider, noClaude.model, noClaude.effort], [
    'claude',
    'openrouter',
    OPENROUTER_MODEL_IDS.glm,
    'xhigh',
  ]);
  // The last-resort GLM fallback rides the same design-lane claude-openrouter transport.
  equal(noClaude.profileId, 'claude-openrouter');
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
