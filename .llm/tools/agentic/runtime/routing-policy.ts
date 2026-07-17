/** Pure policy data and guards for quota fallback route selection. */

import type { RouteIdentity, SessionIdentity } from './contract.ts';
import {
  MODEL_IDS,
  OPEN_EVALUATOR_MODEL_IDS,
  OPENCODE_MODEL_IDS,
  OPENROUTER_MODEL_IDS,
} from '../config/models.ts';
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
  'docs_audit',
  'docs_polish',
] as const;
export type RoutingLanePurpose = typeof ROUTING_LANE_PURPOSES[number];

export const ROUTING_LANES = [
  'light_implementation',
  'normal_implementation',
  'complex_implementation',
  'fast_iteration',
  'deep_analysis',
  'planning_decisions',
  'major_ui_ux_design',
  'major_ui_ux_adversarial_review',
  'adversarial_design_eval',
  'documentation_review',
  'docs_audit',
  'docs_polish',
  'chore_code',
  'claude_workflow',
  'research_extraction',
  'formal_evaluation',
  'review_claude',
  'review_codex_light',
  'review_codex',
  'review_codex_complex',
  'review_codex_fast',
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
    lane: 'light_implementation',
    purpose: 'implementation',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'low',
    condition: 'small_scoped_slices',
  },
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
    condition: 'large_or_cross_cutting_slices',
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
  // --- Single-pass audit of a Claude-generated docs changeset ---------------------
  // Owner-revised 2026-07-17. The whole changeset is audited in ONE pass by
  // Codex · Sol · medium — OPPOSITE-FAMILY to the Claude generators, which
  // restores family diversity for generated-docs accuracy. Use `high` for large
  // changesets (auditor discretion, stated in workflow/doc-audit.md). Every accuracy
  // gate is executed by the auditor (commands run, `deno doc` inspected) — verdicts
  // from evidence, never from the generator's claims. There is NO cross-family
  // fallback: the audit is defined by its opposite-family transport, so a fallback
  // would defeat the lane. Profile: workflow/doc-audit.md.
  {
    lane: 'docs_audit',
    purpose: 'docs_audit',
    agent: 'codex',
    provider: 'openai',
    model: MODEL_IDS.codexSol,
    effort: 'medium',
    condition: 'single_pass_opposite_family_audit_of_generated_docs_changeset',
  },
  // --- Final edit-only prose-polish pass, after audit + fixes land -----------------
  // Owner-revised 2026-07-17. Runs LAST in the docs pipeline: Claude · Fable 5 ·
  // medium edits prose in place for voice/flow/precision. It must not re-author
  // documents from scratch or change technical claims — any accuracy doubt returns
  // to the docs_audit lane. Fallback chain (depth 2): token-limit → Opus 4.8 ·
  // xhigh (Claude-family); and only if NO Claude-agent surface is available at all,
  // GLM 5.2 · xhigh over the `claude-openrouter` transport the design lanes use.
  // GLM is a polish-fallback-of-last-resort ONLY here — this does not widen GLM
  // beyond its design scope elsewhere. Profile: workflow/doc-audit.md.
  {
    lane: 'docs_polish',
    purpose: 'docs_polish',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'medium',
    subscriptionState: 'included',
    condition: 'edit_only_prose_polish_after_audit',
  },
  {
    lane: 'docs_polish',
    purpose: 'docs_polish',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'xhigh',
    condition: 'fallback_on_fable_token_limit',
  },
  {
    lane: 'docs_polish',
    purpose: 'docs_polish',
    agent: 'claude',
    provider: 'openrouter',
    profileId: MAJOR_UI_UX_PRESET.profileId,
    presetId: MAJOR_UI_UX_PRESET.id,
    model: OPENROUTER_MODEL_IDS.glm,
    effort: 'xhigh',
    condition: 'fallback_no_claude_surface',
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
  // --- Adversarial review of Codex/OpenAI-authored work, effort-paired ------------
  // Owner-ratified 2026-07-16, on the PR #784 doctrine: Fable 5 is back on the
  // Anthropic plan, in-plan and auto-selectable — the prior Opus substitution is
  // retired for these review lanes. Fable is reserved for medium+ pairings; every
  // fallback stays Claude-family so opposite-family review is never traded away.
  {
    lane: 'review_codex_light',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'high',
    condition: 'pairs_with_light_implementation',
    evaluatesFamily: 'openai',
  },
  {
    lane: 'review_codex_light',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.sonnet,
    effort: 'high',
    condition: 'token_limit_fallback',
    evaluatesFamily: 'openai',
  },
  {
    lane: 'review_codex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'low',
    subscriptionState: 'included',
    evaluatesFamily: 'openai',
  },
  {
    lane: 'review_codex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'low',
    condition: 'token_limit_fallback',
    evaluatesFamily: 'openai',
  },
  {
    lane: 'review_codex_complex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.fable,
    effort: 'medium',
    subscriptionState: 'included',
    evaluatesFamily: 'openai',
  },
  {
    lane: 'review_codex_complex',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'medium',
    condition: 'token_limit_fallback',
    evaluatesFamily: 'openai',
  },
  {
    lane: 'review_codex_fast',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.opus,
    effort: 'medium',
    condition: 'pairs_with_fast_iteration',
    evaluatesFamily: 'openai',
  },
  {
    lane: 'review_codex_fast',
    purpose: 'evaluation',
    agent: 'claude',
    provider: 'anthropic',
    model: MODEL_IDS.sonnet,
    effort: 'high',
    condition: 'token_limit_fallback',
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
  const lane = assignment.authorFamily === 'anthropic'
    ? 'review_claude'
    : assignment.authorFamily === 'openai'
    ? 'review_codex'
    : undefined;
  if (!lane) {
    throw new Error(
      `no canonical evaluator route for ${assignment.authorFamily} at ${
        at.toISOString().slice(0, 10)
      }`,
    );
  }
  const route = resolveCanonicalRoute(lane, at);
  if (route.agent !== assignment.evaluatorSession.agent) {
    throw new Error(`canonical evaluator route ${lane} does not match the evaluator session`);
  }
  return route;
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
    !route.condition?.startsWith('fallback') &&
    route.condition !== 'exceptional_paid_on_demand' &&
    route.condition !== 'token_limit_fallback'
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
