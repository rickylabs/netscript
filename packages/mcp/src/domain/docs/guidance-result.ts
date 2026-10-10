import {
  GUIDANCE_MAX_EXCERPT_CHARACTERS,
  GUIDANCE_MAX_WHY_CHARACTERS,
  type GuidanceRecommendation,
  type GuidanceRelatedLink,
  type GuidanceStage,
} from './guidance-contract.ts';
import { GUIDANCE_CONCEPTS, type GuidanceConcept } from './guidance-concepts.ts';
import type { RankedGuidanceSection } from './guidance-index.ts';
import type { ResolvedGuidanceLink } from './guidance-links.ts';
import type { IndexedGuidanceSection } from './guidance-parser.ts';
import { type GuidanceTerm, isGuidanceStopWord } from './guidance-terms.ts';

/** Select concept groups explicitly activated by natural-language aliases. */
export function activatedGuidanceConcepts(intent: string): readonly GuidanceConcept[] {
  return GUIDANCE_CONCEPTS.filter((concept) =>
    concept.aliases.some((alias) => intent.includes(alias))
  );
}

/** Build bounded related routes from the top lexical recommendations. */
export function collectGuidanceRelated(
  ranked: readonly RankedGuidanceSection[],
  linksOf: (entry: IndexedGuidanceSection) => readonly ResolvedGuidanceLink[],
): readonly GuidanceRelatedLink[] {
  const related = new Map<string, GuidanceRelatedLink>();
  for (const source of ranked.slice(0, 8)) {
    for (const { relation, target } of linksOf(source.entry)) {
      related.set(`${relation}:${target.id}`, {
        relation,
        slug: target.slug,
        section: target.section,
        heading: target.heading,
      });
    }
  }
  return [...related.values()];
}

/** Convert a ranked section into its public bounded recommendation. */
export function toGuidanceRecommendation(
  entry: IndexedGuidanceSection,
  matchedTerms: readonly GuidanceTerm[],
): GuidanceRecommendation {
  const visibleTerms = matchedTerms.filter((term) => !isGuidanceStopWord(term)).slice(0, 4)
    .map((term) => term.text).join(', ');
  const why = visibleTerms
    ? `Matches the task through: ${visibleTerms}.`
    : 'Matches the requested NetScript workflow.';
  return {
    stage: inferStage(entry.heading),
    slug: entry.slug,
    section: entry.section,
    heading: entry.heading,
    why: why.slice(0, GUIDANCE_MAX_WHY_CHARACTERS),
    excerpt: proseExcerpt(entry.content),
    code: entry.code,
  };
}

/** Stable identity ordering after numeric score comparison. */
export function compareGuidanceSectionIdentity(
  left: IndexedGuidanceSection,
  right: IndexedGuidanceSection,
): number {
  return left.slug.localeCompare(right.slug) || left.section.localeCompare(right.section);
}

/** Collapse prose or caller intent to a bounded-response-friendly line. */
export function guidanceOneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function proseExcerpt(content: string): string {
  return guidanceOneLine(
    content.replace(/```[\s\S]*?```/g, ' ').replace(/\{\{[\s\S]*?\}\}/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
  ).slice(0, GUIDANCE_MAX_EXCERPT_CHARACTERS);
}

function inferStage(heading: string): GuidanceStage {
  if (/\b(?:before|prerequisites?|requirements?|start)\b/i.test(heading)) {
    return 'prerequisite';
  }
  if (/\b(?:verify|verification|test|check|validate)\b/i.test(heading)) return 'verification';
  return 'implementation';
}
