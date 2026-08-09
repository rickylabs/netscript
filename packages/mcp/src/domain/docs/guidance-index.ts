import type { GuidanceResult } from './guidance-contract.ts';
import type { DocsDocument } from './docs-corpus-port.ts';
import type { GuidanceConcept } from './guidance-concepts.ts';
import {
  type GuidanceLinkEdge,
  type IndexedGuidanceSection,
  indexGuidanceDocuments,
} from './guidance-parser.ts';
import {
  activatedGuidanceConcepts,
  collectGuidanceRelated,
  compareGuidanceSectionIdentity,
  guidanceOneLine,
  normalizeGuidanceToken,
  toGuidanceRecommendation,
  tokenizeGuidance,
  uniqueGuidanceTokens,
} from './guidance-result.ts';

/** Numeric policy for deterministic section retrieval and one-hop routing. */
export interface GuidanceRankingPolicy {
  readonly k1: number;
  readonly b: number;
  readonly titleBoost: number;
  readonly headingBoost: number;
  readonly exactPhraseBoost: number;
  readonly conceptBoost: number;
  readonly linkBoost: number;
  readonly graphDepth: 1;
}

/** Locked deterministic retrieval policy approved by PLAN-EVAL. */
export const GUIDANCE_RANKING_POLICY: GuidanceRankingPolicy = Object.freeze({
  k1: 1.2,
  b: 0.75,
  titleBoost: 4,
  headingBoost: 6,
  exactPhraseBoost: 10,
  conceptBoost: 8,
  linkBoost: 2,
  graphDepth: 1,
});

export interface RankedGuidanceSection {
  readonly entry: IndexedGuidanceSection;
  score: number;
  readonly matchedTerms: readonly string[];
}

/** Immutable section-level parser, link graph, and deterministic ranker. */
export class GuidanceIndex {
  readonly #sections: readonly IndexedGuidanceSection[];
  readonly #byId: ReadonlyMap<string, IndexedGuidanceSection>;
  readonly #documentFrequency: ReadonlyMap<string, number>;
  readonly #averageLength: number;

  /** Parse current canonical documents into one shared offline index. */
  constructor(documents: Iterable<DocsDocument>) {
    this.#sections = indexGuidanceDocuments(documents).sort(compareGuidanceSectionIdentity);
    this.#byId = new Map(this.#sections.map((entry) => [entry.id, entry]));
    this.#documentFrequency = documentFrequency(this.#sections);
    this.#averageLength = this.#sections.length === 0
      ? 1
      : this.#sections.reduce((total, entry) => total + entry.tokens.length, 0) /
        this.#sections.length;
  }

  /** Return bounded ordered guidance for a natural-language intent. */
  find(intent: string): GuidanceResult {
    const normalizedIntent = guidanceOneLine(intent).toLocaleLowerCase();
    const concepts = activatedGuidanceConcepts(normalizedIntent);
    const queryTerms = uniqueGuidanceTokens(
      concepts.length > 0
        ? concepts.flatMap((concept) => concept.terms)
        : tokenizeGuidance(normalizedIntent),
    );
    const ranked = this.#sections.map((entry) =>
      this.#rank(entry, normalizedIntent, queryTerms, concepts)
    ).filter((entry): entry is RankedGuidanceSection => entry !== undefined);
    this.#applyLinkBoosts(ranked);
    ranked.sort((left, right) => {
      const leftRoute = routeIndex(left.entry, concepts);
      const rightRoute = routeIndex(right.entry, concepts);
      return leftRoute - rightRoute || right.score - left.score ||
        compareGuidanceSectionIdentity(left.entry, right.entry);
    });

    if (ranked.length === 0) {
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
    const related = collectGuidanceRelated(ranked, this.#byId);
    const topScore = ranked[0]?.score ?? 0;
    const confidence = topScore >= 24 ? 'high' : topScore >= 8 ? 'medium' : 'low';
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

  #rank(
    entry: IndexedGuidanceSection,
    intent: string,
    queryTerms: readonly string[],
    concepts: readonly GuidanceConcept[],
  ): RankedGuidanceSection | undefined {
    if (concepts.length > 0 && entry.level === 1) return undefined;
    const supportedConcepts = concepts.filter((concept) =>
      concept.requiredAnyTerms.some((term) => entry.tokenCounts.has(normalizeGuidanceToken(term)))
    );
    if (concepts.length > 0 && supportedConcepts.length === 0) return undefined;
    let score = 0;
    const matchedTerms: string[] = [];
    const titleTokens = tokenizeGuidance(entry.title);
    const headingTokens = tokenizeGuidance(entry.heading);
    const identityTokens = tokenizeGuidance(`${entry.slug} ${entry.section}`);
    for (const term of queryTerms) {
      const frequency = entry.tokenCounts.get(term) ?? 0;
      const identityFrequency = countToken(titleTokens, term) * GUIDANCE_RANKING_POLICY.titleBoost +
        countToken(headingTokens, term) * GUIDANCE_RANKING_POLICY.headingBoost +
        countToken(identityTokens, term);
      if (frequency === 0 && identityFrequency === 0) continue;
      matchedTerms.push(term);
      if (frequency > 0) {
        const documentFrequency = this.#documentFrequency.get(term) ?? 0;
        const inverseFrequency = Math.log(
          1 + (this.#sections.length - documentFrequency + 0.5) / (documentFrequency + 0.5),
        );
        const normalizedFrequency = frequency * (GUIDANCE_RANKING_POLICY.k1 + 1) /
          (frequency + GUIDANCE_RANKING_POLICY.k1 *
              (1 - GUIDANCE_RANKING_POLICY.b +
                GUIDANCE_RANKING_POLICY.b * entry.tokens.length / this.#averageLength));
        score += inverseFrequency * normalizedFrequency;
      }
      score += identityFrequency;
    }
    const searchable = guidanceOneLine(`${entry.title} ${entry.heading} ${entry.content}`)
      .toLocaleLowerCase();
    if (intent.length >= 4 && searchable.includes(intent)) {
      score += GUIDANCE_RANKING_POLICY.exactPhraseBoost;
    }
    for (const concept of supportedConcepts) {
      const matchedConceptTerms = concept.terms.filter((term) =>
        entry.tokenCounts.has(normalizeGuidanceToken(term))
      ).length;
      score += matchedConceptTerms * GUIDANCE_RANKING_POLICY.conceptBoost;
    }
    return score > 0
      ? { entry, score, matchedTerms: uniqueGuidanceTokens(matchedTerms) }
      : undefined;
  }

  #applyLinkBoosts(ranked: readonly RankedGuidanceSection[]): void {
    const positive = new Map(ranked.map((entry) => [entry.entry.id, entry]));
    const originalScores = new Map(ranked.map((entry) => [entry.entry.id, entry.score]));
    for (const source of ranked) {
      for (const edge of source.entry.links) {
        const target = resolveEdge(edge, this.#sections, this.#byId);
        if (!target) continue;
        const targetRank = positive.get(target.id);
        if (!targetRank || !originalScores.has(target.id)) continue;
        targetRank.score += GUIDANCE_RANKING_POLICY.linkBoost;
      }
    }
  }
}

function routeIndex(
  entry: IndexedGuidanceSection,
  concepts: readonly GuidanceConcept[],
): number {
  const heading = tokenizeGuidance(entry.heading).join(' ');
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

function resolveEdge(
  edge: GuidanceLinkEdge,
  sections: readonly IndexedGuidanceSection[],
  byId: ReadonlyMap<string, IndexedGuidanceSection>,
): IndexedGuidanceSection | undefined {
  if (edge.targetSection) return byId.get(`${edge.targetSlug}#${edge.targetSection}`);
  return sections.find((entry) => entry.slug === edge.targetSlug);
}

function documentFrequency(
  sections: readonly IndexedGuidanceSection[],
): ReadonlyMap<string, number> {
  const frequencies = new Map<string, number>();
  for (const section of sections) {
    for (const token of new Set(section.tokens)) {
      frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    }
  }
  return frequencies;
}

function countToken(tokens: readonly string[], term: string): number {
  return tokens.filter((token) => token === term).length;
}
