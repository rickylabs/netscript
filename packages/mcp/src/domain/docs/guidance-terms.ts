/** One word of an intent or section identity in the forms the ranker compares. */
export interface GuidanceTerm {
  /** Lowercased word as written, used when explaining a match. */
  readonly text: string;
  /** Inflection-folded form (`webhooks` → `webhook`) that counts as the same literal word. */
  readonly literal: string;
  /** Derivation-folded stem (`verify`, `verification` → `verif`) used for recall. */
  readonly stem: string;
}

/** Derivational suffixes folded onto one stem so `verify` meets `verification`. */
const GUIDANCE_DERIVATIONAL_SUFFIXES: readonly (readonly [suffix: string, replacement: string])[] = [
  ['ification', 'if'],
  ['ifiers', 'if'],
  ['ifier', 'if'],
  ['ified', 'if'],
  ['ifies', 'if'],
  ['ify', 'if'],
  ['ations', ''],
  ['ation', ''],
  ['ating', ''],
  ['ated', ''],
  ['ates', ''],
  ['ate', ''],
];

/** Shortest stem a derivational suffix may leave, so `state` and `create` stay whole. */
const GUIDANCE_MIN_DERIVED_STEM = 5;

/** Fold inflectional endings so plural and tense variants count as one literal word. */
export function literalGuidanceToken(value: string): string {
  if (value.length > 5 && value.endsWith('ing')) return value.slice(0, -3);
  if (value.length > 4 && value.endsWith('ed')) return value.slice(0, -2);
  if (value.length > 4 && value.endsWith('s')) return value.slice(0, -1);
  return value;
}

/** Apply the shared stemming rule: derivational folding first, else inflectional folding. */
export function normalizeGuidanceToken(value: string): string {
  const suffix = GUIDANCE_DERIVATIONAL_SUFFIXES.find(([ending]) => value.endsWith(ending));
  if (suffix) {
    const [ending, replacement] = suffix;
    const stem = value.slice(0, -ending.length) + replacement;
    if (stem.length >= GUIDANCE_MIN_DERIVED_STEM) return stem;
  }
  return literalGuidanceToken(value);
}

/** Split text into words carrying their literal and stemmed forms. */
export function guidanceTerms(value: string): GuidanceTerm[] {
  return (value.toLocaleLowerCase().match(/[\p{Letter}\p{Number}]+/gu) ?? [])
    .map((text) => ({ text, literal: literalGuidanceToken(text), stem: normalizeGuidanceToken(text) }))
    .filter((term) => term.stem.length > 1);
}

/** Normalize guidance text into stable stemmed lexical tokens. */
export function tokenizeGuidance(value: string): string[] {
  return guidanceTerms(value).map((term) => term.stem);
}

/** Keep the first term for each stem. */
export function uniqueGuidanceTerms(terms: readonly GuidanceTerm[]): GuidanceTerm[] {
  const seen = new Set<string>();
  return terms.filter((term) => !seen.has(term.stem) && seen.add(term.stem));
}

/**
 * Function words and question framing that carry no retrieval signal in a task intent.
 *
 * Entries are compared with each word's literal form. Single-character words (`I`, `a`) never
 * reach this set because the tokenizer drops them.
 */
export const GUIDANCE_STOP_WORDS: ReadonlySet<string> = new Set(
  [
    'about',
    'above',
    'after',
    'again',
    'all',
    'also',
    'am',
    'an',
    'and',
    'any',
    'are',
    'as',
    'at',
    'be',
    'because',
    'been',
    'before',
    'being',
    'below',
    'between',
    'both',
    'but',
    'by',
    'can',
    'could',
    'did',
    'do',
    'does',
    'doesn',
    'doing',
    'don',
    'during',
    'each',
    'either',
    'for',
    'from',
    'had',
    'has',
    'have',
    'having',
    'he',
    'her',
    'here',
    'him',
    'his',
    'how',
    'if',
    'in',
    'into',
    'is',
    'isn',
    'it',
    'its',
    'itself',
    'just',
    'like',
    'll',
    'me',
    'might',
    'more',
    'most',
    'must',
    'my',
    'myself',
    'need',
    'no',
    'nor',
    'not',
    'of',
    'off',
    'on',
    'once',
    'only',
    'or',
    'other',
    'our',
    'ours',
    'out',
    'over',
    'own',
    'please',
    're',
    'same',
    'she',
    'should',
    'so',
    'some',
    'such',
    'than',
    'that',
    'the',
    'their',
    'them',
    'then',
    'there',
    'these',
    'they',
    'this',
    'those',
    'through',
    'to',
    'too',
    'under',
    'until',
    'up',
    'us',
    've',
    'very',
    'want',
    'was',
    'we',
    'were',
    'what',
    'when',
    'where',
    'whether',
    'which',
    'while',
    'who',
    'whom',
    'whose',
    'why',
    'will',
    'with',
    'would',
    'you',
    'your',
    'yours',
    'yourself',
  ].map(literalGuidanceToken),
);

/** Report whether a word is a stop or question word. */
export function isGuidanceStopWord(term: GuidanceTerm): boolean {
  return GUIDANCE_STOP_WORDS.has(term.literal);
}

/** Tokenize a task intent into unique content terms, dropping stop and question words. */
export function guidanceContentTerms(intent: string): GuidanceTerm[] {
  return uniqueGuidanceTerms(guidanceTerms(intent).filter((term) => !isGuidanceStopWord(term)));
}

/** Corpus-wide inverse document frequency over stems, built once per corpus load. */
export class GuidanceTermWeights {
  readonly #inverseFrequency: ReadonlyMap<string, number>;
  readonly #unseenWeight: number;
  readonly #commonCeiling: number;

  /**
   * Build the table from each section's stemmed token list.
   *
   * @param sectionTokens One token list per indexed section.
   * @param commonDocumentRatio Share of sections at or above which a stem counts as common.
   */
  constructor(sectionTokens: readonly (readonly string[])[], commonDocumentRatio: number) {
    const sectionCount = sectionTokens.length;
    const documentFrequency = new Map<string, number>();
    for (const tokens of sectionTokens) {
      for (const token of new Set(tokens)) {
        documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
      }
    }
    this.#inverseFrequency = new Map(
      [...documentFrequency].map(([stem, frequency]) => [
        stem,
        bm25InverseFrequency(sectionCount, frequency),
      ]),
    );
    this.#unseenWeight = bm25InverseFrequency(sectionCount, 0);
    this.#commonCeiling = bm25InverseFrequency(
      sectionCount,
      Math.ceil(sectionCount * commonDocumentRatio),
    );
  }

  /** Non-negative BM25 inverse document frequency of a stem. */
  inverseFrequency(stem: string): number {
    return this.#inverseFrequency.get(stem) ?? this.#unseenWeight;
  }

  /** Report whether a stem occurs in at least the common share of sections. */
  isCommon(stem: string): boolean {
    return this.inverseFrequency(stem) <= this.#commonCeiling;
  }

  /** Scale in [0, 1]: 1 for distinctive stems, shrinking with IDF once a stem is common. */
  rarity(stem: string): number {
    return this.#commonCeiling <= 0
      ? 1
      : Math.min(1, this.inverseFrequency(stem) / this.#commonCeiling);
  }
}

function bm25InverseFrequency(sectionCount: number, documentFrequency: number): number {
  return Math.log(1 + (sectionCount - documentFrequency + 0.5) / (documentFrequency + 0.5));
}
