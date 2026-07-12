/** Pure policy data and guards for quota fallback route selection. */

import type { RouteIdentity, SessionIdentity } from './contract.ts';
import { MODEL_IDS, OPEN_EVALUATOR_MODEL_IDS } from '../config/models.ts';
import { OPENROUTER_PRESETS, type OpenRouterPresetId } from './provider-profiles.ts';

export const MODEL_FAMILIES = ['anthropic', 'openai', 'google', 'open', 'other'] as const;
export type ModelFamily = typeof MODEL_FAMILIES[number];

export const ROUTING_LANE_PURPOSES = [
  'orchestration',
  'implementation',
  'analysis',
  'design',
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
  'major_ui_ux_design',
  'major_ui_ux_adversarial_review',
  'documentation_review',
  'claude_workflow',
  'research_extraction',
  'mobile_orchestration',
  'formal_evaluation',
  'review_claude',
  'review_codex',
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
  readonly profileId?: RouteIdentity['profileId'];
  readonly presetId?: OpenRouterPresetId;
  readonly condition?: string;
  readonly effectiveFrom?: string;
  readonly effectiveThrough?: string;
  readonly subscriptionState?: SubscriptionState;
  readonly requiresExplicitApproval?: boolean;
  readonly evaluatesFamily?: ModelFamily;
  readonly evaluatorModelPolicy?: 'open_only';
}

const MAJOR_UI_UX_PRESET = OPENROUTER_PRESETS['claude-design-glm-5-2'];
const FORMAL_EVALUATOR_PRESET = OPENROUTER_PRESETS['claude-evaluator-qwen-3-7-max'];

/** Canonical machine-readable route bindings rendered by the harness lane-policy document. */
export const CANONICAL_ROUTE_POLICY: readonly CanonicalRoutePolicy[] = [
  {
    lane: 'normal_implementation',
    purpose: 'implementation',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'medium',
  },
  {
    lane: 'fast_iteration',
    purpose: 'implementation',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexLuna,
    effort: 'max',
  },
  {
    lane: 'deep_analysis',
    purpose: 'analysis',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'xhigh',
    condition: 'primary',
  },
  {
    lane: 'deep_analysis',
    purpose: 'analysis',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'max',
    condition: 'fallback_only_after_codex_quota_exhausted',
    subscriptionState: 'outside_plan',
    requiresExplicitApproval: true,
  },
  {
    lane: 'planning_decisions',
    purpose: 'orchestration',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'medium',
    condition: 'temporary_while_fable_outside_subscription',
  },
  {
    lane: 'planning_decisions',
    purpose: 'orchestration',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'medium',
    condition: 'exceptional_paid_on_demand',
    subscriptionState: 'outside_plan',
    requiresExplicitApproval: true,
  },
  {
    lane: 'major_ui_ux_design',
    purpose: 'design',
    agent: 'claude',
    provider: 'openrouter',
    profileId: MAJOR_UI_UX_PRESET.profileId,
    presetId: MAJOR_UI_UX_PRESET.id,
    model: MAJOR_UI_UX_PRESET.model,
    effort: MAJOR_UI_UX_PRESET.effort,
    condition: 'lead_route_for_major_ui_ux_work',
  },
  {
    lane: 'major_ui_ux_adversarial_review',
    purpose: 'design',
    agent: 'claude',
    provider: 'openrouter',
    profileId: MAJOR_UI_UX_PRESET.profileId,
    presetId: MAJOR_UI_UX_PRESET.id,
    model: MAJOR_UI_UX_PRESET.model,
    effort: MAJOR_UI_UX_PRESET.effort,
    condition: 'required_before_merge_when_glm_not_lead',
  },
  {
    lane: 'documentation_review',
    purpose: 'documentation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'high',
    condition: 'excludes_major_ui_ux_work',
  },
  {
    lane: 'claude_workflow',
    purpose: 'claude_workflow',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'low',
  },
  {
    lane: 'research_extraction',
    purpose: 'research_extraction',
    agent: 'antigravity',
    provider: 'google',
    model: MODEL_IDS.antigravity,
    effort: 'low',
  },
  {
    lane: 'mobile_orchestration',
    purpose: 'orchestration',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'medium',
    condition: 'temporary_while_fable_outside_subscription',
  },
  {
    lane: 'mobile_orchestration',
    purpose: 'orchestration',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'high',
    condition: 'exceptional_paid_on_demand',
    subscriptionState: 'outside_plan',
    requiresExplicitApproval: true,
  },
  {
    lane: 'formal_evaluation',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'openrouter',
    profileId: FORMAL_EVALUATOR_PRESET.profileId,
    presetId: FORMAL_EVALUATOR_PRESET.id,
    model: FORMAL_EVALUATOR_PRESET.model,
    effort: FORMAL_EVALUATOR_PRESET.effort,
    evaluatorModelPolicy: 'open_only',
  },
  {
    lane: 'review_claude',
    purpose: 'evaluation',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'xhigh',
    evaluatesFamily: 'anthropic',
  },
  {
    lane: 'review_codex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'high',
    evaluatesFamily: 'openai',
  },
] as const;

export interface EvaluatorAssignment {
  readonly authorFamily: Exclude<ModelFamily, 'other'>;
  readonly generatorSession: SessionIdentity;
  readonly evaluatorSession: SessionIdentity;
}

export interface FormalEvaluatorAssignment {
  readonly authorFamily: Exclude<ModelFamily, 'open' | 'other'>;
  readonly generatorSession: SessionIdentity;
  readonly evaluatorSession: SessionIdentity;
  readonly route?: CanonicalRoutePolicy;
}

function sessionFamily(session: SessionIdentity): ModelFamily {
  if (session.agent === 'claude') return 'anthropic';
  if (session.agent === 'codex') return 'openai';
  return 'google';
}

/** Resolves an ordinary opposite-family review while rejecting self-certification. */
export function resolveCanonicalOrdinaryReviewRoute(
  assignment: EvaluatorAssignment,
  at: Date,
): CanonicalRoutePolicy {
  if (assignment.generatorSession.sessionId === assignment.evaluatorSession.sessionId) {
    throw new Error('generator and evaluator sessions must differ');
  }
  if (sessionFamily(assignment.generatorSession) !== assignment.authorFamily) {
    throw new Error('generator session family must match the authored slice');
  }
  const evaluatorFamily = sessionFamily(assignment.evaluatorSession);
  if (evaluatorFamily === assignment.authorFamily) {
    throw new Error('evaluator must use the opposite model family');
  }
  const route = CANONICAL_ROUTE_POLICY.find((candidate) =>
    candidate.purpose === 'evaluation' &&
    candidate.evaluatesFamily === assignment.authorFamily &&
    candidate.agent === assignment.evaluatorSession.agent
  );
  if (!route) {
    throw new Error(
      `no canonical evaluator route for ${assignment.authorFamily} at ${
        at.toISOString().slice(0, 10)
      }`,
    );
  }
  return resolveCanonicalRoute(route.lane, at);
}

/** Resolves the formal open-model evaluator and rejects paid closed-model routes. */
export function resolveCanonicalFormalEvaluatorRoute(
  assignment: FormalEvaluatorAssignment,
  at: Date,
): CanonicalRoutePolicy {
  if (assignment.generatorSession.sessionId === assignment.evaluatorSession.sessionId) {
    throw new Error('generator and evaluator sessions must differ');
  }
  if (sessionFamily(assignment.generatorSession) !== assignment.authorFamily) {
    throw new Error('generator session family must match the authored slice');
  }
  const route = assignment.route ?? resolveCanonicalRoute('formal_evaluation', at);
  const preset = route.presetId ? OPENROUTER_PRESETS[route.presetId] : undefined;
  if (
    route.purpose !== 'evaluation' || route.agent !== 'claude' ||
    route.provider !== 'openrouter' || route.profileId !== 'claude-openrouter' ||
    route.evaluatorModelPolicy !== 'open_only' ||
    !OPEN_EVALUATOR_MODEL_IDS.some((model) => model === route.model) ||
    !preset || preset.purpose !== 'evaluation' || preset.model !== route.model ||
    preset.agenticTurn !== 'supported' || preset.reasoningTrace !== 'present'
  ) {
    throw new Error(
      'formal evaluator requires a supported Claude OpenRouter evaluation preset with an approved open model',
    );
  }
  return route;
}

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
