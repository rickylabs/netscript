/** Effect-free in-memory reference adapter for hybrid retrieval. */

import type { EmbeddingProviderPort } from '../ports/embedding.ts';
import type {
  CitationProvenance,
  RetrievalMatchKind,
  RetrievalResult,
  RetrieverPort,
} from '../ports/retriever.ts';

/** Default vector contribution to hybrid scores. */
export const DEFAULT_RETRIEVAL_ALPHA = 0.5;
/** Default additive boost for a query term found in a title. */
export const DEFAULT_RETRIEVAL_TITLE_BOOST = 0.15;
/** Default candidate-pool multiplier applied before the final `k` bound. */
export const DEFAULT_RETRIEVAL_OVERFETCH_FACTOR = 4;

/** An injected document searched by {@linkcode InMemoryRetriever}. */
export interface InMemoryRetrieverDocument {
  /** Stable adapter-owned document or chunk identifier. */
  readonly id: string;
  /** Searchable and returnable document text. */
  readonly content: string;
  /** Citation metadata for the document or chunk. */
  readonly provenance: CitationProvenance;
  /** Precomputed content embedding, when vector search is desired. */
  readonly embedding?: readonly number[];
  /** Precomputed title embedding used by the title boost, when available. */
  readonly titleEmbedding?: readonly number[];
}

/** Configuration for {@linkcode InMemoryRetriever}. */
export interface InMemoryRetrieverOptions {
  /** Injected documents; the adapter never reads a store or filesystem. */
  readonly documents: readonly InMemoryRetrieverDocument[];
  /** Optional provider used only to embed each query. */
  readonly embeddings?: EmbeddingProviderPort;
  /** Vector weight in the range 0–1; keyword weight is `1 - alpha`. */
  readonly alpha?: number;
  /** Additive title-match boost. */
  readonly titleBoost?: number;
  /** Candidate-pool multiplier used before final ranking. */
  readonly overfetchFactor?: number;
}

interface Candidate {
  readonly document: InMemoryRetrieverDocument;
  readonly vector: number;
  readonly keyword: number;
  readonly title: number;
}

/**
 * Deterministic in-memory hybrid retriever for tests and examples.
 *
 * It performs naive token coverage plus cosine similarity over injected vectors.
 * Production ANN/FTS implementations remain application-owned adapters.
 *
 * @example
 * ```ts
 * const retriever = new InMemoryRetriever({ documents });
 * const hits = await retriever.retrieve('workflow', 3);
 * ```
 */
export class InMemoryRetriever implements RetrieverPort {
  readonly #documents: readonly InMemoryRetrieverDocument[];
  readonly #embeddings?: EmbeddingProviderPort;
  readonly #alpha: number;
  readonly #titleBoost: number;
  readonly #overfetchFactor: number;

  /** Construct an adapter over injected, immutable documents. */
  constructor(options: InMemoryRetrieverOptions) {
    this.#documents = options.documents;
    this.#embeddings = options.embeddings;
    this.#alpha = clamp(options.alpha ?? DEFAULT_RETRIEVAL_ALPHA, 0, 1);
    this.#titleBoost = Math.max(0, options.titleBoost ?? DEFAULT_RETRIEVAL_TITLE_BOOST);
    this.#overfetchFactor = Math.max(
      1,
      Math.floor(options.overfetchFactor ?? DEFAULT_RETRIEVAL_OVERFETCH_FACTOR),
    );
  }

  /** Retrieve ranked results from the injected documents. */
  async retrieve(query: string, k: number): Promise<readonly RetrievalResult[]> {
    const limit = Math.max(0, Math.floor(k));
    const terms = tokenize(query);
    if (limit === 0 || terms.length === 0) return [];

    const queryVector = await this.#embedQuery(query);
    const candidates = this.#documents.map((document): Candidate => ({
      document,
      vector: queryVector && document.embedding
        ? positiveCosine(queryVector, document.embedding)
        : 0,
      keyword: coverage(terms, tokenize(document.content)),
      title: titleScore(terms, document.provenance.title, queryVector, document.titleEmbedding),
    }));
    const vectorMax = Math.max(0, ...candidates.map((candidate) => candidate.vector));
    const keywordMax = Math.max(0, ...candidates.map((candidate) => candidate.keyword));
    const poolSize = Math.min(candidates.length, limit * this.#overfetchFactor);

    return candidates
      .filter((candidate) => candidate.vector > 0 || candidate.keyword > 0)
      .map((candidate) => {
        const vector = vectorMax > 0 ? candidate.vector / vectorMax : 0;
        const keyword = keywordMax > 0 ? candidate.keyword / keywordMax : 0;
        const vectorWeight = queryVector ? this.#alpha : 0;
        const keywordWeight = queryVector ? 1 - this.#alpha : 1;
        const base = vectorWeight * vector + keywordWeight * keyword;
        const score = clamp(
          (base + this.#titleBoost * candidate.title) / (1 + this.#titleBoost),
          0,
          1,
        );
        return {
          id: candidate.document.id,
          content: candidate.document.content,
          score,
          matchedBy: matchKind(candidate.vector, candidate.keyword),
          provenance: candidate.document.provenance,
        } satisfies RetrievalResult;
      })
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
      .slice(0, poolSize)
      .slice(0, limit);
  }

  async #embedQuery(query: string): Promise<readonly number[] | undefined> {
    if (!this.#embeddings) return undefined;
    try {
      return (await this.#embeddings.embed(query)).embeddings[0];
    } catch {
      return undefined;
    }
  }
}

function tokenize(value: string): readonly string[] {
  return [...new Set(value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])];
}

function coverage(query: readonly string[], document: readonly string[]): number {
  if (query.length === 0) return 0;
  const words = new Set(document);
  return query.filter((term) => words.has(term)).length / query.length;
}

function titleScore(
  terms: readonly string[],
  title: string,
  queryVector: readonly number[] | undefined,
  titleEmbedding: readonly number[] | undefined,
): number {
  const lexical = coverage(terms, tokenize(title));
  const semantic = queryVector && titleEmbedding ? positiveCosine(queryVector, titleEmbedding) : 0;
  return Math.max(lexical, semantic);
}

function positiveCosine(left: readonly number[], right: readonly number[]): number {
  if (left.length === 0 || left.length !== right.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index++) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return Math.max(0, dot / Math.sqrt(leftMagnitude * rightMagnitude));
}

function matchKind(vector: number, keyword: number): RetrievalMatchKind {
  if (vector > 0 && keyword > 0) return 'hybrid';
  return vector > 0 ? 'vector' : 'keyword';
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
