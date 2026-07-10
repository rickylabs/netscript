import type { RouteIdentity } from './contract.ts';
import {
  CANONICAL_ROUTE_POLICY,
  type FallbackCandidate,
  resolveCanonicalRoute,
  type RoutingPolicyContext,
  selectFallbackCandidate,
} from './routing-policy.ts';

function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`actual ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
  }
}

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

Deno.test('dated planning override changes from Fable medium to Sol max on 2026-07-13', () => {
  const sunday = resolveCanonicalRoute('planning_decisions', new Date('2026-07-12T23:59:59Z'));
  equal([sunday.model, sunday.effort], ['fable-5', 'medium']);
  const monday = resolveCanonicalRoute('planning_decisions', new Date('2026-07-13T00:00:00Z'));
  equal([monday.model, monday.effort], ['gpt-5.6-sol', 'max']);
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
