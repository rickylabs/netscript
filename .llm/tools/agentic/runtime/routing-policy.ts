/** Pure policy data and guards for quota fallback route selection. */

import type { RouteIdentity, SessionIdentity } from './contract.ts';
import { MODEL_IDS, OPENCODE_MODEL_IDS } from '../config/models.ts';
import { OPENROUTER_PRESETS, type OpenRouterPresetId } from './provider-profiles.ts';

export const MODEL_FAMILIES = ['anthropic', 'openai', 'google', 'other'] as const;
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
  'complex_implementation',
  'fast_iteration',
  'deep_analysis',
  'planning_decisions',
  'major_ui_ux_design',
  'major_ui_ux_adversarial_review',
  'adversarial_design_eval',
  'documentation_review',
  'chore_code',
  'claude_workflow',
  'research_extraction',
  'review_claude',
  'review_codex',
  'review_codex_complex',
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
}

const MAJOR_UI_UX_PRESET = OPENROUTER_PRESETS['claude-design-glm-5-2'];

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
    lane: 'complex_implementation',
    purpose: 'implementation',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'high',
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
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'low',
    subscriptionState: 'included',
    condition: 'default_complex_decision_subagent',
  },
  {
    lane: 'deep_analysis',
    purpose: 'analysis',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'high',
    condition: 'fallback_on_fable_token_limit',
  },
  {
    lane: 'planning_decisions',
    purpose: 'orchestration',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'low',
    subscriptionState: 'included',
    condition: 'default_orchestrator',
  },
  {
    lane: 'planning_decisions',
    purpose: 'orchestration',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'high',
    condition: 'fallback_on_fable_token_limit',
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
    lane: 'adversarial_design_eval',
    purpose: 'evaluation',
    agent: 'opencode',
    provider: 'openrouter',
    model: OPENCODE_MODEL_IDS.visionEval,
    effort: 'high',
    condition: 'vision_evidence_complements_required_glm_design_review',
  },
  {
    lane: 'documentation_review',
    purpose: 'documentation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.sonnet,
    effort: 'high',
    subscriptionState: 'included',
    condition: 'docs_cleanup_easy_chores',
  },
  {
    lane: 'documentation_review',
    purpose: 'documentation',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexLuna,
    effort: 'high',
    condition: 'fallback_on_sonnet_token_limit',
  },
  {
    lane: 'chore_code',
    purpose: 'implementation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'medium',
    subscriptionState: 'included',
    condition: 'delegated_code_chores',
  },
  {
    lane: 'chore_code',
    purpose: 'implementation',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexLuna,
    effort: 'max',
    condition: 'fallback_on_opus_token_limit',
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
    lane: 'review_claude',
    purpose: 'evaluation',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'xhigh',
    condition: 'opposite_family_review_of_claude_work',
  },
  {
    lane: 'review_codex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'low',
    subscriptionState: 'included',
    condition: 'adversarial_review_of_normal_codex_work',
  },
  {
    lane: 'review_codex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'low',
    condition: 'fallback_on_fable_token_limit',
  },
  {
    lane: 'review_codex_complex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'high',
    subscriptionState: 'included',
    condition: 'adversarial_review_of_complex_codex_work',
  },
  {
    lane: 'review_codex_complex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'high',
    condition: 'fallback_on_fable_token_limit',
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
    !route.condition?.startsWith('fallback') &&
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
