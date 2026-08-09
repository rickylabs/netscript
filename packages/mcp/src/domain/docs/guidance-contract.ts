/** Maximum natural-language intent characters accepted by `find_guidance`. */
export const GUIDANCE_MAX_INTENT_CHARACTERS = 500;

/** Maximum recommendations returned by one guidance response. */
export const GUIDANCE_MAX_RECOMMENDATIONS = 8;

/** Default recommendations returned when callers omit a limit. */
export const GUIDANCE_DEFAULT_RECOMMENDATIONS = 5;

/** Maximum cited code excerpts attached to one recommendation. */
export const GUIDANCE_MAX_CODE_EXCERPTS_PER_RECOMMENDATION = 2;

/** Maximum related documentation routes returned by one response. */
export const GUIDANCE_MAX_RELATED_LINKS = 8;

/** Maximum characters retained for one prose excerpt. */
export const GUIDANCE_MAX_EXCERPT_CHARACTERS = 600;

/** Maximum characters retained for one cited code excerpt. */
export const GUIDANCE_MAX_CODE_CHARACTERS = 1_600;

/** Maximum characters retained for one recommendation explanation. */
export const GUIDANCE_MAX_WHY_CHARACTERS = 240;

/** Maximum characters retained for low-confidence fallback guidance. */
export const GUIDANCE_MAX_FALLBACK_CHARACTERS = 320;

/** Ordered workflow stages used by guidance recommendations. */
export const GUIDANCE_STAGES = ['prerequisite', 'implementation', 'verification'] as const;

/** Confidence levels returned by the offline guidance index. */
export const GUIDANCE_CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;

/** Relations inferred from internal documentation links. */
export const GUIDANCE_LINK_RELATIONS = ['prerequisite', 'next', 'related'] as const;

/** Workflow position of one recommended section. */
export type GuidanceStage = (typeof GUIDANCE_STAGES)[number];

/** Confidence assigned to one bounded guidance result. */
export type GuidanceConfidence = (typeof GUIDANCE_CONFIDENCE_LEVELS)[number];

/** Meaning assigned to one internal documentation route. */
export type GuidanceLinkRelation = (typeof GUIDANCE_LINK_RELATIONS)[number];

/** Stable source identity for one documentation section. */
export interface GuidanceSectionCitation {
  /** Public document slug. */
  readonly slug: string;
  /** Stable heading fragment. */
  readonly section: string;
  /** Human-readable heading. */
  readonly heading: string;
}

/** Independently cited code excerpt. */
export interface GuidanceCodeExcerpt {
  /** Fence or Vento example language. */
  readonly language: string;
  /** Bounded code source. */
  readonly code: string;
  /** Section containing the example. */
  readonly source: GuidanceSectionCitation;
}

/** One ordered section recommendation. */
export interface GuidanceRecommendation extends GuidanceSectionCitation {
  /** Workflow position assigned to this section. */
  readonly stage: GuidanceStage;
  /** Bounded reason this section matches the caller's intent. */
  readonly why: string;
  /** Bounded supporting prose from the cited section. */
  readonly excerpt: string;
  /** Independently cited examples from the section. */
  readonly code: readonly GuidanceCodeExcerpt[];
}

/** One prerequisite, next-step, or related documentation route. */
export interface GuidanceRelatedLink extends GuidanceSectionCitation {
  /** Relationship inferred from the source link context. */
  readonly relation: GuidanceLinkRelation;
}

/** Bounded intent-aware guidance result. */
export interface GuidanceResult {
  /** Normalized caller intent. */
  readonly intent: string;
  /** Confidence supported by the indexed corpus. */
  readonly confidence: GuidanceConfidence;
  /** Ordered prerequisite → implementation → verification guidance. */
  readonly recommendations: readonly GuidanceRecommendation[];
  /** Bounded one-hop documentation routes. */
  readonly related: readonly GuidanceRelatedLink[];
  /** Honest next action when corpus support is weak. */
  readonly fallback?: string;
  /** Whether flow-level bounds removed or shortened content. */
  readonly truncated: boolean;
}
