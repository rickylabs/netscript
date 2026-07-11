/**
 * Provider-neutral retrieval contracts with citation-ready provenance.
 *
 * @module
 */

/** Match channels a retriever may use to rank a result. */
export const RETRIEVAL_MATCH_KINDS = ['vector', 'keyword', 'hybrid'] as const;

/** The retrieval channels that contributed to a result. */
export type RetrievalMatchKind = (typeof RETRIEVAL_MATCH_KINDS)[number];

/** Character range within a cited source, using an exclusive end offset. */
export interface CitationSpan {
  /** Zero-based character offset where the cited passage begins. */
  readonly start: number;
  /** Zero-based exclusive character offset where the cited passage ends. */
  readonly end: number;
  /** Exact cited passage, when the adapter has it available. */
  readonly text?: string;
}

/** Stable source metadata sufficient to render and resolve an `[n]` citation. */
export interface CitationProvenance {
  /** Stable application-owned source identifier. */
  readonly sourceId: string;
  /** Human-readable source title shown with the citation. */
  readonly title: string;
  /** Location of the result within the source. */
  readonly span: CitationSpan;
}

/** One ranked retrieval result. */
export interface RetrievalResult {
  /** Adapter-owned identifier used to deduplicate the result. */
  readonly id: string;
  /** Text supplied to the consuming tool or model. */
  readonly content: string;
  /** Descending relevance score normalized to the range 0–1. */
  readonly score: number;
  /** Channels that contributed a positive match. */
  readonly matchedBy: RetrievalMatchKind;
  /** Citation-ready source metadata for this result. */
  readonly provenance: CitationProvenance;
}

/** Application-injected ranked retrieval capability. */
export interface RetrieverPort {
  /**
   * Retrieve at most `k` results for `query`, ordered by descending relevance.
   *
   * @param query - Natural-language or keyword query.
   * @param k - Maximum result count; non-positive values return no results.
   * @returns Ranked, deduplicated results with citation provenance.
   * @example
   * ```ts
   * const results = await retriever.retrieve('durable workflows', 5);
   * ```
   */
  retrieve(query: string, k: number): Promise<readonly RetrievalResult[]>;
}
