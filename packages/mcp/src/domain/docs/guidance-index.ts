import type { GuidanceConfidence, GuidanceResult } from './guidance-contract.ts';
import type { DocsDocument } from './docs-corpus-port.ts';
import type { GuidanceConcept } from './guidance-concepts.ts';
import { type ResolvedGuidanceLink, resolveGuidanceLinks } from './guidance-links.ts';
import {
  type GuidanceSectionIdentity,
  type IndexedGuidanceSection,
  indexGuidanceDocuments,
} from './guidance-parser.ts';
import {
  guidanceContentTerms,
  type GuidanceTerm,
  GuidanceTermWeights,
  normalizeGuidanceToken,
  tokenizeGuidance,
  uniqueGuidanceTerms,
} from './guidance-terms.ts';
import {
  activatedGuidanceConcepts,
  collectGuidanceRelated,
  compareGuidanceSectionIdentity,
  guidanceOneLine,
  toGuidanceRecommendation,
} from './guidance-result.ts';

/** Numeric policy for deterministic section retrieval and one-hop routing. */
export interface GuidanceRankingPolicy {
  readonly k1: number;
  readonly b: number;
  readonly titleBoost: number;
  readonly headingBoost: number;
  readonly slugBoost: number;
  readonly derivedIdentityShare: number;
  readonly exactPhraseBoost: number;
  readonly conceptBoost: number;
  readonly linkBoost: number;
  readonly closeScoreGap: number;
  readonly commonDocumentRatio: number;
  readonly graphDepth: 1;
}

/** Locked deterministic retrieval policy approved by PLAN-EVAL. */
export const GUIDANCE_RANKING_POLICY: GuidanceRankingPolicy = Object.freeze({
  k1: 1.2,
  b: 0.75,
  titleBoost: 4,
  headingBoost: 6,
  slugBoost: 1,
  // An identity field that only shares a stem (`verified` for `verification`) earns half the boost
  // of one that carries the literal word, so derivational recall never outranks an exact heading.
  derivedIdentityShare: 0.5,
  exactPhraseBoost: 10,
  conceptBoost: 8,
  linkBoost: 2,
  // Tuned from observed headroom, not derived from the score scale: the measured candidate gap was
  // ≈0.3019801982 (≈0.1980198018 headroom), while regeneration moved scores by ≈0.0748587452.
  closeScoreGap: 0.5,
  // A stem in at least a fifth of all sections (`service`, `plugin`, `data`) is common.
  commonDocumentRatio: 0.2,
  graphDepth: 1,
});

/** Each activated concept with its stop-word-free content terms, resolved once per query. */
type ConceptTerms = ReadonlyMap<GuidanceConcept, readonly GuidanceTerm[]>;

/** One section scored for an intent, with the intent words that matched it. */
export interface RankedGuidanceSection {
  readonly entry: IndexedGuidanceSection;
  score: number;
  readonly matchedTerms: readonly GuidanceTerm[];
}

/** Immutable section-level parser, link graph, and deterministic ranker. */
export class GuidanceIndex {
  readonly #sections: readonly IndexedGuidanceSection[];
  readonly #weights: GuidanceTermWeights;
  readonly #links: ReadonlyMap<string, readonly ResolvedGuidanceLink[]>;
  readonly #searchable: ReadonlyMap<string, string>;
  readonly #averageLength: number;

  /** Parse current canonical documents into one shared offline index. */
  constructor(documents: Iterable<DocsDocument>) {
    this.#sections = indexGuidanceDocuments(documents).sort(compareGuidanceSectionIdentity);
    this.#weights = new GuidanceTermWeights(
      this.#sections.map((entry) => entry.tokens),
      GUIDANCE_RANKING_POLICY.commonDocumentRatio,
    );
    this.#links = resolveGuidanceLinks(this.#sections);
    this.#searchable = new Map(this.#sections.map((entry) => [
      entry.id,
      guidanceOneLine(`${entry.title} ${entry.heading} ${entry.content}`).toLocaleLowerCase(),
    ]));
    this.#averageLength = this.#sections.length === 0
      ? 1
      : this.#sections.reduce((total, entry) => total + entry.tokens.length, 0) /
        this.#sections.length;
  }

  /** Return bounded ordered guidance for a natural-language intent. */
  find(intent: string): GuidanceResult {
    const normalizedIntent = guidanceOneLine(intent).toLocaleLowerCase();
    const concepts = activatedGuidanceConcepts(normalizedIntent);
    // A concept's expansion obeys the same content-term rule as the intent: stop words such as
    // `what` and `will` in a concept's vocabulary neither score nor earn a concept bonus.
    const conceptTerms: ConceptTerms = new Map(
      concepts.map((concept) => [concept, guidanceContentTerms(concept.terms.join(' '))]),
    );
    const queryTerms = concepts.length > 0
      ? uniqueGuidanceTerms([...conceptTerms.values()].flat())
      : guidanceContentTerms(normalizedIntent);
    const ranked = this.#sections.map((entry) =>
      this.#rank(entry, normalizedIntent, queryTerms, conceptTerms)
    ).filter((entry): entry is RankedGuidanceSection => entry !== undefined);
    this.#applyLinkBoosts(ranked);
    orderGuidanceSections(ranked, concepts);
    const top = ranked[0];

    if (top === undefined) {
      return {
        intent: guidanceOneLine(intent),
        confidence: 'low',
        recommendations: [],
        related: [],
        fallback: 'No supported guidance matched this intent. Use search_docs with concrete terms.',
        truncated: false,
      };
    }

    const recommendations = ranked.map(({ entry, matchedTerms }) =>
      toGuidanceRecommendation(entry, matchedTerms)
    );
    const related = collectGuidanceRelated(ranked, (entry) => this.#links.get(entry.id) ?? []);
    const confidence = this.#confidence(top);
    return {
      intent: guidanceOneLine(intent),
      confidence,
      recommendations,
      related,
      ...(confidence === 'low'
        ? { fallback: 'Guidance support is weak. Confirm with search_docs before implementation.' }
        : {}),
      truncated: false,
    };
  }

  /**
   * Score confidence, capped at low when the top match rests only on common words.
   *
   * The cap applies with or without an activated concept: a curated route that matched nothing
   * distinctive is still weak evidence.
   */
  #confidence(top: RankedGuidanceSection): GuidanceConfidence {
    if (top.matchedTerms.every((term) => this.#weights.isCommon(term.stem))) return 'low';
    return top.score >= 24 ? 'high' : top.score >= 8 ? 'medium' : 'low';
  }

  #rank(
    entry: IndexedGuidanceSection,
    intent: string,
    queryTerms: readonly GuidanceTerm[],
    conceptTerms: ConceptTerms,
  ): RankedGuidanceSection | undefined {
    const concepts = [...conceptTerms.keys()];
    if (concepts.length > 0 && entry.level === 1) return undefined;
    const supportedConcepts = concepts.filter((concept) =>
      concept.requiredAnyTerms.some((term) => entry.tokenCounts.has(normalizeGuidanceToken(term)))
    );
    if (concepts.length > 0 && supportedConcepts.length === 0) return undefined;
    const lengthNorm = 1 - GUIDANCE_RANKING_POLICY.b +
      GUIDANCE_RANKING_POLICY.b * entry.tokens.length / this.#averageLength;
    let score = 0;
    const matchedTerms: GuidanceTerm[] = [];
    for (const term of queryTerms) {
      const frequency = entry.tokenCounts.get(term.stem) ?? 0;
      const identity = identityBoost(entry.identity, term);
      if (frequency === 0 && identity === 0) continue;
      matchedTerms.push(term);
      score += this.#weights.inverseFrequency(term.stem) * saturate(frequency, lengthNorm) +
        identity * this.#weights.rarity(term.stem);
    }
    if (intent.length >= 4 && this.#searchable.get(entry.id)?.includes(intent)) {
      score += GUIDANCE_RANKING_POLICY.exactPhraseBoost;
    }
    for (const concept of supportedConcepts) {
      const matchedConceptTerms = (conceptTerms.get(concept) ?? []).filter((term) =>
        entry.tokenCounts.has(term.stem)
      ).length;
      score += matchedConceptTerms * GUIDANCE_RANKING_POLICY.conceptBoost;
    }
    return score > 0 ? { entry, score, matchedTerms } : undefined;
  }

  /** Boost each ranked target once when any ranked section links to it (one hop, not a count). */
  #applyLinkBoosts(ranked: readonly RankedGuidanceSection[]): void {
    const positive = new Map(ranked.map((entry) => [entry.entry.id, entry]));
    const boosted = new Set<string>();
    for (const source of ranked) {
      for (const { target } of this.#links.get(source.entry.id) ?? []) {
        const targetRank = positive.get(target.id);
        if (!targetRank || boosted.has(target.id)) continue;
        boosted.add(target.id);
        targetRank.score += GUIDANCE_RANKING_POLICY.linkBoost;
      }
    }
  }
}

/** Order score-near cross-document candidates without a non-transitive epsilon comparator. */
export function orderGuidanceSections(
  ranked: RankedGuidanceSection[],
  concepts: readonly GuidanceConcept[],
): void {
  const routes = new Map(ranked.map((entry) => [entry, routeIndex(entry.entry, concepts)]));
  const routeOf = (entry: RankedGuidanceSection): number => routes.get(entry)!;
  ranked.sort((left, right) =>
    routeOf(left) - routeOf(right) || right.score - left.score ||
    compareGuidanceSectionIdentity(left.entry, right.entry)
  );

  let start = 0;
  while (start < ranked.length) {
    const leader = ranked[start]!;
    const route = routeOf(leader);
    let end = start + 1;
    while (
      end < ranked.length &&
      routeOf(ranked[end]!) === route &&
      leader.score - ranked[end]!.score <= GUIDANCE_RANKING_POLICY.closeScoreGap
    ) {
      end++;
    }
    const closeScoreGroup = ranked.slice(start, end).sort((left, right) =>
      left.entry.slug.localeCompare(right.entry.slug) || right.score - left.score ||
      left.entry.section.localeCompare(right.entry.section)
    );
    ranked.splice(start, closeScoreGroup.length, ...closeScoreGroup);
    start = end;
  }
}

/** BM25 term-frequency saturation for one section. */
function saturate(frequency: number, lengthNorm: number): number {
  if (frequency === 0) return 0;
  return frequency * (GUIDANCE_RANKING_POLICY.k1 + 1) /
    (frequency + GUIDANCE_RANKING_POLICY.k1 * lengthNorm);
}

/**
 * Score a term against a section's identity fields with DisMax: the best field wins.
 *
 * Summing fields would count one word up to four times (page title, heading, page slug, section
 * slug), which lets every section of one page outrank a single exact heading elsewhere.
 */
function identityBoost(identity: GuidanceSectionIdentity, term: GuidanceTerm): number {
  return Math.max(
    fieldMatch(identity.heading, term) * GUIDANCE_RANKING_POLICY.headingBoost,
    fieldMatch(identity.title, term) * GUIDANCE_RANKING_POLICY.titleBoost,
    fieldMatch(identity.slug, term) * GUIDANCE_RANKING_POLICY.slugBoost,
  );
}

function fieldMatch(field: readonly GuidanceTerm[], term: GuidanceTerm): number {
  if (field.some((word) => word.literal === term.literal)) return 1;
  return field.some((word) => word.stem === term.stem)
    ? GUIDANCE_RANKING_POLICY.derivedIdentityShare
    : 0;
}

function routeIndex(
  entry: IndexedGuidanceSection,
  concepts: readonly GuidanceConcept[],
): number {
  if (concepts.length === 0) return Number.MAX_SAFE_INTEGER;
  const heading = entry.identity.heading.map((term) => term.stem).join(' ');
  const title = tokenizeGuidance(entry.title).join(' ');
  let offset = 0;
  for (const concept of concepts) {
    const index = concept.routeHints.findIndex((hint) =>
      heading === tokenizeGuidance(hint.heading).join(' ') &&
      (!hint.title || title === tokenizeGuidance(hint.title).join(' '))
    );
    if (index >= 0) return offset + index;
    offset += concept.routeHints.length;
  }
  return Number.MAX_SAFE_INTEGER;
}
