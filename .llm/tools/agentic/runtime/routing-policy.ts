/** Pure policy data and guards for quota fallback route selection. */

import type { RouteIdentity, SessionIdentity } from './contract.ts';

export const MODEL_FAMILIES = ['anthropic', 'openai', 'google', 'other'] as const;
export type ModelFamily = typeof MODEL_FAMILIES[number];

export const ROUTING_LANE_PURPOSES = ['orchestration', 'implementation', 'evaluation'] as const;
export type RoutingLanePurpose = typeof ROUTING_LANE_PURPOSES[number];

export const SUBSCRIPTION_STATES = ['included', 'outside_plan'] as const;
export type SubscriptionState = typeof SUBSCRIPTION_STATES[number];

export interface FallbackCandidate {
  readonly route: RouteIdentity;
  readonly family: ModelFamily;
  readonly purpose: RoutingLanePurpose;
  readonly available: boolean;
  readonly subscriptionState: SubscriptionState;
  readonly requiresExplicitApproval: boolean;
  readonly higherEffortEscalation: boolean;
  readonly priority: number;
}

export interface RoutingPolicyContext {
  readonly purpose: RoutingLanePurpose;
  readonly session: SessionIdentity;
  readonly authorFamily?: ModelFamily;
  readonly explicitPaidApproval: boolean;
  readonly explicitEffortEscalation: boolean;
  readonly fallbackDepth: number;
  readonly maxFallbackDepth: number;
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
