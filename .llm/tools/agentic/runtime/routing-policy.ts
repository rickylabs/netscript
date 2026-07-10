/** Pure policy data and guards for quota fallback route selection. */

import type { RouteIdentity, SessionIdentity } from './contract.ts';

export const MODEL_FAMILIES = ['anthropic', 'openai', 'google', 'other'] as const;
export type ModelFamily = typeof MODEL_FAMILIES[number];

export const ROUTING_LANE_PURPOSES = [
  'orchestration',
  'implementation',
  'analysis',
  'documentation',
  'claude_workflow',
  'research_extraction',
  'evaluation',
] as const;
export type RoutingLanePurpose = typeof ROUTING_LANE_PURPOSES[number];

export const ROUTING_LANES = [
  'normal_implementation',
  'fast_iteration',
  'deep_analysis',
  'planning_decisions',
  'documentation_review',
  'claude_workflow',
  'research_extraction',
  'mobile_orchestration',
  'review_claude',
] as const;
export type RoutingLane = typeof ROUTING_LANES[number];

export const SUBSCRIPTION_STATES = ['included', 'outside_plan'] as const;
export type SubscriptionState = typeof SUBSCRIPTION_STATES[number];

export interface CanonicalRoutePolicy {
  readonly lane: RoutingLane;
  readonly purpose: RoutingLanePurpose;
  readonly agent: RouteIdentity['agent'];
  readonly provider: RouteIdentity['provider'];
  readonly model: string;
  readonly effort: RouteIdentity['effort'];
  readonly condition?: string;
  readonly effectiveFrom?: string;
  readonly effectiveThrough?: string;
  readonly subscriptionState?: SubscriptionState;
  readonly requiresExplicitApproval?: boolean;
}

/** Canonical machine-readable route bindings rendered by the harness lane-policy document. */
export const CANONICAL_ROUTE_POLICY: readonly CanonicalRoutePolicy[] = [
  {
    lane: 'normal_implementation',
    purpose: 'implementation',
    agent: 'codex',
    provider: 'openai',
    model: 'gpt-5.6-sol',
    effort: 'medium',
  },
  {
    lane: 'fast_iteration',
    purpose: 'implementation',
    agent: 'codex',
    provider: 'openai',
    model: 'gpt-5.6-luna',
    effort: 'max',
  },
  {
    lane: 'deep_analysis',
    purpose: 'analysis',
    agent: 'codex',
    provider: 'openai',
    model: 'gpt-5.6-sol',
    effort: 'xhigh',
    condition: 'primary',
  },
  {
    lane: 'deep_analysis',
    purpose: 'analysis',
    agent: 'claude',
    provider: 'anthropic',
    model: 'fable-5',
    effort: 'max',
    condition: 'fallback_only_after_codex_quota_exhausted',
  },
  {
    lane: 'planning_decisions',
    purpose: 'orchestration',
    agent: 'claude',
    provider: 'anthropic',
    model: 'fable-5',
    effort: 'medium',
    condition: 'temporary_owner_override',
    effectiveThrough: '2026-07-12',
  },
  {
    lane: 'planning_decisions',
    purpose: 'orchestration',
    agent: 'codex',
    provider: 'openai',
    model: 'gpt-5.6-sol',
    effort: 'max',
    condition: 'dated_transition',
    effectiveFrom: '2026-07-13',
  },
  {
    lane: 'documentation_review',
    purpose: 'documentation',
    agent: 'claude',
    provider: 'anthropic',
    model: 'opus-4.8',
    effort: 'high',
  },
  {
    lane: 'claude_workflow',
    purpose: 'claude_workflow',
    agent: 'claude',
    provider: 'anthropic',
    model: 'opus-4.8',
    effort: 'low',
  },
  {
    lane: 'research_extraction',
    purpose: 'research_extraction',
    agent: 'antigravity',
    provider: 'google',
    model: 'agy',
    effort: 'low',
  },
  {
    lane: 'mobile_orchestration',
    purpose: 'orchestration',
    agent: 'claude',
    provider: 'anthropic',
    model: 'fable-5',
    effort: 'low',
    condition: 'when_subscription_includes_fable',
    subscriptionState: 'included',
  },
  {
    lane: 'mobile_orchestration',
    purpose: 'orchestration',
    agent: 'claude',
    provider: 'anthropic',
    model: 'fable-5',
    effort: 'high',
    condition: 'exceptional_paid_on_demand',
    subscriptionState: 'outside_plan',
    requiresExplicitApproval: true,
  },
  {
    lane: 'review_claude',
    purpose: 'evaluation',
    agent: 'codex',
    provider: 'openai',
    model: 'gpt-5.6-sol',
    effort: 'xhigh',
  },
] as const;

/** Resolves dated routes without silently retaining an expired temporary override. */
export function resolveCanonicalRoute(lane: RoutingLane, at: Date): CanonicalRoutePolicy {
  const day = at.toISOString().slice(0, 10);
  const matches = CANONICAL_ROUTE_POLICY.filter((route) =>
    route.lane === lane && (!route.effectiveFrom || day >= route.effectiveFrom) &&
    (!route.effectiveThrough || day <= route.effectiveThrough)
  );
  const primary = matches.find((route) =>
    route.condition !== 'fallback_only_after_codex_quota_exhausted' &&
    route.condition !== 'exceptional_paid_on_demand'
  );
  if (!primary) throw new Error(`no canonical route for ${lane} at ${day}`);
  return primary;
}

export interface FallbackCandidate {
  readonly route: RouteIdentity;
  readonly family: ModelFamily;
  readonly purpose: RoutingLanePurpose;
  readonly available: boolean;
  readonly subscriptionState: SubscriptionState;
  readonly requiresExplicitApproval: boolean;
  readonly higherEffortEscalation: boolean;
  readonly priority: number;
  readonly requiresCodexQuotaExhaustion?: boolean;
}

export interface RoutingPolicyContext {
  readonly purpose: RoutingLanePurpose;
  readonly session: SessionIdentity;
  readonly authorFamily?: ModelFamily;
  readonly explicitPaidApproval: boolean;
  readonly explicitEffortEscalation: boolean;
  readonly fallbackDepth: number;
  readonly maxFallbackDepth: number;
  readonly failureCode?: 'quota_exhausted' | 'rate_limited' | 'provider_unavailable';
}

export type FallbackSelection =
  | Readonly<{
    status: 'selected';
    candidate: FallbackCandidate;
    notificationRequired: boolean;
  }>
  | Readonly<{
    status: 'blocked';
    reason:
      | 'turn_boundary_required'
      | 'fallback_depth_exceeded'
      | 'opposite_family_unavailable'
      | 'approval_required'
      | 'route_unavailable';
  }>;

function candidateAllowed(
  candidate: FallbackCandidate,
  context: RoutingPolicyContext,
): boolean {
  if (!candidate.available || candidate.purpose !== context.purpose) return false;
  if (candidate.requiresCodexQuotaExhaustion && context.failureCode !== 'quota_exhausted') {
    return false;
  }
  if (context.purpose === 'evaluation' && candidate.family === context.authorFamily) return false;
  if (
    (candidate.subscriptionState === 'outside_plan' || candidate.requiresExplicitApproval) &&
    !context.explicitPaidApproval
  ) return false;
  if (candidate.higherEffortEscalation && !context.explicitEffortEscalation) return false;
  return true;
}

/** Selects the first approved fallback without mutating route defaults or process state. */
export function selectFallbackCandidate(
  candidates: readonly FallbackCandidate[],
  context: RoutingPolicyContext,
): FallbackSelection {
  if (context.session.boundary === 'active') {
    return { status: 'blocked', reason: 'turn_boundary_required' };
  }
  if (context.fallbackDepth >= context.maxFallbackDepth) {
    return { status: 'blocked', reason: 'fallback_depth_exceeded' };
  }
  const purposeCandidates = candidates.filter((candidate) =>
    candidate.available && candidate.purpose === context.purpose
  );
  if (
    context.purpose === 'evaluation' &&
    !purposeCandidates.some((candidate) => candidate.family !== context.authorFamily)
  ) return { status: 'blocked', reason: 'opposite_family_unavailable' };

  const selected = purposeCandidates
    .filter((candidate) => candidateAllowed(candidate, context))
    .toSorted((left, right) => left.priority - right.priority)[0];
  if (selected) {
    return {
      status: 'selected',
      candidate: selected,
      notificationRequired: selected.route.mobileRequired !== true,
    };
  }
  const approvalBlocked = purposeCandidates.some((candidate) =>
    candidate.subscriptionState === 'outside_plan' || candidate.requiresExplicitApproval ||
    candidate.higherEffortEscalation
  );
  return {
    status: 'blocked',
    reason: approvalBlocked ? 'approval_required' : 'route_unavailable',
  };
}
