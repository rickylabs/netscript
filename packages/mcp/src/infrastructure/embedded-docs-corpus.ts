import {
  type DocsCorpusPort,
  type DocsDocument,
  type DocsSearchMatch,
  type DocsSummary,
  MAX_INDEXED_DOC_LENGTH,
  normalizeDocsSlug,
} from '../domain/docs/docs-corpus-port.ts';
import { GuidanceIndex } from '../domain/docs/guidance-index.ts';
import type { GuidanceResult } from '../domain/docs/guidance-contract.ts';
import { processDocsSources, rankDocument, tokenize, toSummary } from './filesystem-docs-corpus.ts';

/** One Markdown asset shipped with the package. */
export interface EmbeddedDocsSource {
  /** Stable document slug. */
  readonly slug: string;
  /** Markdown source text. */
  readonly source: string;
}

/** Options for a package-shipped, in-memory documentation corpus. */
export interface EmbeddedDocsCorpusOptions {
  /** Markdown assets embedded by the package composition root. */
  readonly documents: readonly EmbeddedDocsSource[];
  /** Maximum Markdown characters retained per document. */
  readonly maxDocumentLength?: number;
}

/** Immutable docs corpus backed by Markdown assets imported with the package. */
export class EmbeddedDocsCorpus implements DocsCorpusPort {
  readonly #documents: ReadonlyMap<string, DocsDocument>;
  readonly #aliases: ReadonlyMap<string, string>;
  readonly #guidance: GuidanceIndex;

  /** Parse the supplied package assets once at composition time. */
  constructor(options: EmbeddedDocsCorpusOptions) {
    const maxLength = options.maxDocumentLength ?? MAX_INDEXED_DOC_LENGTH;
    const { documents, aliases } = processDocsSources(options.documents, maxLength);
    this.#documents = documents;
    this.#aliases = aliases;
    this.#guidance = new GuidanceIndex(documents.values());
  }

  /** List embedded document summaries in stable slug order. */
  list(): Promise<readonly DocsSummary[]> {
    return Promise.resolve(
      [...this.#documents.values()].map(toSummary).sort((left, right) =>
        left.slug.localeCompare(right.slug)
      ),
    );
  }

  /** Rank embedded documents using the shared lexical index rules. */
  search(query: string): Promise<readonly DocsSearchMatch[]> {
    const terms = tokenize(query);
    if (terms.length === 0) {
      return Promise.resolve([]);
    }
    return Promise.resolve(
      [...this.#documents.values()].map((document) => rankDocument(document, terms))
        .filter((match): match is DocsSearchMatch => match !== undefined)
        .sort((left, right) => right.score - left.score || left.slug.localeCompare(right.slug)),
    );
  }

  /** Retrieve an embedded document by normalized slug or alias. */
  get(slug: string): Promise<DocsDocument | undefined> {
    const normalized = normalizeDocsSlug(slug);
    const canonicalSlug = this.#aliases.get(normalized) ?? normalized;
    const document = this.#documents.get(canonicalSlug);
    if (!document) return Promise.resolve(undefined);
    if (canonicalSlug !== normalized) {
      return Promise.resolve({ ...document, redirectedFrom: normalized });
    }
    return Promise.resolve(document);
  }

  /** Resolve embedded section-level guidance through the shared index. */
  findGuidance(intent: string): Promise<GuidanceResult> {
    return Promise.resolve(this.#guidance.find(intent));
  }
}
